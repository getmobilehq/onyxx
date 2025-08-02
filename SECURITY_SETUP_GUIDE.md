# 🔐 ONYX Platform Security Setup Guide

## 📋 Table of Contents
1. [Database Security Migration](#1-database-security-migration)
2. [Two-Factor Authentication (2FA)](#2-two-factor-authentication-2fa)
3. [Cloudflare WAF Configuration](#3-cloudflare-waf-configuration)
4. [Sentry Security Monitoring](#4-sentry-security-monitoring)
5. [Penetration Testing](#5-penetration-testing)
6. [Data Encryption at Rest](#6-data-encryption-at-rest)

---

## 1. Database Security Migration

### Step 1: Connect to Render Dashboard
1. Go to https://dashboard.render.com
2. Navigate to your PostgreSQL database
3. Copy the `External Database URL`

### Step 2: Run Migration Locally
```bash
cd backend

# Set the DATABASE_URL environment variable
export DATABASE_URL="your-render-database-url"

# Run the migration script
node run-security-migration.js
```

### Step 3: Verify Migration
```sql
-- Connect to your database and run:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%security%';
```

Expected tables:
- security_events
- login_attempts
- ip_whitelist
- user_sessions
- password_history
- api_keys
- audit_logs

---

## 2. Two-Factor Authentication (2FA)

### Backend Setup (Already Implemented)

The 2FA system is ready with these endpoints:
- `POST /api/2fa/generate` - Generate QR code
- `POST /api/2fa/enable` - Enable 2FA
- `POST /api/2fa/verify` - Verify token
- `POST /api/2fa/disable` - Disable 2FA
- `GET /api/2fa/status` - Check status

### Frontend Implementation

1. **Install Required Packages:**
```bash
npm install react-qrcode-generator axios
```

2. **Create 2FA Setup Component:**
```tsx
// src/components/two-factor-setup.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';

export function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  const generateQR = async () => {
    const response = await api.post('/2fa/generate');
    setQrCode(response.data.data.qr_code);
    setSecret(response.data.data.secret);
  };
  
  const enable2FA = async () => {
    const response = await api.post('/2fa/enable', { token });
    if (response.data.success) {
      setBackupCodes(response.data.data.backup_codes);
    }
  };
  
  return (
    <div>
      {/* QR Code display */}
      {/* Token input */}
      {/* Backup codes display */}
    </div>
  );
}
```

### Recommended Authenticator Apps
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password

---

## 3. Cloudflare WAF Configuration

### Step 1: Add Domain to Cloudflare
1. Sign up at https://cloudflare.com
2. Add `onyxreport.com`
3. Update nameservers at your domain registrar

### Step 2: Configure Security Settings

**SSL/TLS:**
- Set to "Full (strict)"
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"

**Security → WAF:**
1. Go to Security → WAF
2. Create custom rules:

```
Rule 1: Block SQL Injection
Expression: (http.request.uri.query contains "SELECT" or 
            http.request.uri.query contains "UNION" or 
            http.request.uri.query contains "DROP")
Action: Block

Rule 2: Block XSS Attempts
Expression: (http.request.uri contains "<script" or 
            http.request.uri contains "javascript:")
Action: Block

Rule 3: Rate Limiting
Expression: (http.request.uri.path contains "/api/auth/login")
Action: Rate limit (5 requests per minute)

Rule 4: Geo-blocking (optional)
Expression: (ip.geoip.country in {"CN" "RU" "KP"})
Action: Challenge
```

**Security → Bots:**
- Enable "Bot Fight Mode"
- Configure "Super Bot Fight Mode" (paid plans)

**Security → DDoS:**
- Enable "I'm Under Attack Mode" (when needed)
- Set Security Level to "High"

### Step 3: Page Rules
Create these page rules:
1. `api.onyxreport.com/*` - Cache Level: Bypass
2. `onyxreport.com/admin/*` - Security Level: High
3. `*onyxreport.com/*` - Always Use HTTPS

---

## 4. Sentry Security Monitoring

### Step 1: Create Sentry Account
1. Sign up at https://sentry.io
2. Create a new project (Node.js for backend, React for frontend)

### Step 2: Backend Integration

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

```typescript
// backend/src/config/sentry.ts
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      return event;
    },
  });
}
```

### Step 3: Frontend Integration

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Step 4: Security Alerts
Configure alerts for:
- Failed login attempts > 10 per hour
- SQL injection attempts
- XSS attempts
- Unusual API usage patterns
- Error rate spikes

---

## 5. Penetration Testing

### Option 1: Automated Testing (Free)

**OWASP ZAP:**
```bash
# Install OWASP ZAP
brew install --cask owasp-zap  # macOS
# or download from https://www.zaproxy.org/download/

# Run automated scan
zap.sh -cmd -quickurl https://onyxreport.com -quickprogress
```

**Nikto:**
```bash
# Install Nikto
brew install nikto  # macOS

# Run scan
nikto -h https://onyxreport.com
```

### Option 2: Professional Services

**Recommended Platforms:**
- HackerOne: https://www.hackerone.com
- Bugcrowd: https://www.bugcrowd.com
- Synack: https://www.synack.com

**Budget Options:**
- PentesterLab: $20/month
- Detectify: $50/month
- Intruder: $100/month

### Option 3: Bug Bounty Program

Create a security.txt file:
```txt
# /.well-known/security.txt
Contact: security@onyxreport.com
Expires: 2025-01-01T00:00:00.000Z
Acknowledgments: https://onyxreport.com/security/thanks
Policy: https://onyxreport.com/security/policy
Canonical: https://onyxreport.com/.well-known/security.txt
```

---

## 6. Data Encryption at Rest

### PostgreSQL Encryption

**Option 1: Render's Built-in Encryption**
- Already enabled by default on Render
- Uses AES-256 encryption
- No additional configuration needed

**Option 2: Column-Level Encryption**

```typescript
// backend/src/utils/encryption.ts
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY!; // 32 bytes key

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Sensitive Fields to Encrypt
- SSN/Tax IDs
- Bank account numbers
- API keys
- Personal health information
- Credit card data (use PCI-compliant service)

### File Storage Encryption

**For uploaded files:**
```typescript
// Use Cloudinary with encryption
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload with encryption
const result = await cloudinary.uploader.upload(file, {
  resource_type: 'auto',
  type: 'authenticated',
  access_mode: 'token',
  encryption: {
    type: 'aes256'
  }
});
```

---

## 🚀 Implementation Priority

1. **Immediate (Today):**
   - ✅ Run database migration
   - ✅ Enable Cloudflare WAF
   - ✅ Set up Sentry monitoring

2. **This Week:**
   - [ ] Implement 2FA frontend
   - [ ] Configure all Cloudflare rules
   - [ ] Run OWASP ZAP scan

3. **This Month:**
   - [ ] Complete penetration testing
   - [ ] Implement column encryption
   - [ ] Set up bug bounty program

---

## 📞 Security Support Contacts

- **Cloudflare Support:** https://support.cloudflare.com
- **Render Support:** https://render.com/support
- **Sentry Support:** https://sentry.io/support
- **Security Questions:** security@onyxreport.com

---

## 🔒 Security Checklist

- [ ] Database security tables migrated
- [ ] 2FA enabled for admin accounts
- [ ] Cloudflare WAF active
- [ ] Sentry monitoring configured
- [ ] Penetration test completed
- [ ] Data encryption implemented
- [ ] SSL certificates valid
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Backup system tested
- [ ] Incident response plan ready
- [ ] Security training completed

---

*Last Updated: [Current Date]*
*Security Level: ENTERPRISE GRADE* 🛡️