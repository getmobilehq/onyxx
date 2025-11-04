# Milestone 6: Advanced Features & Analytics

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
**Part of:** The Onyx Bible - Complete Platform Documentation

---

## Table of Contents

1. [Advanced Features Overview](#advanced-features-overview)
2. [Analytics Dashboard](#analytics-dashboard)
3. [Predictive Maintenance](#predictive-maintenance)
4. [Building Cost Management](#building-cost-management)
5. [Email & Notification System](#email--notification-system)
6. [Two-Factor Authentication](#two-factor-authentication)
7. [Admin Platform Features](#admin-platform-features)
8. [Reporting & Export Capabilities](#reporting--export-capabilities)

---

## Advanced Features Overview

### Features Status

**75% Complete:**
- ✅ **Analytics Dashboard** - Partial (basic visualizations)
- 🚧 **Predictive Maintenance** - Backend ready, UI pending
- ✅ **Building Cost Management** - Complete
- ✅ **Email System** - Infrastructure ready
- ✅ **Two-Factor Authentication** - Complete
- ✅ **Admin Platform** - Complete
- 🚧 **Export Capabilities** - Partial

---

## Analytics Dashboard

### Overview

**Purpose:** Provide data-driven insights for portfolio management and strategic planning

**Page:** `src/pages/analytics/index.tsx`

**Status:** 75% Complete (basic analytics working, advanced visualizations pending)

---

### Analytics Summary

**Endpoint:** `GET /api/analytics/summary`

**Metrics Provided:**
```json
{
  "total_buildings": 45,
  "total_assessments": 120,
  "completed_assessments": 98,
  "in_progress_assessments": 15,
  "pending_assessments": 7,
  "average_fci": 0.32,
  "total_repair_costs": 4500000.00,
  "total_replacement_value": 15000000.00,
  "buildings_by_condition": {
    "Excellent": 5,
    "Good": 28,
    "Fair": 10,
    "Critical": 2
  },
  "assessments_by_month": [
    { "month": "2025-01", "count": 12 },
    { "month": "2025-02", "count": 15 }
  ]
}
```

**Implementation:**
```typescript
// Backend: backend/src/controllers/analytics.controller.ts
export const getAnalyticsSummary = async (req, res) => {
  const { organization_id } = req.user;

  // Fetch buildings count
  const buildingsCount = await knex('buildings')
    .where({ organization_id })
    .count('* as count');

  // Fetch assessments stats
  const assessments = await knex('assessments')
    .where({ organization_id })
    .select('status', 'fci', 'total_repair_cost', 'replacement_value');

  // Calculate averages and summaries
  const avgFCI = assessments.reduce((sum, a) => sum + a.fci, 0) / assessments.length;
  const totalRepairCost = assessments.reduce((sum, a) => sum + a.total_repair_cost, 0);

  // Group by condition category
  const byCondition = groupBuildingsByCondition(assessments);

  return res.json({
    success: true,
    data: { /* summary object */ }
  });
};
```

---

### Building Analytics

**Endpoint:** `GET /api/analytics/buildings`

**Features:**
- Building performance metrics
- FCI trends per building
- Cost analysis per building
- Assessment frequency

**Data Structure:**
```json
{
  "buildings": [
    {
      "id": "uuid",
      "name": "Main Office",
      "type": "Office",
      "year_built": 2010,
      "square_footage": 50000,
      "latest_fci": 0.25,
      "fci_trend": "improving",
      "condition_category": "Good",
      "assessment_count": 8,
      "last_assessment_date": "2025-06-15",
      "total_repair_cost": 150000.00,
      "replacement_value": 600000.00,
      "cost_per_sqft": 3.00,
      "age_years": 15
    }
  ]
}
```

**UI Components:**
- Sortable data table
- Building comparison charts
- FCI distribution histogram
- Quick filters by condition

---

### FCI & Age Correlation

**Endpoint:** `GET /api/analytics/fci-age-correlation`

**Purpose:** Analyze relationship between building age and condition

**Analysis:**
```typescript
// Group buildings by age ranges
const ageGroups = [
  { range: "0-10 years", min: 0, max: 10 },
  { range: "11-20 years", min: 11, max: 20 },
  { range: "21-30 years", min: 21, max: 30 },
  { range: "31-40 years", min: 31, max: 40 },
  { range: "41+ years", min: 41, max: 999 }
];

// Calculate average FCI per age group
const correlation = ageGroups.map(group => ({
  age_group: group.range,
  average_fci: calculateAvgFCI(buildings, group.min, group.max),
  building_count: countBuildings(buildings, group.min, group.max),
  average_repair_cost: calculateAvgRepairCost(buildings, group.min, group.max)
}));
```

**Visualization:**
- Scatter plot: Age vs FCI
- Line chart: Average FCI by age group
- Bar chart: Building count by age group

**Insights:**
- Identify aging patterns
- Plan for lifecycle replacements
- Budget for older buildings

---

### Cost Efficiency Analysis

**Endpoint:** `GET /api/analytics/cost-efficiency`

**Metrics:**
- Cost per square foot (maintenance)
- FCI efficiency score
- Repair cost vs replacement value ratio
- Building type efficiency comparison

**Calculation:**
```typescript
// Efficiency score (0-100)
const efficiencyScore = (building) => {
  const idealFCI = 0.15;  // Target FCI
  const actualFCI = building.latest_fci;

  // Lower FCI = higher score
  const fciScore = Math.max(0, 100 - (actualFCI - idealFCI) * 100);

  // Factor in cost per sqft
  const avgCostPerSqft = 5.00;  // Industry average
  const costScore = Math.max(0, 100 - ((building.cost_per_sqft - avgCostPerSqft) / avgCostPerSqft * 100));

  // Weighted average
  return (fciScore * 0.6 + costScore * 0.4);
};
```

**UI Display:**
- Efficiency rankings table
- Cost comparison charts
- Outlier identification
- Best practices recommendations

---

### Maintenance Cost Trends

**Endpoint:** `GET /api/analytics/cost-trends`

**Query Parameters:**
- `period`: "month", "quarter", "year"
- `startDate`, `endDate`: Date range

**Time Series Data:**
```json
{
  "trends": [
    {
      "period": "2025-Q1",
      "total_cost": 250000.00,
      "assessment_count": 12,
      "average_cost_per_assessment": 20833.33,
      "buildings_assessed": 10
    },
    {
      "period": "2025-Q2",
      "total_cost": 180000.00,
      "assessment_count": 10,
      "average_cost_per_assessment": 18000.00,
      "buildings_assessed": 9
    }
  ],
  "totals": {
    "total_cost": 430000.00,
    "total_assessments": 22,
    "average_quarterly_cost": 215000.00
  }
}
```

**Visualizations:**
- Line chart: Cost trends over time
- Bar chart: Assessment count by period
- Area chart: Cumulative costs
- Forecast projection (future feature)

**Implementation:**
```typescript
// Backend query
const trends = await knex('assessments')
  .select(
    knex.raw("DATE_TRUNC('quarter', assessment_date) as period"),
    knex.raw('SUM(total_repair_cost) as total_cost'),
    knex.raw('COUNT(*) as assessment_count'),
    knex.raw('COUNT(DISTINCT building_id) as buildings_assessed')
  )
  .where({ organization_id })
  .where('status', 'completed')
  .groupBy('period')
  .orderBy('period');
```

---

### Portfolio Dashboard

**UI Components:**

**1. FCI Distribution Chart**
```tsx
<PieChart width={400} height={400}>
  <Pie
    data={conditionData}
    dataKey="count"
    nameKey="category"
    label
  >
    {conditionData.map((entry, index) => (
      <Cell key={index} fill={COLORS[entry.category]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

**2. Cost Trend Line Chart**
```tsx
<LineChart width={600} height={300} data={trendsData}>
  <XAxis dataKey="period" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Line type="monotone" dataKey="total_cost" stroke="#8884d8" />
  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
</LineChart>
```

**3. Building Performance Table**
- Sortable columns
- Filterable by condition
- Export to CSV
- Drill-down to building details

---

## Predictive Maintenance

### Status: Backend Ready, UI Pending

**Purpose:** Predict element failures and optimize maintenance timing

**Backend Implementation:** `backend/src/controllers/predictive-maintenance.controller.ts`

---

### Maintenance Predictions

**Endpoint:** `GET /api/analytics/predictions`

**Algorithm:**
```typescript
export const predictMaintenanceNeeds = (element, assessment) => {
  const {
    typical_lifespan_years,
    condition_rating,
    estimated_remaining_life
  } = element;

  const currentAge = getCurrentAge(element);
  const degradationRate = calculateDegradationRate(condition_rating);

  // Predict failure date
  const yearsRemaining = estimated_remaining_life ||
    (typical_lifespan_years - currentAge);

  const adjustedYears = yearsRemaining / degradationRate;

  const predictedFailureDate = addYears(new Date(), adjustedYears);

  // Confidence based on data quality
  const confidence = calculateConfidence(element);

  return {
    element_id: element.id,
    element_name: element.name,
    predicted_failure_date: predictedFailureDate,
    confidence: confidence,
    urgency: getUrgencyLevel(adjustedYears),
    recommended_action: getRecommendedAction(adjustedYears, condition_rating)
  };
};
```

**Response:**
```json
{
  "predictions": [
    {
      "building_id": "uuid",
      "building_name": "Main Office",
      "element_code": "B3010",
      "element_name": "Roof Coverings",
      "current_condition_rating": 3,
      "predicted_failure_date": "2027-08-15",
      "years_remaining": 2.5,
      "confidence": 0.85,
      "urgency": "medium",
      "recommended_action": "Plan replacement in 24 months",
      "estimated_cost": 125000.00
    }
  ]
}
```

---

### Failure Risk Analysis

**Endpoint:** `GET /api/analytics/risk-analysis`

**Risk Scoring:**
```typescript
const calculateRiskScore = (element) => {
  const weights = {
    condition: 0.40,      // Current condition (40%)
    age: 0.25,            // Age vs lifespan (25%)
    criticality: 0.20,    // System criticality (20%)
    cost: 0.15            // Replacement cost (15%)
  };

  const conditionScore = (6 - element.condition_rating) / 5 * 100;
  const ageScore = (element.current_age / element.typical_lifespan) * 100;
  const criticalityScore = getCriticalityScore(element.category);
  const costScore = (element.replacement_cost / maxCost) * 100;

  const riskScore =
    conditionScore * weights.condition +
    ageScore * weights.age +
    criticalityScore * weights.criticality +
    costScore * weights.cost;

  return {
    score: Math.round(riskScore),
    level: getRiskLevel(riskScore),  // Low/Medium/High/Critical
    factors: {
      condition: conditionScore,
      age: ageScore,
      criticality: criticalityScore,
      cost: costScore
    }
  };
};
```

**Risk Levels:**
- **0-25:** Low - Routine monitoring
- **26-50:** Medium - Increased inspections
- **51-75:** High - Plan intervention
- **76-100:** Critical - Immediate action required

---

### Optimization Suggestions

**Endpoint:** `GET /api/analytics/optimization`

**Strategies:**

**1. Budget Optimization**
- Group repairs by building
- Prioritize by risk score
- Bundle similar work for efficiency
- Identify economies of scale

**2. Timing Optimization**
- Avoid rush jobs (higher cost)
- Plan during off-season
- Coordinate with operations
- Minimize disruption

**3. Lifecycle Optimization**
- Replace vs repair analysis
- Expected ROI calculations
- Total cost of ownership
- Long-term planning

**Response:**
```json
{
  "optimizations": [
    {
      "strategy": "Bundle roof work across 3 buildings",
      "buildings": ["Building A", "Building B", "Building C"],
      "total_cost": 375000.00,
      "potential_savings": 75000.00,
      "savings_percentage": 16.7,
      "recommended_timeline": "Q3 2026",
      "rationale": "Coordinate roofing contractor for volume discount"
    }
  ]
}
```

---

### Predictive Dashboard (UI - Pending)

**Planned Components:**

**1. Risk Heatmap**
- Buildings as grid
- Color-coded by risk level
- Interactive drill-down

**2. Maintenance Timeline**
- Gantt chart of predicted failures
- Prioritized action items
- Budget impact visualization

**3. Cost Projections**
- 5-year maintenance forecast
- Budget planning tool
- Scenario modeling

**4. Alerts & Notifications**
- Upcoming failures (90 days)
- Budget threshold warnings
- Recommended actions

---

## Building Cost Management

### Status: 100% Complete

**Purpose:** Dynamic replacement value calculation based on building type

**Admin Page:** `src/pages/admin/building-costs.tsx`

---

### Reference Cost Table

**Database Table:** `reference_building_costs`

**Structure:**
```sql
CREATE TABLE reference_building_costs (
  id UUID PRIMARY KEY,
  building_type VARCHAR(100) UNIQUE NOT NULL,
  cost_per_sqft DECIMAL(10,2) NOT NULL,
  region VARCHAR(100),
  last_updated TIMESTAMP DEFAULT NOW(),
  source TEXT,
  notes TEXT
);
```

**Sample Data:**
```sql
INSERT INTO reference_building_costs (building_type, cost_per_sqft, region, source)
VALUES
  ('Office', 250.00, 'National Average', 'RS Means 2025'),
  ('School', 350.00, 'National Average', 'RS Means 2025'),
  ('Hospital', 600.00, 'National Average', 'RS Means 2025'),
  ('Retail', 200.00, 'National Average', 'RS Means 2025'),
  ('Industrial', 150.00, 'National Average', 'RS Means 2025'),
  ('Hotel', 400.00, 'National Average', 'RS Means 2025'),
  ('Residential', 180.00, 'National Average', 'RS Means 2025'),
  ('Municipal', 300.00, 'National Average', 'RS Means 2025');
```

---

### Admin Interface

**Features:**

**1. Cost Management Table**
- List all building types
- Current cost per sqft
- Last updated date
- Data source
- Edit/Update actions

**2. Add New Building Type**
- Type name
- Cost per sqft
- Region (optional)
- Source (optional)
- Notes

**3. Update Costs**
- Bulk update all types
- Individual type updates
- Track change history
- Audit trail

**4. Regional Variations**
- Support for regional pricing
- Multiplier factors
- Location-based adjustments

---

### Replacement Value Calculation

**Implementation:**
```typescript
// When creating/updating building
const calculateReplacementValue = async (building) => {
  // Fetch cost per sqft for building type
  const costRef = await knex('reference_building_costs')
    .where({ building_type: building.type })
    .first();

  if (!costRef) {
    throw new Error(`No cost reference found for type: ${building.type}`);
  }

  // Calculate replacement value
  const replacementValue = building.square_footage * costRef.cost_per_sqft;

  return {
    replacement_value: replacementValue,
    cost_per_sqft: costRef.cost_per_sqft
  };
};

// Update building record
await knex('buildings')
  .where({ id: building.id })
  .update({
    replacement_value: replacementValue,
    cost_per_sqft: costRef.cost_per_sqft,
    updated_at: knex.fn.now()
  });
```

**Automatic Updates:**
- When cost reference is updated
- Recalculate all buildings of that type
- Update replacement values
- Recalculate FCIs for recent assessments

---

### API Endpoints

**GET /api/admin/building-costs**
- List all building type costs
- Admin only

**POST /api/admin/building-costs**
- Add new building type cost
- Admin only

**PUT /api/admin/building-costs/:id**
- Update cost for building type
- Admin only

**DELETE /api/admin/building-costs/:id**
- Remove building type cost
- Admin only

---

## Email & Notification System

### Status: Infrastructure Complete, UI Partial

**Email Service:** Mailgun
**Implementation:** `backend/src/services/email.service.ts`

---

### Email Service Configuration

**Setup:**
```typescript
import Mailgun from 'mailgun.js';
import formData from 'form-data';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || ''
});

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const FROM_EMAIL = `Onyx Assessment Platform <noreply@${MAILGUN_DOMAIN}>`;
```

---

### Email Types

**1. Welcome Email**
```typescript
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Onyx Report';
  const html = `
    <h1>Welcome ${user.name}!</h1>
    <p>Your account has been created successfully.</p>
    <p>Organization: ${user.organization_name}</p>
    <p>Role: ${user.role}</p>
    <a href="${CLIENT_URL}/login">Login to Dashboard</a>
  `;

  await mg.messages.create(MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: user.email,
    subject,
    html
  });
};
```

**2. Assessment Completion Notification**
```typescript
export const sendAssessmentCompleteEmail = async (assessment, user) => {
  const subject = `Assessment Completed: ${assessment.building_name}`;
  const html = `
    <h2>Assessment Completed</h2>
    <p>Building: ${assessment.building_name}</p>
    <p>FCI: ${assessment.fci.toFixed(4)}</p>
    <p>Condition: ${assessment.condition_category}</p>
    <p>Total Repair Cost: $${assessment.total_repair_cost.toLocaleString()}</p>
    <a href="${CLIENT_URL}/assessments/${assessment.id}">View Report</a>
  `;

  await mg.messages.create(MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: user.email,
    subject,
    html
  });
};
```

**3. Team Invitation Email**
```typescript
export const sendTeamInvitation = async (invitation) => {
  const inviteLink = `${CLIENT_URL}/register?token=${invitation.token}`;

  const html = `
    <h2>You're Invited to Join ${invitation.organization_name}</h2>
    <p>Click the link below to create your account:</p>
    <a href="${inviteLink}">Accept Invitation</a>
    <p>This link expires in 7 days.</p>
  `;

  await mg.messages.create(MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: invitation.email,
    subject: `Invitation to join ${invitation.organization_name}`,
    html
  });
};
```

---

### Report Subscriptions

**Feature:** Automated email delivery of reports

**Database Table:** `email_subscriptions`

**Subscription Types:**
- **Daily:** Assessment summary
- **Weekly:** Portfolio report
- **Monthly:** Executive dashboard
- **On-Completion:** Immediate report when assessment completes

**Implementation:**
```typescript
// Scheduled job (node-cron)
import cron from 'node-cron';

// Daily reports at 8 AM
cron.schedule('0 8 * * *', async () => {
  const subscriptions = await knex('email_subscriptions')
    .where({ frequency: 'daily', active: true });

  for (const sub of subscriptions) {
    await sendScheduledReport(sub);
  }
});

// Weekly reports on Monday 8 AM
cron.schedule('0 8 * * 1', async () => {
  const subscriptions = await knex('email_subscriptions')
    .where({ frequency: 'weekly', active: true });

  for (const sub of subscriptions) {
    await sendScheduledReport(sub);
  }
});
```

**Report Email:**
```typescript
export const sendScheduledReport = async (subscription) => {
  // Generate report data
  const reportData = await generateReportData(subscription);

  // Attach PDF if configured
  let attachments = [];
  if (subscription.include_pdf) {
    const pdfBuffer = await generatePDFBuffer(reportData);
    attachments.push({
      filename: 'report.pdf',
      data: pdfBuffer
    });
  }

  await mg.messages.create(MAILGUN_DOMAIN, {
    from: FROM_EMAIL,
    to: subscription.user_email,
    subject: `${subscription.frequency} Report - ${new Date().toLocaleDateString()}`,
    html: formatReportEmail(reportData),
    attachment: attachments
  });

  // Update last_sent_at
  await knex('email_subscriptions')
    .where({ id: subscription.id })
    .update({ last_sent_at: knex.fn.now() });
};
```

---

### Notification Preferences

**User Settings Page:** `src/pages/settings/index.tsx`

**Options:**
- Email on assessment completion
- Weekly summary reports
- Critical deficiency alerts
- Team activity notifications
- System announcements

---

## Two-Factor Authentication

### Status: 100% Complete

**Implementation:** TOTP (Time-based One-Time Password)
**Library:** Speakeasy
**Backend:** `backend/src/services/two-factor-auth.service.ts`

---

### Setup Flow

**1. Enable 2FA**
```typescript
// Generate secret
export const generate2FASecret = (userEmail: string) => {
  const secret = speakeasy.generateSecret({
    name: `Onyx Report (${userEmail})`,
    length: 32
  });

  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url  // QR code for authenticator app
  };
};

// Store secret in database
await knex('users')
  .where({ id: userId })
  .update({
    two_factor_secret: secret,
    two_factor_enabled: false  // Not enabled until verified
  });
```

**2. User Scans QR Code**
- Display QR code using `qrcode` library
- User scans with Google Authenticator / Authy
- Generates 6-digit codes

**3. Verify & Enable**
```typescript
export const verify2FAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2  // Allow 2 time steps before/after
  });
};

