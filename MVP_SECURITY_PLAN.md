# ONYX MVP Security Plan - Launch First, Secure Later

## Executive Summary

This plan enables ONYX to launch online **immediately** with minimum viable security, then implement comprehensive security post-launch. Focus on preventing catastrophic failures while accepting some risk for faster time-to-market.

---

## Phase 1: Pre-Launch (2-4 Hours) - ABSOLUTE ESSENTIALS

### 🚨 **CRITICAL: Must Fix Before Going Live**

#### 1. Secure Environment Variables (30 minutes)
**Problem**: Secrets exposed in git repository
**Quick Fix**: Move to environment variables

```bash
# Create new .env.production (don't commit to git)
JWT_SECRET=your-super-secure-random-string-here
JWT_REFRESH_SECRET=another-super-secure-random-string
DATABASE_URL=your-production-database-url
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

**Implementation:**
1. Generate new secrets: `openssl rand -base64 64`
2. Set in Render.com environment variables
3. Remove secrets from git history (optional for MVP)

#### 2. Basic Rate Limiting (60 minutes)
**Problem**: Brute force attacks on login
**Quick Fix**: Add express-rate-limit

```bash
cd backend
npm install express-rate-limit
```

```typescript
// backend/src/server.ts
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: { success: false, message: 'Too many login attempts, try again later' },
  standardHeaders: true,
});

// Apply only to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

#### 3. Essential Security Headers (30 minutes)
**Problem**: XSS and clickjacking vulnerabilities
**Quick Fix**: Update helmet configuration

```typescript
// backend/src/server.ts - Update existing helmet setup
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to avoid breaking functionality
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

#### 4. HTTPS Enforcement (Already done via Render.com)
✅ **No action needed** - Render.com handles this automatically

### 📊 **Pre-Launch Security Status**
- ✅ HTTPS encryption
- ✅ Basic rate limiting
- ✅ Secure secrets management
- ✅ Essential headers
- ⚠️ Still has medium-risk vulnerabilities (acceptable for MVP)

---

## Phase 2: Week 1-2 Post-Launch - USER CONFIDENCE

### Priority: Build trust while gathering user feedback

#### 1. Basic Input Validation (4 hours)
**Goal**: Prevent basic injection attacks

```typescript
// Add to key endpoints that handle user data
import { body, validationResult } from 'express-validator';

const validateBuilding = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('address').trim().isLength({ max: 500 }).escape(),
  body('description').trim().isLength({ max: 1000 }).escape(),
];

const handleValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Apply to building creation/update routes
app.post('/api/buildings', validateBuilding, handleValidation, buildingsController.create);
```

#### 2. Basic Audit Logging (6 hours)
**Goal**: Track critical actions for debugging and compliance

```typescript
// Simple audit logging for critical actions
const auditLog = async (userId: string, action: string, resource: string, resourceId?: string) => {
  try {
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, ip_address, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [userId, action, resource, resourceId, req.ip]);
  } catch (error) {
    console.error('Audit log failed:', error);
    // Don't fail the request if audit logging fails
  }
};

// Add to critical actions
// Login
auditLog(user.id, 'LOGIN', 'auth');
// Building creation
auditLog(user.id, 'CREATE', 'building', building.id);
// Assessment completion
auditLog(user.id, 'COMPLETE', 'assessment', assessment.id);
```

#### 3. File Upload Security (3 hours)
**Goal**: Prevent malicious file uploads

```typescript
// backend/src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow only images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF) and PDFs are allowed'));
    }
  },
});
```

---

## Phase 3: Month 1 Post-Launch - GROWTH PREPARATION

### Priority: Scale securely as user base grows

#### 1. Enhanced Authentication (8 hours)
```typescript
// Password complexity requirements
const passwordValidator = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number');

// Account lockout after failed attempts
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

