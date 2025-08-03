# 🛡️ Cloudflare WAF Setup Guide for ONYX Platform

**Domain**: onyxreport.com  
**Security Level**: Enterprise Grade  
**Last Updated**: December 2024  

---

## 🚀 Quick Setup Steps

### Step 1: Add Domain to Cloudflare
1. **Login to Cloudflare**: https://dash.cloudflare.com
2. **Add Site**: Click "Add a site" 
3. **Enter Domain**: `onyxreport.com`
4. **Select Plan**: Free (sufficient for WAF basic rules)
5. **Review DNS Records**: Import existing records
6. **Update Nameservers**: At your domain registrar

### Step 2: Configure SSL/TLS Settings
```
🔒 SSL/TLS → Overview
✅ Encryption Mode: "Full (strict)"
✅ Always Use HTTPS: ON
✅ Automatic HTTPS Rewrites: ON
✅ Minimum TLS Version: 1.2

🔒 SSL/TLS → Edge Certificates
✅ Always Use HTTPS: ON
✅ HTTP Strict Transport Security (HSTS): ON
   - Max Age: 6 months
   - Include subdomains: ON
   - Preload: ON
✅ Certificate Transparency Monitoring: ON
```

### Step 3: Security Settings
```
🛡️ Security → Settings
✅ Security Level: HIGH
✅ Challenge Passage: 30 minutes
✅ Browser Integrity Check: ON
✅ Privacy Pass Support: ON

🛡️ Security → Bots
✅ Bot Fight Mode: ON
✅ Super Bot Fight Mode: ON (if available)
```

---

## 🔥 Advanced WAF Rules Configuration

### Step 4: Create WAF Custom Rules

Go to **Security** → **WAF** → **Custom rules** and create these rules:

#### **Rule 1: Block SQL Injection Attempts**
```javascript
Name: Block SQL Injection
Expression: 
(
  http.request.uri.query contains "SELECT" or
  http.request.uri.query contains "UNION" or
  http.request.uri.query contains "DROP" or
  http.request.uri.query contains "INSERT" or
  http.request.uri.query contains "DELETE" or
  http.request.uri.query contains "UPDATE" or
  http.request.uri.query contains "EXEC" or
  http.request.uri.query contains "SCRIPT" or
  http.request.body contains "SELECT" or
  http.request.body contains "UNION" or
  http.request.body contains "DROP"
)

Action: Block
```

#### **Rule 2: Block XSS Attempts**
```javascript
Name: Block XSS Attacks
Expression:
(
  http.request.uri contains "<script" or
  http.request.uri contains "javascript:" or
  http.request.uri contains "onload=" or
  http.request.uri contains "onerror=" or
  http.request.uri contains "onclick=" or
  http.request.body contains "<script" or
  http.request.body contains "javascript:" or
  http.request.headers["user-agent"] contains "<script"
)

Action: Block
```

#### **Rule 3: Rate Limiting for Login Endpoints**
```javascript
Name: Rate Limit Login Attempts
Expression:
(
  http.request.uri.path eq "/api/auth/login" or
  http.request.uri.path eq "/api/auth/register"
)

Action: Rate Limit
Rate: 5 requests per minute per IP
Duration: 10 minutes
Response: Custom HTML page or JSON error
```

#### **Rule 4: Rate Limiting for API Endpoints**
```javascript
Name: Rate Limit API Calls
Expression:
(
  http.request.uri.path contains "/api/"
)

Action: Rate Limit
Rate: 100 requests per minute per IP
Duration: 1 minute
```

#### **Rule 5: Block Suspicious User Agents**
```javascript
Name: Block Malicious Bots
Expression:
(
  http.request.headers["user-agent"] contains "sqlmap" or
  http.request.headers["user-agent"] contains "nikto" or
  http.request.headers["user-agent"] contains "nmap" or
  http.request.headers["user-agent"] contains "masscan" or
  http.request.headers["user-agent"] contains "python-requests" or
  http.request.headers["user-agent"] contains "curl" or
  http.request.headers["user-agent"] eq ""
)

Action: Block
```

#### **Rule 6: Protect Admin Areas**
```javascript
Name: Enhanced Admin Protection
Expression:
(
  http.request.uri.path contains "/admin" or
  http.request.uri.path contains "/api/security" or
  http.request.uri.path contains "/api/users"
) and not (
  ip.geoip.country in {"US" "CA" "GB"}
)

Action: Challenge (Managed Challenge)
```

