import { MailgunEmailService } from './mailgun-email.service';
import { logSecurityEvent } from '../config/security';
import { format } from 'date-fns';

interface SecurityAlert {
  type: 'FAILED_LOGIN' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 'SECURITY_BREACH' | 'PASSWORD_CHANGED' | 'TWO_FACTOR_ENABLED' | 'TWO_FACTOR_DISABLED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user?: {
    id: string;
    name: string;
    email: string;
  };
  details: any;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
}

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  temporaryPassword?: string;
  loginUrl: string;
  organizationName?: string;
}

export class SecurityEmailService {
  private mailgunService: MailgunEmailService;

  constructor(mailgunService: MailgunEmailService) {
    this.mailgunService = mailgunService;
  }

  /**
   * Send security alert email to administrators
   */
  async sendSecurityAlert(alert: SecurityAlert, adminEmails: string[] = ['admin@onyxreport.com']) {
    try {
      const subject = this.getAlertSubject(alert);
      const html = this.generateSecurityAlertHTML(alert);

      for (const adminEmail of adminEmails) {
        await this.mailgunService.sendEmail({
          to: adminEmail,
          subject,
          html
        });
      }

      logSecurityEvent(
        'SECURITY_ALERT_SENT',
        alert.user?.id || null,
        alert.ipAddress,
        {
          alert_type: alert.type,
          severity: alert.severity,
          admin_count: adminEmails.length
        }
      );

      console.log(`🚨 Security alert sent to ${adminEmails.length} administrators`);
    } catch (error) {
      console.error('❌ Error sending security alert:', error);
      throw error;
    }
  }

