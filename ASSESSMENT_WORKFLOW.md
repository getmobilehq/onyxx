# Onyx Assessment Workflow Documentation

## Complete Assessment to Report Generation Flow

### Overview
The Onyx Building Assessment System follows a structured workflow from building creation through report generation. This document outlines the complete process.

---

## 1. Building Management Phase

### 1.1 Building Creation
**Endpoint:** `POST /api/buildings`
**Frontend:** `src/pages/buildings/new-building.tsx`

**Process:**
1. User creates new building with basic information
2. Required fields: name, type, square footage
3. Optional: address, year built, cost per sqft
4. Building gets assigned unique UUID
5. Organization association established

**Key Files:**
- `backend/src/controllers/buildings.controller.ts:createBuilding`
- `src/pages/buildings/new-building.tsx`

### 1.2 Building Cost Configuration
**Admin Feature:** Building type cost management
**Endpoint:** Admin interface in dashboard

**Process:**
1. Admin sets cost per square foot by building type
2. Dynamic replacement value calculation
3. Database-driven pricing with `cost_per_sqft` column

---

## 2. Assessment Creation Phase

### 2.1 Assessment Initialization
**Endpoint:** `POST /api/assessments`
**Frontend:** `src/pages/assessments/new-assessment.tsx`

**Process:**
1. User selects existing building
2. Assessment created with status: `pending`
3. Assessment gets unique UUID
4. User assigned as assessor

**Key Files:**
- `backend/src/controllers/assessments.controller.ts:createAssessment`
- `src/pages/assessments/new-assessment.tsx`

### 2.2 Pre-Assessment Phase
**Frontend:** Pre-assessment checklist and element selection

**Process:**
1. Building information verification
2. Element selection from Uniformat II classification (64 standard elements)
3. Pre-assessment checklist completion
4. Assessment status remains `pending`

**Elements System:**
- Database seeding with standard building elements
- Element categories based on Uniformat II
- Custom element addition capability

---

## 3. Field Assessment Phase

### 3.1 Assessment Execution
**Endpoint:** Assessment detail page with element evaluation
**Frontend:** `src/pages/assessments/[id]/assessment-detail.tsx`

**Process:**
1. Assessment status changes to `in_progress`
2. Element-by-element condition evaluation
3. Condition rating scale: 1-5 (1=Poor, 5=Excellent)
4. Photo upload capability for each element
5. Deficiency documentation with categorization

**Deficiency Categories:**
- Life Safety & Code Compliance
- Critical Systems
- Energy Efficiency  
- Asset Life Cycle
- User Experience
- Equity & Accessibility

**Key APIs:**
- `PUT /api/assessments/:id/elements/:elementId` - Update element assessment
- `POST /api/buildings/upload-image` - Photo upload

### 3.2 Element Assessment Data
**Data Captured per Element:**
- Condition rating (1-5 scale)
- Repair cost estimate
- Deficiency category
- Priority level (Immediate, Short-term, Long-term)
- Notes and observations
- Photo documentation

---

## 4. Assessment Completion Phase

### 4.1 Assessment Finalization
**Process:**
1. All elements evaluated
2. User clicks "Complete Assessment"
3. Assessment status changes to `completed`
4. Automatic report generation triggered

**Key Validation:**
- All selected elements must have condition ratings
- Repair cost calculations validated
- Required photos uploaded per organization policy

---

## 5. Report Generation Phase

### 5.1 FCI Calculation Engine
**Endpoint:** `POST /api/assessments/:id/generate-report`
**Backend:** `backend/src/controllers/assessments.controller.ts:generateReport`

**FCI Formula:**
```
FCI = Total Repair Costs ÷ Replacement Value
```

**Calculation Process:**
1. Sum all element repair costs by priority:
   - Immediate (0-1 year)
   - Short-term (1-3 years)  
   - Long-term (3-10 years)
2. Calculate replacement value: `square_footage × cost_per_sqft`
3. Compute FCI score: `total_repair_cost ÷ replacement_value`
4. Determine condition rating based on FCI thresholds

**FCI Interpretation Ranges:**
- 0.00-0.1: Excellent (new building)
- 0.1-0.4: Good (light investment)
- 0.4-0.7: Fair (renovation needed)
- 0.7+: Critical (consider demolition)