#### **Rule 7: Block Known Attack Patterns**
```javascript
Name: Block Common Attack Patterns
Expression:
(
  http.request.uri contains "../" or
  http.request.uri contains "etc/passwd" or
  http.request.uri contains "cmd.exe" or
  http.request.uri contains "powershell" or
  http.request.uri contains "base64_decode" or
  http.request.uri contains "eval(" or
  http.request.body contains "../" or
  http.request.body contains "etc/passwd"
)

Action: Block
```

#### **Rule 8: Country-Based Access Control (Optional)**
```javascript
Name: Geographic Access Control
Expression:
not (
  ip.geoip.country in {
    "US" "CA" "GB" "AU" "DE" "FR" "NL" "SE" "NO" "DK" "FI"
  }
) and (
  http.request.uri.path contains "/api/auth" or
  http.request.uri.path contains "/admin"
)

Action: Challenge (Managed Challenge)
```

---

## 🔧 Advanced Security Configuration

### Step 5: Configure Page Rules
Go to **Rules** → **Page Rules** and create:

#### **Rule 1: API Security**
```
URL Pattern: api.onyxreport.com/*
Settings:
- Security Level: High
- Cache Level: Bypass
- Disable Apps: ON
- Browser Integrity Check: ON
```

#### **Rule 2: Admin Area Protection**
```
URL Pattern: onyxreport.com/admin*
Settings:
- Security Level: I'm Under Attack
- Cache Level: Bypass  
- Always Use HTTPS: ON
```

#### **Rule 3: Static Assets Caching**
```
URL Pattern: onyxreport.com/*.js
URL Pattern: onyxreport.com/*.css
URL Pattern: onyxreport.com/*.png
URL Pattern: onyxreport.com/*.jpg
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 day
```

### Step 6: Configure Transform Rules
Go to **Rules** → **Transform Rules** → **Modify Response Header**:

#### **Security Headers Rule**
```javascript
Name: Add Security Headers
Expression: (http.host eq "onyxreport.com")

Set dynamic header:
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;
```

---

## 📊 Monitoring and Analytics

### Step 7: Configure Security Analytics

#### **Security Events Dashboard**
1. Go to **Security** → **Events**
2. Create custom filters:
   - **SQL Injection Attempts**: Action = Block, Rule = "Block SQL Injection"
   - **XSS Attempts**: Action = Block, Rule = "Block XSS Attacks"  
   - **Rate Limited IPs**: Action = Rate Limit
   - **Geographic Blocks**: Action = Challenge, Country != US/CA/GB

#### **Custom Analytics Queries**
```javascript
// Top blocked countries
{
  "query": "SELECT country, COUNT(*) as blocks FROM events WHERE action = 'block' GROUP BY country ORDER BY blocks DESC LIMIT 10",
  "timeRange": "24h"
}

// Most common attack patterns
{
  "query": "SELECT ruleName, COUNT(*) as triggers FROM events WHERE action = 'block' GROUP BY ruleName ORDER BY triggers DESC",
  "timeRange": "7d"
}

// Rate limited endpoints
{
  "query": "SELECT path, COUNT(*) as rate_limits FROM events WHERE action = 'rate_limit' GROUP BY path ORDER BY rate_limits DESC",
  "timeRange": "1h"
}
```

---

## ⚡ Performance Optimization

### Step 8: Caching and Performance

#### **Caching Rules**
```javascript
// API Endpoints - No Cache
Expression: (http.request.uri.path contains "/api/")
Action: Set cache status = Bypass

// Static Assets - Long Cache
Expression: (http.request.uri.path matches ".*\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$")
Action: Set cache status = Cache everything
Edge TTL: 30 days
Browser TTL: 7 days

// HTML Pages - Short Cache
Expression: (http.request.uri.path matches ".*\\.(html?)$" or http.request.uri.path eq "/")
Action: Set cache status = Cache everything  
Edge TTL: 2 hours
Browser TTL: 30 minutes
```

#### **Compression Settings**
```
Speed → Optimization
✅ Auto Minify: JavaScript, CSS, HTML
✅ Brotli Compression: ON
✅ Early Hints: ON
✅ HTTP/2 Server Push: ON
```

---

## 🚨 Security Monitoring Setup

### Step 9: Configure Notifications

#### **Security Notifications**
Go to **Notifications** and create:

1. **Security Events Alert**
   - Trigger: Security events > 100 in 5 minutes
   - Action: Email + Webhook to your monitoring system

2. **DDoS Attack Alert**  
   - Trigger: DDoS attack detected
   - Action: Immediate email notification

