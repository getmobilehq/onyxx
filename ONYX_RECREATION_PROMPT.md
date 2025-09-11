# ONYX REPORT - COMPLETE RECREATION PROMPT
## Comprehensive Instructions to Build a Building Condition Assessment SaaS Platform

---

# THE PROMPT

You are tasked with building **Onyx Report**, a comprehensive multi-tenant SaaS platform for building condition assessment and facility management. This system enables organizations to conduct digital facility assessments, calculate Facility Condition Index (FCI), and generate professional reports for capital planning.

## CORE REQUIREMENTS

### 1. PRODUCT SPECIFICATION

Build a web application with the following core capabilities:

**Primary Features:**
- Multi-tenant architecture with organization-based data isolation
- Complete building inventory management system
- Two-phase assessment workflow (Pre-Assessment → Field Assessment)
- Uniformat II building element classification (50+ standard elements)
- 5-point condition rating scale for each element
- Deficiency tracking with 6 categories and cost estimation
- Automated FCI calculation and condition scoring
- PDF report generation with executive summaries
- Role-based access control (Admin, Manager, Assessor)
- Real-time dashboard with KPIs and analytics

**User Journey:**
1. Organization signs up (simplified registration without tokens)
2. Admin adds buildings to inventory
3. Assessor creates new assessment
4. Pre-assessment: Select building, choose elements, complete checklist
5. Field assessment: Rate each element, document deficiencies, add photos
6. System calculates FCI score automatically
7. Generate and download PDF report
8. View analytics and trends on dashboard

### 2. TECHNICAL ARCHITECTURE

**Frontend Stack:**
```
- React 18.3.1 with TypeScript 5.5.3
- Vite 5.3.4 as build tool
- Tailwind CSS 3.4.1 for styling
- ShadCN UI components (built on Radix UI)
- React Router DOM 6.26.0 for routing
- React Hook Form + Zod for form validation
- Recharts 2.12.7 for data visualization
- Axios 1.7.3 for API calls
- jsPDF 2.5.1 for PDF generation
```

**Backend Stack:**
```
- Node.js 18+ with Express 4.19.2
- TypeScript 5.5.4
- PostgreSQL 15+ database
- JWT authentication (jsonwebtoken 9.0.2)
- bcrypt 5.1.1 for password hashing
- node-postgres (pg) 8.12.0 for database
- Multer for file uploads
- Express Rate Limit for API protection
- Helmet for security headers
```

**Deployment:**
```
- Frontend: Static site hosting (Render/Vercel/Netlify)
- Backend: Node.js web service (Render/Heroku/Railway)
- Database: PostgreSQL (Render/Supabase/Neon)
- Custom domain with SSL
- Environment-based configuration
```

### 3. DATABASE SCHEMA

Create these PostgreSQL tables:

```sql
-- Organizations (tenant isolation)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    subscription_plan VARCHAR(50) DEFAULT 'professional',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (with organization reference)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assessor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    building_type VARCHAR(100),
    year_built INTEGER,
    square_footage INTEGER,
    replacement_value DECIMAL(15, 2),
    cost_per_sqft DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Elements (Uniformat II classification)
CREATE TABLE elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    major_group VARCHAR(100),
    group_element VARCHAR(200),
    individual_element VARCHAR(300),
    typical_life_years INTEGER
);

-- Assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    building_id UUID REFERENCES buildings(id),
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_date DATE,
    completion_date TIMESTAMP,
    fci_score DECIMAL(5, 4),
    total_deficiency_cost DECIMAL(12, 2),
    overall_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment Elements (junction table)
CREATE TABLE assessment_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id),
    element_id UUID REFERENCES elements(id),
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    condition_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, element_id)
);

-- Deficiencies
CREATE TABLE assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_element_id UUID REFERENCES assessment_elements(id),
    category VARCHAR(100),
    description TEXT,
    estimated_cost DECIMAL(12, 2),
    priority INTEGER
);
```

### 4. API ENDPOINTS

Implement these REST API endpoints:

**Authentication:**
```
POST /api/auth/register - Register with organization name
POST /api/auth/login - Login with email/password
POST /api/auth/refresh - Refresh JWT token
GET  /api/auth/me - Get current user
```

