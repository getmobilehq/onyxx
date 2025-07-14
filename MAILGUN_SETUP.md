# Mailgun Setup Guide for Onyx Platform

This guide will help you configure Mailgun for transactional emails in the Onyx building assessment platform.

## 🚀 Quick Setup

### 1. Create Mailgun Account
1. Go to [Mailgun.com](https://www.mailgun.com/)
2. Sign up for a free account (includes 5,000 emails/month)
3. Verify your email and phone number

### 2. Get Your Mailgun Credentials

#### API Key
1. Go to **Settings** → **API Keys**
2. Copy your **Private API Key** (starts with `key-`)

#### Domain Setup
1. Go to **Sending** → **Domains**
2. Choose one of these options:

**Option A: Use Mailgun Sandbox Domain (Testing)**
- Use the provided sandbox domain (e.g., `sandbox123.mailgun.org`)
- Can only send to authorized recipients
- Good for development/testing

**Option B: Add Your Own Domain (Production)**
- Click **Add New Domain**
- Enter your domain (e.g., `yourdomain.com`)
- Follow DNS setup instructions

### 3. Configure Environment Variables

Update your `/backend/.env` file:

```env
# Email Configuration - Mailgun
MAILGUN_API_KEY=key-your-private-api-key-here
MAILGUN_DOMAIN=your-domain.com
MAILGUN_HOST=api.mailgun.net
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=Onyx Assessment Platform
```

#### Example with Sandbox Domain:
```env
MAILGUN_API_KEY=key-abcd1234567890abcd1234567890abcd
MAILGUN_DOMAIN=sandbox123.mailgun.org
MAILGUN_HOST=api.mailgun.net
FROM_EMAIL=noreply@sandbox123.mailgun.org
FROM_NAME=Onyx Assessment Platform
```

#### Example with Custom Domain:
```env
MAILGUN_API_KEY=key-abcd1234567890abcd1234567890abcd
MAILGUN_DOMAIN=yourdomain.com
MAILGUN_HOST=api.mailgun.net
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Onyx Assessment Platform
```

### 4. DNS Configuration (Custom Domain Only)

If using your own domain, add these DNS records:

#### TXT Record (Domain Verification)
```
Name: yourdomain.com
Value: v=spf1 include:mailgun.org ~all
```

#### MX Records
```
Priority: 10, Value: mxa.mailgun.org
Priority: 10, Value: mxb.mailgun.org
```

#### CNAME Records
```
Name: email.yourdomain.com
Value: mailgun.org

Name: _domainkey.yourdomain.com
Value: k1._domainkey.mailgun.org
```

### 5. Test Your Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Start the Backend
```bash
npm run dev
```

#### Test Email Service
```bash
# Check email service status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5002/api/reports/email-status

# Send test email
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"report_type": "summary"}' \
  http://localhost:5002/api/reports/test-email
```

## 🎯 Features Enabled

### Automated Report Delivery
- **Daily Reports**: Sent at 8 AM every day
- **Weekly Reports**: Sent at 8 AM every Monday  
- **Monthly Reports**: Sent at 8 AM on the 1st of each month

### Email Types
- **Summary Reports**: High-level assessment overview
- **Detailed Reports**: Comprehensive building analysis
- **Critical Reports**: Only buildings requiring immediate attention

### Advanced Features
- **Professional HTML Templates**: Beautiful, responsive email design
- **Excel Attachments**: Detailed reports with charts and analytics
- **Email Tracking**: Open rates, click tracking, delivery confirmation
- **Email Statistics**: Mailgun analytics integration
- **Rate Limiting**: Automatic delays to prevent spam flags

## 🔧 Troubleshooting

### Common Issues

#### "Mailgun not configured" Error
- Check that `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set in `.env`
- Ensure no trailing spaces in environment variables
- Restart the backend server after changes

#### Emails Not Sending
- Verify domain status in Mailgun dashboard
- Check DNS records (for custom domains)
- Ensure recipient email is authorized (for sandbox domains)

#### 401 Unauthorized Error
- Verify API key is correct and active
- Check that you're using the **Private API Key**, not Public

#### Domain Not Verified
- Complete DNS setup for custom domains
- Wait up to 24-48 hours for DNS propagation
- Use Mailgun's DNS checker tool

### Testing with Sandbox Domain

When using sandbox domain, you can only send emails to:
1. **Authorized Recipients**: Add in Mailgun dashboard
2. **Your Account Email**: Email used to create Mailgun account

To add authorized recipients:
1. Go to **Sending** → **Domains**
2. Click your sandbox domain
3. Click **Authorized Recipients**
4. Add test email addresses

## 📊 Email Analytics

### View Statistics
```bash
# Get email stats for last 30 days (Admin only)
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  http://localhost:5002/api/reports/admin/email-stats

# Get stats for specific period
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  http://localhost:5002/api/reports/admin/email-stats?days=7
```

### Available Metrics
- **Delivered**: Successfully delivered emails
- **Opens**: Email open rates
- **Clicks**: Link click tracking
- **Bounces**: Failed delivery attempts
- **Complaints**: Spam reports

## 🔒 Security Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables only
- Rotate API keys regularly
- Use different keys for development/production

### Domain Security
- Enable DKIM signing (automatic with Mailgun)
- Set up SPF records properly
- Monitor bounce and complaint rates
- Use dedicated sending domains

### Rate Limiting
The system includes automatic rate limiting:
- 1-second delay between emails
- Prevents being flagged as spam
- Respects Mailgun's sending limits

## 📈 Upgrade Options

### Free Tier Limits
- 5,000 emails/month
- 3 months of log retention
- Email support

### Paid Plans (Starting $35/month)
- 50,000+ emails/month
- Advanced analytics
- Priority support
- Custom IP addresses
- Advanced tracking

## 🔗 Useful Links

- [Mailgun Dashboard](https://app.mailgun.com/)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [DNS Checker Tool](https://toolbox.googleapps.com/apps/dig/)
- [Email Testing Tool](https://www.mail-tester.com/)

## 💡 Pro Tips

1. **Use a Dedicated Domain**: Better deliverability than shared domains
2. **Monitor Analytics**: Track open rates and optimize subject lines  
3. **Clean Your Lists**: Remove bounced emails regularly
4. **Test Thoroughly**: Use sandbox domain for development
5. **Follow Best Practices**: Mailgun provides detailed deliverability guides

---

*Need help? Check the Mailgun documentation or contact their support team.*