3. **High Error Rate Alert**
   - Trigger: 5xx errors > 50 in 1 minute
   - Action: Email notification

#### **Webhook Integration with ONYX Backend**
```javascript
Webhook URL: https://onyx-backend-f7vh.onrender.com/api/security/cloudflare-webhook
HTTP Method: POST
Secret: your-webhook-secret

Payload Example:
{
  "event_type": "security_event",
  "timestamp": "2024-12-02T10:30:00Z",
  "rule_name": "Block SQL Injection",
  "action": "block",
  "ip": "192.168.1.100",
  "country": "US",
  "user_agent": "malicious-bot/1.0",
  "uri": "/api/auth/login?id=1' OR '1'='1",
  "severity": "high"
}
```

---

## 🔬 Testing WAF Rules

### Step 10: Security Testing

#### **SQL Injection Test**
```bash
# This should be BLOCKED by WAF
curl "https://onyxreport.com/api/auth/login?id=1' OR '1'='1"
curl "https://onyxreport.com/search?q='; DROP TABLE users; --"

# Expected: 403 Forbidden or Block page
```

#### **XSS Attack Test**
```bash
# This should be BLOCKED by WAF
curl "https://onyxreport.com/search?q=<script>alert('xss')</script>"
curl "https://onyxreport.com/profile?name=javascript:alert('xss')"

# Expected: 403 Forbidden or Block page
```

#### **Rate Limiting Test**
```bash
# Send 10 rapid requests to login (should be rate limited after 5)
for i in {1..10}; do
  curl -X POST "https://onyxreport.com/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
  sleep 1
done

# Expected: Rate limit response after 5 attempts
```

#### **Bot Detection Test**
```bash
# This should be BLOCKED by bot protection
curl -H "User-Agent: sqlmap/1.0" "https://onyxreport.com/"
curl -H "User-Agent: nikto/2.1.6" "https://onyxreport.com/"

# Expected: 403 Forbidden or Challenge page
```

---

## 📈 Performance Metrics

### Key WAF Metrics to Monitor:

1. **Security Metrics:**
   - Blocked requests per hour: Target < 1% of total traffic
   - False positive rate: Target < 0.1%
   - Challenge solve rate: Target > 95%
   - Geographic block effectiveness: Monitor country-based blocks

2. **Performance Metrics:**
   - Page load time: Target < 2 seconds
   - Cache hit rate: Target > 85%
   - Origin server requests: Target < 15% of total
   - Bandwidth savings: Target > 60%

3. **Availability Metrics:**
   - Uptime: Target 99.99%
   - Origin server health: Monitor 5xx errors
   - DNS resolution time: Target < 50ms
   - SSL handshake time: Target < 100ms

---

## 🛠️ Maintenance and Updates

### Monthly Tasks:
- [ ] Review security event logs
- [ ] Update WAF rules based on new threats
- [ ] Analyze false positive reports
- [ ] Review geographic access patterns
- [ ] Update rate limiting thresholds

### Quarterly Tasks:
- [ ] Comprehensive security rule audit
- [ ] Performance optimization review
- [ ] DDoS protection testing
- [ ] SSL certificate renewal check
- [ ] Emergency response drill

---

## 🚨 Emergency Procedures

### Under Attack Mode
If experiencing a DDoS attack:
1. Go to **Security** → **Settings**
2. Set Security Level to **"I'm Under Attack"**
3. Monitor traffic patterns
4. Adjust as needed when attack subsides

### Blocking Specific Countries
```javascript
// Emergency country block
Expression: (ip.geoip.country in {"CN" "RU" "KP"})
Action: Block
```

### Temporary Rate Limiting
```javascript
// Emergency rate limiting
Expression: (true)
Action: Rate Limit
Rate: 10 requests per minute per IP
Duration: 60 minutes
```

---

## 📞 Support and Resources

### Cloudflare Support
- **Community**: https://community.cloudflare.com
- **Documentation**: https://developers.cloudflare.com
- **Status Page**: https://www.cloudflarestatus.com
- **Support Tickets**: Available for paid plans

### ONYX Security Team
- **Email**: security@onyxreport.com
- **Emergency**: Real-time monitoring enabled
- **Documentation**: This guide + security playbooks

---

**WAF Configuration Status**: Ready for activation  
**Security Level**: Enterprise Grade  
**Expected Setup Time**: 30-45 minutes  

*Complete these configurations to activate world-class web application firewall protection for ONYX Platform!*