**Buildings:**
```
GET    /api/buildings - List all buildings (filtered by organization)
POST   /api/buildings - Create new building
GET    /api/buildings/:id - Get building details
PUT    /api/buildings/:id - Update building
DELETE /api/buildings/:id - Delete building
```

**Assessments:**
```
GET    /api/assessments - List assessments
POST   /api/assessments - Create assessment
GET    /api/assessments/:id - Get assessment details
POST   /api/assessments/:id/elements - Save element ratings
POST   /api/assessments/:id/complete - Complete and calculate FCI
GET    /api/assessments/:id/report - Generate PDF report
```

**Elements:**
```
GET    /api/elements - List Uniformat elements
POST   /api/elements/seed - Seed database with 50+ elements
```

### 5. FRONTEND PAGES & COMPONENTS

**Authentication Pages:**
- `/login` - Email/password login form
- `/register` - Organization name, user details, password

**Dashboard Pages:**
- `/dashboard` - Statistics cards, recent assessments, FCI trends chart
- `/buildings` - Building grid with cards showing details
- `/buildings/new` - Form to add new building
- `/buildings/:id` - Building details with assessment history
- `/assessments` - Assessment list with status badges
- `/assessments/new` - Pre-assessment workflow
- `/assessments/:id/field` - Field assessment with element rating
- `/reports` - Generated reports list with download links

**Key React Components:**
```jsx
// Layout Components
<DashboardLayout> - Sidebar navigation, header, main content area
<AuthLayout> - Centered card for login/register

// Feature Components  
<BuildingCard> - Display building info with actions
<AssessmentList> - Table with filters and sorting
<ElementRatingForm> - 5-point scale, notes, deficiency entry
<DeficiencyModal> - Category selection, cost estimation
<FCIDisplay> - Visual FCI score with interpretation
<StatCard> - Dashboard metric display

// UI Components (ShadCN)
<Button>, <Card>, <Input>, <Select>, <Dialog>
<Table>, <Badge>, <Tabs>, <RadioGroup>
<Form>, <Label>, <Textarea>, <Toast>
```

### 6. BUSINESS LOGIC

**FCI Calculation:**
```
FCI = Total Deficiency Cost / Replacement Value

Interpretation:
- 0.00-0.10: Excellent (routine maintenance)
- 0.10-0.40: Good (preventive maintenance)  
- 0.40-0.70: Fair (renovation needed)
- 0.70+: Critical (major renovation/replacement)
```

**Condition Rating Scale:**
```
5 - Excellent: New or like new condition
4 - Good: Minor wear, fully functional
3 - Fair: Moderate wear, functional with minor issues
2 - Poor: Significant wear, major repairs needed
1 - Critical: Failed or requires replacement
```

**Deficiency Categories:**
1. Life Safety & Code Compliance
2. Critical Systems
3. Energy Efficiency
4. Asset Life Cycle
5. User Experience
6. Equity & Accessibility

**Building Types & Cost/SqFt:**
```javascript
const buildingCosts = {
  'office': 200,
  'retail': 180,
  'industrial': 120,
  'residential': 150,
  'educational': 220,
  'healthcare': 350,
  'hospitality': 250,
  'warehouse': 100
};
```

### 7. AUTHENTICATION FLOW

1. **Registration:**
   - User provides: name, email, password, organization name
   - System creates organization and user records
   - Returns JWT access token (7 day expiry) and refresh token (30 day)
   - Redirect to dashboard

2. **Login:**
   - Validate email/password against database
   - Generate JWT tokens with user payload
   - Store tokens in localStorage
   - Set Authorization header for API calls

3. **Protected Routes:**
   - Check for valid JWT on each request
   - Refresh token if expired
   - Redirect to login if unauthorized

4. **Role-Based Access:**
   - Admin: Full system access
   - Manager: View all, edit buildings/assessments
   - Assessor: Create/edit assessments only

### 8. ASSESSMENT WORKFLOW

**Phase 1: Pre-Assessment**
1. Select building from dropdown
2. Choose assessment type (Routine/Comprehensive/Focused)
3. Select Uniformat elements to assess (checkbox list)
4. Complete pre-assessment checklist:
   - Verify building information
   - Confirm square footage
   - Update replacement value
   - Note access requirements
