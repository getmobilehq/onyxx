import mailgunService, { MailgunEmailService } from './mailgun-email.service';
import SecurityEmailService from './security-email.service';
import pool from '../config/database';
import { logSecurityEvent } from '../config/security';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_template: string;
  category: 'security' | 'notification' | 'marketing' | 'system';
  is_active: boolean;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_id: string;
  status: 'sent' | 'failed' | 'pending';
  mailgun_message_id?: string;
  error_message?: string;
  sent_at: Date;
}

export class EnhancedEmailService {
  private mailgunService: MailgunEmailService;
  private securityEmailService: SecurityEmailService;

  constructor() {
    this.mailgunService = mailgunService;
    this.securityEmailService = new SecurityEmailService(this.mailgunService);
  }

  /**
   * Send enhanced welcome email with organization context
   */
  async sendWelcomeEmail(userEmail: string, userName: string, organizationName?: string, temporaryPassword?: string) {
    try {
      const loginUrl = `${process.env.CLIENT_URL || 'https://onyxreport.com'}/login`;
      
      await this.securityEmailService.sendWelcomeEmail({
        userName,
        userEmail,
        temporaryPassword,
        loginUrl,
        organizationName
      });

      await this.logEmail({
        recipient_email: userEmail,
        subject: 'Welcome to ONYX Platform',
        template_id: 'welcome',
        status: 'sent'
      });

      console.log(`✅ Welcome email sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      
      await this.logEmail({
        recipient_email: userEmail,
        subject: 'Welcome to ONYX Platform',
        template_id: 'welcome',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Send security alert to administrators
   */
  async sendSecurityAlert(
    alertType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: any,
    userInfo?: { id: string; name: string; email: string },
    ipAddress: string = '0.0.0.0'
  ) {
    try {
      // Get admin emails from database
      const adminQuery = `
        SELECT email FROM users 
        WHERE role = 'admin' AND is_active = true
      `;
      const adminResult = await pool.query(adminQuery);
      const adminEmails = adminResult.rows.map(row => row.email);

      if (adminEmails.length === 0) {
        console.warn('⚠️ No admin emails found for security alert');
        return;
      }

      await this.securityEmailService.sendSecurityAlert({
        type: alertType as any,
        severity,
        user: userInfo,
        details,
        timestamp: new Date(),
        ipAddress
      }, adminEmails);

      // Log each email sent
      for (const adminEmail of adminEmails) {
        await this.logEmail({
          recipient_email: adminEmail,
          subject: `Security Alert: ${alertType}`,
          template_id: 'security_alert',
          status: 'sent'
        });
      }

      console.log(`🚨 Security alert sent to ${adminEmails.length} administrators`);
    } catch (error) {
      console.error('❌ Error sending security alert:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
    try {
      await this.securityEmailService.sendPasswordResetEmail(userEmail, userName, resetToken);

      await this.logEmail({
        recipient_email: userEmail,
        subject: 'Reset Your ONYX Platform Password',
        template_id: 'password_reset',
        status: 'sent'
      });

      // Log security event
      logSecurityEvent(
        'PASSWORD_RESET_EMAIL_SENT',
        null,
        '0.0.0.0',
        { user_email: userEmail, user_name: userName }
      );

      console.log(`🔑 Password reset email sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      
      await this.logEmail({
        recipient_email: userEmail,
        subject: 'Reset Your ONYX Platform Password',
        template_id: 'password_reset',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Send 2FA setup confirmation with backup codes
   */
  async send2FAConfirmationEmail(userEmail: string, userName: string, backupCodes: string[]) {
    try {
      await this.securityEmailService.send2FASetupConfirmation(userEmail, userName, backupCodes);

      await this.logEmail({
        recipient_email: userEmail,
        subject: 'Two-Factor Authentication Enabled - Backup Codes',
        template_id: '2fa_confirmation',
        status: 'sent'
      });

      // Log security event
      logSecurityEvent(
        'TWO_FACTOR_CONFIRMATION_EMAIL_SENT',
        null,
        '0.0.0.0',
        { user_email: userEmail, backup_codes_count: backupCodes.length }
      );

      console.log(`🔐 2FA confirmation email sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending 2FA confirmation email:', error);
      
      await this.logEmail({
        recipient_email: userEmail,
        subject: 'Two-Factor Authentication Enabled - Backup Codes',
        template_id: '2fa_confirmation',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Send security notification for account changes
   */
  async sendSecurityNotification(
    userEmail: string,
    userName: string,
    action: string,
    details: any,
    ipAddress: string
  ) {
    try {
      await this.securityEmailService.sendSecurityNotification(
        userEmail,
        userName,
        action,
        details,
        ipAddress
      );

      await this.logEmail({
        recipient_email: userEmail,
        subject: `Security Notification: ${action}`,
        template_id: 'security_notification',
        status: 'sent'
      });

      console.log(`🔔 Security notification sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending security notification:', error);
      
      await this.logEmail({
        recipient_email: userEmail,
        subject: `Security Notification: ${action}`,
        template_id: 'security_notification',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Send assessment report via email
   */
  async sendAssessmentReport(
    userEmail: string,
    userName: string,
    reportBuffer: Buffer,
    reportType: string,
    buildingName?: string
  ) {
    try {
      const subject = `Assessment Report${buildingName ? ` - ${buildingName}` : ''}`;
      const fileName = `assessment-report-${new Date().toISOString().split('T')[0]}.xlsx`;

      const html = this.generateAssessmentReportHTML(userName, reportType, buildingName);

      await this.mailgunService.sendEmailWithAttachment({
        to: userEmail,
        subject,
        html,
        attachments: [{
          filename: fileName,
          data: reportBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }]
      });

      await this.logEmail({
        recipient_email: userEmail,
        subject,
        template_id: 'assessment_report',
        status: 'sent'
      });

      console.log(`📊 Assessment report sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending assessment report:', error);
      
      await this.logEmail({
        recipient_email: userEmail,
        subject: `Assessment Report${buildingName ? ` - ${buildingName}` : ''}`,
        template_id: 'assessment_report',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Send bulk notification emails
   */
  async sendBulkNotification(
    userEmails: string[],
    subject: string,
    message: string,
    senderName: string = 'ONYX Platform'
  ) {
    const results = [];

    for (const email of userEmails) {
      try {
        const html = this.generateNotificationHTML(message, senderName);

        await this.mailgunService.sendEmail({
          to: email,
          subject,
          html
        });

        await this.logEmail({
          recipient_email: email,
          subject,
          template_id: 'bulk_notification',
          status: 'sent'
        });

        results.push({ email, status: 'sent' });
        
        // Delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error sending notification to ${email}:`, error);
        
        await this.logEmail({
          recipient_email: email,
          subject,
          template_id: 'bulk_notification',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

        results.push({ email, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    console.log(`📧 Bulk notification sent to ${userEmails.length} recipients: ${results.filter(r => r.status === 'sent').length} successful, ${results.filter(r => r.status === 'failed').length} failed`);
    
    return results;
  }

  /**
   * Get email statistics
   */
  async getEmailStats(days: number = 30) {
    try {
      // Get email logs from database
      const logsQuery = `
        SELECT 
          DATE(sent_at) as date,
          template_id,
          status,
          COUNT(*) as count
        FROM email_logs 
        WHERE sent_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(sent_at), template_id, status
        ORDER BY date DESC
      `;
      
      const logsResult = await pool.query(logsQuery);

      // Get Mailgun stats if available
      let mailgunStats = null;
      try {
        mailgunStats = await this.mailgunService.getEmailStats(days);
      } catch (error) {
        console.warn('⚠️ Could not fetch Mailgun stats:', error);
      }

      return {
        database_stats: logsResult.rows,
        mailgun_stats: mailgunStats,
        period_days: days
      };
    } catch (error) {
      console.error('❌ Error fetching email stats:', error);
      throw error;
    }
  }

  /**
   * Verify email service health
   */
  async verifyEmailService() {
    try {
      const mailgunVerification = await this.mailgunService.verifyConnection();
      
      // Test database connection
      await pool.query('SELECT 1');
      
      return {
        mailgun: mailgunVerification,
        database: { success: true, message: 'Database connection verified' },
        overall_status: mailgunVerification.success ? 'healthy' : 'degraded'
      };
    } catch (error) {
      console.error('❌ Email service verification failed:', error);
      return {
        mailgun: { success: false, message: 'Mailgun verification failed' },
        database: { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
        overall_status: 'unhealthy'
      };
    }
  }

  /**
   * Test email functionality
   */
  async sendTestEmail(userEmail: string, testType: 'welcome' | 'security' | 'report' = 'welcome') {
    try {
      switch (testType) {
        case 'welcome':
          await this.sendWelcomeEmail(userEmail, 'Test User', 'Test Organization', 'TestPass123!');
          break;
        case 'security':
          await this.sendSecurityAlert(
            'TEST_ALERT',
            'LOW',
            { message: 'This is a test security alert' },
            { id: 'test', name: 'Test User', email: userEmail },
            '127.0.0.1'
          );
          break;
        case 'report':
          const testBuffer = Buffer.from('Test report content');
          await this.sendAssessmentReport(userEmail, 'Test User', testBuffer, 'Test Report', 'Test Building');
          break;
      }

      return { success: true, message: `Test ${testType} email sent successfully` };
    } catch (error) {
      console.error('❌ Test email failed:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async logEmail(emailLog: Omit<EmailLog, 'id' | 'sent_at'>) {
    try {
      await pool.query(
        `INSERT INTO email_logs (recipient_email, subject, template_id, status, mailgun_message_id, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          emailLog.recipient_email,
          emailLog.subject,
          emailLog.template_id,
          emailLog.status,
          emailLog.mailgun_message_id || null,
          emailLog.error_message || null
        ]
      );
    } catch (error) {
      console.error('❌ Error logging email:', error);
      // Don't throw here to avoid breaking email sending
    }
  }

  private generateAssessmentReportHTML(userName: string, reportType: string, buildingName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assessment Report</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #1f2937;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px; 
            text-align: center;
            color: white;
          }
          .content { 
            padding: 30px; 
          }
          .report-box {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block; 
            font-weight: 600;
            text-align: center;
          }
          .footer { 
            background-color: #f9fafb;
            text-align: center; 
            padding: 20px;
            color: #6b7280; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📊 Assessment Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">ONYX Platform</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>
            
            <p>Your requested assessment report is ready and attached to this email.</p>

            <div class="report-box">
              <h3 style="margin-top: 0; color: #0369a1;">📋 Report Details</h3>
              <p><strong>Report Type:</strong> ${reportType}</p>
              ${buildingName ? `<p><strong>Building:</strong> ${buildingName}</p>` : ''}
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>The report includes:</p>
            <ul>
              <li>📈 Facility Condition Index (FCI) calculations</li>
              <li>💰 Cost breakdown and repair recommendations</li>
              <li>🏗️ Element condition ratings</li>
              <li>📊 Performance metrics and trends</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://onyxreport.com'}/reports" class="button">
                View Online Dashboard
              </a>
            </div>

            <p>Best regards,<br><strong>The ONYX Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform - Building Assessment Excellence</strong></p>
            <p>This is an automated report delivery.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateNotificationHTML(message: string, senderName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notification</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #1f2937;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px; 
            text-align: center;
            color: white;
          }
          .content { 
            padding: 30px; 
          }
          .message-box {
            background-color: #f8fafc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
          }
          .footer { 
            background-color: #f9fafb;
            text-align: center; 
            padding: 20px;
            color: #6b7280; 
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 Notification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">ONYX Platform</p>
          </div>
          
          <div class="content">
            <div class="message-box">
              ${message}
            </div>

            <p>Best regards,<br><strong>${senderName}</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform</strong></p>
            <p>This is an automated notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EnhancedEmailService();