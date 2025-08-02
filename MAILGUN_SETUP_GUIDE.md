# 📧 Mailgun Setup Guide for ONYX Platform

This guide will help you activate and configure Mailgun for the ONYX Platform's email system.

## 🚀 Quick Start

### Step 1: Create Mailgun Account
1. Visit https://www.mailgun.com
2. Sign up for a free account (40,000 emails/month for 3 months)
3. Verify your email address
4. Complete account setup

### Step 2: Add Your Domain
1. In Mailgun dashboard, go to **Sending** → **Domains**
2. Click **Add New Domain**
3. Enter your domain: `onyxreport.com`
4. Choose region: **US** (recommended)
5. Click **Add Domain**

### Step 3: Verify Domain (DNS Configuration)
Add these DNS records to your domain (via Cloudflare or domain registrar):

#### TXT Records:
```
Name: onyxreport.com
Value: v=spf1 include:mailgun.org ~all

Name: k1._domainkey.onyxreport.com
Value: [Mailgun will provide this - copy from dashboard]
```

#### MX Record:
```
Name: onyxreport.com
Value: mxa.mailgun.org
Priority: 10

Name: onyxreport.com
Value: mxb.mailgun.org
Priority: 10
```

#### CNAME Record:
```
Name: email.onyxreport.com
Value: mailgun.org
```

### Step 4: Get API Credentials
1. Go to **Settings** → **API Keys**
2. Copy your **Private API key**
3. Note your domain: `onyxreport.com`

### Step 5: Configure Environment Variables
Add these to your Render.com backend environment variables:

```bash
MAILGUN_API_KEY=your-private-api-key-here
MAILGUN_DOMAIN=onyxreport.com
MAILGUN_HOST=api.mailgun.net
FROM_EMAIL=noreply@onyxreport.com
FROM_NAME=ONYX Platform
```

---

## 🔧 Advanced Configuration

### Custom From Addresses
You can configure different from addresses for different email types:

```bash
# Security alerts
SECURITY_FROM_EMAIL=security@onyxreport.com
SECURITY_FROM_NAME=ONYX Security Team

# Reports
REPORTS_FROM_EMAIL=reports@onyxreport.com
REPORTS_FROM_NAME=ONYX Reports

# Support
SUPPORT_FROM_EMAIL=support@onyxreport.com
SUPPORT_FROM_NAME=ONYX Support
```

### Email Templates
The system includes these pre-built templates:
- **Welcome Email** - New user onboarding
- **Password Reset** - Secure password recovery
- **Security Alerts** - Real-time threat notifications
- **2FA Confirmation** - Two-factor setup confirmation
- **Assessment Reports** - Automated report delivery

### Webhooks (Optional)
Set up webhooks to track email delivery:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://onyx-backend-f7vh.onrender.com/api/email/webhook`
3. Enable events: `delivered`, `opened`, `clicked`, `bounced`, `complained`

---

## 📊 Email Testing

### Test Email Service
```bash
# Test basic email functionality
curl -X POST https://onyx-backend-f7vh.onrender.com/api/email/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "type": "welcome"
  }'
```

### Test Security Alerts
```bash
curl -X POST https://onyx-backend-f7vh.onrender.com/api/email/security-alert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alertType": "TEST_ALERT",
    "severity": "LOW",
    "details": {"test": true},
    "ipAddress": "127.0.0.1"
  }'
```

### Test Report Delivery
```bash
curl -X POST https://onyx-backend-f7vh.onrender.com/api/email/test-report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "reportType": "summary"
  }'
```

---

## 🔒 Security Features

### Email Security
- **SPF Records**: Prevent email spoofing
- **DKIM Signing**: Verify email authenticity
- **DMARC Policy**: Email authentication and reporting
- **Secure Headers**: X-Mailgun-Track headers for analytics
- **Rate Limiting**: Prevent abuse and spam

### Security Notifications
The system automatically sends emails for:
- Failed login attempts (>5 attempts)
- Account lockouts
- Password changes
- 2FA enable/disable
- Suspicious activities
- Security policy violations

### Email Logging
All emails are logged with:
- Recipient information
- Delivery status
- Timestamp tracking
- Error reporting
- Security event correlation

---

## 📈 Monitoring & Analytics

### Email Statistics
Access email analytics via:
```
GET /api/email/stats?days=30
GET /api/email/mailgun-stats?days=7
```

### Health Monitoring
Check email service health:
```
GET /api/email/health
```

### Dashboard Metrics
Monitor these KPIs:
- **Delivery Rate**: >95% target
- **Open Rate**: 20-30% average
- **Bounce Rate**: <5% target
- **Complaint Rate**: <0.1% target
- **Response Time**: <30 seconds

---

