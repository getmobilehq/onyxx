# ONYX Platform Cybersecurity Assessment

## Executive Summary

This document provides a comprehensive cybersecurity assessment of the ONYX building assessment platform, identifying potential security concerns, vulnerabilities, and recommended mitigation strategies.

**Overall Security Status: MODERATE RISK**
- ✅ Strong foundations with JWT authentication and multi-tenant architecture
- ⚠️ Several medium-risk vulnerabilities requiring immediate attention
- ❌ Critical security gaps in production deployment and monitoring

---

## 1. Authentication & Authorization Security

### ✅ **Current Strengths**

1. **JWT Token Implementation**
   - Location: `backend/src/middleware/auth.middleware.ts`
   - Uses industry-standard JWT with refresh tokens
   - Proper token expiration (7d access, 30d refresh)
   - Automatic token rotation

2. **Password Security**
   - Location: `backend/src/controllers/auth.controller.ts`
   - bcrypt hashing with salt rounds (10)
   - No plain text password storage

3. **Role-Based Access Control (RBAC)**
   - Three roles: admin, manager, assessor
   - Route-level permissions enforcement
   - Organization-scoped data access

### ❌ **Critical Vulnerabilities**

#### A1: JWT Secret Management
**Risk Level: CRITICAL**
```typescript
// backend/.env - EXPOSED IN VERSION CONTROL
JWT_SECRET=onyx-secret-key-2025-change-in-production
JWT_REFRESH_SECRET=onyx-refresh-secret-2025-change-in-production
```
**Impact:** Anyone with repository access can forge tokens
**Solution:** Use environment-specific secrets, remove from git history

#### A2: No Account Lockout
**Risk Level: HIGH**
```typescript
// No rate limiting or lockout mechanism in auth.controller.ts
const response = await authAPI.login(email, password);
```
**Impact:** Vulnerable to brute force attacks
**Solution:** Implement progressive delays and account lockout

#### A3: Missing Password Complexity Requirements
**Risk Level: MEDIUM**
**Current:** No password validation rules
**Impact:** Weak passwords compromise accounts
**Solution:** Enforce minimum 12 chars, mixed case, numbers, symbols

### ⚠️ **Medium Risk Issues**

1. **Session Management**
   - No session timeout handling
   - Tokens persist until expiration even if user logs out elsewhere
   - Missing "Sign out all devices" functionality

2. **Authorization Bypass Potential**
   - Some routes lack proper role validation
   - Organization isolation could be bypassed with manual requests

---

## 2. Data Security & Encryption

### ✅ **Current Strengths**

1. **Data in Transit**
   - HTTPS enforced in production (Render.com)
   - TLS encryption for database connections

2. **Multi-tenant Isolation**
   - Organization-scoped database queries
   - User data properly segregated

### ❌ **Critical Vulnerabilities**

#### D1: Database Credentials Exposed
**Risk Level: CRITICAL**
```bash
# backend/.env - IN VERSION CONTROL
DATABASE_URL=postgresql://jojo:Montg0m3r!@localhost:5432/onyx
DB_PASSWORD=Montg0m3r!
```
**Impact:** Full database compromise if repository is breached
**Solution:** Use environment variables, rotate credentials

#### D2: No Data Encryption at Rest
**Risk Level: HIGH**
- Building assessment data stored in plain text
- No field-level encryption for sensitive data
- PII (addresses, contact info) unencrypted

#### D3: Cloudinary API Keys Exposed
**Risk Level: HIGH**
```bash
CLOUDINARY_API_SECRET=wkBJfzT8PrtCI1-e6xb-oj_ovSo
```
**Impact:** Unauthorized access to file storage, potential data exfiltration

### ⚠️ **Medium Risk Issues**

1. **Backup Security**
   - No mention of encrypted backups
   - Unknown backup access controls

2. **Data Retention**
   - No clear data deletion policies
   - Soft deletes may retain sensitive data indefinitely

---

## 3. Application Security Vulnerabilities

### ❌ **Critical Vulnerabilities**

#### V1: SQL Injection Potential
**Risk Level: CRITICAL**
**Location:** Multiple controllers using string concatenation
```typescript
// Example in organizations.controller.ts
const result = await pool.query(`
  SELECT * FROM organizations WHERE name = '${name}'
`);
```
**Impact:** Database compromise, data theft
**Status:** MOST controllers use parameterized queries correctly, but manual review needed

#### V2: Cross-Site Scripting (XSS)
**Risk Level: HIGH**
**Areas of Concern:**
- User-generated content in building descriptions
- Assessment notes and comments
- Report generation with unsanitized data

#### V3: File Upload Security
**Risk Level: HIGH**
**Location:** `backend/src/middleware/upload.middleware.ts`
```typescript
// Missing file type validation and size limits
const upload = multer({ dest: 'uploads/' });
```
**Impact:** Malicious file uploads, server compromise

