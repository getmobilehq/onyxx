# Milestone 3: Database Schema & Data Models

**Document Version:** 1.0
**Last Updated:** November 3, 2025
**Status:** ✅ Complete
**Part of:** The Onyx Bible - Complete Platform Documentation

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Core Tables](#core-tables)
4. [Table Definitions](#table-definitions)
5. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [Indexing Strategy](#indexing-strategy)
7. [Data Integrity & Constraints](#data-integrity--constraints)
8. [Migration System](#migration-system)

---

## Database Overview

### Database Technology
**PostgreSQL 16** - Production-grade relational database

### Database Statistics
- **Total Tables:** 15 core tables
- **Multi-Tenant Architecture:** Organization-based isolation
- **Primary Keys:** UUID for all tables
- **Relationships:** 20+ foreign key constraints
- **Indexes:** 30+ indexes for performance

### Connection Details
```typescript
// Production (Render PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

// Connection Pool Configuration
max: 20 connections
idleTimeout: 30 seconds
ssl: enabled (production)
```

---

## Entity Relationship Diagram

```
┌──────────────────┐
│  organizations   │
│  (Tenant Root)   │
└────────┬─────────┘
         │
         │ 1:N
         ├────────────────────────────────────────────────┐
         │                                                │
         ▼                                                ▼
┌─────────────────┐                              ┌──────────────┐
│     users       │                              │  buildings   │
│  (Team Members) │                              │  (Assets)    │
└────────┬────────┘                              └──────┬───────┘
         │                                              │
         │ creates/assigns                              │ assessed by
         │                                              │
         │                                              ▼
         │                                      ┌───────────────┐
         └─────────────────────────────────────►│  assessments  │
                                                │ (Inspections) │
                                                └───────┬───────┘
                                                        │
                                                        │ 1:N
                            ┌───────────────────────────┼────────────┐
                            │                           │            │
                            ▼                           ▼            ▼
                  ┌──────────────────┐      ┌─────────────────┐  ┌──────────┐
                  │assessment_elements│      │pre_assessments │  │ reports  │
                  │  (Element Ratings)│      │  (Pre-phase)   │  │ (PDFs)   │
                  └──────────┬───────┘      └─────────────────┘  └──────────┘
                             │
                             │ 1:N
                             ▼
                  ┌──────────────────────┐
                  │assessment_deficiencies│
                  │   (Issues Found)      │
                  └──────────────────────┘

┌────────────────┐          ┌──────────────────────┐
│   elements     │          │reference_building_costs│
│ (Uniformat II) │          │   (Cost Per SqFt)     │
└────────────────┘          └──────────────────────┘

┌──────────────────┐        ┌──────────────────┐
│email_subscriptions│        │     tokens       │
│  (Report Alerts)  │        │(Registration Keys)│
└──────────────────┘        └──────────────────┘
```

---

## Core Tables

### 1. **organizations**
**Purpose:** Multi-tenant root - each organization is a separate customer

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique organization ID |
| name | VARCHAR(255) | NOT NULL | Organization name |
| subscription_tier | VARCHAR(50) | | Subscription level |
| subscription_status | VARCHAR(50) | | active/inactive/trial |
| max_users | INTEGER | | User limit |
| max_buildings | INTEGER | | Building limit |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Sample Data:**
```sql
INSERT INTO organizations (id, name, subscription_tier, subscription_status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Acme Facilities Management',
  'professional',
  'active'
);
```

---

### 2. **users**
**Purpose:** User accounts with role-based permissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique user ID |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password | VARCHAR(255) | NOT NULL | Bcrypt hash |
| name | VARCHAR(255) | NOT NULL | Full name |
| role | VARCHAR(50) | NOT NULL | admin/manager/assessor |
| organization_id | UUID | FK → organizations | Tenant isolation |
| is_platform_admin | BOOLEAN | DEFAULT false | Super admin flag |
| is_organization_owner | BOOLEAN | DEFAULT false | Org owner flag |
| invited_by | UUID | FK → users | Inviter user |
| signup_token | UUID | FK → tokens | Registration token |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Roles:**
- **admin**: Full access to organization data
- **manager**: Create/edit buildings and assessments
- **assessor**: Conduct assessments, view buildings

**Password Security:**
- Bcrypt hashing with 10 salt rounds
- Minimum 6 characters

---

### 3. **buildings**
**Purpose:** Building assets being assessed

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique building ID |
| organization_id | UUID | FK, NOT NULL | Tenant owner |
| name | VARCHAR(255) | NOT NULL | Building name |
| type | VARCHAR(100) | NOT NULL | Building type (Office, School, etc.) |
| year_built | INTEGER | | Construction year |
| square_footage | INTEGER | | Total area (sq ft) |
| replacement_value | DECIMAL(15,2) | | Current replacement cost |
| cost_per_sqft | DECIMAL(10,2) | | Cost per sq ft for type |
| street_address | TEXT | | Physical address |
| city | VARCHAR(100) | | City |
| state | VARCHAR(50) | | State/Province |
| zip_code | VARCHAR(20) | | Postal code |
| country | VARCHAR(100) | DEFAULT 'USA' | Country |
| description | TEXT | | Additional details |
| image_url | TEXT | | Building photo URL (Cloudinary) |
| created_by_user_id | UUID | FK → users | Creator |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Building Types:**
- Office, School, Hospital, Hotel, Retail, Industrial, Residential, Municipal, etc.

**Replacement Value:**
- Automatically calculated as: `square_footage × cost_per_sqft`
- Used in FCI calculations

---

### 4. **elements**
**Purpose:** Uniformat II building element classification (64 standard elements)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique element ID |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Uniformat code (e.g., B2010) |
| name | VARCHAR(255) | NOT NULL | Element name |
| category | VARCHAR(100) | NOT NULL | Major category |
| description | TEXT | | Detailed description |
| typical_lifespan_years | INTEGER | | Expected lifespan |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Uniformat II Categories:**
- **A - Substructure**: Foundations, basement construction
- **B - Shell**: Superstructure, exterior closure, roofing
- **C - Interiors**: Interior construction, stairs, finishes
- **D - Services**: Conveying, plumbing, HVAC, fire protection, electrical
- **E - Equipment & Furnishings**: Equipment, furnishings, special construction
- **F - Special Construction**: Special facilities
- **G - Building Sitework**: Site preparation, improvements, utilities

**Example Elements:**
```
B2010 - Exterior Walls
B3010 - Roof Coverings
C3020 - Floor Finishes
D3030 - Cooling Generating Systems
D5020 - Lighting and Branch Wiring
```

---

### 5. **assessments**
**Purpose:** Assessment records tracking building condition evaluations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique assessment ID |
| organization_id | UUID | FK, NOT NULL | Tenant owner |
| building_id | UUID | FK, NOT NULL | Building assessed |
| assessment_type | VARCHAR(50) | NOT NULL | comprehensive/targeted |
| status | VARCHAR(50) | NOT NULL | pending/in_progress/completed |
| fci | DECIMAL(5,4) | | Facility Condition Index (0-1) |
| total_repair_cost | DECIMAL(15,2) | | Sum of all deficiency costs |
| replacement_value | DECIMAL(15,2) | | Building replacement value |
| assessment_date | TIMESTAMP | | Date conducted |
| created_by_user_id | UUID | FK → users | Creator |
| assigned_to_user_id | UUID | FK → users | Assigned assessor |
| notes | TEXT | | General notes |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |
| completed_at | TIMESTAMP | | Completion timestamp |

**Status Workflow:**
```
pending → in_progress → completed
```

**FCI Calculation:**
```
FCI = Total Repair Cost / Replacement Value
```

**FCI Interpretation:**
- 0.00 - 0.10: Excellent (new building)
- 0.10 - 0.40: Good (light investment needed)
- 0.40 - 0.70: Fair (renovation needed)
- 0.70+: Critical (consider demolition)

---

### 6. **assessment_elements**
**Purpose:** Elements included in an assessment with their condition ratings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique record ID |
| assessment_id | UUID | FK, NOT NULL | Parent assessment |
| element_id | UUID | FK, NOT NULL | Uniformat element |
| condition_rating | INTEGER | CHECK (1-5) | Condition score |
| quantity | DECIMAL(10,2) | | Amount assessed |
| unit_of_measure | VARCHAR(50) | | sq ft, linear ft, each, etc. |
| estimated_remaining_life | INTEGER | | Years remaining |
| replacement_cost | DECIMAL(15,2) | | Cost to replace |
| repair_cost | DECIMAL(15,2) | | Cost to repair |
| priority | VARCHAR(50) | | low/medium/high/critical |
| notes | TEXT | | Element-specific notes |
| photos | TEXT[] | | Photo URLs (array) |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Condition Rating Scale:**
- **5 - Excellent**: New or like-new condition
- **4 - Good**: Minor wear, fully functional
- **3 - Fair**: Moderate wear, functional with minor issues
- **2 - Poor**: Major wear, limited functionality
- **1 - Critical**: Failure imminent or occurred

---

### 7. **assessment_deficiencies**
**Purpose:** Specific deficiencies found during field assessment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique deficiency ID |
| assessment_element_id | UUID | FK, NOT NULL | Related element |
| category | VARCHAR(100) | NOT NULL | Deficiency category |
| description | TEXT | NOT NULL | Issue description |
| severity | VARCHAR(50) | NOT NULL | low/medium/high/critical |
| location | TEXT | | Specific location |
| estimated_cost | DECIMAL(15,2) | | Repair cost estimate |
| recommended_action | TEXT | | Corrective action |
| photos | TEXT[] | | Photo evidence |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Deficiency Categories:**
1. **Life Safety & Code Compliance**: Fire, structural, accessibility
2. **Critical Systems**: HVAC, electrical, plumbing failures
3. **Energy Efficiency**: Insulation, windows, HVAC inefficiencies
4. **Asset Life Cycle**: Normal wear and aging
5. **User Experience**: Aesthetics, comfort, functionality
6. **Equity & Accessibility**: ADA compliance, inclusive design

---

### 8. **pre_assessments**
**Purpose:** Pre-assessment phase data (building selection, element selection)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique pre-assessment ID |
| assessment_id | UUID | FK, UNIQUE | One-to-one with assessment |
| building_id | UUID | FK, NOT NULL | Building selected |
| selected_elements | UUID[] | | Array of element IDs |
| checklist_completed | BOOLEAN | DEFAULT false | Checklist status |
| notes | TEXT | | Pre-assessment notes |
| created_by_user_id | UUID | FK → users | Creator |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### 9. **field_assessments**
**Purpose:** Field assessment phase data (on-site inspection)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique field assessment ID |
| building_id | UUID | FK, NOT NULL | Building inspected |
| element_id | UUID | FK, NOT NULL | Element inspected |
| assessor_id | UUID | FK → users | Conducting assessor |
| condition_rating | INTEGER | CHECK (1-5) | Condition score |
| notes | TEXT | | Field notes |
| photos | TEXT[] | | Field photos |
| assessment_date | TIMESTAMP | | Inspection date |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### 10. **fci_reports**
**Purpose:** FCI calculation results and historical tracking

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique report ID |
| assessment_id | UUID | FK, NOT NULL | Source assessment |
| building_id | UUID | FK, NOT NULL | Building assessed |
| fci_value | DECIMAL(5,4) | NOT NULL | Calculated FCI |
| total_repair_cost | DECIMAL(15,2) | NOT NULL | Sum of repairs |
| replacement_value | DECIMAL(15,2) | NOT NULL | Building value |
| condition_category | VARCHAR(50) | | Excellent/Good/Fair/Critical |
| report_date | TIMESTAMP | DEFAULT NOW() | Report generation date |
| created_by | UUID | FK → users | Report creator |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### 11. **reports**
**Purpose:** Generated PDF reports

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique report ID |
| assessment_id | UUID | FK | Source assessment |
| building_id | UUID | FK, NOT NULL | Building in report |
| title | VARCHAR(255) | NOT NULL | Report title |
| report_type | VARCHAR(50) | NOT NULL | FCI/comprehensive/summary |
| file_url | TEXT | | PDF URL (if stored) |
| generated_at | TIMESTAMP | DEFAULT NOW() | Generation timestamp |
| created_by_user_id | UUID | FK → users | Generator |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### 12. **tokens**
**Purpose:** Registration invitation tokens (legacy system)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Token ID |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Token string |
| token_type | VARCHAR(50) | NOT NULL | registration/invitation |
| organization_id | UUID | FK → organizations | Target organization |
| role | VARCHAR(50) | | Assigned role |
| max_uses | INTEGER | DEFAULT 1 | Usage limit |
| uses_remaining | INTEGER | | Remaining uses |
| created_by | UUID | FK → users | Token creator |
| used_by | UUID | FK → users | Token user |
| expires_at | TIMESTAMP | | Expiration date |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Note:** Token requirement removed in MVP; system supports direct signup

---

### 13. **reference_building_costs**
**Purpose:** Cost per square foot by building type for replacement value calculations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique cost record ID |
| building_type | VARCHAR(100) | UNIQUE, NOT NULL | Building type |
| cost_per_sqft | DECIMAL(10,2) | NOT NULL | Cost per sq ft |
| region | VARCHAR(100) | | Geographic region |
| last_updated | TIMESTAMP | DEFAULT NOW() | Price update date |
| source | TEXT | | Cost data source |
| notes | TEXT | | Additional context |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Sample Data:**
```sql
INSERT INTO reference_building_costs (building_type, cost_per_sqft)
VALUES
  ('Office', 250.00),
  ('School', 350.00),
  ('Hospital', 600.00),
  ('Retail', 200.00),
  ('Industrial', 150.00);
```

---

### 14. **email_subscriptions**
**Purpose:** Automated report delivery subscriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Subscription ID |
| user_id | UUID | FK → users | Subscriber |
| building_id | UUID | FK → buildings | Building to monitor |
| frequency | VARCHAR(50) | NOT NULL | daily/weekly/monthly |
| report_type | VARCHAR(50) | NOT NULL | Report format |
| active | BOOLEAN | DEFAULT true | Subscription status |
| last_sent_at | TIMESTAMP | | Last email sent |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### 15. **migration_audit**
**Purpose:** Track database migrations and schema changes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment ID |
| migration_name | VARCHAR(255) | NOT NULL | Migration identifier |
| executed_at | TIMESTAMP | DEFAULT NOW() | Execution time |
| schema_snapshot | JSON | | Schema state snapshot |

---

## Relationships & Foreign Keys

### Organization Relationships
```
organizations (1) → (N) users
organizations (1) → (N) buildings
organizations (1) → (N) assessments
organizations (1) → (N) tokens
```

### Building Relationships
```
buildings (1) → (N) assessments
buildings (1) → (N) reports
buildings (1) → (N) field_assessments
buildings (1) → (N) email_subscriptions
```

### Assessment Relationships
```
assessments (1) → (1) pre_assessments
assessments (1) → (N) assessment_elements
assessments (1) → (N) reports
assessments (1) → (N) fci_reports

assessment_elements (1) → (N) assessment_deficiencies
```

### User Relationships
```
users → created buildings (1:N)
users → created assessments (1:N)
users → assigned assessments (1:N)
users → conducted field_assessments (1:N)
users → invited other users (1:N)
```

---

## Indexing Strategy

### Primary Key Indexes (Automatic)
All tables use UUID primary keys with automatic B-tree indexes.

### Foreign Key Indexes
```sql
-- Organizations
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_buildings_organization_id ON buildings(organization_id);
CREATE INDEX idx_assessments_organization_id ON assessments(organization_id);

-- Buildings
CREATE INDEX idx_assessments_building_id ON assessments(building_id);
CREATE INDEX idx_buildings_created_by ON buildings(created_by_user_id);

-- Assessments
CREATE INDEX idx_assessment_elements_assessment_id
  ON assessment_elements(assessment_id);
CREATE INDEX idx_assessment_elements_element_id
  ON assessment_elements(element_id);
CREATE INDEX idx_assessments_created_by ON assessments(created_by_user_id);
CREATE INDEX idx_assessments_assigned_to ON assessments(assigned_to_user_id);

-- Deficiencies
CREATE INDEX idx_deficiencies_assessment_element_id
  ON assessment_deficiencies(assessment_element_id);

-- Reports
CREATE INDEX idx_reports_assessment_id ON reports(assessment_id);
CREATE INDEX idx_reports_building_id ON reports(building_id);
```

### Composite Indexes
```sql
-- Query assessments by org + status (common filter)
CREATE INDEX idx_assessments_org_status
  ON assessments(organization_id, status);

-- Query buildings by org + type
CREATE INDEX idx_buildings_org_type
  ON buildings(organization_id, type);
```

### Performance Considerations
- Indexes improve read performance but slow writes
- Monitor index usage with `pg_stat_user_indexes`
- Consider partial indexes for filtered queries
- Rebuild indexes periodically: `REINDEX TABLE table_name`

---

## Data Integrity & Constraints

### Primary Key Constraints
All tables have UUID primary keys ensuring uniqueness.

### Foreign Key Constraints
```sql
-- Enforce referential integrity
ALTER TABLE users
  ADD CONSTRAINT fk_users_org
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE CASCADE;

ALTER TABLE assessments
  ADD CONSTRAINT fk_assessments_building
  FOREIGN KEY (building_id)
  REFERENCES buildings(id)
  ON DELETE CASCADE;
```

### Check Constraints
```sql
-- Ensure valid condition ratings (1-5)
ALTER TABLE assessment_elements
  ADD CONSTRAINT check_condition_rating
  CHECK (condition_rating >= 1 AND condition_rating <= 5);

-- Ensure valid FCI values (0-2, allowing some margin)
ALTER TABLE assessments
  ADD CONSTRAINT check_fci_range
  CHECK (fci >= 0 AND fci <= 2 OR fci IS NULL);

-- Ensure positive square footage
ALTER TABLE buildings
  ADD CONSTRAINT check_positive_sqft
  CHECK (square_footage > 0);
```

### NOT NULL Constraints
Critical fields marked as NOT NULL:
- Email, password, name (users)
- Organization_id (most tables)
- Building_id, assessment_id (related tables)

### Unique Constraints
```sql
-- Prevent duplicate emails
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Prevent duplicate element codes
ALTER TABLE elements ADD CONSTRAINT unique_code UNIQUE (code);
```

---

## Migration System

### Migration Tool
Custom migration system using Knex.js:

```bash
# Run all pending migrations
npm run migrate up

# Rollback last migration
npm run migrate rollback

# View migration status
npm run migrate status

# View migration history
npm run migrate history

# Dry run (test without applying)
npm run migrate up --dry-run
```

### Migration Files
Location: `backend/src/database/migrations/`

**Migration File Structure:**
```typescript
// 001_fix_schema_issues.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Apply changes
  await knex.schema.createTable('new_table', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Rollback changes
  await knex.schema.dropTableIfExists('new_table');
}
```

### Migration Best Practices
1. **Always include down() method** for rollback capability
2. **Test migrations on development first**
3. **Backup production database before migrating**
4. **Keep migrations small and focused**
5. **Document breaking changes**
6. **Never edit applied migrations** (create new one instead)

### Schema Versioning
All migrations tracked in `migration_audit` table with:
- Migration name
- Execution timestamp
- Schema snapshot (JSON)

---

**Next Steps:**
- Proceed to **Milestone 4: API Documentation**

---

**Document Control:**
- Created: November 3, 2025
- Version: 1.0
- Status: Complete ✅