### 5.2 Report Data Structure
**Generated Report Contains:**
- Assessment metadata (ID, dates, assessor)
- Building information (name, type, year, square footage)
- FCI results (score, rating, costs)
- Cost breakdown by time periods
- Element details with conditions and repair costs
- Summary and recommendations

### 5.3 Report Storage
**Database:** Reports table with JSON data
**File Generation:** Multiple formats supported
- JSON format for API responses
- HTML format for web display
- PDF generation capability

---

## 6. Report Delivery & Export

### 6.1 Web Interface
**Frontend:** `src/pages/reports/reports-dashboard.tsx`
**Features:**
- Report listing and search
- Interactive report viewing
- Cost visualizations with charts
- Export capabilities

### 6.2 PDF Generation
**Script:** `generate-html-report.cjs`
**Process:**
1. Fetch report data via API
2. Generate styled HTML template
3. Browser-based PDF printing
4. Professional formatting with print styles

**PDF Features:**
- Professional styling with company branding
- Print-optimized layout
- Cost breakdown visualizations
- Element assessment details
- Executive summary format

---

## 7. API Integration Points

### 7.1 Core API Endpoints
```
Authentication:
POST /api/auth/login
POST /api/auth/register

Buildings:
GET /api/buildings
POST /api/buildings  
PUT /api/buildings/:id
DELETE /api/buildings/:id
POST /api/buildings/upload-image

Assessments:
GET /api/assessments
POST /api/assessments
GET /api/assessments/:id
PUT /api/assessments/:id
DELETE /api/assessments/:id
PUT /api/assessments/:id/elements/:elementId
POST /api/assessments/:id/generate-report

Elements:
GET /api/elements
POST /api/elements
PUT /api/elements/:id

Reports:
GET /api/reports
GET /api/reports/:id
```

### 7.2 Security & CORS
**Configuration:** `backend/src/config/security.ts`
**Features:**
- JWT authentication with refresh tokens
- Role-based authorization (admin, manager, assessor)
- Rate limiting for API endpoints
- CORS configuration for production domains
- Input validation and sanitization

---

## 8. Data Flow Summary

```
1. Building Creation
   ↓
2. Assessment Setup (Pre-Assessment)
   ↓  
3. Field Assessment (Element Evaluation)
   ↓
4. Assessment Completion
   ↓
5. Automatic Report Generation
   ↓
6. Report Storage & Delivery
   ↓
7. PDF Export & Distribution
```

---

## 9. Error Handling & Recovery

### 9.1 Common Issues & Solutions
- **CORS Errors:** Enhanced CORS configuration with explicit headers
- **Assessment Completion Failures:** Validation checks and error recovery
- **Report Generation Timeouts:** Optimized database queries
- **File Upload Issues:** Multi-format support and validation

### 9.2 Production Stability
- Comprehensive error logging
- API rate limiting and security
- Database connection pooling
- Frontend error boundaries

---

## 10. Development & Testing

### 10.1 Local Development
```bash
# Backend
cd backend && npm run dev

# Frontend  
npm run dev
```

### 10.2 Production Deployment
- **Frontend:** https://onyxreport.com (Render static site)
- **Backend:** https://onyx-backend-f7vh.onrender.com (Render web service)
- **Database:** Render PostgreSQL
- **CI/CD:** GitHub Actions → Render auto-deploy

---

## 11. Report Generation Scripts

### 11.1 Manual Report Generation
**Script:** `generate-report.cjs`
- Login authentication
- API-based report generation
- JSON output with detailed data

### 11.2 PDF Report Generation  
**Script:** `generate-html-report.cjs`
- Styled HTML report template
- Print-optimized CSS
- Browser-based PDF generation
- Professional formatting

---

## Sample Assessment Data

**Assessment ID:** `da5031dc-9e28-490f-82fe-a426a96d7396`
**Building:** Two Story Bank (1950)
**FCI Score:** 0.0280 (2.80% - Good Condition)
**Total Repair Cost:** $56,000
**Replacement Value:** $2,000,000

**Key Elements Assessed:**
1. Structural Foundation - Condition 2/5 - $50,000 repair cost
   - Notes: "Rusted basement requiring immediate attention"
2. Electrical Systems - Condition 4/5 - $6,000 repair cost
   - Notes: "Minor electrical updates needed"

This comprehensive workflow ensures accurate building assessments and professional reporting for capital planning decisions.