### ⚠️ **Medium Risk Issues**

1. **Cross-Site Request Forgery (CSRF)**
   - No CSRF protection implemented
   - State-changing operations vulnerable

2. **Input Validation Gaps**
   - Some endpoints lack proper validation
   - Potential for injection attacks

3. **Error Information Disclosure**
   - Detailed error messages may leak system information
   - Stack traces in development mode

---

## 4. Infrastructure & Deployment Security

### ✅ **Current Strengths**

1. **Hosting Security**
   - Render.com provides managed infrastructure
   - Automatic HTTPS certificates
   - DDoS protection included

### ❌ **Critical Vulnerabilities**

#### I1: No Security Headers
**Risk Level: HIGH**
**Missing Headers:**
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

#### I2: CORS Configuration
**Risk Level: MEDIUM**
```typescript
// backend/src/server.ts - Overly permissive
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true,
}));
```

#### I3: No Rate Limiting
**Risk Level: HIGH**
- No API rate limiting implemented
- Vulnerable to DoS attacks
- No protection against automated abuse

### ⚠️ **Medium Risk Issues**

1. **Dependency Vulnerabilities**
   - No automated dependency scanning
   - Potential outdated packages with known vulnerabilities

2. **Environment Configuration**
   - Production secrets in development files
   - Missing security-focused environment variables

---

## 5. Privacy & Compliance Concerns

### ❌ **High Risk Issues**

1. **GDPR Compliance Gaps**
   - No data deletion workflows
   - Missing consent management
   - No data portability features
   - Lack of privacy policy integration

2. **Audit Logging Missing**
   - No comprehensive audit trails
   - Cannot track data access or modifications
   - Insufficient for compliance requirements

3. **Data Residency**
   - Unknown data location (Render.com hosting)
   - No geographic data controls

---

## 6. Business Logic Security

### ⚠️ **Medium Risk Issues**

1. **Privilege Escalation**
   - Users might manipulate organization_id in requests
   - Insufficient validation of ownership

2. **Data Integrity**
   - No checksums or data validation
   - Assessment results could be tampered with

3. **Concurrent Access**
   - No conflict resolution for simultaneous edits
   - Race conditions possible

---

## 7. Recommended Security Implementations

### **Phase 1: Critical (Immediate - Week 1)**

#### 1. Secure Secrets Management
```bash
# Remove from git and use environment variables
unset JWT_SECRET
unset DATABASE_URL
unset CLOUDINARY_API_SECRET

# Use strong, unique secrets
export JWT_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
```

#### 2. Implement Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
```

#### 3. Add Security Headers
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### **Phase 2: High Priority (Week 2-3)**

#### 4. Input Validation & Sanitization
```typescript
import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

const validateBuilding = [
  body('name').trim().escape().isLength({ min: 1, max: 100 }),
  body('description').customSanitizer(value => DOMPurify.sanitize(value)),
  // Add validation for all inputs
];
```

#### 5. File Upload Security
```typescript
import multer from 'multer';
import path from 'path';

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs allowed'));
    }
  },
});
```

#### 6. Audit Logging System
```typescript
interface AuditLog {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  changes?: any;
}

const auditLogger = (action: string, resource: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Log the action
    const log: AuditLog = {
      userId: req.user.id,
      organizationId: req.user.organization_id,
      action,
      resource,
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
    };
    
    // Store in audit_logs table
    saveAuditLog(log);
    next();
  };
};
```

### **Phase 3: Medium Priority (Week 4-6)**

#### 7. Data Encryption at Rest
```typescript
import crypto from 'crypto';

