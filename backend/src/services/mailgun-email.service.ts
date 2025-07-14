import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import cron from 'node-cron';
import pool from '../config/database';
import ReportGeneratorService from './report-generator.service';
import { format } from 'date-fns';

interface MailgunConfig {
  apiKey: string;
  domain: string;
  host: string;
}

interface ReportSubscription {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  report_type: 'summary' | 'detailed' | 'critical_only';
  filters: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class MailgunEmailService {
  private mailgun: any;
  private isInitialized = false;
  private domain: string = '';
  private fromEmail: string = '';
  private fromName: string = '';

  constructor() {
    this.initializeMailgun();
    this.scheduleReports();
  }

  private initializeMailgun() {
    try {
      const config: MailgunConfig = {
        apiKey: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || '',
        host: process.env.MAILGUN_HOST || 'api.mailgun.net'
      };

      if (!config.apiKey || !config.domain) {
        console.warn('⚠️ Mailgun not configured - missing API key or domain');
        this.isInitialized = false;
        return;
      }

      this.domain = config.domain;
      this.fromEmail = process.env.FROM_EMAIL || `noreply@${config.domain}`;
      this.fromName = process.env.FROM_NAME || 'Onyx Assessment Platform';

      const mailgun = new Mailgun(FormData);
      this.mailgun = mailgun.client({
        username: 'api',
        key: config.apiKey,
        url: `https://${config.host}/`
      });

      this.isInitialized = true;
      console.log('📧 Mailgun service initialized successfully');
      console.log(`📍 Domain: ${this.domain}`);
      console.log(`✉️ From: ${this.fromName} <${this.fromEmail}>`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Mailgun:', error);
      this.isInitialized = false;
    }
  }

  private scheduleReports() {
    // Daily reports at 8 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('📧 Running daily email reports...');
      await this.sendScheduledReports('daily');
    });

    // Weekly reports on Monday at 8 AM
    cron.schedule('0 8 * * 1', async () => {
      console.log('📧 Running weekly email reports...');
      await this.sendScheduledReports('weekly');
    });

    // Monthly reports on the 1st at 8 AM
    cron.schedule('0 8 1 * *', async () => {
      console.log('📧 Running monthly email reports...');
      await this.sendScheduledReports('monthly');
    });

    console.log('⏰ Email report schedules configured');
  }