// Track failed attempts in database
const trackFailedLogin = async (email: string) => {
  await pool.query(`
    UPDATE users 
    SET 
      failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
      lockout_until = CASE 
        WHEN COALESCE(failed_login_attempts, 0) + 1 >= $1 
        THEN NOW() + INTERVAL '30 minutes'
        ELSE lockout_until
      END
    WHERE email = $2
  `, [LOCKOUT_ATTEMPTS, email]);
};
```

#### 2. Data Backup & Recovery (4 hours)
```bash
# Set up automated backups
# Render.com PostgreSQL includes daily backups
# Add application-level backup verification

# Create backup verification script
node scripts/verify-backups.js
```

#### 3. Monitoring & Alerting (6 hours)
```typescript
// Simple error tracking and alerting
import { createTransport } from 'nodemailer';

const sendSecurityAlert = async (message: string, severity: 'low' | 'medium' | 'high') => {
  if (severity === 'high') {
    // Send immediate alert
    console.error(`SECURITY ALERT: ${message}`);
    // TODO: Add email/Slack notification
  }
};

// Monitor for suspicious activity
const detectSuspiciousActivity = {
  multipleFailedLogins: (email: string, attempts: number) => {
    if (attempts > 10) {
      sendSecurityAlert(`Multiple failed logins for ${email}`, 'high');
    }
  },
  
  rapidApiCalls: (userId: string, requestCount: number) => {
    if (requestCount > 1000) {
      sendSecurityAlert(`User ${userId} making excessive API calls`, 'medium');
    }
  },
};
```

---

## Phase 4: Month 2-3 Post-Launch - ENTERPRISE READY

### Priority: Prepare for enterprise customers and compliance

#### 1. Data Encryption (12 hours)
```typescript
// Encrypt sensitive fields
import crypto from 'crypto';

class FieldEncryption {
  private static algorithm = 'aes-256-gcm';
  private static key = process.env.ENCRYPTION_KEY;

  static encryptSensitiveData(data: any) {
    const sensitiveFields = ['address', 'phone', 'email', 'notes'];
    const encrypted = { ...data };
    
    sensitiveFields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });
    
    return encrypted;
  }
}
```

#### 2. GDPR Compliance (16 hours)
```typescript
// Data export functionality
export const exportUserData = async (userId: string) => {
  const userData = await pool.query(`
    SELECT name, email, role, created_at 
    FROM users WHERE id = $1
  `, [userId]);
  
  const assessments = await pool.query(`
    SELECT * FROM assessments WHERE assigned_to = $1
  `, [userId]);
  
  return {
    personal_data: userData.rows[0],
    assessments: assessments.rows,
    export_date: new Date().toISOString(),
  };
};

// Data deletion functionality
export const deleteUserData = async (userId: string) => {
  // Anonymize rather than delete to preserve assessment integrity
  await pool.query(`
    UPDATE users SET 
      name = 'Deleted User',
      email = CONCAT('deleted_', id, '@deleted.com'),
      phone = NULL,
      deleted_at = NOW()
    WHERE id = $1
  `, [userId]);
};
```

#### 3. Security Testing (8 hours)
```bash
# Automated security scanning
npm install -g retire
npm install --save-dev eslint-plugin-security

# Add to CI/CD pipeline
npm audit --audit-level moderate
retire --path .
eslint --ext .js,.ts src/ --config .eslintrc-security.js
```

---

## Launch Strategy & Risk Management

### **Go-Live Checklist (2-4 hours total)**

```bash
# 1. Environment Setup (30 min)
□ Set production environment variables
□ Generate new JWT secrets
□ Configure Cloudinary for production
□ Update CORS settings for production domain

# 2. Security Essentials (90 min)
□ Deploy rate limiting
□ Enable security headers
□ Test authentication flows
□ Verify HTTPS enforcement

# 3. Monitoring Setup (60 min)
□ Configure error logging
□ Set up basic health checks
□ Test backup verification
□ Create incident response contacts