5. Save pre-assessment and proceed

**Phase 2: Field Assessment**
1. Display selected elements grouped by major category
2. For each element:
   - Show element details (code, name, description)
   - 5-point condition rating (radio buttons)
   - Optional notes field
   - Add deficiencies button (if rating ≤ 3)
3. Deficiency entry:
   - Select category from dropdown
   - Enter description
   - Estimate cost
   - Set priority (1-4)
   - Upload photos (optional)
4. Progress indicator showing completion
5. Complete assessment button (validates all elements rated)

**Phase 3: Completion**
1. Calculate total deficiency costs
2. Retrieve building replacement value
3. Calculate FCI score
4. Determine overall condition
5. Update assessment status to 'completed'
6. Generate PDF report
7. Send notification email

### 9. UNIFORMAT II ELEMENTS TO SEED

Include these 50 standard building elements:

**A - Substructure**
- A1010: Standard Foundations
- A1020: Special Foundations
- A2010: Basement Excavation
- A2020: Basement Walls

**B - Shell**
- B1010: Floor Construction
- B1020: Roof Construction
- B2010: Exterior Walls
- B2020: Exterior Windows
- B2030: Exterior Doors
- B3010: Roof Coverings

**C - Interiors**
- C1010: Partitions
- C1020: Interior Doors
- C1030: Fittings
- C2010: Stair Construction
- C3010: Wall Finishes
- C3020: Floor Finishes
- C3030: Ceiling Finishes

**D - Services**
- D1010: Elevators & Lifts
- D2010: Plumbing Fixtures
- D2020: Domestic Water Distribution
- D2030: Sanitary Drainage
- D3010: Energy Supply
- D3020: Heat Generating Systems
- D3030: Cooling Generating Systems
- D3040: Distribution Systems
- D3050: Terminal & Package Units
- D4010: Sprinklers
- D4020: Standpipes
- D5010: Electrical Service & Distribution
- D5020: Lighting & Branch Wiring
- D5030: Communications & Security

**E - Equipment & Furnishings**
- E1010: Commercial Equipment
- E1020: Institutional Equipment
- E2010: Fixed Furnishings

**F - Special Construction**
- F1010: Special Structures
- F2010: Building Elements Demolition

**G - Building Sitework**
- G1010: Site Clearing
- G2010: Roadways
- G2020: Parking Lots
- G2030: Pedestrian Paving
- G2050: Landscaping
- G3010: Water Supply
- G3020: Sanitary Sewer
- G3030: Storm Sewer
- G4010: Electrical Distribution
- G4020: Site Lighting

### 10. STYLING & UI REQUIREMENTS

**Design System:**
- Use Tailwind CSS utility classes
- Implement light/dark mode toggle
- Consistent spacing: 4px base unit
- Color palette:
  ```css
  Primary: blue-600 (#2563eb)
  Secondary: gray-600 (#4b5563)
  Success: green-600 (#16a34a)
  Warning: yellow-600 (#ca8a04)
  Danger: red-600 (#dc2626)
  ```

**Responsive Design:**
- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Collapsible sidebar on mobile
- Stack cards vertically on small screens
- Touch-friendly tap targets (44px minimum)

**Component Patterns:**
- Cards for content grouping
- Tables with sorting and filtering
- Modal dialogs for forms
- Toast notifications for feedback
- Loading skeletons during data fetch
- Empty states with CTAs

### 11. ERROR HANDLING & VALIDATION

**Frontend Validation:**
- Zod schemas for all forms
- Real-time field validation
- Clear error messages
- Disable submit until valid

**Backend Validation:**
- Express-validator middleware
- Sanitize all inputs
- Validate UUID formats
- Check required fields
- Verify relationships exist

**Error Responses:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Global Error Handling:**
- Try-catch blocks in async functions
- Database transaction rollbacks
- Centralized error middleware
- User-friendly error messages
- Log errors for debugging

### 12. SECURITY REQUIREMENTS

**Authentication Security:**
- Hash passwords with bcrypt (10 salt rounds)
- JWT tokens with strong secret keys
- Token expiration and refresh logic
- Logout invalidates tokens