// If verified, enable 2FA
if (isValid) {
  await knex('users')
    .where({ id: userId })
    .update({ two_factor_enabled: true });
}
```

---

### Login with 2FA

**Flow:**
```
1. User enters email + password
2. System validates credentials
3. If 2FA enabled, prompt for code
4. User enters 6-digit code from app
5. System verifies token
6. If valid, issue JWT tokens
7. If invalid, show error
```

**Implementation:**
```typescript
// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password, twoFactorToken } = req.body;

  // Verify password
  const user = await authenticateUser(email, password);

  // Check if 2FA enabled
  if (user.two_factor_enabled) {
    if (!twoFactorToken) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        message: 'Please enter your 2FA code'
      });
    }

    // Verify 2FA token
    const isValid = verify2FAToken(user.two_factor_secret, twoFactorToken);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code'
      });
    }
  }

  // Issue tokens
  const tokens = generateTokens(user);

  return res.json({
    success: true,
    data: { user, tokens }
  });
});
```

---

### Backup Codes

**Feature:** Recovery codes if authenticator app unavailable

**Implementation:**
```typescript
export const generateBackupCodes = (): string[] => {
  const codes: string[] = [];

  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
};

// Store hashed backup codes
const hashedCodes = backupCodes.map(code => bcrypt.hashSync(code, 10));