  async sendScheduledReports(frequency: 'daily' | 'weekly' | 'monthly') {
    if (!this.isInitialized) {
      console.log('⚠️ Mailgun not initialized, skipping scheduled reports');
      return;
    }

    try {
      // Get all active subscriptions for this frequency
      const subscriptionsQuery = `
        SELECT 
          rs.*,
          u.email as user_email,
          u.name as user_name
        FROM report_subscriptions rs
        JOIN users u ON rs.user_id = u.id
        WHERE rs.frequency = $1 AND rs.is_active = true
      `;
      
      const result = await pool.query(subscriptionsQuery, [frequency]);
      const subscriptions = result.rows as ReportSubscription[];

      console.log(`📧 Found ${subscriptions.length} active ${frequency} subscriptions`);

      // Send reports for each subscription
      for (const subscription of subscriptions) {
        await this.sendReportToSubscriber(subscription);
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error sending ${frequency} reports:`, error);
    }
  }

  async sendReportToSubscriber(subscription: ReportSubscription) {
    try {
      // Generate report based on subscription type
      let reportBuffer: Buffer;
      let fileName: string;
      let subject: string;

      if (subscription.report_type === 'summary') {
        reportBuffer = await ReportGeneratorService.generateExcelReport(subscription.filters);
        fileName = `assessment-summary-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        subject = `Assessment Summary Report - ${format(new Date(), 'MMMM dd, yyyy')}`;
      } else if (subscription.report_type === 'critical_only') {
        const criticalFilters = {
          ...subscription.filters,
          critical_only: true
        };
        reportBuffer = await ReportGeneratorService.generateExcelReport(criticalFilters);
        fileName = `critical-assessments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        subject = `Critical Assessments Report - ${format(new Date(), 'MMMM dd, yyyy')}`;
      } else {
        reportBuffer = await ReportGeneratorService.generateExcelReport(subscription.filters);
        fileName = `detailed-assessment-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        subject = `Detailed Assessment Report - ${format(new Date(), 'MMMM dd, yyyy')}`;
      }

      // Send email with report attachment
      await this.sendEmailWithAttachment({
        to: subscription.user_email,
        subject,
        html: this.generateEmailHTML(subscription),
        attachments: [{
          filename: fileName,
          data: reportBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]
      });

      console.log(`📧 Sent ${subscription.frequency} report to ${subscription.user_email}`);

    } catch (error) {
      console.error(`❌ Error sending report to ${subscription.user_email}:`, error);
    }
  }

  private generateEmailHTML(subscription: ReportSubscription): string {
    const currentDate = format(new Date(), 'MMMM dd, yyyy');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Onyx Assessment Report</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px; 
            text-align: center;
            color: white;
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold;
            margin-bottom: 8px;
          }
          .tagline {
            font-size: 14px;
            opacity: 0.9;
          }
          .content { 
            padding: 30px; 
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
          }
          .report-info {
            background-color: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .feature-list {
            margin: 20px 0;
          }
          .feature-list li {
            margin: 8px 0;
            padding-left: 8px;
          }
          .button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            margin: 20px 0;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .footer { 
            background-color: #f8f9fa;
            text-align: center; 
            padding: 20px;
            color: #6b7280; 
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
          }
          .stat {
            text-align: center;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Onyx</div>
            <div class="tagline">Building Assessment & Facility Management</div>
          </div>
          
          <div class="content">
            <div class="greeting">Hello ${subscription.user_name},</div>
            
            <p>Your ${subscription.frequency} ${subscription.report_type.replace('_', ' ')} report is ready and attached to this email.</p>
            
            <div class="report-info">
              <strong>📊 Report Details:</strong><br>
              <strong>Type:</strong> ${subscription.report_type.replace('_', ' ').toUpperCase()}<br>
              <strong>Frequency:</strong> ${subscription.frequency.toUpperCase()}<br>
              <strong>Generated:</strong> ${currentDate}
            </div>
            
            <p><strong>This report includes:</strong></p>
            <ul class="feature-list">
              <li>📈 Assessment summary and status updates</li>
              <li>🏗️ FCI calculations and condition ratings</li>
              <li>💰 Cost breakdowns and repair recommendations</li>
              <li>📊 Building performance metrics and trends</li>
              <li>🔮 Predictive maintenance insights</li>
            </ul>
            
            <p>The report is attached as an Excel file for easy analysis. You can import this data into your preferred tools or share it with your team.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/reports" class="button">
                📱 View Online Dashboard
              </a>
            </div>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">📧</div>
                <div class="stat-label">Automated</div>
              </div>
              <div class="stat">
                <div class="stat-number">⚡</div>
                <div class="stat-label">Real-time</div>
              </div>
              <div class="stat">
                <div class="stat-number">🔒</div>
                <div class="stat-label">Secure</div>
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              <small>
                <strong>Need help?</strong> Contact your system administrator or visit our dashboard to modify your report preferences.
              </small>
            </p>
            
            <p>Best regards,<br><strong>The Onyx Assessment Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>Generated on ${currentDate}</strong></p>
            <p>This is an automated email from Onyx Assessment Platform.<br>
            Please do not reply directly to this message.</p>
            <p style="margin-top: 15px;">
              <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
              <a href="#" style="color: #667eea; text-decoration: none;">Manage Preferences</a> | 
              <a href="#" style="color: #667eea; text-decoration: none;">Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmailWithAttachment(options: {
    to: string;
    subject: string;
    html: string;
    attachments: Array<{
      filename: string;
      data: Buffer;
      contentType: string;
    }>;
  }) {
    try {
      if (!this.isInitialized) {
        throw new Error('Mailgun service not initialized');
      }

      const messageData: any = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        'h:Reply-To': this.fromEmail,
        'h:X-Mailgun-Track': 'yes',
        'h:X-Mailgun-Track-Clicks': 'yes',
        'h:X-Mailgun-Track-Opens': 'yes'
      };

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        messageData.attachment = options.attachments.map(att => ({
          filename: att.filename,
          data: att.data,
          contentType: att.contentType
        }));
      }

      const response = await this.mailgun.messages.create(this.domain, messageData);
      
      console.log(`📧 Email sent successfully to ${options.to}`);
      console.log(`📝 Message ID: ${response.id}`);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error sending email via Mailgun:', error);
      throw error;
    }
  }

  // Send a simple email without attachments
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    try {
      if (!this.isInitialized) {
        throw new Error('Mailgun service not initialized');
      }

      const messageData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
        'h:Reply-To': this.fromEmail,
        'h:X-Mailgun-Track': 'yes',
        'h:X-Mailgun-Track-Clicks': 'yes',
        'h:X-Mailgun-Track-Opens': 'yes'
      };

      const response = await this.mailgun.messages.create(this.domain, messageData);
      
      console.log(`📧 Email sent successfully to ${options.to}`);
      console.log(`📝 Message ID: ${response.id}`);
      
      return response;
      
    } catch (error) {
      console.error('❌ Error sending email via Mailgun:', error);
      throw error;
    }
  }

  // Manual report sending for testing
  async sendTestReport(userEmail: string, reportType: 'summary' | 'detailed' | 'critical_only' = 'summary') {
    if (!this.isInitialized) {
      throw new Error('Mailgun service not initialized');
    }

    try {
      const reportBuffer = await ReportGeneratorService.generateExcelReport({});
      const fileName = `test-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      await this.sendEmailWithAttachment({
        to: userEmail,
        subject: `🧪 Test Assessment Report - ${format(new Date(), 'MMMM dd, yyyy')}`,
        html: this.generateEmailHTML({
          user_email: userEmail,
          user_name: 'Test User',
          frequency: 'daily',
          report_type: reportType
        } as ReportSubscription),
        attachments: [{
          filename: fileName,
          data: reportBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]
      });

      return { success: true, message: 'Test report sent successfully via Mailgun' };
      
    } catch (error) {
      console.error('❌ Error sending test report:', error);
      throw error;
    }
  }

  // Check if Mailgun service is ready
  async verifyConnection() {
    if (!this.isInitialized) {
      return { success: false, message: 'Mailgun service not initialized - check API key and domain' };
    }

    try {
      // Test Mailgun connection by validating domain
      const domainInfo = await this.mailgun.domains.get(this.domain);
      
      return { 
        success: true, 
        message: `Mailgun service ready - Domain: ${this.domain}`,
        domain: domainInfo
      };
    } catch (error) {
      console.error('❌ Mailgun service verification failed:', error);
      return { 
        success: false, 
        message: 'Mailgun service verification failed - check domain configuration' 
      };
    }
  }

  // Get email statistics (Mailgun feature)
  async getEmailStats(days: number = 30) {
    if (!this.isInitialized) {
      throw new Error('Mailgun service not initialized');
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await this.mailgun.stats.getDomain(this.domain, {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        resolution: 'day'
      });

      return stats;
    } catch (error) {
      console.error('❌ Error fetching email stats:', error);
      throw error;
    }
  }
}

export default new MailgunEmailService();