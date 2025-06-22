
You are a senior full-stack AI code agent tasked with building a production-grade SaaS application called **Onyx** for building condition assessment and lifecycle reporting. The platform includes three primary modules: Buildings, Pre-Assessment, and Field Assessment, along with Admin and Reporting capabilities.

### 🌐 System Requirements Overview

**System Name:** Onyx  
**App Type:** Multi-tenant SaaS (Web-based)  
**Users:** Admin, Building Manager, Field Assessor  
**Core Output:** Facility Condition Index (FCI) report (PDF)

---

### 🧱 Tech Stack

- **Frontend:** React.js (TypeScript) + Tailwind CSS + ShadCN UI
- **Backend:** Node.js + Express.js (REST APIs)
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** JWT + Role-based + Multi-tenancy (Organizations)
- **Cloud:** Vercel (Frontend), Railway or Render (Backend)
- **Storage:** Cloudinary or S3 (building images, report uploads)
- **PDF Generation:** Puppeteer or React-PDF
- **Charts:** Recharts

---

### 📦 Key Modules to Build

#### 1. Authentication
- Register/Login
- Role-based access: admin, manager, assessor
- Multi-tenant model using `organizations` table
- Tenant isolation via `org_id`

#### 2. Buildings Module
- Create/Edit building (name, type, location, year built, sqft, cost/sqft)
- Auto-populate cost/sqft from reference table
- Upload image, store metadata
- Assign to organization and creator

#### 3. Pre-Assessment Module
- Table of grouped elements (major → group → individual)
- Inputs: total useful life, install year, repair frequency
- Locking after all entries are submitted

#### 4. Field Assessment Module
- Rate each element: Excellent, Fair, Needs Attention
- Require repair cost if condition is not Excellent
- Option to upload image evidence
- Submit when complete

#### 5. FCI Engine
- Formula: FCI = Sum(repair costs) ÷ Replacement Cost
- Replacement Cost = cost/sqft × sqft
- Display color-coded FCI rating

#### 6. Reporting Module
- Generate PDF report with:
  - Cover metadata
  - Building overview
  - FCI score and visual scale
  - System breakdown
  - Photo gallery
  - Repair recommendations
- Export options: Download, Email, Save to log

#### 7. Admin Dashboard
- View buildings and users by org
- Filter by location, score, role
- Export CSV, view FCI charts

---

### 🛡️ Multi-Tenancy Model

- `organizations` table holds org data
- All data tables link to `org_id`
- Admin can view all, others are scoped to their org

---

### 🧪 Testing & DevOps

- **Tests:** Jest (unit) + Cypress (e2e)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry or LogRocket
- **Environment:** `.env` file with secrets

---

### ✅ MVP Goals

- Complete buildings lifecycle: create → assess → FCI → report
- Multi-user SaaS dashboard
- Scalable backend API structure
- Exportable and traceable assessments

Now begin code scaffolding starting with:
- `/api` folder structure
- Prisma schema for all core tables (users, orgs, buildings, assessments, etc.)
- Auth and session logic
- Frontend layout using ShadCN

