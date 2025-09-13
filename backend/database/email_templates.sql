-- Email Templates for Onyx Application
-- Insert comprehensive email templates for all system notifications

-- Welcome email template
INSERT INTO email_templates (name, subject, html_content, text_content, category, is_active) VALUES 
('welcome', 
 'Welcome to Onyx - Building Assessment Platform', 
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Onyx</title>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .button { background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome to Onyx</h1>
            <p>Professional Building Assessment Platform</p>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>Welcome to <strong>{{organization_name}}</strong> on the Onyx platform! Your account has been successfully created.</p>
            
            <p>With Onyx, you can:</p>
            <ul>
                <li>Conduct comprehensive building condition assessments</li>
                <li>Generate professional FCI reports</li>
                <li>Track facility maintenance and capital planning</li>
                <li>Collaborate with your team on assessments</li>
            </ul>
            
            <p>Get started by logging into your account:</p>
            <a href="{{app_url}}" class="button">Access Your Dashboard</a>
            
            <p>If you have any questions, our support team is here to help.</p>
            
            <p>Best regards,<br>The Onyx Team</p>
        </div>
        <div class="footer">
            <p>© 2024 Onyx Platform. All rights reserved.</p>
            <p>If you did not create this account, please ignore this email.</p>
        </div>
    </div>
</body>
</html>',
'Welcome to Onyx - Building Assessment Platform

Hello {{user_name}},

Welcome to {{organization_name}} on the Onyx platform! Your account has been successfully created.

With Onyx, you can:
- Conduct comprehensive building condition assessments
- Generate professional FCI reports  
- Track facility maintenance and capital planning
- Collaborate with your team on assessments

Get started by logging into your account at: {{app_url}}

If you have any questions, our support team is here to help.

Best regards,
The Onyx Team

© 2024 Onyx Platform. All rights reserved.
If you did not create this account, please ignore this email.',
'user_management', true),

-- Assessment completion notification
('assessment_completed',
 'Assessment Completed - {{building_name}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assessment Completed</title>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .metrics { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 24px; font-weight: bold; color: #059669; }
        .metric-label { font-size: 14px; color: #6b7280; }
        .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✅ Assessment Completed</h1>
            <p>{{building_name}}</p>
        </div>
        <div class="content">
            <h2>Assessment Summary</h2>
            <p>The facility condition assessment for <strong>{{building_name}}</strong> has been completed by {{assessor_name}}.</p>
            
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">{{fci_score}}</div>
                    <div class="metric-label">FCI Score</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${{total_repair_cost}}</div>
                    <div class="metric-label">Total Repair Cost</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{{element_count}}</div>
                    <div class="metric-label">Elements Assessed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{{deficiency_count}}</div>
                    <div class="metric-label">Deficiencies Found</div>
                </div>
            </div>
            
            <p><strong>Assessment Date:</strong> {{assessment_date}}<br>
               <strong>Completed By:</strong> {{assessor_name}}</p>
            
            <a href="{{report_url}}" class="button">View Full Report</a>
            
            <p>The detailed report is now available in your dashboard for review and download.</p>
        </div>
        <div class="footer">
            <p>© 2024 Onyx Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'Assessment Completed - {{building_name}}

Assessment Summary
==================

The facility condition assessment for {{building_name}} has been completed by {{assessor_name}}.

Key Metrics:
- FCI Score: {{fci_score}}
- Total Repair Cost: ${{total_repair_cost}}
- Elements Assessed: {{element_count}}
- Deficiencies Found: {{deficiency_count}}

Assessment Date: {{assessment_date}}
Completed By: {{assessor_name}}

View the full report at: {{report_url}}

The detailed report is now available in your dashboard for review and download.

© 2024 Onyx Platform. All rights reserved.',
'assessment_notifications', true),

-- Password reset template
('password_reset',
 'Reset Your Onyx Password',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {{user_name}},</h2>
            <p>We received a request to reset your password for your Onyx account.</p>
            
            <p>Click the button below to create a new password:</p>
            <a href="{{reset_url}}" class="button">Reset My Password</a>
            
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you did not request this reset, please ignore this email</li>
                    <li>Your current password will remain unchanged until you create a new one</li>
                </ul>
            </div>
            
            <p>For security reasons, if you continue to have trouble accessing your account, please contact your system administrator.</p>
            
            <p>Best regards,<br>The Onyx Team</p>
        </div>
        <div class="footer">
            <p>© 2024 Onyx Platform. All rights reserved.</p>
            <p>This password reset was requested from IP: {{ip_address}}</p>
        </div>
    </div>
</body>
</html>',
'Reset Your Onyx Password

Hello {{user_name}},

We received a request to reset your password for your Onyx account.

Reset your password by visiting: {{reset_url}}

IMPORTANT:
- This link will expire in 1 hour
- If you did not request this reset, please ignore this email
- Your current password will remain unchanged until you create a new one

For security reasons, if you continue to have trouble accessing your account, please contact your system administrator.

Best regards,
The Onyx Team

© 2024 Onyx Platform. All rights reserved.
This password reset was requested from IP: {{ip_address}}',
'security', true),

-- Team invitation template
('team_invitation',
 'You''ve been invited to join {{organization_name}} on Onyx',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        .role-badge { background: #ede9fe; color: #7c3aed; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Team Invitation</h1>
            <p>Join {{organization_name}} on Onyx</p>
        </div>
        <div class="content">
            <h2>You''re Invited!</h2>
            <p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{organization_name}}</strong> on the Onyx platform.</p>
            
            <p>You''ve been assigned the role: <span class="role-badge">{{user_role}}</span></p>
            
            <p>{{invitation_message}}</p>
            
            <p>Accept your invitation and create your account:</p>
            <a href="{{invitation_url}}" class="button">Accept Invitation</a>
            
            <p>About Onyx:</p>
            <ul>
                <li>Professional building condition assessment tools</li>
                <li>Comprehensive FCI reporting and analytics</li>
                <li>Team collaboration and project management</li>
                <li>Capital planning and maintenance scheduling</li>
            </ul>
            
            <p>This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
            <p>© 2024 Onyx Platform. All rights reserved.</p>
            <p>If you believe you received this invitation in error, please ignore this email.</p>
        </div>
    </div>
</body>
</html>',
'You''ve been invited to join {{organization_name}} on Onyx

You''re Invited!

{{inviter_name}} has invited you to join {{organization_name}} on the Onyx platform.

You''ve been assigned the role: {{user_role}}

{{invitation_message}}

Accept your invitation and create your account at: {{invitation_url}}

About Onyx:
- Professional building condition assessment tools
- Comprehensive FCI reporting and analytics  
- Team collaboration and project management
- Capital planning and maintenance scheduling

This invitation will expire in 7 days.

© 2024 Onyx Platform. All rights reserved.
If you believe you received this invitation in error, please ignore this email.',
'user_management', true),

-- Report generation complete
('report_ready',
 'Your Report is Ready - {{building_name}}',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Ready</title>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #0891b2; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .button { background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .button-secondary { background: #ffffff; color: #0891b2; border: 2px solid #0891b2; padding: 10px 22px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 10px 10px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>📊 Report Generated</h1>
            <p>{{building_name}}</p>
        </div>
        <div class="content">
            <h2>Your report is ready for download</h2>
            <p>The facility condition assessment report for <strong>{{building_name}}</strong> has been successfully generated and is now available.</p>
            
            <p><strong>Report Details:</strong></p>
            <ul>
                <li>Building: {{building_name}}</li>
                <li>Assessment Date: {{assessment_date}}</li>
                <li>Report Type: {{report_type}}</li>
                <li>Generated: {{generated_date}}</li>
            </ul>
            
            <p>Download your report:</p>
            <a href="{{pdf_download_url}}" class="button">Download PDF Report</a>
            <a href="{{excel_download_url}}" class="button-secondary">Download Excel Data</a>
            
            <a href="{{dashboard_url}}" class="button-secondary">View in Dashboard</a>
            
            <p>The report includes comprehensive facility condition analysis, FCI calculations, maintenance recommendations, and detailed findings.</p>
        </div>
        <div class="footer">
            <p>© 2024 Onyx Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'Your Report is Ready - {{building_name}}

Report Generated
================

The facility condition assessment report for {{building_name}} has been successfully generated and is now available.

Report Details:
- Building: {{building_name}}
- Assessment Date: {{assessment_date}}
- Report Type: {{report_type}}
- Generated: {{generated_date}}

Download Links:
PDF Report: {{pdf_download_url}}
Excel Data: {{excel_download_url}}

View in Dashboard: {{dashboard_url}}

The report includes comprehensive facility condition analysis, FCI calculations, maintenance recommendations, and detailed findings.

© 2024 Onyx Platform. All rights reserved.',
'report_notifications', true),

-- System maintenance notification
('maintenance_notification',
 'Scheduled Maintenance - Onyx Platform',
 '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scheduled Maintenance</title>
    <style>
        .email-container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        .schedule { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>⚠️ Scheduled Maintenance</h1>
            <p>Onyx Platform</p>
        </div>
        <div class="content">
            <h2>Planned System Maintenance</h2>
            <p>We will be performing scheduled maintenance on the Onyx platform to improve performance and add new features.</p>
            
            <div class="schedule">
                <h3>Maintenance Schedule</h3>
                <p><strong>Start:</strong> {{maintenance_start}}<br>
                   <strong>End:</strong> {{maintenance_end}}<br>
                   <strong>Duration:</strong> {{maintenance_duration}}</p>
            </div>
            
            <p><strong>What to expect:</strong></p>
            <ul>
                <li>The platform will be temporarily unavailable</li>
                <li>No data will be lost during this maintenance</li>
                <li>All ongoing work will be preserved</li>
                <li>Email notifications may be delayed</li>
            </ul>
            
            <p>We apologize for any inconvenience and appreciate your patience as we work to improve your experience.</p>
            
            <p>If you have any urgent questions, please contact our support team.</p>
            
            <p>Thank you,<br>The Onyx Team</p>
        </div>
        <div class="footer">
            <p>© 2024 Onyx Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'Scheduled Maintenance - Onyx Platform

Planned System Maintenance

We will be performing scheduled maintenance on the Onyx platform to improve performance and add new features.

Maintenance Schedule:
Start: {{maintenance_start}}
End: {{maintenance_end}}
Duration: {{maintenance_duration}}

What to expect:
- The platform will be temporarily unavailable
- No data will be lost during this maintenance
- All ongoing work will be preserved
- Email notifications may be delayed

We apologize for any inconvenience and appreciate your patience as we work to improve your experience.

If you have any urgent questions, please contact our support team.

Thank you,
The Onyx Team

© 2024 Onyx Platform. All rights reserved.',
'system_notifications', true);