**API Security:**
- CORS configuration for allowed origins
- Rate limiting (100 requests/15 minutes)
- Helmet.js security headers
- Input sanitization
- SQL injection prevention (parameterized queries)

**Data Security:**
- HTTPS only in production
- Environment variables for secrets
- No sensitive data in logs
- Audit trail for critical actions

### 13. PERFORMANCE OPTIMIZATION

**Frontend:**
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Debounced search inputs
- Pagination for large lists
- Memoization with React.memo

**Backend:**
- Database connection pooling
- Indexed database columns
- Efficient SQL queries
- Response compression
- Cache static assets

**Deployment:**
- CDN for static assets
- Gzip compression
- HTTP/2 support
- Database query optimization
- Monitoring and alerts

### 14. TESTING REQUIREMENTS

**Frontend Tests:**
- Component unit tests with Vitest
- Integration tests for workflows
- Form validation tests
- API mock testing

**Backend Tests:**
- Unit tests for services
- API endpoint tests
- Database transaction tests
- Authentication tests

**E2E Tests:**
- Full assessment workflow
- User registration and login
- Report generation
- Data persistence

### 15. DEPLOYMENT INSTRUCTIONS

**Environment Variables:**

Frontend (.env):
```
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Onyx Report
```

Backend (.env):
```
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ALLOWED_ORIGINS=https://yourdomain.com
```

**Build Commands:**

Frontend:
```bash
npm install
npm run build
# Deploy dist/ folder to static hosting
```

Backend:
```bash
cd backend
npm install
npm run build
npm start
```

Database:
```bash
# Run migrations
psql $DATABASE_URL < schema.sql
# Seed elements
curl -X POST https://api/elements/seed
```

### 16. DEFAULT CREDENTIALS

Create default admin user:
```
Email: admin@onyx.com
Password: password123
Role: admin
Organization: Demo Organization
```

### 17. SUCCESS CRITERIA

The application is complete when:

1. ✅ Users can register and login
2. ✅ Buildings can be created, edited, deleted
3. ✅ Assessments follow the two-phase workflow
4. ✅ All 50 Uniformat elements are available
5. ✅ Elements can be rated 1-5 with notes
6. ✅ Deficiencies can be added with costs
7. ✅ FCI calculates correctly
8. ✅ PDF reports generate with all data
9. ✅ Dashboard shows real-time statistics
10. ✅ Multi-tenant data isolation works
11. ✅ Role-based permissions enforced
12. ✅ Mobile responsive design
13. ✅ Production deployment successful
14. ✅ No critical security vulnerabilities
15. ✅ Page load times under 3 seconds

### 18. SAMPLE API CALLS

**Login:**
```bash
curl -X POST https://api.onyx.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@onyx.com","password":"password123"}'
```

**Create Building:**
```bash
curl -X POST https://api.onyx.com/buildings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Office",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "building_type": "office",
    "square_footage": 50000,
    "year_built": 1995
  }'
```

**Complete Assessment:**
```bash
curl -X POST https://api.onyx.com/assessments/ASSESSMENT_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 19. COMMON ISSUES & SOLUTIONS

**Issue: CORS errors**
Solution: Configure backend CORS with frontend URL

**Issue: Assessment completion fails**
Solution: Ensure all elements have ratings

**Issue: FCI calculation incorrect**
Solution: Verify building has replacement value

**Issue: PDF generation fails**
Solution: Check write permissions on uploads folder

**Issue: Login tokens expire**
Solution: Implement token refresh logic

### 20. FINAL NOTES

- Start with authentication system first
- Build database schema before APIs
- Test each API endpoint with Postman
- Implement frontend after backend is stable
- Add features incrementally
- Deploy early and often
- Monitor error logs
- Gather user feedback
- Iterate based on usage

---

## USING THIS PROMPT

To recreate Onyx Report, provide this entire prompt to an AI coding assistant or development team. The system should be built in this order:

1. Database setup and schema
2. Backend API with authentication
3. Frontend structure and routing
4. Authentication flow
5. Building management
6. Assessment workflow
7. FCI calculation
8. Report generation
9. Dashboard and analytics
10. Testing and deployment

Expected timeline: 400-500 hours for complete MVP implementation.

---

END OF PROMPT