class DataEncryption {
  private static algorithm = 'aes-256-gcm';
  private static key = process.env.ENCRYPTION_KEY;

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
```

#### 8. Enhanced Authentication
```typescript
// Add password complexity requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

// Implement account lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutes

const checkAccountLockout = async (email: string) => {
  const user = await getUserByEmail(email);
  if (user.lockout_until && user.lockout_until > new Date()) {
    throw new Error('Account temporarily locked due to failed login attempts');
  }
};
```

#### 9. GDPR Compliance Features
```typescript
// Data deletion
const deleteUserData = async (userId: string) => {
  await Promise.all([
    pool.query('DELETE FROM users WHERE id = $1', [userId]),
    pool.query('UPDATE assessments SET assigned_to = NULL WHERE assigned_to = $1', [userId]),
    // Anonymize rather than delete assessment history
    pool.query('UPDATE audit_logs SET user_id = NULL WHERE user_id = $1', [userId]),
  ]);
};

// Data export
const exportUserData = async (userId: string) => {
  const userData = await pool.query(`
    SELECT u.*, o.name as organization_name 
    FROM users u 
    LEFT JOIN organizations o ON u.organization_id = o.id 
    WHERE u.id = $1
  `, [userId]);
  
  return {
    personal_data: userData.rows[0],
    assessments: await getUserAssessments(userId),
    activity_logs: await getUserActivityLogs(userId),
  };
};
```

### **Phase 4: Advanced Security (Ongoing)**

#### 10. Security Monitoring
```typescript
// Implement intrusion detection
const suspiciousActivityDetector = {
  multipleFailedLogins: (userId: string, attempts: number) => {
    if (attempts > 10) {
      alertSecurityTeam(`Multiple failed logins for user ${userId}`);
    }
  },
  
  unusualDataAccess: (userId: string, accessPattern: any) => {
    // Detect unusual access patterns
    if (accessPattern.buildingsAccessed > 100) {
      alertSecurityTeam(`Unusual data access by user ${userId}`);
    }
  },
  
  privilegeEscalation: (userId: string, attemptedAction: string) => {
    alertSecurityTeam(`Privilege escalation attempt by user ${userId}: ${attemptedAction}`);
  },
};
```

---

## 8. Security Testing Recommendations

### **Automated Testing**

1. **Dependency Scanning**
```bash
npm audit --audit-level moderate
npm install --package-lock-only
npm audit fix
```

2. **Static Code Analysis**
```bash
npm install -g eslint-plugin-security
# Add security rules to eslint config
```

3. **Container Security**
```dockerfile
# Use non-root user in Docker
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
```

### **Manual Testing**

1. **Penetration Testing Checklist**
   - [ ] SQL injection testing
   - [ ] XSS vulnerability scanning
   - [ ] Authentication bypass attempts
   - [ ] Authorization testing
   - [ ] File upload security testing
   - [ ] Session management testing

2. **OWASP Top 10 Verification**
   - [ ] Injection attacks
   - [ ] Broken authentication
   - [ ] Sensitive data exposure
   - [ ] XML external entities (XXE)
   - [ ] Broken access control
   - [ ] Security misconfiguration
   - [ ] Cross-site scripting (XSS)
   - [ ] Insecure deserialization
   - [ ] Using components with known vulnerabilities
   - [ ] Insufficient logging and monitoring

---

## 9. Incident Response Plan

### **Security Incident Categories**

1. **Category 1: Critical (Immediate Response)**
   - Data breach
   - System compromise
   - Unauthorized admin access

2. **Category 2: High (4-hour Response)**
   - Account takeover
   - Service disruption
   - Malware detection

3. **Category 3: Medium (24-hour Response)**
   - Suspicious activity
   - Failed authentication spikes
   - Unusual data access patterns

### **Response Procedures**

1. **Immediate Actions**
   - Isolate affected systems
   - Preserve evidence
   - Notify stakeholders
   - Document incident

2. **Investigation Steps**
   - Analyze logs
   - Determine scope
   - Identify root cause
   - Assess damage

3. **Recovery Process**
   - Patch vulnerabilities
   - Restore from clean backups
   - Reset compromised credentials
   - Monitor for recurring issues

---

## 10. Compliance Framework

### **Required Compliance Standards**

1. **GDPR (EU Data Protection)**
   - [ ] Data protection by design
   - [ ] User consent mechanisms
   - [ ] Right to be forgotten
   - [ ] Data portability
   - [ ] Breach notification procedures

2. **SOC 2 Type II**
   - [ ] Security controls
   - [ ] Availability measures
   - [ ] Processing integrity
   - [ ] Confidentiality controls
   - [ ] Privacy protections

3. **ISO 27001**
   - [ ] Information security management system
   - [ ] Risk assessment procedures
   - [ ] Security policies and procedures
   - [ ] Employee security training
   - [ ] Regular security audits

---

## Conclusion

ONYX has a solid foundation with JWT authentication and multi-tenant architecture, but requires immediate attention to critical security vulnerabilities. The platform is currently at **MODERATE RISK** with several **CRITICAL** issues that must be addressed before production deployment.

### **Priority Actions:**
1. **Week 1**: Secure secrets management, rate limiting, security headers
2. **Week 2-3**: Input validation, file upload security, audit logging
3. **Week 4-6**: Data encryption, enhanced authentication, GDPR compliance
4. **Ongoing**: Security monitoring, testing, and compliance maintenance

### **Investment Required:**
- **Immediate (Week 1)**: 20-30 hours of development time
- **Phase 2-3**: 60-80 hours for comprehensive security implementation
- **Ongoing**: 10-15% of development capacity for security maintenance

With proper implementation of these security measures, ONYX can achieve enterprise-grade security suitable for handling sensitive building assessment data and meeting compliance requirements.