  /**
   * Send user welcome email with account setup instructions
   */
  async sendWelcomeEmail(data: WelcomeEmailData) {
    try {
      const subject = `Welcome to ONYX Platform - Your Account is Ready`;
      const html = this.generateWelcomeEmailHTML(data);

      await this.mailgunService.sendEmail({
        to: data.userEmail,
        subject,
        html
      });

      console.log(`👋 Welcome email sent to ${data.userEmail}`);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string) {
    try {
      const resetUrl = `${process.env.CLIENT_URL || 'https://onyxreport.com'}/reset-password?token=${resetToken}`;
      const subject = `Reset Your ONYX Platform Password`;
      const html = this.generatePasswordResetHTML(userName, resetUrl);

      await this.mailgunService.sendEmail({
        to: userEmail,
        subject,
        html
      });

      console.log(`🔑 Password reset email sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send 2FA setup confirmation email
   */
  async send2FASetupConfirmation(userEmail: string, userName: string, backupCodes: string[]) {
    try {
      const subject = `Two-Factor Authentication Enabled - Backup Codes`;
      const html = this.generate2FAConfirmationHTML(userName, backupCodes);

      await this.mailgunService.sendEmail({
        to: userEmail,
        subject,
        html
      });

      console.log(`🔐 2FA confirmation email sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending 2FA confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send security notification for important account changes
   */
  async sendSecurityNotification(
    userEmail: string, 
    userName: string, 
    action: string, 
    details: any,
    ipAddress: string
  ) {
    try {
      const subject = `Security Notification: ${action}`;
      const html = this.generateSecurityNotificationHTML(userName, action, details, ipAddress);

      await this.mailgunService.sendEmail({
        to: userEmail,
        subject,
        html
      });

      console.log(`🔔 Security notification sent to ${userEmail}`);
    } catch (error) {
      console.error('❌ Error sending security notification:', error);
      throw error;
    }
  }

  private getAlertSubject(alert: SecurityAlert): string {
    const severity = alert.severity === 'CRITICAL' ? '🚨 CRITICAL' : 
                    alert.severity === 'HIGH' ? '⚠️ HIGH' : 
                    alert.severity === 'MEDIUM' ? '🟡 MEDIUM' : '🔵 LOW';

    const baseSubject = `[ONYX Security Alert] ${severity}`;

    switch (alert.type) {
      case 'FAILED_LOGIN':
        return `${baseSubject} - Multiple Failed Login Attempts`;
      case 'ACCOUNT_LOCKED':
        return `${baseSubject} - Account Locked Due to Security`;
      case 'SUSPICIOUS_ACTIVITY':
        return `${baseSubject} - Suspicious User Activity Detected`;
      case 'SECURITY_BREACH':
        return `${baseSubject} - Potential Security Breach`;
      case 'PASSWORD_CHANGED':
        return `${baseSubject} - Password Changed`;
      case 'TWO_FACTOR_ENABLED':
        return `${baseSubject} - Two-Factor Authentication Enabled`;
      case 'TWO_FACTOR_DISABLED':
        return `${baseSubject} - Two-Factor Authentication Disabled`;
      default:
        return `${baseSubject} - Security Event`;
    }
  }

  private generateSecurityAlertHTML(alert: SecurityAlert): string {
    const timestamp = format(alert.timestamp, 'MMMM dd, yyyy \'at\' HH:mm:ss');
    const severityColor = alert.severity === 'CRITICAL' ? '#dc2626' : 
                         alert.severity === 'HIGH' ? '#ea580c' : 
                         alert.severity === 'MEDIUM' ? '#d97706' : '#2563eb';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ONYX Security Alert</title>
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
            background-color: ${severityColor};
            padding: 20px; 
            text-align: center;
            color: white;
          }
          .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .alert-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .content { 
            padding: 30px; 
          }
          .alert-details {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          .detail-value {
            color: #6b7280;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
          }
          .action-required {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .button { 
            background-color: ${severityColor};
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
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
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">🚨</div>
            <h1 class="alert-title">Security Alert</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${alert.type.replace(/_/g, ' ')}</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Security Event Details</h2>
            
            <div class="alert-details">
              <div class="detail-row">
                <span class="detail-label">Event Type:</span>
                <span class="detail-value">${alert.type}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Severity:</span>
                <span class="detail-value" style="color: ${severityColor}; font-weight: bold;">${alert.severity}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Timestamp:</span>
                <span class="detail-value">${timestamp}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP Address:</span>
                <span class="detail-value">${alert.ipAddress}</span>
              </div>
              ${alert.user ? `
              <div class="detail-row">
                <span class="detail-label">User:</span>
                <span class="detail-value">${alert.user.name} (${alert.user.email})</span>
              </div>
              ` : ''}
              ${alert.userAgent ? `
              <div class="detail-row">
                <span class="detail-label">User Agent:</span>
                <span class="detail-value">${alert.userAgent}</span>
              </div>
              ` : ''}
            </div>

            ${alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? `
            <div class="action-required">
              <strong>⚠️ Immediate Action Required</strong><br>
              This security event requires immediate attention. Please review the details and take appropriate action to secure the platform.
            </div>
            ` : ''}

            <h3>Event Details:</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px;">
              ${JSON.stringify(alert.details, null, 2)}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'https://onyxreport.com'}/admin/security" class="button">
                View Security Dashboard
              </a>
            </div>

            <p><strong>Recommended Actions:</strong></p>
            <ul>
              <li>Review the security dashboard for additional events</li>
              <li>Check user account status and recent activities</li>
              <li>Verify IP address and geographic location</li>
              <li>Consider implementing additional security measures if needed</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform Security Team</strong></p>
            <p>This is an automated security alert. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ONYX Platform</title>
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
            padding: 40px 20px; 
            text-align: center;
            color: white;
          }
          .logo { 
            font-size: 36px; 
            font-weight: bold;
            margin-bottom: 10px;
          }
          .content { 
            padding: 30px; 
          }
          .credentials-box {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
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
            margin: 10px 0;
          }
          .feature-list {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
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
            <div class="logo">🏗️ ONYX</div>
            <h1 style="margin: 0; font-size: 28px;">Welcome to ONYX Platform</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Building Assessment & Facility Management</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.userName}! 👋</h2>
            
            <p>Welcome to the ONYX Platform! Your account has been successfully created and you're ready to start managing building assessments and facility operations.</p>

            ${data.organizationName ? `
            <p><strong>Organization:</strong> ${data.organizationName}</p>
            ` : ''}

            ${data.temporaryPassword ? `
            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #0369a1;">🔑 Your Login Credentials</h3>
              <p><strong>Email:</strong> ${data.userEmail}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${data.temporaryPassword}</code></p>
              <p style="color: #dc2626; font-size: 14px; margin-bottom: 0;">
                ⚠️ Please change your password immediately after logging in
              </p>
            </div>
            ` : ''}

            <div class="feature-list">
              <h3 style="margin-top: 0;">🚀 What you can do with ONYX:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>📊 Conduct comprehensive building assessments</li>
                <li>🏗️ Track facility condition indices (FCI)</li>
                <li>💰 Calculate repair costs and maintenance budgets</li>
                <li>📈 Generate detailed reports and analytics</li>
                <li>👥 Collaborate with your team members</li>
                <li>🔒 Secure, enterprise-grade platform</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" class="button">
                🚀 Access Your Dashboard
              </a>
            </div>

            <h3>🔒 Security Features:</h3>
            <ul>
              <li><strong>Two-Factor Authentication:</strong> Enable 2FA in your profile for enhanced security</li>
              <li><strong>Secure Sessions:</strong> Automatic session management and timeout</li>
              <li><strong>Audit Logging:</strong> All activities are logged for security and compliance</li>
            </ul>

            <h3>📞 Need Help?</h3>
            <p>If you have any questions or need assistance getting started:</p>
            <ul>
              <li>📧 Email: support@onyxreport.com</li>
              <li>📖 Visit our help documentation in the platform</li>
              <li>🎓 Complete the onboarding tutorial in your dashboard</li>
            </ul>

            <p style="margin-top: 30px;">Best regards,<br><strong>The ONYX Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform - Building Assessment Excellence</strong></p>
            <p>This email was sent to ${data.userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetHTML(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your ONYX Platform Password</title>
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
          .reset-box {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
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
            margin: 10px 0;
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
            <h1 style="margin: 0;">🔑 Password Reset</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">ONYX Platform</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>
            
            <p>We received a request to reset your password for your ONYX Platform account. If you didn't make this request, you can safely ignore this email.</p>

            <div class="reset-box">
              <h3 style="margin-top: 0; color: #92400e;">⏰ Important</h3>
              <p style="margin-bottom: 0;">This password reset link will expire in <strong>1 hour</strong> for security reasons.</p>
            </div>

            <p>To reset your password, click the button below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">
                🔓 Reset My Password
              </a>
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 13px;">
              ${resetUrl}
            </p>

            <h3>🔒 Security Tips:</h3>
            <ul>
              <li>Choose a strong password with at least 8 characters</li>
              <li>Include uppercase, lowercase, numbers, and special characters</li>
              <li>Don't reuse passwords from other accounts</li>
              <li>Consider enabling two-factor authentication for extra security</li>
            </ul>

            <p style="margin-top: 30px;">If you continue to have problems, please contact our support team.</p>

            <p>Best regards,<br><strong>The ONYX Security Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform Security</strong></p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generate2FAConfirmationHTML(userName: string, backupCodes: string[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Two-Factor Authentication Enabled</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 30px 20px; 
            text-align: center;
            color: white;
          }
          .content { 
            padding: 30px; 
          }
          .success-box {
            background-color: #f0fdf4;
            border: 1px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .backup-codes {
            background-color: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .code-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
          }
          .backup-code {
            background-color: white;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
            text-align: center;
            border: 1px solid #d1d5db;
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
            <h1 style="margin: 0;">🔐 2FA Enabled</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Two-Factor Authentication</p>
          </div>
          
          <div class="content">
            <div class="success-box">
              <h2 style="margin-top: 0; color: #059669;">✅ Success!</h2>
              <p style="margin-bottom: 0;">Two-factor authentication has been successfully enabled for your account.</p>
            </div>

            <h2 style="color: #1f2937;">Hello ${userName},</h2>
            
            <p>Great news! Two-factor authentication (2FA) is now active on your ONYX Platform account. This adds an extra layer of security to protect your account.</p>

            <div class="backup-codes">
              <h3 style="margin-top: 0; color: #92400e;">🔑 Important: Save Your Backup Codes</h3>
              <p>These backup codes can be used to access your account if you lose access to your authenticator app. <strong>Store them in a safe place!</strong></p>
              
              <div class="code-grid">
                ${backupCodes.map(code => `<div class="backup-code">${code}</div>`).join('')}
              </div>
              
              <p style="margin-bottom: 0; font-size: 14px; color: #92400e;">
                ⚠️ Each code can only be used once. Save these codes securely!
              </p>
            </div>

            <h3>📱 How 2FA Works:</h3>
            <ol>
              <li>Enter your email and password as usual</li>
              <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Enter the 6-digit code from your app</li>
              <li>Access your account securely!</li>
            </ol>

            <h3>🆘 If You Lose Access:</h3>
            <ul>
              <li>Use one of your backup codes above</li>
              <li>Contact support if you've lost both your device and backup codes</li>
              <li>You can disable 2FA from your profile settings if needed</li>
            </ul>

            <h3>🔒 Security Benefits:</h3>
            <ul>
              <li>Protection against password breaches</li>
              <li>Secure access even if your password is compromised</li>
              <li>Compliance with security best practices</li>
              <li>Peace of mind for your valuable data</li>
            </ul>

            <p style="margin-top: 30px;">Thank you for taking steps to secure your account!</p>

            <p>Best regards,<br><strong>The ONYX Security Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform Security</strong></p>
            <p>This email was sent to confirm your 2FA setup.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateSecurityNotificationHTML(
    userName: string, 
    action: string, 
    details: any, 
    ipAddress: string
  ): string {
    const timestamp = format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm:ss');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Notification</title>
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
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 30px 20px; 
            text-align: center;
            color: white;
          }
          .content { 
            padding: 30px; 
          }
          .notification-box {
            background-color: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
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
            <h1 style="margin: 0;">🔔 Security Notification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">ONYX Platform</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName},</h2>
            
            <p>We're writing to inform you about a security-related action on your account:</p>

            <div class="notification-box">
              <h3 style="margin-top: 0; color: #1d4ed8;">📋 Action Details</h3>
              <p><strong>Action:</strong> ${action}</p>
              <p><strong>Time:</strong> ${timestamp}</p>
              <p><strong>IP Address:</strong> ${ipAddress}</p>
              ${details.location ? `<p><strong>Location:</strong> ${details.location}</p>` : ''}
            </div>

            <p>If this was you, no further action is needed. If you don't recognize this activity, please:</p>

            <ul>
              <li>🔐 Change your password immediately</li>
              <li>🛡️ Enable two-factor authentication if not already active</li>
              <li>📧 Contact our support team</li>
              <li>🔍 Review your recent account activity</li>
            </ul>

            <p style="margin-top: 30px;">Stay secure!</p>

            <p>Best regards,<br><strong>The ONYX Security Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ONYX Platform Security</strong></p>
            <p>This is an automated security notification.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default SecurityEmailService;