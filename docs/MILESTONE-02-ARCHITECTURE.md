# Milestone 2: Architecture & Technology Stack

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
**Part of:** The Onyx Bible - Complete Platform Documentation

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Database Architecture](#database-architecture)
5. [Multi-Tenancy Design](#multi-tenancy-design)
6. [Security Architecture](#security-architecture)
7. [Technology Stack](#technology-stack)
8. [Design Patterns](#design-patterns)
9. [Development Setup](#development-setup)

---

## System Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────┐
│           CLIENT TIER (Presentation)                │
│  React SPA + TypeScript + Tailwind + ShadCN UI     │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/REST
                     ▼
┌─────────────────────────────────────────────────────┐
│        APPLICATION TIER (Business Logic)            │
│  Node.js + Express + JWT Auth + Controllers        │
└────────────────────┬────────────────────────────────┘
                     │ PostgreSQL
                     ▼
┌─────────────────────────────────────────────────────┐
│            DATA TIER (Persistence)                  │
│  PostgreSQL 16 + Multi-tenant Schema + Knex        │
└─────────────────────────────────────────────────────┘

External Services: Cloudinary | Mailgun | Sentry | Render
```

### Architecture Principles

- **Separation of Concerns**: Clear layer boundaries
- **RESTful API**: Stateless communication
- **JWT Authentication**: Token-based security
- **Multi-Tenancy**: Organization-level isolation
- **Scalability**: Horizontal scaling ready
- **Security First**: Defense in depth

---

## Frontend Architecture

### Core Technologies

**Framework Stack:**
- React 18.3 + TypeScript 5.5
- Vite 5.4 (Build tool)
- Tailwind CSS 3.4 + ShadCN UI
- React Router DOM v6

**State Management:**
- Context API (Global: Auth, Organization)
- React Hooks (Local state)
- React Hook Form (Forms)

**Data Layer:**
- Axios (HTTP client)
- Zod (Validation)

**UI Components:**
- ShadCN UI + Radix UI
- Lucide React (Icons)
- Recharts (Charts)

### Project Structure

```
src/
├── components/
│   ├── ui/                 # ShadCN components
│   ├── assessment-workflow/
│   ├── dashboard/
│   └── layout/
├── pages/                  # Route components
│   ├── auth/
│   ├── dashboard/
│   ├── buildings/
│   ├── assessments/
│   ├── reports/
│   └── analytics/
├── context/
│   ├── auth-context.tsx    # Authentication
│   └── org-context.tsx     # Organization
├── services/
│   └── api.ts              # API client
├── lib/
│   └── utils.ts            # Utilities
└── main.tsx                # Entry point
```

### State Management

**Authentication Context:**
```typescript
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email, password) => Promise<void>;
  logout: () => void;
  register: (name, email, password, org) => Promise<void>;
};
```

**Organization Context:**
```typescript
type OrgContextType = {
  organization: Organization | null;
  refreshOrganization: () => Promise<void>;
};
```

### Routing Structure

```
Public Routes:
  /login
  /register

Protected Routes:
  /dashboard
  /buildings, /buildings/:id
  /assessments, /assessments/:id
  /assessments/:id/pre-assessment
  /assessments/:id/field-assessment
  /reports, /reports/:id
  /analytics
  /team, /profile, /settings

Admin Routes:
  /admin/dashboard
  /admin/users
  /admin/organizations
  /admin/building-costs
```

### API Integration

**Centralized API Client:**
```typescript
// services/api.ts
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add JWT token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Attempt token refresh
    }
    return Promise.reject(error);
  }
);
```

---

## Backend Architecture

### Core Technologies

**Framework Stack:**
- Node.js 20+ + Express 4.18
- TypeScript 5.3
- PostgreSQL 16 + Knex.js

**Security:**
- JWT (jsonwebtoken)
- bcryptjs (Password hashing)
- Helmet (Security headers)
- CORS + Rate limiting

**Services:**
- Cloudinary (Images)
- Mailgun (Email)
- Sentry (Monitoring)

### Project Structure

```
backend/src/
├── config/
│   ├── database.ts
│   ├── security.ts
│   └── sentry.ts
├── controllers/          # Request handlers
├── services/            # Business logic
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── security.middleware.ts
├── routes/              # API endpoints
├── database/
│   └── migrations/
├── types/
├── app.ts              # Express config
└── server.ts           # Entry point
```

### Layered Architecture

**1. Routes Layer:**
- Define endpoints
- Apply middleware
- Route to controllers

**2. Controller Layer:**
- Handle HTTP requests
- Validate input
- Call services
- Format responses

**3. Service Layer:**
- Business logic
- Database operations
- External integrations
- Calculations (FCI, analytics)

**4. Database Layer:**
- Connection pooling
- Query execution
- Transactions

### Middleware Stack

**Application-Level:**
1. Sentry (Error tracking)
2. Helmet (Security headers)
3. CORS (Cross-origin)
4. Body Parser (JSON, 10MB limit)

**Route-Level:**
1. Security middleware
2. Rate limiting
3. Authentication (JWT)
4. Authorization (RBAC)
5. File upload (Multer)

**Error-Level:**
1. 404 handler
2. Error handler

### Authentication Flow

```
Client                          Server
  │                               │
  │  POST /api/auth/login         │
  │  { email, password }          │
  ├──────────────────────────────►│
  │                               │
  │                    Verify password (bcrypt)
  │                    Generate JWT tokens
  │                               │
  │  { user, accessToken,         │
  │    refreshToken }             │
  │◄──────────────────────────────┤
  │                               │
  │  Store tokens                 │
  │                               │
  │  GET /api/buildings           │
  │  Authorization: Bearer token  │
  ├──────────────────────────────►│
  │                               │
  │                    Verify JWT
  │                    Check organization
  │                               │
  │  { buildings: [...] }         │
  │◄──────────────────────────────┤
```

**Token Specs:**
- Access Token: 1-hour expiry
- Refresh Token: 7-day expiry
- Algorithm: HS256

---

## Database Architecture

### PostgreSQL Schema

**15 Core Tables:**
1. organizations
2. users
3. buildings
4. elements (Uniformat II)
5. assessments
6. assessment_elements
7. assessment_deficiencies
8. pre_assessments
9. field_assessments
10. fci_reports
11. reports
12. tokens
13. reference_building_costs
14. email_subscriptions
15. migration_audit

### Connection Management

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000
});
```

### Query Builder (Knex)

```typescript
// Parameterized queries prevent SQL injection
knex('buildings')
  .where({ organization_id: orgId })
  .select('*');
```

### Indexing Strategy

**Primary Keys:**
- UUID on all tables

**Foreign Key Indexes:**
```sql
CREATE INDEX idx_buildings_org_id
  ON buildings(organization_id);
CREATE INDEX idx_assessments_building_id
  ON assessments(building_id);
```

**Composite Indexes:**
```sql
CREATE INDEX idx_assessments_org_status
  ON assessments(organization_id, status);
```

### Migration System

```bash
npm run migrate up          # Run migrations
npm run migrate rollback    # Rollback
npm run migrate status      # View status
```

---

## Multi-Tenancy Design

### Organization-Level Partitioning

**Strategy:** Logical separation using `organization_id` column

**Implementation:**
```typescript
// All queries filter by organization
const buildings = await knex('buildings')
  .where({ organization_id: req.user.organization_id })
  .select('*');
```

**Benefits:**
- Simple implementation
- Cost-effective (single DB)
- Easy cross-tenant analytics

**Security:**
- Middleware enforces organization filter
- All protected routes validate organization access
- Code review for query auditing

---

## Security Architecture

### Defense Layers

**1. Network Security:**
- HTTPS/TLS encryption
- CORS restrictions
- Allowed origins whitelist

**2. Application Security:**
- Helmet.js security headers
- Content Security Policy
- Rate limiting (5/min auth, 100/min API)

**3. Authentication:**
- JWT tokens (short-lived)
- Bcrypt password hashing (10 rounds)
- Refresh token rotation

**4. Authorization:**
- Role-based access control
- Organization-level isolation
- Route-level permissions

**5. Input Validation:**
- Express-validator
- Zod schemas
- SQL injection prevention
- XSS sanitization

### CORS Configuration

```typescript
const allowedOrigins = [
  'https://onyxreport.com',
  'https://www.onyxreport.com',
  'http://localhost:5173'  // Dev only
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
```

### Rate Limiting

```typescript
// Auth endpoints: 5 requests per 15 minutes
authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});

// API endpoints: 100 requests per 15 minutes
apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.5 | Type safety |
| Vite | 5.4 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| ShadCN UI | Latest | Components |
| React Router | 6.22 | Routing |
| React Hook Form | 7.53 | Forms |
| Zod | 3.23 | Validation |
| Axios | 1.6 | HTTP client |
| Recharts | 2.12 | Charts |
| Vitest | 3.2 | Testing |
| Sentry | 10.0 | Monitoring |

### Backend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Runtime |
| Express | 4.18 | Framework |
| TypeScript | 5.3 | Type safety |
| PostgreSQL | 16 | Database |
| Knex.js | 3.1 | Query builder |
| jsonwebtoken | 9.0 | JWT auth |
| bcryptjs | 2.4 | Password hash |
| Helmet | 7.1 | Security |
| CORS | 2.8 | Cross-origin |
| Multer | 1.4 | File upload |
| Cloudinary | 1.41 | Image CDN |
| Mailgun | 9.4 | Email |
| Jest | 29.7 | Testing |
| Sentry | 10.0 | Monitoring |

---

## Design Patterns

### Backend Patterns

1. **MVC Architecture**: Routes → Controllers → Services
2. **Service Layer**: Business logic separation
3. **Middleware Pipeline**: Composable request processing
4. **Repository Pattern**: Database abstraction via Knex

### Frontend Patterns

1. **Container/Presentational**: Logic vs UI separation
2. **Custom Hooks**: Reusable logic encapsulation
3. **Context Providers**: Global state management
4. **Compound Components**: Complex UI composition

### Best Practices

- TypeScript strict mode
- ESLint + code formatting
- Automated testing
- Code review process
- Git feature branch workflow

---

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm 10+

### Setup Steps

```bash
# Install dependencies
npm install
cd backend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit .env with DATABASE_URL, JWT_SECRET, etc.

# Run migrations
cd backend && npm run migrate up

# Start servers (separate terminals)
cd backend && npm run dev  # Port 5001
npm run dev                 # Port 5173
```

### Environment Variables

**Backend `.env`:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret
MAILGUN_API_KEY=key
MAILGUN_DOMAIN=domain.com
SENTRY_DSN=dsn
PORT=5001
NODE_ENV=development
```

### Development Commands

**Frontend:**
```bash
npm run dev       # Dev server
npm run build     # Production build
npm test          # Run tests
npm run lint      # Lint code
```

**Backend:**
```bash
npm run dev       # Dev server (nodemon)
npm run build     # Compile TypeScript
npm start         # Production server
npm test          # Run tests
npm run migrate   # Database migrations
```

---

**Next Steps:**
- Proceed to **Milestone 3: Database Schema & Data Models**

---

**Document Control:**
- Created: November 3, 2025
- Version: 1.0
- Status: Complete ✅