## 🚨 Troubleshooting

### Common Issues

#### 1. DNS Not Propagated
**Problem**: Domain verification fails
**Solution**: 
- Wait 24-48 hours for DNS propagation
- Check DNS records with: `dig TXT onyxreport.com`
- Verify records in Cloudflare DNS settings

#### 2. API Key Invalid
**Problem**: Authentication errors
**Solution**:
- Regenerate API key in Mailgun dashboard
- Update environment variables in Render
- Restart backend service

#### 3. Emails Going to Spam
**Problem**: Low deliverability
**Solution**:
- Complete domain verification
- Set up DMARC policy
- Warm up domain with gradual volume increase
- Monitor sender reputation

#### 4. Rate Limiting
**Problem**: Too many emails sent
**Solution**:
- Implement delays between emails
- Use bulk email endpoints
- Upgrade Mailgun plan for higher limits

### Error Codes
- **400**: Bad request (invalid email format)
- **401**: Unauthorized (invalid API key)
- **402**: Payment required (exceeded quota)
- **429**: Rate limit exceeded
- **500**: Server error (contact support)

---

## 📋 Email Types & Use Cases

### 1. Security Emails
- **Failed Login Alerts**: Real-time notifications
- **Account Lockout**: Immediate security alerts
- **Password Changes**: Confirmation notifications
- **2FA Setup**: Setup confirmation with backup codes
- **Suspicious Activity**: Threat detection alerts

### 2. System Emails
- **Welcome Messages**: New user onboarding
- **Password Resets**: Secure recovery process
- **Account Verification**: Email confirmation
- **System Maintenance**: Service notifications
- **Feature Updates**: Platform announcements

### 3. Report Emails
- **Daily Reports**: Automated assessment summaries
- **Weekly Reports**: Comprehensive facility analysis
- **Monthly Reports**: Executive dashboards
- **Critical Alerts**: Urgent facility issues
- **Custom Reports**: User-defined analytics

### 4. Communication Emails
- **Team Notifications**: Collaboration updates
- **Assignment Alerts**: Task notifications
- **Deadline Reminders**: Assessment due dates
- **Approval Requests**: Workflow notifications
- **Status Updates**: Project progress reports

---

## 🎯 Best Practices

### Email Design
- **Mobile Responsive**: 60%+ emails opened on mobile
- **Clear CTAs**: Single, prominent call-to-action
- **Professional Branding**: Consistent ONYX styling
- **Accessible Content**: WCAG 2.1 compliance
- **Optimized Images**: Fast loading, alt text

### Content Guidelines
- **Subject Lines**: <50 characters, clear purpose
- **Preview Text**: 90-140 characters summary
- **Personalization**: Use recipient names
- **Clear Language**: Professional, concise tone
- **Value Focus**: Highlight benefits and actions

### Delivery Optimization
- **Send Time**: 9-11 AM, Tuesday-Thursday optimal
- **Frequency**: Respect user preferences
- **List Hygiene**: Remove bounced emails
- **A/B Testing**: Test subject lines and content
- **Segmentation**: Target relevant audiences

### Compliance
- **CAN-SPAM**: Include unsubscribe links
- **GDPR**: Respect data protection rights
- **Privacy Policy**: Link to privacy information
- **Consent Management**: Honor opt-out requests
- **Data Retention**: Follow legal requirements

---

## 🔗 Useful Resources

### Mailgun Documentation
- [Getting Started Guide](https://documentation.mailgun.com/en/latest/quickstart.html)
- [API Reference](https://documentation.mailgun.com/en/latest/api-reference.html)
- [Webhooks Guide](https://documentation.mailgun.com/en/latest/user_manual.html#webhooks)
- [Email Validation](https://documentation.mailgun.com/en/latest/api-email-validation.html)

### Email Best Practices
- [Email Design Guide](https://mailgun.com/email-design-guide/)
- [Deliverability Tips](https://www.mailgun.com/blog/email-deliverability/)
- [Authentication Setup](https://help.mailgun.com/hc/en-us/articles/203380100-Where-can-I-find-my-API-key-and-SMTP-credentials-)

### Testing Tools
- [Mail-Tester](https://www.mail-tester.com/) - Test spam score
- [Litmus](https://litmus.com/) - Email preview testing
- [Email on Acid](https://www.emailonacid.com/) - Email testing platform

---

## 📞 Support

### Mailgun Support
- **Email**: support@mailgun.com
- **Documentation**: https://help.mailgun.com
- **Status Page**: https://status.mailgun.com

### ONYX Platform Support
- **Email**: support@onyxreport.com
- **Documentation**: In-platform help system
- **Emergency**: Security incident response

---

*Last Updated: December 2024*  
*Version: 1.0*