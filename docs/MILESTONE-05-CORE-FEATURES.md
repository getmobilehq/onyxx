# Milestone 5: Core Functional Features

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
**Part of:** The Onyx Bible - Complete Platform Documentation

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Authentication & Registration](#user-authentication--registration)
3. [Building Management](#building-management)
4. [Assessment System](#assessment-system)
5. [FCI Calculation Engine](#fci-calculation-engine)
6. [Report Generation](#report-generation)
7. [Dashboard & Statistics](#dashboard--statistics)
8. [User & Team Management](#user--team-management)
9. [Organization Management](#organization-management)

---

## Feature Overview

### Core Features Status (100% Complete)

✅ **User Authentication** - JWT-based auth with refresh tokens
✅ **Simplified Registration** - No tokens required for MVP
✅ **Building Management** - Full CRUD with image upload
✅ **Two-Phase Assessment** - Pre-assessment + Field assessment
✅ **Element Selection** - 64 Uniformat II elements
✅ **Condition Rating** - 5-point scale with photos
✅ **Deficiency Tracking** - 6 categories with cost estimates
✅ **FCI Calculation** - Automated index calculation
✅ **PDF Reports** - Professional report generation
✅ **Dashboard** - Real-time statistics
✅ **Team Management** - User roles and permissions
✅ **Organization Management** - Multi-tenant support

---

## User Authentication & Registration

### Registration System

**Feature:** Simplified user signup without token requirement (MVP update)

**User Flow:**
```
1. User visits /register
2. Enters: name, email, password, organization name
3. System validates input
4. Creates new organization automatically
5. Creates user account (admin role)
6. Returns JWT tokens
7. Redirects to dashboard
```

**Implementation:** `src/pages/auth/register.tsx`

**Form Fields:**
- **Name**: User's full name (min 2 characters)
- **Email**: Valid email address (unique)
- **Password**: Minimum 6 characters
- **Organization Name**: New organization to create
- **Role**: Pre-selected as 'admin' for first user

**Validation:**
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization name required'),
  role: z.enum(['admin', 'manager', 'assessor'])
});
```

**Backend Logic:** `backend/src/controllers/auth.controller.ts`
```typescript
// 1. Check if email exists
// 2. Hash password with bcrypt (10 rounds)
// 3. Create organization (if organizationName provided)
// 4. Create user with organization_id
// 5. Generate JWT tokens (access + refresh)
// 6. Return user + tokens
```

**Security Features:**
- Password hashing with bcrypt
- Email uniqueness validation
- Rate limiting (5 attempts per 15 min)
- Input sanitization

---

### Login System

**Feature:** Email/password authentication with JWT tokens

**User Flow:**
```
1. User visits /login
2. Enters email + password
3. System validates credentials
4. Returns JWT access token (1 hour)
5. Returns refresh token (7 days)
6. Stores tokens in localStorage
7. Sets user context
8. Redirects to dashboard
```

**Implementation:** `src/pages/auth/login.tsx`

**Token Management:**
```typescript
// Store tokens
localStorage.setItem('accessToken', tokens.accessToken);
localStorage.setItem('refreshToken', tokens.refreshToken);

// Add to request headers
headers: {
  'Authorization': `Bearer ${accessToken}`
}

// Auto-refresh on 401
if (error.response.status === 401) {
  // Call refresh endpoint
  // Get new tokens
  // Retry original request
}
```

**JWT Payload:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "name": "John Doe",
  "organization_id": "org-uuid",
  "is_platform_admin": false,
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Security Features:**
- Bcrypt password verification
- JWT token signing with secret
- Short-lived access tokens
- Refresh token rotation
- Rate limiting (5 attempts per 15 min)

---

### Session Management

**Features:**
- Persistent login (refresh tokens)
- Auto-refresh before expiration
- Logout (clear tokens)
- Token validation on protected routes

**Protected Route Example:**
```typescript
// App.tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/buildings" element={<Buildings />} />
  {/* Other protected routes */}
</Route>

// ProtectedRoute component
if (!accessToken) {
  return <Navigate to="/login" />;
}
```

---

## Building Management

### Building CRUD Operations

**Feature:** Complete building lifecycle management

**Building Data Model:**
```typescript
interface Building {
  id: string;
  organization_id: string;
  name: string;
  type: string;  // Office, School, Hospital, etc.
  year_built: number;
  square_footage: number;
  replacement_value: number;  // Auto-calculated
  cost_per_sqft: number;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}
```

---

### Create Building

**Page:** `src/pages/buildings/new-building.tsx`

**Form Fields:**
- **Name** (required, min 2 chars)
- **Type** (required, dropdown: Office, School, Hospital, Retail, Industrial, etc.)
- **Year Built** (1800 - current year + 5)
- **Square Footage** (positive integer)
- **Cost per SqFt** (optional, fetched from reference table or manual)
- **Address** (street, city, state, zip)
- **Description** (optional)
- **Photo** (optional, image upload)

**Calculation:**
```typescript
// Auto-calculate replacement value
replacement_value = square_footage × cost_per_sqft
```

**Workflow:**
```
1. User clicks "New Building"
2. Fills out form
3. Optionally uploads photo (Cloudinary)
4. System validates input
5. Calculates replacement_value
6. Saves to database
7. Redirects to building list
```

**Backend:** `POST /api/buildings`
```typescript
// 1. Validate input (express-validator)
// 2. Check organization_id from JWT
// 3. Upload image to Cloudinary (if provided)
// 4. Calculate replacement_value
// 5. Insert into buildings table
// 6. Return created building
```

---

### View Buildings

**Page:** `src/pages/buildings/index.tsx`

**Features:**
- **List View**: Card grid layout
- **Search**: Filter by name
- **Filter**: By building type
- **Sort**: By name, year, FCI
- **Statistics**: Total buildings, avg FCI

**Building Card Display:**
- Building photo (or placeholder)
- Name, type, year
- Square footage
- Latest FCI (color-coded)
- Assessment count
- Actions (View, Edit, Delete)

**Implementation:**
```typescript
// Fetch buildings
const { data } = await api.get('/api/buildings');

// Display in grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {buildings.map(building => (
    <BuildingCard key={building.id} building={building} />
  ))}
</div>
```

---

### View Building Details

**Page:** `src/pages/buildings/building-details.tsx`

**Sections:**
1. **Building Information**
   - Photo, name, type, year
   - Address
   - Square footage, replacement value
   - Cost per sqft

2. **Assessment History**
   - List of all assessments
   - Status, date, FCI
   - Link to assessment details

3. **Latest FCI Trend**
   - Chart showing FCI over time
   - Condition category

4. **Actions**
   - New Assessment
   - Edit Building
   - Delete Building

**Backend:** `GET /api/buildings/:id`
- Returns building + related assessments
- Includes latest FCI data

---

### Edit Building

**Page:** `src/pages/buildings/edit-building.tsx`

**Features:**
- Pre-populated form with current values
- Same validation as create
- Update image option
- Recalculate replacement_value on save

**Backend:** `PUT /api/buildings/:id`

---

### Delete Building

**Features:**
- Confirmation dialog
- Cascade delete assessments
- Admin-only permission

**Backend:** `DELETE /api/buildings/:id`
- Requires admin role
- Deletes building + related data

---

### Image Upload

**Feature:** Cloudinary integration for building photos

**Implementation:** `src/services/upload.ts`
```typescript
const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/api/buildings/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.data.url;  // Cloudinary URL
};
```

**Backend:** `POST /api/buildings/upload-image`
- Multer middleware for file handling
- Upload to Cloudinary
- Return CDN URL
- Max size: 10MB
- Formats: JPEG, PNG

---

## Assessment System

### Two-Phase Workflow

**Phase 1: Pre-Assessment** (Planning)
- Building selection
- Element selection (from 64 Uniformat II elements)
- Checklist completion
- Assessment scope definition

**Phase 2: Field Assessment** (Inspection)
- Element-by-element condition rating
- Photo documentation
- Deficiency tracking
- Cost estimation
- Completion and FCI calculation

---

### Assessment Creation

**Page:** `src/pages/assessments/new.tsx`

**Workflow:**
```
1. User clicks "New Assessment"
2. Selects building
3. Enters assessment type
4. Assigns to user (optional)
5. Creates assessment record (status: pending)
6. Redirects to pre-assessment
```

**Backend:** `POST /api/assessments`
```typescript
{
  building_id: "uuid",
  assessment_type: "comprehensive",
  assigned_to_user_id: "uuid",
  status: "pending"
}
```

---

### Pre-Assessment Phase

**Page:** `src/pages/assessments/pre-assessment.tsx`

**Step 1: Assessment Information**
- Assessment type (Annual, Condition, Compliance, etc.)
- Assessment date
- Assessment scope
- Building details review

**Step 2: Element Selection**
- Display 64 Uniformat II elements
- Grouped by category (A-G)
- Multi-select checkboxes
- Search and filter

**Element Categories:**
- **A - Substructure**: Foundations, basements
- **B - Shell**: Exterior walls, roofing
- **C - Interiors**: Partitions, stairs, finishes
- **D - Services**: HVAC, plumbing, electrical
- **E - Equipment**: Furnishings, equipment
- **F - Special Construction**: Special facilities
- **G - Sitework**: Site improvements

**Step 3: Pre-Assessment Checklist**
```typescript
const checklist = {
  safety_equipment: boolean,
  building_access: boolean,
  documentation: boolean,
  weather_conditions: boolean,
  stakeholder_notification: boolean
};
```

**Step 4: Review & Submit**
- Summary of selections
- Confirm and proceed to field assessment

**Backend:** `POST /api/pre-assessments`
```typescript
{
  assessment_id: "uuid",
  building_id: "uuid",
  assessment_type: "Annual",
  assessment_date: "2025-06-15",
  assessment_scope: "comprehensive",
  building_size: 50000,
  selected_elements: ["element-uuid-1", "element-uuid-2"],
  checklist: { /* checklist object */ },
  status: "completed"
}
```

**Implementation:** `src/components/uniformat-selector/`

---

### Field Assessment Phase

**Page:** `src/pages/assessments/field-assessment.tsx`

**Layout:**
- Left sidebar: Element list (selected elements)
- Main panel: Current element details
- Progress indicator

**For Each Element:**

**1. Element Information**
- Code (e.g., B2010)
- Name (e.g., Exterior Walls)
- Category
- Typical lifespan

**2. Condition Rating (1-5 scale)**
- **5 - Excellent**: New or like-new
- **4 - Good**: Minor wear, fully functional
- **3 - Fair**: Moderate wear, minor issues
- **2 - Poor**: Major wear, limited functionality
- **1 - Critical**: Failure imminent/occurred

**Visual Selector:**
```tsx
<ConditionRatingSelector
  value={rating}
  onChange={setRating}
  labels={['Critical', 'Poor', 'Fair', 'Good', 'Excellent']}
/>
```

**3. Cost Estimation**
- **Repair Cost**: Cost to fix current issues
- **Replacement Cost**: Cost to fully replace
- **Priority**: Low/Medium/High/Critical

**4. Photo Upload**
- Multiple photos per element
- Upload to Cloudinary
- Store URLs in database array
- Preview thumbnails

**5. Deficiency Tracking**
- Add deficiency button
- Deficiency form:
  - **Category**: Life Safety, Critical Systems, Energy Efficiency, Asset Life Cycle, User Experience, Equity & Accessibility
  - **Description**: Detailed description
  - **Severity**: Low/Medium/High/Critical
  - **Location**: Specific location
  - **Estimated Cost**: Repair cost
  - **Recommended Action**: Corrective measures
  - **Photos**: Supporting photos

**6. Notes**
- Free-text notes for element

**Navigation:**
- Previous/Next element buttons
- Progress: "Element 5 of 12"
- Save & Continue
- Save & Exit

**Auto-save:**
- Debounced auto-save every 30 seconds
- Manual save button
- Optimistic UI updates

**Backend:** `POST /api/assessments/:id/elements`
```typescript
{
  elements: [
    {
      element_id: "uuid",
      condition_rating: 4,
      quantity: 5000,
      unit_of_measure: "sq ft",
      estimated_remaining_life: 15,
      replacement_cost: 500000.00,
      repair_cost: 25000.00,
      priority: "medium",
      notes: "Minor cracks in northwest corner",
      photos: ["url1", "url2"]
    }
  ]
}
```

**Deficiency Backend:** `POST /api/assessment-deficiencies`
```typescript
{
  assessment_element_id: "uuid",
  category: "Life Safety & Code Compliance",
  description: "Fire door not closing properly",
  severity: "high",
  location: "Third floor stairwell",
  estimated_cost: 2500.00,
  recommended_action: "Replace door closer mechanism",
  photos: ["url1"]
}
```

---

### Assessment Completion

**Feature:** Mark assessment as complete and trigger FCI calculation

**Workflow:**
```
1. User completes all elements
2. Clicks "Complete Assessment"
3. System validates all elements rated
4. Calculates FCI automatically
5. Updates assessment status to "completed"
6. Sets completed_at timestamp
7. Redirects to assessment details
```

**Backend:** `POST /api/assessments/:id/complete`
```typescript
// 1. Fetch all assessment_elements
// 2. Sum all repair costs
// 3. Get building replacement_value
// 4. Calculate FCI = total_repair_cost / replacement_value
// 5. Update assessment with FCI, total_repair_cost, status
// 6. Return updated assessment
```

---

### Assessment Details View

**Page:** `src/pages/assessments/assessment-details.tsx`

**Sections:**

**1. Assessment Summary**
- Building name and photo
- Assessment date, type, status
- Assigned assessor
- FCI score (large, color-coded)
- Condition category

**2. Financial Summary**
- Total repair cost
- Replacement value
- FCI calculation breakdown

**3. Elements Assessed**
- Table of all elements
- Columns: Element, Condition Rating, Repair Cost, Priority
- Sort by various columns
- Color-coded condition ratings

**4. Deficiencies Summary**
- Grouped by category
- Count by severity
- Total estimated cost

**5. Photos Gallery**
- All photos from assessment
- Grid layout with lightbox

**6. Actions**
- Generate PDF Report
- Edit Assessment
- Delete Assessment

---

## FCI Calculation Engine

### FCI Formula

```
FCI = Total Repair Cost / Replacement Value

Where:
- Total Repair Cost = Sum of all repair costs for assessed elements
- Replacement Value = Building square footage × Cost per sqft
```

### Implementation

**Location:** `backend/src/services/fci.service.ts`

```typescript
export const calculateFCI = (
  totalRepairCost: number,
  replacementValue: number
): number => {
  if (replacementValue === 0) return 0;

  const fci = totalRepairCost / replacementValue;

  // Round to 4 decimal places
  return Math.round(fci * 10000) / 10000;
};

export const getFCICategory = (fci: number): string => {
  if (fci >= 0 && fci < 0.1) return 'Excellent';
  if (fci >= 0.1 && fci < 0.4) return 'Good';
  if (fci >= 0.4 && fci < 0.7) return 'Fair';
  return 'Critical';
};

export const getFCIColor = (fci: number): string => {
  if (fci < 0.1) return 'green';
  if (fci < 0.4) return 'blue';
  if (fci < 0.7) return 'yellow';
  return 'red';
};
```

### FCI Interpretation

**Industry Standard Ranges:**

| FCI Range | Category | Description | Action Required |
|-----------|----------|-------------|-----------------|
| 0.00 - 0.10 | Excellent | New or like-new building | Routine maintenance |
| 0.10 - 0.40 | Good | Light investment needed | Preventive maintenance |
| 0.40 - 0.70 | Fair | Renovation required | Capital planning needed |
| 0.70+ | Critical | Consider demolition | Major intervention |

### Real-Time Calculation

**During Assessment:**
- FCI updates as elements are rated
- Live preview in UI
- Final calculation on completion

**Stored in Database:**
```sql
UPDATE assessments
SET
  fci = calculated_fci,
  total_repair_cost = sum_of_repairs,
  replacement_value = building_replacement_value,
  status = 'completed',
  completed_at = NOW()
WHERE id = assessment_id;
```

---

## Report Generation

### PDF Report Features

**Report Contents:**
1. **Cover Page**
   - Building photo
   - Building name and address
   - Assessment date
   - FCI score (large)
   - Assessor name

2. **Executive Summary**
   - Building overview
   - Assessment scope
   - Key findings
   - FCI interpretation

3. **Financial Summary**
   - Total repair cost
   - Replacement value
   - FCI calculation
   - Cost breakdown by category

4. **Element Assessment Table**
   - All assessed elements
   - Condition ratings
   - Repair costs
   - Priorities

5. **Deficiencies Report**
   - Grouped by category
   - Severity breakdown
   - Recommended actions
   - Cost estimates

6. **Photos Documentation**
   - Element photos
   - Deficiency photos
   - Captions

7. **Recommendations**
   - Priority repairs
   - Maintenance schedule
   - Long-term planning

### Implementation

**Frontend:** `src/services/report.service.ts` (jsPDF)
```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReport = async (assessment: Assessment) => {
  const doc = new jsPDF();

  // Cover page
  doc.setFontSize(24);
  doc.text('Facility Condition Assessment', 20, 30);
  doc.addImage(buildingImage, 'JPEG', 20, 50, 170, 100);

  // Assessment summary
  doc.addPage();
  doc.setFontSize(18);
  doc.text('Assessment Summary', 20, 20);

  // Elements table
  autoTable(doc, {
    head: [['Element', 'Condition', 'Repair Cost', 'Priority']],
    body: elementsData,
    startY: 40
  });

  // Save
  doc.save(`assessment-${assessment.id}.pdf`);
};
```

**Backend:** `backend/src/services/report.service.ts` (PDFKit)
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generateAssessmentReport = async (
  assessment: Assessment,
  building: Building
): Promise<string> => {
  const doc = new PDFDocument();
  const filePath = `/tmp/report-${assessment.id}.pdf`;
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Cover page
  doc.fontSize(24).text('Facility Condition Assessment', 100, 100);
  doc.image(buildingImagePath, 100, 150, { width: 400 });

  // Content sections
  // ...

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));

  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(filePath);

  return uploadResult.secure_url;
};
```

### Report Generation Endpoint

**Trigger:** `POST /api/assessments/:id/generate-report`

**Process:**
1. Fetch assessment with all data
2. Fetch building details
3. Fetch all elements and deficiencies
4. Generate PDF
5. Upload to Cloudinary
6. Save report record to database
7. Return report URL

---

## Dashboard & Statistics

### Dashboard Overview

**Page:** `src/pages/dashboard/index.tsx`

**Widgets:**

**1. Summary Statistics**
- Total Buildings
- Total Assessments
- Completed This Month
- Average FCI

**2. Recent Assessments**
- Last 5 assessments
- Status, building, date
- Quick links

**3. Buildings by Condition**
- Pie chart
- Excellent/Good/Fair/Critical counts
- Click to filter

**4. FCI Trend**
- Line chart over time
- Organization-wide average

**5. Priority Repairs**
- List of critical deficiencies
- Cost estimates
- Quick actions

**6. Assessment Activity**
- Bar chart by month
- Completed vs in-progress

### Implementation

**Data Fetching:**
```typescript
const fetchDashboardData = async () => {
  const [stats, assessments, buildings] = await Promise.all([
    api.get('/api/analytics/summary'),
    api.get('/api/assessments?limit=5'),
    api.get('/api/buildings?limit=10')
  ]);

  return { stats, assessments, buildings };
};
```

**Charts:** Using Recharts
```tsx
<PieChart width={300} height={300}>
  <Pie
    data={conditionData}
    dataKey="count"
    nameKey="category"
    cx="50%"
    cy="50%"
    outerRadius={80}
  />
</PieChart>
```

---

## User & Team Management

### User Roles & Permissions

| Feature | Admin | Manager | Assessor |
|---------|-------|---------|----------|
| View Dashboard | ✅ | ✅ | ✅ |
| View Buildings | ✅ | ✅ | ✅ |
| Create/Edit Buildings | ✅ | ✅ | ❌ |
| Delete Buildings | ✅ | ❌ | ❌ |
| Create Assessments | ✅ | ✅ | ✅ |
| Conduct Assessments | ✅ | ✅ | ✅ |
| View Reports | ✅ | ✅ | ✅ |
| Manage Team | ✅ | ✅ | ❌ |
| Organization Settings | ✅ | ❌ | ❌ |

### Team Management Page

**Page:** `src/pages/team/index.tsx`

**Features:**
- **User List**: All users in organization
- **Search**: By name or email
- **Filter**: By role
- **Actions**: Edit role, Remove user

**Add User:**
- Invite by email
- Assign role
- Send invitation
- User receives email with signup link

**Edit User:**
- Change name
- Change role (admin only)
- Deactivate account

**Remove User:**
- Confirmation dialog
- Reassign assessments
- Delete user

### Implementation

**Backend Authorization:**
```typescript
// Route protection
router.get('/users',
  authenticate,
  authorize('admin', 'manager'),
  getAllUsers
);

// Check role in controller
if (req.user.role !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Insufficient permissions'
  });
}
```

---

## Organization Management

### Organization Settings

**Page:** `src/pages/organization/index.tsx`

**Sections:**

**1. Organization Details**
- Name
- Subscription tier
- Subscription status
- User count
- Building count

**2. Subscription Information**
- Current plan
- Features included
- Usage statistics
- Billing cycle

**3. Organization Settings**
- Update name
- Contact information
- Logo upload

**4. Danger Zone**
- Delete organization (admin only)
- Export all data

### Multi-Tenant Isolation

**Implementation:**
- Every query includes `organization_id` filter
- Middleware extracts from JWT token
- Row-level security

**Example:**
```typescript
// Middleware adds organization_id
req.user = {
  id: 'user-uuid',
  organization_id: 'org-uuid',
  role: 'admin'
};

// Controller filters by organization
const buildings = await knex('buildings')
  .where({ organization_id: req.user.organization_id })
  .select('*');
```

---

**Next Steps:**
- Proceed to **Milestone 6: Advanced Features**

---

**Document Control:**
- Created: November 3, 2025
- Version: 1.0
- Status: Complete ✅
