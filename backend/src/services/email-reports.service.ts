import nodemailer from 'nodemailer';
import cron from 'node-cron';
import pool from '../config/database';
import ReportGeneratorService from './report-generator.service';
import { format } from 'date-fns';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
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

export class EmailReportsService {
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeTransporter();
    this.scheduleReports();
  }

  private initializeTransporter() {
    try {
      const emailConfig: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isInitialized = true;
      
      console.log('📧 Email transporter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
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
      console.log('⚠️ Email service not initialized, skipping scheduled reports');
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
        // Generate Excel summary report
        reportBuffer = await ReportGeneratorService.generateExcelReport(subscription.filters);
        fileName = `assessment-summary-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        subject = `Assessment Summary Report - ${format(new Date(), 'MMMM dd, yyyy')}`;
      } else if (subscription.report_type === 'critical_only') {
        // Filter for critical assessments only
        const criticalFilters = {
          ...subscription.filters,
          critical_only: true
        };
        reportBuffer = await ReportGeneratorService.generateExcelReport(criticalFilters);
        fileName = `critical-assessments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        subject = `Critical Assessments Report - ${format(new Date(), 'MMMM dd, yyyy')}`;
      } else {
        // Default to detailed report
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
          content: reportBuffer,
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .logo { color: #007bff; font-size: 24px; font-weight: bold; }
          .content { background: white; padding: 20px; border-radius: 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Onyx Assessment Platform</div>
            <p>Building Assessment & Facility Management</p>
          </div>
          
          <div class="content">
            <h2>Hello ${subscription.user_name},</h2>
            
            <p>Your ${subscription.frequency} ${subscription.report_type.replace('_', ' ')} report is ready!</p>
            
            <p>This report includes:</p>
            <ul>
              <li>Assessment summary and status updates</li>
              <li>FCI calculations and condition ratings</li>
              <li>Cost breakdowns and repair recommendations</li>
              <li>Building performance metrics</li>
            </ul>
            
            <p>The report is attached as an Excel file for your review. You can import this data into your preferred analysis tools or share it with your team.</p>
            
            <p>If you need to modify your report preferences or frequency, please contact your system administrator.</p>
            
            <div style="margin: 20px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/reports" class="button">View Online Dashboard</a>
            </div>
            
            <p>Best regards,<br>The Onyx Assessment Team</p>
          </div>
          
          <div class="footer">
            <p>Generated on ${currentDate}</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
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
      content: Buffer;
      contentType: string;
    }>;
  }) {
    try {
      const mailOptions = {
        from: `"Onyx Assessment Platform" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments
      };

      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
      } else {
        throw new Error('Email transporter not initialized');
      }
      console.log(`📧 Email sent successfully to ${options.to}`);
      
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  // Manual report sending for testing
  async sendTestReport(userEmail: string, reportType: 'summary' | 'detailed' | 'critical_only' = 'summary') {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const reportBuffer = await ReportGeneratorService.generateExcelReport({});
      const fileName = `test-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      await this.sendEmailWithAttachment({
        to: userEmail,
        subject: `Test Assessment Report - ${format(new Date(), 'MMMM dd, yyyy')}`,
        html: this.generateEmailHTML({
          user_email: userEmail,
          user_name: 'Test User',
          frequency: 'daily',
          report_type: reportType
        } as ReportSubscription),
        attachments: [{
          filename: fileName,
          content: reportBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]
      });

      return { success: true, message: 'Test report sent successfully' };
      
    } catch (error) {
      console.error('❌ Error sending test report:', error);
      throw error;
    }
  }

  // Check if email service is ready
  async verifyConnection() {
    if (!this.isInitialized) {
      return { success: false, message: 'Email service not initialized' };
    }

    try {
      if (this.transporter) {
        await this.transporter.verify();
      } else {
        throw new Error('Email transporter not initialized');
      }
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      console.error('❌ Email service verification failed:', error);
      return { success: false, message: 'Email service verification failed' };
    }
  }
}

export default new EmailReportsService();