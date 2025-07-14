# Onyx Building Assessment Platform

A production-grade SaaS application for building condition assessment and facility management with advanced analytics, predictive maintenance, and automated reporting capabilities for capital planning.

## 🌐 System Overview

**System Name:** Onyx  
**App Type:** Multi-tenant SaaS (Web-based)  
**Users:** Admin, Building Manager, Field Assessor  
**Core Output:** Facility Condition Index (FCI) reports and predictive maintenance insights for capital planning decisions

---

## 🧱 Tech Stack

### Frontend
- **React.js** (TypeScript) + Tailwind CSS + ShadCN UI
- **Charts:** Recharts for data visualization
- **State Management:** React hooks and context
- **Routing:** React Router

### Backend
- **Node.js** + Express.js (REST APIs)
- **Database:** PostgreSQL with custom queries
- **Authentication:** JWT + Role-based access control
- **File Storage:** Cloudinary for image management
- **Document Generation:** PDFKit + ExcelJS
- **Email System:** Nodemailer with HTML templates
- **Scheduling:** Node-cron for automated reports

### Infrastructure
- **Frontend Deployment:** Vercel-ready
- **Backend Deployment:** Railway/Render compatible
- **Environment Management:** Comprehensive .env configuration

---

## 📦 Core Modules

### 1. Authentication & Multi-Tenancy
- Register/Login with JWT tokens
- Role-based access: admin, facility_manager, assessor
- Multi-tenant model using organizations
- Tenant isolation via org_id

### 2. Buildings Management
- CRUD operations for building portfolio
- Auto-population of cost/sqft from reference data
- Cloudinary integration for building images
- Building analytics and performance tracking

### 3. Assessment System
- **Pre-Assessment:** Element grouping and lifecycle planning
- **Field Assessment:** Condition rating, repair cost estimation, and deficiency categorization
- **Deficiency Categories:** Life Safety & Code Compliance, Critical Systems, Energy Efficiency, Asset Life Cycle, User Experience, Equity & Accessibility
- **FCI Calculation:** Automated Facility Condition Index computation
- **Workflow Management:** Status tracking and assignment

### 4. Advanced Analytics Engine
- **Cost Analysis:** Cost per square foot trends and comparisons
- **Age vs FCI Correlation:** Building age impact on facility condition
- **Efficiency Rankings:** Building performance and cost efficiency
- **Trend Analysis:** Historical data visualization and insights

### 5. Predictive Maintenance System
- **AI-Powered Predictions:** Component failure forecasting
- **Risk Analysis:** HVAC, electrical, plumbing, and structural risk assessment
- **Optimization Suggestions:** Cost-saving maintenance strategies
- **Timeline Predictions:** Maintenance scheduling recommendations

### 6. Automated Reporting
- **PDF Generation:** Comprehensive assessment reports with charts
- **Excel Export:** Detailed analytics with conditional formatting
- **Email Automation:** Scheduled report delivery (daily/weekly/monthly)
- **Subscription Management:** User-configurable report preferences

---

## 🚀 Advanced Features Implementation

### 1. PDF/Excel Export System

#### Backend Implementation
```typescript
// services/report-generator.service.ts
- PDFKit integration for comprehensive PDF reports
- ExcelJS for detailed Excel analytics
- FCI data extraction and formatting
- Automated chart generation
```

#### API Endpoints
```
GET /api/reports/pdf/:assessmentId - Generate PDF report
GET /api/reports/excel - Generate Excel report with filters
```

#### Features
- Building information and assessment details
- FCI calculations with visual representations
- Cost breakdown by timeline (immediate, short-term, long-term)
- Conditional formatting in Excel exports
- Multiple worksheet analytics

### 2. Scheduled Email Reports

#### Backend Implementation
```typescript
// services/email-reports.service.ts
- Node-cron for automated scheduling
- Nodemailer with SMTP configuration
- HTML email templates with attachments
- Subscription management system
```

#### Database Schema
```sql
-- report_subscriptions table
- User subscription preferences
- Frequency settings (daily/weekly/monthly)
- Report type configurations
- Filter preferences
```

#### Features
- Professional HTML email templates
- Automated report generation and delivery
- User subscription management interface
- Admin controls for manual triggering
- Multiple report types (summary, detailed, critical_only)

### 3. Advanced Analytics Dashboard

#### Backend Implementation
```typescript
// services/analytics.service.ts
- Complex SQL queries with CTEs and window functions
- Building performance calculations
- Cost efficiency analysis
- Age vs FCI correlation algorithms
```

#### API Endpoints
```
GET /api/analytics/buildings - Building analytics
GET /api/analytics/fci-age-correlation - Age vs FCI analysis
GET /api/analytics/cost-efficiency - Cost efficiency rankings
GET /api/analytics/cost-trends - Maintenance cost trends
GET /api/analytics/summary - Comprehensive analytics
```

#### Features
- Interactive charts and visualizations
- Cost per square foot analysis
- Building efficiency rankings
- Age vs condition correlation
- Trend analysis over time

### 4. Predictive Maintenance Algorithms

#### Backend Implementation
```typescript
// services/predictive-maintenance.service.ts
- Machine learning-style algorithms
- Component failure prediction models
- Risk assessment calculations
- Optimization suggestion engine
```

#### API Endpoints
```
GET /api/analytics/predictions - Maintenance predictions
GET /api/analytics/risk-analysis - Component risk analysis
GET /api/analytics/optimization - Cost optimization suggestions
GET /api/analytics/predictive-dashboard - Comprehensive dashboard
```

#### Features
- AI-powered failure predictions
- Component-specific risk analysis (HVAC, electrical, plumbing, structural)
- Confidence scoring and timeline predictions
- ROI-based optimization suggestions
- Priority-based maintenance scheduling