# 4. Launch Verification (30 min)
□ Test login/logout functionality
□ Verify organization isolation
□ Check file upload security
□ Confirm rate limiting works
```

### **Acceptable MVP Risks**

✅ **Accepted for initial launch:**
- No field-level encryption (non-critical data)
- Basic audit logging (not comprehensive)
- Limited input validation (covers major vectors)
- No advanced threat detection
- Minimal compliance features

❌ **NOT acceptable (must fix pre-launch):**
- Exposed secrets in code
- No HTTPS
- No rate limiting on auth
- No basic input sanitization
- No file upload restrictions

### **Communication Plan**

#### For Early Users:
```
"ONYX is launching with strong security fundamentals including HTTPS encryption, 
secure authentication, and data isolation. We're continuously enhancing our 
security as we grow, with major improvements planned monthly."
```

#### For Enterprise Prospects:
```
"ONYX provides enterprise-grade security foundations with plans for SOC 2 
compliance, advanced encryption, and comprehensive audit logging in our 
upcoming releases."
```

---

## Post-Launch Security Timeline

### **Week 1-2: Immediate Improvements**
- [ ] Input validation on all endpoints
- [ ] Basic audit logging
- [ ] File upload security
- **Time Investment**: 2-3 hours/week

### **Month 1: User Confidence**
- [ ] Enhanced authentication
- [ ] Account lockout mechanisms
- [ ] Security monitoring
- **Time Investment**: 4-6 hours/week

### **Month 2-3: Enterprise Readiness**
- [ ] Data encryption at rest
- [ ] GDPR compliance features
- [ ] Comprehensive audit trails
- **Time Investment**: 8-10 hours/week

### **Month 4+: Advanced Security**
- [ ] SOC 2 compliance
- [ ] Penetration testing
- [ ] Advanced threat detection
- **Time Investment**: 5-8 hours/week

---

## Budget Considerations

### **MVP Launch Security**: $0 additional cost
- Use existing Render.com security features
- Implement basic protections with current stack
- No new tools or services required

### **Post-Launch Security Investments**:
- **Month 1**: $0-50/month (monitoring tools)
- **Month 2-3**: $100-300/month (security services)
- **Month 4+**: $500-1000/month (compliance tools, penetration testing)

### **Development Time**:
- **Pre-launch**: 2-4 hours (absolute minimum)
- **Month 1**: 20-30 hours (user confidence)
- **Month 2-3**: 40-60 hours (enterprise readiness)
- **Ongoing**: 10-15% of development capacity

---

## Success Metrics

### **Launch Success Indicators**:
- Zero security incidents in first 30 days
- No unauthorized access attempts succeed
- File uploads work securely
- Authentication remains stable under load

### **Post-Launch Security KPIs**:
- Time to implement each security phase
- Security incident response time
- User trust metrics (retention, enterprise inquiries)
- Compliance audit readiness score

---

## Emergency Response Plan

### **If Security Incident Occurs Post-Launch**:

1. **Immediate (0-1 hour)**:
   - Take affected systems offline if needed
   - Assess scope of potential breach
   - Notify key stakeholders
   - Preserve evidence

2. **Short-term (1-24 hours)**:
   - Implement temporary fixes
   - Reset potentially compromised credentials
   - Communicate with affected users
   - Document incident details

3. **Recovery (1-7 days)**:
   - Deploy permanent fixes
   - Conduct post-incident review
   - Update security measures
   - Improve monitoring

---

## Conclusion

This MVP security approach enables ONYX to launch quickly while maintaining acceptable risk levels. The key is implementing absolute essentials pre-launch (2-4 hours) and then systematically improving security post-launch based on user feedback and growth requirements.

**Risk-Reward Balance**:
- **Risk**: Some medium-level vulnerabilities remain
- **Reward**: Faster time-to-market, user feedback, revenue generation
- **Mitigation**: Clear post-launch security roadmap and incident response plan

**Next Steps**:
1. Implement Phase 1 (pre-launch essentials)
2. Launch with monitoring in place
3. Gather user feedback while implementing Phase 2
4. Continuously improve security posture

This approach balances security with business needs, allowing ONYX to compete in the market while building toward enterprise-grade security.