# Milestone 7: Infrastructure, Deployment & Operations

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
**Part of:** The Onyx Bible - Complete Platform Documentation

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Deployment Architecture](#deployment-architecture)
3. [Production Environment](#production-environment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Logging](#monitoring--logging)
7. [Performance Optimization](#performance-optimization)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Security Best Practices](#security-best-practices)
10. [Scaling Strategy](#scaling-strategy)
11. [Development Workflow](#development-workflow)
12. [Testing Strategy](#testing-strategy)
13. [Troubleshooting Guide](#troubleshooting-guide)

---

## Infrastructure Overview

### Production Status

**🚀 Live & Production-Ready**

**Deployment Date:** October 3, 2025
**Uptime:** 99.9% target
**Status:** Stable MVP in production

### Hosting Platform

**Render.com** - Unified cloud platform

**Services Used:**
- **Web Service** - Backend API (Node.js)
- **Static Site** - Frontend (React SPA)
- **PostgreSQL** - Managed database
- **Redis** - Session storage (planned)

**Why Render.com:**
- ✅ Simple deployment from Git
- ✅ Automatic SSL/TLS certificates
- ✅ Managed PostgreSQL with backups
- ✅ Auto-scaling capabilities
- ✅ Zero-downtime deployments
- ✅ Affordable pricing for MVP
- ✅ Free tier available for testing

---

## Deployment Architecture

### High-Level Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET / USERS                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  RENDER.COM LOAD BALANCER                    │
│              (Automatic SSL, DDoS Protection)                │
└──────────────────┬────────────────────┬─────────────────────┘
                   │                    │
                   │                    │
       ┌───────────▼─────────┐    ┌────▼──────────────────┐
       │  FRONTEND SERVICE   │    │   BACKEND SERVICE     │
       │   (Static Site)     │    │   (Web Service)       │
       │                     │    │                       │
       │  React + Vite SPA   │    │  Node.js + Express   │
       │  Served as Static   │    │  Auto-scaling        │
       │  Assets             │    │  Health checks       │
       └─────────────────────┘    └───────┬───────────────┘
                                          │
                                          │ PostgreSQL Protocol
                                          ▼
                              ┌───────────────────────┐
                              │  PostgreSQL Database  │
                              │   (Managed Service)   │
                              │                       │
                              │  - Daily backups      │
                              │  - Point-in-time      │
                              │  - High availability  │
                              └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
├─────────────────────┬──────────────────┬────────────────────┤
│   Cloudinary        │    Mailgun       │     Sentry        │
│   (Image CDN)       │  (Email Service) │  (Error Tracking) │
└─────────────────────┴──────────────────┴────────────────────┘
```

### Service Components

**1. Frontend (Static Site)**
- **URL:** https://onyxreport.com
- **Type:** Static site hosting
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Auto-deploy:** On push to `main` branch

**2. Backend (Web Service)**
- **URL:** https://manage.onyxreport.com
- **Type:** Node.js web service
- **Start Command:** `npm start`
- **Health Check:** `/api/health`
- **Auto-deploy:** On push to `main` branch
- **Environment:** Node 20.x

**3. Database (PostgreSQL)**
- **Service:** Render PostgreSQL
- **Version:** PostgreSQL 16
- **Plan:** Starter ($7/month for development)
- **Backups:** Daily automatic backups
- **Connection:** Via DATABASE_URL environment variable

---

## Production Environment

### Environment URLs

**Production:**
- Frontend: https://onyxreport.com
- Backend: https://manage.onyxreport.com
- API Base: https://manage.onyxreport.com/api

**Health Check:**
```bash
curl https://manage.onyxreport.com/api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Onyx Backend API is running",
  "version": "1.0.1",
  "timestamp": "2025-11-03T17:30:00.000Z",
  "cors_enabled": true
}
```

---

### Resource Allocation

**Frontend (Static Site):**
- **CPU:** N/A (static files)
- **Memory:** N/A
- **Bandwidth:** Unlimited
- **Storage:** 100GB included

**Backend (Web Service):**
- **CPU:** Shared (scales with plan)
- **Memory:** 512MB (Starter)
- **Instances:** 1 (can scale to multiple)
- **Auto-scaling:** Yes (Pro plans)

**Database:**
- **Storage:** 1GB (Starter, expandable)
- **Connections:** 22 max concurrent
- **RAM:** Shared
- **Disk:** SSD

---

### SSL/TLS Configuration

**Automatic HTTPS:**
- Render provides free SSL certificates
- Auto-renewal via Let's Encrypt
- TLS 1.2 and 1.3 supported
- HTTPS redirect enforced

**Custom Domain:**
```bash
# Configure custom domain in Render dashboard
# Add DNS records:
# Type: CNAME
# Name: www (or @)
# Value: onyx-frontend.onrender.com
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Render

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run tests
        working-directory: ./backend
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          JWT_SECRET: test-secret

  deploy:
    needs: [test-frontend, test-backend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Render
        run: |
          echo "Render auto-deploys on push to main"
          echo "No manual deployment needed"
```

---

### Deployment Process

**Automatic Deployment:**

```
1. Developer pushes code to GitHub (main branch)
   ↓
2. GitHub Actions triggered
   ↓
3. Run automated tests
   ↓
4. If tests pass, trigger Render deployment
   ↓
5. Render pulls latest code from GitHub
   ↓
6. Backend: npm install → npm run build → npm start
   Frontend: npm install → npm run build → serve dist
   ↓
7. Health checks performed
   ↓
8. Zero-downtime deployment (rolling update)
   ↓
9. New version live
```

**Rollback Process:**
```bash
# In Render dashboard:
# 1. Go to service
# 2. Click "Rollbacks" tab
# 3. Select previous deployment
# 4. Click "Restore"
# 5. Confirmation and deploy
```

---

### Build Configuration

**Frontend Build:**
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Backend Build:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

**Render Configuration:**
```yaml
# render.yaml (optional, for infrastructure as code)
services:
  - type: web
    name: onyx-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: onyx-db
          property: connectionString

  - type: static
    name: onyx-frontend
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://manage.onyxreport.com/api

databases:
  - name: onyx-db
    plan: starter
```

---

## Environment Configuration

### Backend Environment Variables

**Production `.env` (Render dashboard):**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db  # From Render PostgreSQL

# Server
NODE_ENV=production
PORT=5001
CLIENT_URL=https://onyxreport.com

# Authentication
JWT_SECRET=<strong-secret-key-256-bit>
JWT_REFRESH_SECRET=<strong-refresh-secret-256-bit>

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Mailgun (Email Service)
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=mg.yourdomain.com

# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional
CORS_ORIGIN=https://onyxreport.com,https://www.onyxreport.com
```

**Frontend Environment Variables (Build time):**

```bash
# Vite environment variables
VITE_API_URL=https://manage.onyxreport.com/api
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

### Environment Management

**Secret Rotation:**
```bash
# Rotate secrets periodically (quarterly)
# 1. Generate new secret
# 2. Update in Render dashboard
# 3. Trigger re-deployment
# 4. Monitor for issues
# 5. Invalidate old secret
```

**Access Control:**
- Secrets stored in Render dashboard (encrypted)
- No secrets in Git repository
- Team access via Render RBAC
- Audit logging of changes

---

## Monitoring & Logging

### Sentry Integration

**Error Tracking & Performance Monitoring**

**Setup (Backend):**
```typescript
// backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = (app) => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration()
      ],
      tracesSampleRate: 0.1,  // 10% of transactions
      profilesSampleRate: 0.1
    });

    // Request handler
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());

    // Error handler (add last)
    app.use(Sentry.Handlers.errorHandler());
  }
};
```

**Setup (Frontend):**
```typescript
// src/config/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

**User Context:**
```typescript
// Set user context on login
Sentry.setUser({
  id: user.id,
  email: user.email,
  role: user.role,
  organization_id: user.organization_id
});

// Clear on logout
Sentry.setUser(null);
```

**Custom Events:**
```typescript
// Track important business events
Sentry.captureMessage('Assessment completed', {
  level: 'info',
  tags: {
    assessment_id: assessment.id,
    building_id: assessment.building_id,
    fci: assessment.fci
  }
});

// Track errors with context
try {
  await completeAssessment(id);
} catch (error) {
  Sentry.captureException(error, {
    tags: { assessment_id: id },
    extra: { assessment_data: data }
  });
}
```

---

### Application Logging

**Backend Logging:**
```typescript
// Structured logging (consider Winston or Pino)
console.log('[INFO]', timestamp, message, { context });
console.error('[ERROR]', timestamp, error, { context });
console.warn('[WARN]', timestamp, warning, { context });
```

**Log Aggregation:**
- Render provides log streaming
- Logs available in dashboard
- Can export to external services (Datadog, Loggly)

**Log Retention:**
- Last 7 days available in Render
- Consider external log storage for longer retention

---

### Performance Monitoring

**Metrics Tracked:**
- API response times
- Database query times
- Error rates
- Memory usage
- CPU usage
- Request throughput

**Sentry Performance:**
```typescript
// Transaction tracing
const transaction = Sentry.startTransaction({
  op: 'assessment.complete',
  name: 'Complete Assessment'
});

try {
  // Your code
  await completeAssessment(id);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

**Alerts:**
- Error rate > 1%
- Response time > 2 seconds (p95)
- Database connection errors
- Memory usage > 80%

---

## Performance Optimization

### Frontend Optimization

**1. Code Splitting**
```typescript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/dashboard'));
const Buildings = lazy(() => import('./pages/buildings'));

<Suspense fallback={<LoadingSpinner />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

**2. Asset Optimization**
- Image compression (Cloudinary auto-optimization)
- Minification (Vite handles automatically)
- Tree shaking (remove unused code)
- Gzip compression (Render automatic)

**3. Caching Strategy**
```typescript
// Cache static assets
// Vite generates cache-busted filenames
// Render serves with cache headers

// API response caching
const cache = new Map();
const getCachedData = async (key, fetchFn) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetchFn();
  cache.set(key, data);
  return data;
};
```

**4. Bundle Size Analysis**
```bash
npm run build
# Analyze dist/ folder size
# Identify large dependencies
# Consider alternatives or code splitting
```

---

### Backend Optimization

**1. Database Query Optimization**
```typescript
// Use indexes
await knex('buildings')
  .where({ organization_id })  // Indexed
  .select('*');

// Avoid N+1 queries
const buildings = await knex('buildings')
  .where({ organization_id })
  .select('*');

const buildingIds = buildings.map(b => b.id);

const assessments = await knex('assessments')
  .whereIn('building_id', buildingIds)
  .select('*');

// Join instead of multiple queries
const buildingsWithAssessments = await knex('buildings')
  .leftJoin('assessments', 'buildings.id', 'assessments.building_id')
  .where({ 'buildings.organization_id': organization_id })
  .select('buildings.*', knex.raw('json_agg(assessments.*) as assessments'))
  .groupBy('buildings.id');
```

**2. Connection Pooling**
```typescript
// Already configured in database.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**3. Response Compression**
```typescript
import compression from 'compression';

app.use(compression());  // Gzip responses
```

**4. Caching (Planned)**
```typescript
// Redis caching for frequently accessed data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache analytics data (expensive queries)
const cacheKey = `analytics:${organization_id}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const data = await calculateAnalytics(organization_id);
await redis.setex(cacheKey, 3600, JSON.stringify(data));  // 1 hour TTL
return data;
```

---

### CDN & Static Assets

**Cloudinary for Images:**
- Automatic format optimization (WebP)
- Responsive images
- Lazy loading
- CDN delivery

**Static Asset CDN:**
- Render serves frontend assets via CDN
- Global edge locations
- Automatic cache invalidation on deploy

---

## Backup & Disaster Recovery

### Database Backups

**Render Automatic Backups:**
- Daily backups (automatic)
- 7-day retention (Starter plan)
- Point-in-time recovery available (Pro plans)

**Manual Backup:**
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20251103.sql
```

**Backup Strategy:**
- Automated daily backups via Render
- Weekly manual exports to S3 (recommended)
- Pre-deployment database snapshots
- Test restores quarterly

---

### Disaster Recovery Plan

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours

**Disaster Scenarios:**

**1. Database Failure**
```
1. Identify issue (monitoring alerts)
2. Assess data loss
3. Restore from latest backup
4. Verify data integrity
5. Resume operations
6. Post-mortem analysis
```

**2. Application Failure**
```
1. Check health endpoints
2. Review error logs (Sentry)
3. Rollback to previous deployment
4. Investigate root cause
5. Deploy fix
6. Monitor stability
```

**3. Third-party Service Outage**
```
- Cloudinary down: Images fail to load (degraded)
- Mailgun down: Emails queued for retry
- Sentry down: Logging continues locally
- Render down: Wait for restoration
```

---

### Data Export & Import

**Export All Data:**
```bash
# Organizations
pg_dump $DATABASE_URL -t organizations > organizations.sql

# Users
pg_dump $DATABASE_URL -t users > users.sql

# Buildings
pg_dump $DATABASE_URL -t buildings > buildings.sql

# Assessments
pg_dump $DATABASE_URL -t assessments > assessments.sql

# Complete backup
pg_dump $DATABASE_URL > complete-backup.sql
```

**Import Data:**
```bash
psql $DATABASE_URL < complete-backup.sql
```

---

## Security Best Practices

### Application Security

**1. Authentication & Authorization**
- ✅ JWT tokens with short expiration
- ✅ Refresh token rotation
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Role-based access control
- ✅ Two-factor authentication available

**2. Input Validation**
- ✅ Express-validator on all inputs
- ✅ Zod schemas for type safety
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)

**3. Security Headers**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://manage.onyxreport.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**4. Rate Limiting**
- ✅ Auth endpoints: 5 req/15min
- ✅ API endpoints: 100 req/15min
- ✅ IP-based rate limiting

**5. CORS Configuration**
- ✅ Whitelist allowed origins
- ✅ Credentials enabled for auth
- ✅ Preflight caching

---

### Database Security

**1. Connection Security**
- ✅ SSL/TLS encrypted connections
- ✅ Connection string in environment variable
- ✅ No hardcoded credentials

**2. Access Control**
- ✅ Separate database users for services
- ✅ Minimal permissions (principle of least privilege)
- ✅ No public database access

**3. Data Protection**
- ✅ Organization-level isolation
- ✅ Sensitive data encryption at rest
- ✅ Regular security audits

---

### Infrastructure Security

**1. Network Security**
- ✅ HTTPS only (TLS 1.2+)
- ✅ DDoS protection (Render)
- ✅ Firewall rules
- ✅ Private networking between services

**2. Secret Management**
- ✅ Environment variables for secrets
- ✅ No secrets in Git repository
- ✅ Regular secret rotation
- ✅ Encrypted storage (Render)

**3. Dependency Security**
```bash
# Regular dependency audits
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm outdated
npm update
```

---

### Compliance & Best Practices

**OWASP Top 10 Mitigation:**
- ✅ Broken Access Control - RBAC implemented
- ✅ Cryptographic Failures - Strong encryption
- ✅ Injection - Parameterized queries
- ✅ Insecure Design - Security-first architecture
- ✅ Security Misconfiguration - Hardened configs
- ✅ Vulnerable Components - Regular updates
- ✅ Authentication Failures - Strong auth system
- ✅ Software Integrity - Verified dependencies
- ✅ Logging Failures - Comprehensive logging
- ✅ SSRF - Input validation

**GDPR Considerations:**
- User data encryption
- Right to deletion (implemented)
- Data export capability
- Privacy policy
- Cookie consent

---

## Scaling Strategy

### Vertical Scaling (Short-term)

**Current:** Starter plan (512MB RAM)

**Upgrade Path:**
```
Starter (512MB) → Pro (2GB) → Pro Plus (4GB) → Custom
```

**When to Scale:**
- Memory usage consistently > 70%
- CPU usage consistently > 80%
- Response times degrading
- Database connections maxing out

---

### Horizontal Scaling (Medium-term)

**Backend:**
- Add multiple instances (Render auto-scaling)
- Load balancing (automatic)
- Stateless design enables easy scaling
- Session storage in Redis

**Database:**
- Connection pooling (already implemented)
- Read replicas (for heavy read workloads)
- Database sharding (if needed at scale)

**Frontend:**
- CDN distribution (already implemented)
- Edge caching
- Service workers for offline capability

---

### Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| API Response Time (p95) | <500ms | <300ms |
| Frontend Load Time | <2s | <1s |
| Database Query Time | <100ms | <50ms |
| Error Rate | <0.5% | <0.1% |
| Uptime | 99.5% | 99.9% |
| Concurrent Users | 100 | 1000 |

---

## Development Workflow

### Git Workflow

**Branch Strategy:**
```
main (production)
  ↑
  └── feature/feature-name (development)
```

**Workflow:**
```
1. Create feature branch from main
2. Develop and commit changes
3. Run tests locally
4. Push to GitHub
5. Create pull request
6. Code review
7. CI tests run automatically
8. Merge to main
9. Auto-deploy to production
```

**Commit Message Convention:**
```
feat: Add predictive maintenance dashboard
fix: Resolve assessment completion bug
docs: Update API documentation
refactor: Improve FCI calculation performance
test: Add building CRUD tests
```

---

### Local Development

**Setup:**
```bash
# Clone repository
git clone <repo-url>
cd onyx

# Install dependencies
npm install
cd backend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit .env with your credentials

# Run migrations
cd backend && npm run migrate up

# Start development servers
cd backend && npm run dev  # Port 5001
npm run dev                 # Port 5173
```

**Development URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5001
- API: http://localhost:5001/api

---

### Code Quality

**Linting:**
```bash
npm run lint      # Frontend
cd backend && npm run lint  # Backend (if configured)
```

**Formatting:**
- Use consistent code style
- Consider Prettier for auto-formatting

**Type Safety:**
- TypeScript strict mode enabled
- No implicit any
- Comprehensive type definitions

---

## Testing Strategy

### Current Testing Status

**Overall Coverage:** ~30%
**Target Coverage:** 80%

---

### Frontend Testing

**Framework:** Vitest + React Testing Library

**Test Types:**

**1. Unit Tests**
```typescript
// src/services/fci.test.ts
import { calculateFCI } from './fci';

describe('FCI Calculation', () => {
  it('should calculate FCI correctly', () => {
    const fci = calculateFCI(100000, 500000);
    expect(fci).toBe(0.2);
  });

  it('should handle zero replacement value', () => {
    const fci = calculateFCI(100000, 0);
    expect(fci).toBe(0);
  });
});
```

**2. Component Tests**
```typescript
// src/components/BuildingCard.test.tsx
import { render, screen } from '@testing-library/react';
import BuildingCard from './BuildingCard';

test('renders building information', () => {
  const building = {
    id: '1',
    name: 'Test Building',
    type: 'Office',
    square_footage: 50000
  };

  render(<BuildingCard building={building} />);

  expect(screen.getByText('Test Building')).toBeInTheDocument();
  expect(screen.getByText('Office')).toBeInTheDocument();
});
```

**3. Integration Tests (Planned)**
- Full user flows
- API integration
- State management

**Run Tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
npm run test:ui       # Visual test runner
```

---

### Backend Testing

**Framework:** Jest + Supertest

**Test Types:**

**1. Unit Tests**
```typescript
// backend/tests/services/fci.test.ts
import { calculateFCI, getFCICategory } from '../../src/services/fci.service';

describe('FCI Service', () => {
  describe('calculateFCI', () => {
    it('should return correct FCI', () => {
      expect(calculateFCI(100000, 500000)).toBe(0.2);
    });

    it('should round to 4 decimal places', () => {
      expect(calculateFCI(123456, 789012)).toBe(0.1564);
    });
  });

  describe('getFCICategory', () => {
    it('should return Excellent for FCI < 0.1', () => {
      expect(getFCICategory(0.05)).toBe('Excellent');
    });

    it('should return Good for FCI 0.1-0.4', () => {
      expect(getFCICategory(0.25)).toBe('Good');
    });
  });
});
```

**2. API Tests**
```typescript
// backend/tests/api/buildings.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Buildings API', () => {
  let token: string;

  beforeAll(async () => {
    // Login and get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    token = res.body.data.tokens.accessToken;
  });

  describe('GET /api/buildings', () => {
    it('should return buildings for authenticated user', async () => {
      const res = await request(app)
        .get('/api/buildings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.buildings)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/buildings');
      expect(res.status).toBe(401);
    });
  });
});
```

**Run Tests:**
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ci       # CI mode (no watch)
```

---

### End-to-End Testing (Planned)

**Framework:** Playwright

**Test Scenarios:**
- User registration and login
- Building creation workflow
- Complete assessment workflow
- Report generation
- Team management

**Example:**
```typescript
// e2e/assessment.spec.ts
import { test, expect } from '@playwright/test';

test('complete assessment workflow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to new assessment
  await page.click('text=New Assessment');

  // Select building
  await page.click('text=Main Office');

  // Complete pre-assessment
  await page.click('text=Start Pre-Assessment');
  // ... continue workflow

  // Verify completion
  await expect(page.locator('text=Assessment Completed')).toBeVisible();
});
```

---

## Troubleshooting Guide

### Common Issues

**1. Database Connection Errors**

**Symptom:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Verify connection pool settings
# Check max connections not exceeded
```

---

**2. CORS Errors**

**Symptom:** `Access-Control-Allow-Origin` errors in browser console

**Solution:**
```typescript
// Verify CORS configuration in backend
const allowedOrigins = [
  'https://onyxreport.com',
  'http://localhost:5173'
];

// Check request origin
console.log('Request origin:', req.headers.origin);

// Ensure origin is in allowed list
```

---

**3. Token Expiration Issues**

**Symptom:** Frequent 401 errors, users logged out

**Solution:**
```typescript
// Check token expiration times
const ACCESS_TOKEN_EXPIRY = '1h';  // Current
const REFRESH_TOKEN_EXPIRY = '7d';  // Current

// Verify refresh token logic
// Check token verification in auth middleware
```

---

**4. Image Upload Failures**

**Symptom:** Images not uploading to Cloudinary

**Solution:**
```bash
# Verify Cloudinary credentials
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY

# Check file size limits
# Verify Multer configuration

# Test Cloudinary connection
curl -X POST https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload \
  -F "file=@test.jpg" \
  -F "api_key=${API_KEY}" \
  -F "timestamp=$(date +%s)" \
  -F "signature=${SIGNATURE}"
```

---

**5. Build Failures**

**Symptom:** `npm run build` fails

**Solution:**
```bash
# Check TypeScript errors
npm run build -- --no-emit

# Verify all dependencies installed
npm ci

# Check for environment variable issues
# Ensure all VITE_ variables defined

# Clear build cache
rm -rf dist
rm -rf node_modules/.vite
npm run build
```

---

**6. Performance Issues**

**Symptom:** Slow API responses, high memory usage

**Solution:**
```sql
-- Identify slow queries
EXPLAIN ANALYZE SELECT * FROM assessments
WHERE organization_id = 'xxx';

-- Check for missing indexes
SELECT * FROM pg_stat_user_indexes;

-- Analyze table statistics
ANALYZE buildings;
```

---

### Debugging Tools

**Backend:**
```typescript
// Enable debug logging
DEBUG=* npm run dev

// Node.js inspector
node --inspect dist/server.js

// Memory profiling
node --inspect --max-old-space-size=4096 dist/server.js
```

**Frontend:**
```bash
# React DevTools (browser extension)
# Redux DevTools (if using Redux)

# Vite debug mode
DEBUG=vite:* npm run dev
```

**Database:**
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- View slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Conclusion

The Onyx Report platform is production-ready with:

✅ **Robust Infrastructure** - Deployed on Render with automatic scaling
✅ **CI/CD Pipeline** - Automated testing and deployment
✅ **Comprehensive Monitoring** - Sentry integration for errors and performance
✅ **Security First** - Multiple layers of security controls
✅ **Scalability** - Architecture ready for growth
✅ **High Availability** - 99.9% uptime target
✅ **Disaster Recovery** - Automated backups and recovery procedures

**Next Steps for Production:**
1. Monitor initial user feedback
2. Optimize based on real usage patterns
3. Implement advanced features (Milestone 6 pending items)
4. Expand test coverage to 80%
5. Plan for international expansion
6. Scale infrastructure as needed

---

**Document Control:**
- Created: November 3, 2025
- Version: 1.0
- Status: Complete ✅
- Final Milestone: Infrastructure & Operations Complete

---

## 🎉 The Onyx Bible - Complete Documentation Set

**All 7 Milestones Documented:**
1. ✅ Executive Overview & System Introduction
2. ✅ Architecture & Technology Stack
3. ✅ Database Schema & Data Models
4. ✅ API Endpoints & Authentication
5. ✅ Core Functional Features
6. ✅ Advanced Features & Analytics
7. ✅ Infrastructure, Deployment & Operations

**Total Documentation:** ~35,000 tokens across 7 comprehensive documents

**Thank you for using the Onyx Bible!** 📚
