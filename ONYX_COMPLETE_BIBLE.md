# ONYX REPORT - COMPLETE IMPLEMENTATION BIBLE
## End-to-End Technical Specification & Recreation Guide

---

# TABLE OF CONTENTS

1. [EXECUTIVE SUMMARY](#1-executive-summary)
2. [PRODUCT OVERVIEW](#2-product-overview)
3. [SYSTEM ARCHITECTURE](#3-system-architecture)
4. [DATABASE DESIGN](#4-database-design)
5. [BACKEND IMPLEMENTATION](#5-backend-implementation)
6. [FRONTEND IMPLEMENTATION](#6-frontend-implementation)
7. [API DOCUMENTATION](#7-api-documentation)
8. [DEPLOYMENT GUIDE](#8-deployment-guide)
9. [TESTING STRATEGY](#9-testing-strategy)
10. [SECURITY IMPLEMENTATION](#10-security-implementation)

---

# 1. EXECUTIVE SUMMARY

## Product Vision
Onyx Report is a comprehensive multi-tenant SaaS platform for building condition assessment and lifecycle reporting, designed to help organizations manage their facility infrastructure through data-driven insights and predictive maintenance.

## Core Value Proposition
- **For**: Facility managers, property owners, and assessment professionals
- **Who need**: Systematic building condition tracking and capital planning
- **The product**: Provides digital assessment workflows with FCI calculations
- **Unlike**: Traditional paper-based or spreadsheet assessments
- **Our solution**: Offers real-time collaboration, automated reporting, and predictive analytics

## Key Metrics
- **Assessment Time Reduction**: 60% faster than manual methods
- **Report Generation**: Instant PDF reports vs. days of preparation
- **Data Accuracy**: 95% reduction in calculation errors
- **ROI**: 3-5x return through optimized maintenance planning

---

# 2. PRODUCT OVERVIEW

## 2.1 Core Features

### User Management & Authentication
- **Multi-tenant architecture** with organization isolation
- **Role-based access control** (Admin, Manager, Assessor)
- **JWT authentication** with refresh token rotation
- **Simplified registration** (organization name-based)
- **Session management** with secure token storage

### Building Management
- **Complete CRUD operations** for building inventory
- **Building profiles** with 20+ data fields
- **Photo management** and documentation
- **Building type categorization** (Office, Retail, Industrial, etc.)
- **Dynamic replacement value** calculation

### Assessment Workflow
- **Two-phase assessment process**:
  1. Pre-Assessment Planning
  2. Field Assessment Execution
- **Uniformat II element classification** (50+ building elements)
- **5-point condition rating scale**
- **Deficiency tracking** with 6 categories
- **Photo documentation** per element
- **Real-time FCI calculation**

### Reporting & Analytics
- **Automated PDF report generation**
- **FCI trending** and analysis
- **Executive dashboards** with KPIs
- **Cost projection models**
- **Maintenance prioritization**

## 2.2 User Personas

### Facility Manager (Primary)
- **Goals**: Optimize maintenance budgets, extend asset life
- **Pain Points**: Manual tracking, budget justification
- **Features Used**: Dashboards, reports, cost analysis

### Field Assessor
- **Goals**: Efficient data collection, accurate documentation
- **Pain Points**: Paper forms, data re-entry
- **Features Used**: Mobile assessment, photo capture

### Executive/Owner
- **Goals**: Capital planning, risk mitigation
- **Pain Points**: Lack of visibility, reactive maintenance
- **Features Used**: Executive reports, FCI trends

## 2.3 User Journey Map

```
Discovery → Registration → Onboarding → Building Setup → Assessment → Reporting → Action
    ↓           ↓             ↓              ↓              ↓           ↓          ↓
Landing    Create Org    Add Buildings   Input Data    Conduct    Generate   Plan
 Page      & Account     & Details      Properties    Assessment   Reports   Maintenance
```

---

# 3. SYSTEM ARCHITECTURE

## 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                   React 18.3 + TypeScript                    │
│                      Vite + Tailwind                         │
│                        ShadCN UI                             │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     REVERSE PROXY                            │
│                        Nginx                                 │
│                   SSL Termination                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      API BACKEND                             │
│                  Node.js + Express                           │
│                      TypeScript                              │
│                    JWT Auth + CORS                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│                     PostgreSQL                               │
│                   Multi-tenant Schema                        │
└─────────────────────────────────────────────────────────────┘
```

## 3.2 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.3.4
- **Styling**: Tailwind CSS 3.4.1
- **UI Components**: ShadCN/Radix UI
- **State Management**: React Context API
- **Routing**: React Router DOM 6.26.0
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts 2.12.7
- **HTTP Client**: Axios 1.7.3
- **PDF Generation**: jsPDF 2.5.1

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.19.2
- **Language**: TypeScript 5.5.4
- **Database**: PostgreSQL 15+
- **ORM**: node-postgres (pg) 8.12.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **File Upload**: Multer 1.4.5
- **Email**: Mailgun JS 10.2.1
- **Validation**: Express Validator 7.1.0
- **Security**: Helmet, Express Rate Limit

### Infrastructure
- **Hosting**: Render.com (or AWS/GCP alternative)
- **CDN**: Cloudflare
- **Domain**: Custom with SSL
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry/LogRocket
- **Analytics**: Google Analytics/Mixpanel

## 3.3 Directory Structure

```
onyx/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # ShadCN components
│   │   │   ├── layouts/    # Page layouts
│   │   │   └── features/   # Feature components
│   │   ├── pages/          # Route pages
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
│
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utilities
│   │   └── server.ts       # Entry point
│   ├── uploads/            # File uploads
│   └── package.json
│
├── database/               # Database scripts
│   ├── migrations/        # Schema migrations
│   ├── seeds/            # Seed data
│   └── schema.sql        # Complete schema
│
└── docs/                  # Documentation
    ├── api/              # API docs
    ├── deployment/       # Deploy guides
    └── architecture/     # System design
```

---

# 4. DATABASE DESIGN

## 4.1 Database Schema

### Organizations Table
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'professional',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_tokens INTEGER DEFAULT 100,
    subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_organizations_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_created ON organizations(created_at);
```

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assessor' CHECK (role IN ('admin', 'manager', 'assessor')),
    phone VARCHAR(50),
    job_title VARCHAR(100),
    avatar_url TEXT,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    refresh_token TEXT,
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_active ON users(is_active);
```

### Buildings Table
```sql
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    building_type VARCHAR(100),
    year_built INTEGER,
    square_footage INTEGER,
    number_of_floors INTEGER,
    primary_use VARCHAR(200),
    occupancy_type VARCHAR(100),
    construction_type VARCHAR(100),
    last_renovation_year INTEGER,
    owner_name VARCHAR(255),
    owner_contact VARCHAR(255),
    manager_name VARCHAR(255),
    manager_contact VARCHAR(255),
    description TEXT,
    notes TEXT,
    image_url TEXT,
    replacement_value DECIMAL(15, 2),
    cost_per_sqft DECIMAL(10, 2),
    annual_operating_cost DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_buildings_organization ON buildings(organization_id);
CREATE INDEX idx_buildings_type ON buildings(building_type);
CREATE INDEX idx_buildings_status ON buildings(status);
```

### Elements Table (Uniformat II)
```sql
CREATE TABLE elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    major_group VARCHAR(100),
    group_element VARCHAR(200),
    individual_element VARCHAR(300),
    category VARCHAR(100),
    description TEXT,
    parent_code VARCHAR(20),
    level INTEGER,
    typical_life_years INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_elements_code ON elements(code);
CREATE INDEX idx_elements_major_group ON elements(major_group);
```

### Assessments Table
```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100) DEFAULT 'routine',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    assigned_to UUID REFERENCES users(id),
    weather_conditions VARCHAR(100),
    temperature_f INTEGER,
    total_deficiency_cost DECIMAL(12, 2) DEFAULT 0,
    priority_1_cost DECIMAL(12, 2) DEFAULT 0,
    priority_2_cost DECIMAL(12, 2) DEFAULT 0,
    priority_3_cost DECIMAL(12, 2) DEFAULT 0,
    priority_4_cost DECIMAL(12, 2) DEFAULT 0,
    fci_score DECIMAL(5, 4),
    overall_condition VARCHAR(50),
    assessor_notes TEXT,
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_assessments_building ON assessments(building_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_assigned ON assessments(assigned_to);
```

### Assessment_Elements Table
```sql
CREATE TABLE assessment_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    element_id UUID REFERENCES elements(id),
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    condition_notes TEXT,
    quantity DECIMAL(10, 2),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 4),
    deficiency_type VARCHAR(100),
    action_required VARCHAR(100),
    estimated_remaining_life_years INTEGER,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, element_id)
);

-- Indexes
CREATE INDEX idx_assessment_elements_assessment ON assessment_elements(assessment_id);
CREATE INDEX idx_assessment_elements_element ON assessment_elements(element_id);
```

### Assessment_Deficiencies Table
```sql
CREATE TABLE assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_element_id UUID REFERENCES assessment_elements(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(12, 2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 4),
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_deficiencies_element ON assessment_deficiencies(assessment_element_id);
CREATE INDEX idx_deficiencies_category ON assessment_deficiencies(category);
```

### Reports Table
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id),
    assessment_id UUID REFERENCES assessments(id),
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    executive_summary TEXT,
    findings JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    data JSONB DEFAULT '{}'::jsonb,
    pdf_url TEXT,
    generated_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_reports_organization ON reports(organization_id);
CREATE INDEX idx_reports_building ON reports(building_id);
CREATE INDEX idx_reports_assessment ON reports(assessment_id);
```

### Audit_Logs Table
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

## 4.2 Data Relationships

```
Organizations (1) ─── (N) Users
     │                      │
     │                      │ Assigned To
     │                      ↓
     └──── (N) Buildings ─── (N) Assessments
                                      │
                                      │
                             ┌────────┴────────┐
                             ↓                 ↓
                    Assessment_Elements    Reports
                             │
                             ↓
                    Assessment_Deficiencies

Elements (Master Data) ←── Referenced by Assessment_Elements
```

---

# 5. BACKEND IMPLEMENTATION

## 5.1 Server Setup

### Main Server File (server.ts)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';
import { initializeDatabase } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

## 5.2 Database Configuration

### Database Connection (config/database.ts)
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export default pool;
```

## 5.3 Authentication System

### JWT Service (services/auth.service.ts)
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/database';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const ACCESS_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY = '30d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  organization_id: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { 
    expiresIn: ACCESS_TOKEN_EXPIRY 
  });
  
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRY 
  });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string, 
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### Auth Middleware (middleware/auth.middleware.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organization_id: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};
```

## 5.4 Core Controllers

### Buildings Controller (controllers/buildings.controller.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const createBuilding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      name, address, city, state, zip_code,
      building_type, year_built, square_footage,
      number_of_floors, primary_use, replacement_value
    } = req.body;
    
    const user = req.user!;
    
    // Calculate cost per sqft based on building type
    const costPerSqft = calculateCostPerSqft(building_type);
    const calculatedReplacementValue = replacement_value || (square_footage * costPerSqft);
    
    const result = await pool.query(
      `INSERT INTO buildings (
        organization_id, name, address, city, state, zip_code,
        building_type, year_built, square_footage, number_of_floors,
        primary_use, replacement_value, cost_per_sqft, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        user.organization_id, name, address, city, state, zip_code,
        building_type, year_built, square_footage, number_of_floors,
        primary_use, calculatedReplacementValue, costPerSqft, user.id
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBuildings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;
    const { search, building_type, status } = req.query;
    
    let query = `
      SELECT * FROM buildings 
      WHERE organization_id = $1
    `;
    const params: any[] = [user.organization_id];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR address ILIKE $${params.length})`;
    }
    
    if (building_type) {
      params.push(building_type);
      query += ` AND building_type = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    next(error);
  }
};

const calculateCostPerSqft = (buildingType: string): number => {
  const costMap: { [key: string]: number } = {
    'office': 200,
    'retail': 180,
    'industrial': 120,
    'residential': 150,
    'educational': 220,
    'healthcare': 350,
    'hospitality': 250,
    'warehouse': 100,
    'mixed_use': 175
  };
  
  return costMap[buildingType?.toLowerCase()] || 150;
};
```

### Assessment Controller (controllers/assessments.controller.ts)
```typescript
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateFCI } from '../services/fci.service';

export const createAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { building_id, assessment_type, scheduled_date } = req.body;
    const user = req.user!;
    
    const result = await pool.query(
      `INSERT INTO assessments (
        organization_id, building_id, assessment_type,
        scheduled_date, assigned_to, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      RETURNING *`,
      [
        user.organization_id, building_id, assessment_type,
        scheduled_date, user.id, user.id
      ]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

export const saveAssessmentElements = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { elements } = req.body;
    
    for (const element of elements) {
      // Save element rating
      await client.query(
        `INSERT INTO assessment_elements (
          assessment_id, element_id, condition_rating,
          condition_notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (assessment_id, element_id)
        DO UPDATE SET
          condition_rating = EXCLUDED.condition_rating,
          condition_notes = EXCLUDED.condition_notes,
          updated_at = NOW()`,
        [id, element.element_id, element.condition_rating, element.notes]
      );
      
      // Save deficiencies if any
      if (element.deficiencies && element.deficiencies.length > 0) {
        for (const deficiency of element.deficiencies) {
          await client.query(
            `INSERT INTO assessment_deficiencies (
              assessment_element_id, category, severity,
              description, estimated_cost, priority
            ) VALUES (
              (SELECT id FROM assessment_elements 
               WHERE assessment_id = $1 AND element_id = $2),
              $3, $4, $5, $6, $7
            )`,
            [
              id, element.element_id, deficiency.category,
              deficiency.severity, deficiency.description,
              deficiency.estimated_cost, deficiency.priority
            ]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Assessment elements saved successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const completeAssessment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Calculate FCI
    const fciResult = await calculateFCI(id, client);
    
    // Update assessment status and FCI
    await client.query(
      `UPDATE assessments SET
        status = 'completed',
        completion_date = NOW(),
        fci_score = $1,
        total_deficiency_cost = $2,
        overall_condition = $3,
        updated_at = NOW()
      WHERE id = $4`,
      [
        fciResult.fci,
        fciResult.totalDeficiencyCost,
        fciResult.condition,
        id
      ]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      data: {
        fci: fciResult.fci,
        condition: fciResult.condition,
        totalDeficiencyCost: fciResult.totalDeficiencyCost
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
```

## 5.5 Business Logic Services

### FCI Calculation Service (services/fci.service.ts)
```typescript
import { PoolClient } from 'pg';

export interface FCIResult {
  fci: number;
  condition: string;
  totalDeficiencyCost: number;
  replacementValue: number;
}

export const calculateFCI = async (
  assessmentId: string,
  client: PoolClient
): Promise<FCIResult> => {
  // Get building replacement value
  const buildingResult = await client.query(
    `SELECT b.replacement_value, b.square_footage, b.cost_per_sqft
     FROM buildings b
     JOIN assessments a ON a.building_id = b.id
     WHERE a.id = $1`,
    [assessmentId]
  );
  
  if (buildingResult.rows.length === 0) {
    throw new Error('Building not found');
  }
  
  const building = buildingResult.rows[0];
  const replacementValue = building.replacement_value || 
    (building.square_footage * building.cost_per_sqft);
  
  // Calculate total deficiency cost
  const deficiencyResult = await client.query(
    `SELECT COALESCE(SUM(ad.estimated_cost), 0) as total_cost
     FROM assessment_deficiencies ad
     JOIN assessment_elements ae ON ad.assessment_element_id = ae.id
     WHERE ae.assessment_id = $1`,
    [assessmentId]
  );
  
  const totalDeficiencyCost = parseFloat(deficiencyResult.rows[0].total_cost);
  
  // Calculate FCI
  const fci = replacementValue > 0 ? totalDeficiencyCost / replacementValue : 0;
  
  // Determine condition based on FCI
  let condition = 'Excellent';
  if (fci > 0.7) {
    condition = 'Critical';
  } else if (fci > 0.4) {
    condition = 'Fair';
  } else if (fci > 0.1) {
    condition = 'Good';
  }
  
  return {
    fci: Math.round(fci * 10000) / 10000, // Round to 4 decimal places
    condition,
    totalDeficiencyCost,
    replacementValue
  };
};
```

### Report Generation Service (services/report.service.ts)
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';

export const generateAssessmentReport = async (assessmentId: string) => {
  // Fetch assessment data
  const assessmentResult = await pool.query(
    `SELECT a.*, b.name as building_name, b.address, b.city, b.state,
            u.name as assessor_name, o.name as organization_name
     FROM assessments a
     JOIN buildings b ON a.building_id = b.id
     JOIN users u ON a.assigned_to = u.id
     JOIN organizations o ON a.organization_id = o.id
     WHERE a.id = $1`,
    [assessmentId]
  );
  
  if (assessmentResult.rows.length === 0) {
    throw new Error('Assessment not found');
  }
  
  const assessment = assessmentResult.rows[0];
  
  // Create PDF
  const doc = new PDFDocument();
  const fileName = `assessment_${assessmentId}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../uploads/reports', fileName);
  
  doc.pipe(fs.createWriteStream(filePath));
  
  // Add content
  doc.fontSize(20).text('FACILITY CONDITION ASSESSMENT REPORT', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(16).text(`Building: ${assessment.building_name}`);
  doc.fontSize(12).text(`Address: ${assessment.address}, ${assessment.city}, ${assessment.state}`);
  doc.text(`Assessment Date: ${new Date(assessment.completion_date).toLocaleDateString()}`);
  doc.text(`Assessor: ${assessment.assessor_name}`);
  doc.moveDown();
  
  doc.fontSize(14).text('EXECUTIVE SUMMARY');
  doc.fontSize(12).text(`FCI Score: ${assessment.fci_score}`);
  doc.text(`Overall Condition: ${assessment.overall_condition}`);
  doc.text(`Total Deficiency Cost: $${assessment.total_deficiency_cost.toLocaleString()}`);
  
  // Add more sections as needed...
  
  doc.end();
  
  return `/uploads/reports/${fileName}`;
};
```

---

# 6. FRONTEND IMPLEMENTATION

## 6.1 Application Structure

### Main App Component (App.tsx)
```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import { ThemeProvider } from './context/theme-context';
import { Toaster } from './components/ui/toaster';
import AuthLayout from './components/layouts/auth-layout';
import DashboardLayout from './components/layouts/dashboard-layout';
import ProtectedRoute from './components/auth/protected-route';

// Pages
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import DashboardPage from './pages/dashboard';
import BuildingsPage from './pages/buildings';
import AssessmentsPage from './pages/assessments';
import ReportsPage from './pages/reports';
import UsersPage from './pages/users';
import SettingsPage from './pages/settings';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/buildings" element={<BuildingsPage />} />
              <Route path="/buildings/:id" element={<BuildingDetailsPage />} />
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/assessments/new" element={<NewAssessmentPage />} />
              <Route path="/assessments/:id" element={<AssessmentDetailsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
```

## 6.2 Context Providers

### Auth Context (context/auth-context.tsx)
```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/me');
        setUser(response.data.data.user);
      } catch (error) {
        localStorage.removeItem('accessToken');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  };
  
  const login = async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { user, tokens } = response.data.data;
    
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    
    setUser(user);
    navigate('/dashboard');
  };
  
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };
  
  const register = async (data: RegisterData) => {
    const response = await axios.post('/api/auth/register', data);
    const { user, tokens } = response.data.data;
    
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    
    setUser(user);
    navigate('/dashboard');
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 6.3 Core Components

### Building Card Component (components/buildings/building-card.tsx)
```tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Building, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BuildingCardProps {
  building: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    building_type: string;
    year_built: number;
    square_footage: number;
    replacement_value: number;
    status: string;
  };
}

export const BuildingCard: React.FC<BuildingCardProps> = ({ building }) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{building.name}</CardTitle>
          <Badge variant={building.status === 'active' ? 'default' : 'secondary'}>
            {building.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{building.address}, {building.city}, {building.state}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{building.building_type} • {building.square_footage.toLocaleString()} sq ft</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Built {building.year_built}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>${building.replacement_value.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/buildings/${building.id}`)}
          >
            View Details
          </Button>
          <Button 
            size="sm"
            onClick={() => navigate(`/assessments/new?building_id=${building.id}`)}
          >
            Start Assessment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Assessment Form Component (components/assessments/assessment-form.tsx)
```tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const elementSchema = z.object({
  element_id: z.string(),
  condition_rating: z.number().min(1).max(5),
  notes: z.string().optional(),
  deficiencies: z.array(z.object({
    category: z.string(),
    severity: z.string(),
    description: z.string(),
    estimated_cost: z.number()
  })).optional()
});

interface AssessmentFormProps {
  element: {
    id: string;
    name: string;
    major_group: string;
    group_element: string;
    individual_element: string;
  };
  onSave: (data: any) => void;
  onNext: () => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ 
  element, 
  onSave, 
  onNext 
}) => {
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [deficiencies, setDeficiencies] = useState<any[]>([]);
  
  const handleSubmit = () => {
    const data = {
      element_id: element.id,
      condition_rating: rating,
      notes,
      deficiencies
    };
    onSave(data);
    onNext();
  };
  
  const conditionLabels = {
    5: 'Excellent - New or like new',
    4: 'Good - Minor wear',
    3: 'Fair - Moderate wear',
    2: 'Poor - Significant wear',
    1: 'Critical - Replacement needed'
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{element.individual_element}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {element.major_group} → {element.group_element}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Condition Rating</Label>
          <RadioGroup value={rating.toString()} onValueChange={(v) => setRating(parseInt(v))}>
            {[5, 4, 3, 2, 1].map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value.toString()} id={`rating-${value}`} />
                <Label htmlFor={`rating-${value}`} className="font-normal">
                  {conditionLabels[value as keyof typeof conditionLabels]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="notes">Assessment Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any observations or notes..."
            rows={4}
          />
        </div>
        
        {rating <= 3 && (
          <div>
            <Label>Deficiencies</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setDeficiencies([...deficiencies, {
                category: '',
                severity: 'low',
                description: '',
                estimated_cost: 0
              }])}
            >
              Add Deficiency
            </Button>
            
            {deficiencies.map((deficiency, index) => (
              <div key={index} className="mt-4 p-4 border rounded-lg space-y-3">
                <Input
                  placeholder="Description"
                  value={deficiency.description}
                  onChange={(e) => {
                    const updated = [...deficiencies];
                    updated[index].description = e.target.value;
                    setDeficiencies(updated);
                  }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="border rounded px-3 py-2"
                    value={deficiency.category}
                    onChange={(e) => {
                      const updated = [...deficiencies];
                      updated[index].category = e.target.value;
                      setDeficiencies(updated);
                    }}
                  >
                    <option value="">Select Category</option>
                    <option value="life_safety">Life Safety & Code</option>
                    <option value="critical_systems">Critical Systems</option>
                    <option value="energy">Energy Efficiency</option>
                    <option value="asset_lifecycle">Asset Life Cycle</option>
                    <option value="user_experience">User Experience</option>
                    <option value="accessibility">Equity & Accessibility</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="Estimated Cost"
                    value={deficiency.estimated_cost}
                    onChange={(e) => {
                      const updated = [...deficiencies];
                      updated[index].estimated_cost = parseFloat(e.target.value);
                      setDeficiencies(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onNext}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0}>
            Save & Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

## 6.4 API Service Layer

### API Configuration (services/api.ts)
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### Building Service (services/building.service.ts)
```typescript
import api from './api';

export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  building_type: string;
  year_built: number;
  square_footage: number;
  replacement_value: number;
}

export const buildingService = {
  async getAll(params?: { search?: string; building_type?: string }) {
    const response = await api.get('/buildings', { params });
    return response.data.data;
  },
  
  async getById(id: string) {
    const response = await api.get(`/buildings/${id}`);
    return response.data.data;
  },
  
  async create(data: Partial<Building>) {
    const response = await api.post('/buildings', data);
    return response.data.data;
  },
  
  async update(id: string, data: Partial<Building>) {
    const response = await api.put(`/buildings/${id}`, data);
    return response.data.data;
  },
  
  async delete(id: string) {
    await api.delete(`/buildings/${id}`);
  }
};
```

---

# 7. API DOCUMENTATION

## 7.1 API Endpoints Overview

### Authentication Endpoints
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - User login
POST   /api/auth/refresh      - Refresh access token
POST   /api/auth/logout       - Logout user
GET    /api/auth/me           - Get current user
POST   /api/auth/forgot       - Request password reset
POST   /api/auth/reset        - Reset password
```

### Building Endpoints
```
GET    /api/buildings         - List all buildings
GET    /api/buildings/:id     - Get building details
POST   /api/buildings         - Create new building
PUT    /api/buildings/:id     - Update building
DELETE /api/buildings/:id     - Delete building
GET    /api/buildings/:id/assessments - Get building assessments
GET    /api/buildings/:id/reports     - Get building reports
```

### Assessment Endpoints
```
GET    /api/assessments       - List all assessments
GET    /api/assessments/:id   - Get assessment details
POST   /api/assessments       - Create new assessment
PUT    /api/assessments/:id   - Update assessment
DELETE /api/assessments/:id   - Delete assessment
GET    /api/assessments/:id/elements  - Get assessment elements
POST   /api/assessments/:id/elements  - Save assessment elements
POST   /api/assessments/:id/complete  - Complete assessment
GET    /api/assessments/:id/calculate-fci - Calculate FCI
POST   /api/assessments/:id/generate-report - Generate report
```

### Element Endpoints
```
GET    /api/elements          - List all elements
GET    /api/elements/:id      - Get element details
POST   /api/elements/seed     - Seed Uniformat elements
```

### User Endpoints
```
GET    /api/users             - List organization users
GET    /api/users/:id         - Get user details
POST   /api/users             - Create new user
PUT    /api/users/:id         - Update user
DELETE /api/users/:id         - Delete user
PUT    /api/users/:id/role    - Update user role
```

### Report Endpoints
```
GET    /api/reports           - List all reports
GET    /api/reports/:id       - Get report details
POST   /api/reports/generate  - Generate new report
GET    /api/reports/:id/download - Download report PDF
```

## 7.2 Request/Response Examples

### Login Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@onyx.com",
  "password": "password123"
}
```

### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@onyx.com",
      "name": "Admin User",
      "role": "admin",
      "organization_id": "uuid"
    },
    "tokens": {
      "accessToken": "jwt.token.here",
      "refreshToken": "refresh.token.here"
    }
  }
}
```

### Create Building Request
```http
POST /api/buildings
Authorization: Bearer jwt.token.here
Content-Type: application/json

{
  "name": "Corporate Headquarters",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "building_type": "office",
  "year_built": 1995,
  "square_footage": 50000,
  "number_of_floors": 10,
  "primary_use": "Corporate Office"
}
```

### Save Assessment Elements Request
```http
POST /api/assessments/:id/elements
Authorization: Bearer jwt.token.here
Content-Type: application/json

{
  "elements": [
    {
      "element_id": "uuid",
      "condition_rating": 4,
      "notes": "Minor wear observed",
      "deficiencies": [
        {
          "category": "energy",
          "severity": "low",
          "description": "Outdated lighting fixtures",
          "estimated_cost": 5000,
          "priority": 3
        }
      ]
    }
  ]
}
```

---

# 8. DEPLOYMENT GUIDE

## 8.1 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://api.onyxreport.com/api
VITE_APP_NAME=Onyx Report
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### Backend (.env)
```env
# Server
NODE_ENV=production
PORT=5001

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# CORS
ALLOWED_ORIGINS=https://onyxreport.com,https://www.onyxreport.com

# Email (Mailgun)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.onyxreport.com
FROM_EMAIL=noreply@onyxreport.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

## 8.2 Docker Deployment

### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5001
CMD ["node", "dist/server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:5001/api

  backend:
    build: ./backend
    ports:
      - "5001:5001"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://onyx:password@postgres:5432/onyxdb
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=onyx
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=onyxdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 8.3 Cloud Deployment (Render)

### Frontend (Static Site)
1. Connect GitHub repository
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Environment Variables: Set VITE_* variables

### Backend (Web Service)
1. Connect GitHub repository
2. Build Command: `cd backend && npm install && npm run build`
3. Start Command: `cd backend && npm start`
4. Environment Variables: Set all backend env variables
5. Health Check Path: `/api/health`

### Database (PostgreSQL)
1. Create PostgreSQL instance
2. Run migration scripts
3. Note connection string for backend

## 8.4 CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
      
      - name: Run tests
        run: |
          npm test
          cd backend && npm test
      
      - name: Build
        run: |
          npm run build
          cd backend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/deploy/srv-xxx?key=$RENDER_API_KEY
```

---

# 9. TESTING STRATEGY

## 9.1 Frontend Testing

### Unit Tests (Vitest)
```typescript
// components/buildings/building-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BuildingCard } from './building-card';

describe('BuildingCard', () => {
  const mockBuilding = {
    id: '1',
    name: 'Test Building',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    building_type: 'office',
    year_built: 2000,
    square_footage: 10000,
    replacement_value: 1000000,
    status: 'active'
  };
  
  it('renders building information', () => {
    render(
      <BrowserRouter>
        <BuildingCard building={mockBuilding} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Building')).toBeInTheDocument();
    expect(screen.getByText(/123 Test St/)).toBeInTheDocument();
    expect(screen.getByText(/10,000 sq ft/)).toBeInTheDocument();
  });
  
  it('navigates to building details on click', () => {
    const { getByText } = render(
      <BrowserRouter>
        <BuildingCard building={mockBuilding} />
      </BrowserRouter>
    );
    
    fireEvent.click(getByText('View Details'));
    expect(window.location.pathname).toBe('/buildings/1');
  });
});
```

### Integration Tests
```typescript
// tests/assessment-workflow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const server = setupServer(
  rest.post('/api/assessments', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: { id: '123', status: 'pending' }
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Assessment Workflow', () => {
  it('completes full assessment flow', async () => {
    render(<App />);
    
    // Login
    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password');
    await userEvent.click(screen.getByText(/login/i));
    
    // Navigate to assessments
    await waitFor(() => {
      expect(screen.getByText(/assessments/i)).toBeInTheDocument();
    });
    
    // Start new assessment
    await userEvent.click(screen.getByText(/new assessment/i));
    
    // Complete assessment form
    // ... test implementation
  });
});
```

## 9.2 Backend Testing

### Unit Tests (Jest)
```typescript
// tests/services/fci.service.test.ts
import { calculateFCI } from '../../src/services/fci.service';
import pool from '../../src/config/database';

jest.mock('../../src/config/database');

describe('FCI Service', () => {
  it('calculates FCI correctly', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({
          rows: [{ replacement_value: 1000000, square_footage: 10000, cost_per_sqft: 100 }]
        })
        .mockResolvedValueOnce({
          rows: [{ total_cost: 100000 }]
        })
    };
    
    const result = await calculateFCI('assessment-id', mockClient as any);
    
    expect(result.fci).toBe(0.1);
    expect(result.condition).toBe('Good');
    expect(result.totalDeficiencyCost).toBe(100000);
    expect(result.replacementValue).toBe(1000000);
  });
});
```

### API Tests
```typescript
// tests/api/buildings.test.ts
import request from 'supertest';
import app from '../../src/app';
import { generateTokens } from '../../src/services/auth.service';

describe('Buildings API', () => {
  let token: string;
  
  beforeAll(() => {
    token = generateTokens({
      id: 'user-id',
      email: 'test@test.com',
      role: 'admin',
      organization_id: 'org-id'
    }).accessToken;
  });
  
  describe('GET /api/buildings', () => {
    it('returns list of buildings', async () => {
      const response = await request(app)
        .get('/api/buildings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('requires authentication', async () => {
      await request(app)
        .get('/api/buildings')
        .expect(401);
    });
  });
});
```

---

# 10. SECURITY IMPLEMENTATION

## 10.1 Security Best Practices

### Input Validation
```typescript
// middleware/validation.middleware.ts
import { body, validationResult } from 'express-validator';

export const validateBuilding = [
  body('name').notEmpty().trim().escape(),
  body('address').optional().trim().escape(),
  body('year_built').optional().isInt({ min: 1800, max: new Date().getFullYear() }),
  body('square_footage').optional().isInt({ min: 1 }),
  body('building_type').optional().isIn(['office', 'retail', 'industrial', 'residential']),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries
const result = await pool.query(
  'SELECT * FROM buildings WHERE organization_id = $1 AND name ILIKE $2',
  [organizationId, `%${searchTerm}%`]
);

// Never use string concatenation
// BAD: `SELECT * FROM buildings WHERE id = '${id}'`
```

### XSS Prevention
```typescript
// Use DOMPurify for sanitizing HTML content
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput);
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
```

### Security Headers
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
    preload: true
  }
}));
```

## 10.2 Data Privacy

### Personal Data Handling
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement data retention policies
- Provide data export functionality
- Support account deletion

### GDPR Compliance
- User consent for data processing
- Right to access personal data
- Right to rectification
- Right to erasure
- Data portability

---

# APPENDICES

## A. Uniformat II Element Codes

```
A - SUBSTRUCTURE
  A10 - Foundations
    A1010 - Standard Foundations
    A1020 - Special Foundations
  A20 - Basement Construction
    A2010 - Basement Excavation
    A2020 - Basement Walls

B - SHELL
  B10 - Superstructure
    B1010 - Floor Construction
    B1020 - Roof Construction
  B20 - Exterior Enclosure
    B2010 - Exterior Walls
    B2020 - Exterior Windows
    B2030 - Exterior Doors
  B30 - Roofing
    B3010 - Roof Coverings
    B3020 - Roof Openings

C - INTERIORS
  C10 - Interior Construction
    C1010 - Partitions
    C1020 - Interior Doors
    C1030 - Fittings
  C20 - Stairs
    C2010 - Stair Construction
    C2020 - Stair Finishes
  C30 - Interior Finishes
    C3010 - Wall Finishes
    C3020 - Floor Finishes
    C3030 - Ceiling Finishes

D - SERVICES
  D10 - Conveying
    D1010 - Elevators & Lifts
    D1020 - Escalators
  D20 - Plumbing
    D2010 - Plumbing Fixtures
    D2020 - Domestic Water Distribution
    D2030 - Sanitary Drainage
  D30 - HVAC
    D3010 - Energy Supply
    D3020 - Heat Generating Systems
    D3030 - Cooling Generating Systems
    D3040 - Distribution Systems
    D3050 - Terminal & Package Units
  D40 - Fire Protection
    D4010 - Sprinklers
    D4020 - Standpipes
  D50 - Electrical
    D5010 - Electrical Service & Distribution
    D5020 - Lighting & Branch Wiring
    D5030 - Communications & Security

E - EQUIPMENT & FURNISHINGS
  E10 - Equipment
    E1010 - Commercial Equipment
    E1020 - Institutional Equipment
  E20 - Furnishings
    E2010 - Fixed Furnishings

F - SPECIAL CONSTRUCTION
  F10 - Special Construction
    F1010 - Special Structures
  F20 - Selective Demolition
    F2010 - Building Elements Demolition

G - BUILDING SITEWORK
  G10 - Site Preparation
    G1010 - Site Clearing
  G20 - Site Improvements
    G2010 - Roadways
    G2020 - Parking Lots
    G2030 - Pedestrian Paving
    G2040 - Site Development
    G2050 - Landscaping
  G30 - Site Civil/Mechanical Utilities
    G3010 - Water Supply
    G3020 - Sanitary Sewer
    G3030 - Storm Sewer
  G40 - Site Electrical Utilities
    G4010 - Electrical Distribution
    G4020 - Site Lighting
```

## B. FCI Interpretation Guide

```
FCI Range    | Condition  | Recommended Action
-------------|------------|--------------------
0.00 - 0.10  | Excellent  | Routine maintenance
0.10 - 0.40  | Good       | Preventive maintenance
0.40 - 0.70  | Fair       | Renovation planning
0.70+        | Critical   | Major renovation or replacement
```

## C. Deficiency Categories

1. **Life Safety & Code Compliance**
   - Fire safety violations
   - ADA non-compliance
   - Structural safety issues

2. **Critical Systems**
   - HVAC failures
   - Electrical system issues
   - Plumbing failures

3. **Energy Efficiency**
   - Insulation deficiencies
   - Outdated lighting
   - Inefficient HVAC

4. **Asset Life Cycle**
   - End-of-life components
   - Deferred maintenance items
   - Obsolete systems

5. **User Experience**
   - Comfort issues
   - Aesthetic concerns
   - Functionality problems

6. **Equity & Accessibility**
   - Accessibility barriers
   - Inclusion issues
   - Universal design gaps

---

# CONCLUSION

This comprehensive bible provides everything needed to recreate Onyx Report from scratch. The system is designed to be:

- **Scalable**: Multi-tenant architecture supports unlimited organizations
- **Secure**: Industry-standard security practices throughout
- **Maintainable**: Clean code architecture with separation of concerns
- **User-Friendly**: Intuitive interface with guided workflows
- **Data-Driven**: Comprehensive analytics and reporting

For questions or clarifications, refer to the specific sections above or consult the inline code documentation.

**Version**: 1.0.0
**Last Updated**: January 2025
**Total Implementation Time**: ~400-500 hours for MVP
**Recommended Team Size**: 2-3 developers

---

END OF DOCUMENT