await knex('users')
  .where({ id: userId })
  .update({
    backup_codes: JSON.stringify(hashedCodes)
  });
```

**Using Backup Code:**
```typescript
// Check if input is backup code
if (twoFactorToken.length === 8) {  // Backup code format
  const isValidBackupCode = await verifyBackupCode(user, twoFactorToken);

  if (isValidBackupCode) {
    // Remove used backup code
    await removeUsedBackupCode(user.id, twoFactorToken);
    // Proceed with login
  }
}
```

---

### Disable 2FA

**Requirements:**
- Current password
- Current 2FA code (or backup code)

**Implementation:**
```typescript
router.post('/2fa/disable', authenticate, async (req, res) => {
  const { password, twoFactorToken } = req.body;

  // Verify password
  const isValidPassword = await bcrypt.compare(password, req.user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Verify 2FA token
  const isValidToken = verify2FAToken(req.user.two_factor_secret, twoFactorToken);
  if (!isValidToken) {
    return res.status(401).json({ message: 'Invalid 2FA code' });
  }

  // Disable 2FA
  await knex('users')
    .where({ id: req.user.id })
    .update({
      two_factor_enabled: false,
      two_factor_secret: null,
      backup_codes: null
    });

  return res.json({ message: '2FA disabled successfully' });
});
```

---

## Admin Platform Features

### Status: 100% Complete

**Purpose:** Platform administration and organization management

**Access:** Platform admin only (`is_platform_admin: true`)

---

### Admin Dashboard

**Page:** `src/pages/admin/dashboard.tsx`

**Widgets:**
- **Total Organizations:** Count of all organizations
- **Total Users:** Count across all organizations
- **Total Buildings:** Platform-wide
- **Total Assessments:** Platform-wide
- **System Health:** API status, database status
- **Recent Activity:** Latest signups, assessments

---

### Organization Management

**Page:** `src/pages/admin/organization-details.tsx`

**Features:**

**1. Organization List**
- All organizations
- Search by name
- Filter by subscription status
- Sort by various fields

**2. Organization Details**
- Basic information
- User count, building count
- Subscription details
- Usage statistics
- Activity log

**3. Organization Actions**
- Edit organization
- Change subscription tier
- Suspend/Activate
- Delete organization (with confirmation)
- View audit log

**4. User Management**
- List users in organization
- Change user roles
- Reset passwords
- Deactivate accounts

---

### User Management

**Page:** `src/pages/admin/users.tsx`

**Features:**
- View all users across organizations
- Search and filter
- User details and activity
- Password resets
- Account management

---

### Token Management (Legacy)

**Page:** `src/pages/admin/tokens.tsx`

**Purpose:** Manage registration tokens (pre-MVP system)

**Features:**
- Create tokens
- View token usage
- Expire tokens
- Track token history

**Note:** Token system optional in current MVP (direct signup available)

---

### System Settings

**Features:**
- Platform configuration
- Feature flags
- Email templates
- Notification settings
- Maintenance mode

---

## Reporting & Export Capabilities

### Status: 75% Complete

---

### PDF Reports

**Status:** ✅ Complete

**Features:**
- FCI assessment reports
- Building portfolio reports
- Executive summaries
- Custom report generation

**Implementation:** See Milestone 5 - Report Generation

---

### Excel Export

**Status:** 🚧 Planned

**Features:**
- Export building list
- Export assessment data
- Export analytics data
- Custom data selections

**Planned Implementation:**
```typescript
import ExcelJS from 'exceljs';

export const exportBuildingsToExcel = async (buildings) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Buildings');

  // Add headers
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Year Built', key: 'year_built', width: 12 },
    { header: 'Square Footage', key: 'square_footage', width: 15 },
    { header: 'Latest FCI', key: 'latest_fci', width: 12 }
  ];

  // Add rows
  buildings.forEach(building => {
    worksheet.addRow(building);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
```

---

### CSV Export

**Status:** 🚧 Partial

**Features:**
- Simple data exports
- Import templates
- Bulk data operations

---

### API Data Export

**Status:** ✅ Complete

**Features:**
- All data accessible via API
- JSON format
- Pagination support
- Filtering and sorting

---

**Next Steps:**
- Proceed to **Milestone 7: Infrastructure & Operations**

---

**Document Control:**
- Created: November 3, 2025
- Version: 1.0
- Status: Complete ✅