---

## 🛡️ Multi-Tenancy & Security

### Data Isolation
- Organization-based data segregation
- Role-based access control (RBAC)
- JWT authentication with refresh tokens
- Tenant-scoped API endpoints

### Security Features
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting on API endpoints
- Secure file upload handling

---

## 🗄️ Database Schema

### Core Tables
```sql
-- Users and Organizations
users (id, email, name, role, org_id, created_at)
organizations (id, name, subscription, created_at)

-- Building Management
buildings (id, name, type, address, year_built, square_footage, cost_per_sqft, org_id)
building_images (id, building_id, image_url, created_at)

-- Assessment System
assessments (id, building_id, type, status, assigned_to_user_id, notes, org_id)
building_elements (id, name, category, useful_life, install_year, org_id)

-- Advanced Features
report_subscriptions (id, user_id, frequency, report_type, filters, is_active)
```

### Key Relationships
- All tables include org_id for multi-tenancy
- Foreign key constraints ensure data integrity
- Indexes on frequently queried columns
- Audit trails with created_at/updated_at timestamps

---

## 📊 FCI Calculation Engine

### Formula Implementation
```typescript
FCI = Total Repair Cost ÷ Replacement Value
Replacement Value = cost_per_sqft × square_footage
```

### Rating Scale
- **Excellent (0.00-0.1):** Representative of new building, routine maintenance only
- **Good (0.1-0.4):** Light investment needed, continue preventive maintenance
- **Fair (0.4-0.7):** Need strong plan for renovation
- **Critical (0.7+):** Consider demolition as cost of repair/replacement is at or close to 100% of new build

### Advanced Analytics
- Trend analysis over time
- Component-specific breakdowns
- Cost impact projections
- Maintenance optimization recommendations

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run build
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Run migrations
npm run migrate

# Create report subscriptions table
psql -d onyx -f create-report-subscriptions-table.sql
```

### Environment Configuration
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/onyx

# JWT
JWT_SECRET=your-secret-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Client
CLIENT_URL=http://localhost:5174
```

---

## 🎯 Key Features

### Assessment Workflow
1. **Building Registration:** Add buildings with comprehensive metadata
2. **Pre-Assessment:** Define building elements and lifecycle parameters
3. **Field Assessment:** Rate conditions, categorize deficiencies, and estimate repair costs
4. **FCI Calculation:** Automated condition index computation
5. **Report Generation:** PDF/Excel exports with detailed analytics for capital planning

### Advanced Analytics
- **Performance Metrics:** Building efficiency and cost analysis
- **Predictive Insights:** Maintenance forecasting and optimization
- **Trend Analysis:** Historical data visualization
- **Risk Assessment:** Component failure probability analysis

### Automation Features
- **Scheduled Reports:** Automated email delivery
- **Predictive Maintenance:** AI-powered failure predictions
- **Cost Optimization:** ROI-based maintenance suggestions
- **Alert System:** Critical condition notifications

---

## 📈 API Documentation

### Authentication
```
POST /api/auth/login - User authentication
POST /api/auth/register - User registration
POST /api/auth/refresh - Token refresh
```

### Buildings
```
GET /api/buildings - List buildings
POST /api/buildings - Create building
GET /api/buildings/:id - Get building details
PUT /api/buildings/:id - Update building
DELETE /api/buildings/:id - Delete building
```

### Assessments
```
GET /api/assessments - List assessments
POST /api/assessments - Create assessment
GET /api/assessments/:id - Get assessment details
PUT /api/assessments/:id - Update assessment
POST /api/assessments/:id/calculate-fci - Calculate FCI
POST /api/assessments/:id/complete - Complete assessment
```

### Reports & Analytics
```
GET /api/reports/pdf/:assessmentId - Generate PDF report
GET /api/reports/excel - Generate Excel report
GET /api/analytics/summary - Analytics dashboard
GET /api/analytics/predictive-dashboard - Predictive maintenance
```

---

## 🧪 Testing

### Unit Tests
- Jest for backend API testing
- React Testing Library for component tests

### Integration Tests
- API endpoint testing
- Database operation validation
- Email system testing

### End-to-End Tests
- Cypress for user workflow testing
- Assessment creation to report generation
- Multi-user scenarios

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Automatic deployment on git push
# Environment variables configured in Vercel dashboard
```

### Backend (Railway/Render)
```bash
# Dockerfile included for containerized deployment
# Environment variables managed through platform
```

### Database
- PostgreSQL hosted service (Railway, Render, or AWS RDS)
- Automated backups and scaling
- Connection pooling for performance

---

## 🔮 Future Enhancements

### Planned Features
- **Mobile App:** React Native companion app
- **IoT Integration:** Real-time sensor data integration
- **Machine Learning:** Enhanced predictive algorithms
- **3D Visualization:** Building condition heat maps
- **API Integration:** Third-party facility management systems

### Scalability Improvements
- **Microservices:** Service decomposition for scale
- **Caching:** Redis for performance optimization
- **CDN:** Global content delivery
- **Load Balancing:** Multi-instance deployment

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 👥 Contributors

- **Development Team:** Full-stack implementation
- **Data Analytics:** Predictive modeling and algorithms
- **DevOps:** Infrastructure and deployment automation
- **QA:** Testing and quality assurance

---

## 📞 Support

For technical support or questions about the Onyx platform:
- **Documentation:** Internal wiki and API docs
- **Issue Tracking:** GitHub Issues
- **Email:** daniel@onyxplatform.com

---

*Onyx Platform - Advanced Building Assessment and Facility Management*