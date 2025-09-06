# Report Generation Fix Documentation

## Overview
This document details the complete process for fixing report generation in the Onyx application, based on successful testing performed on September 5, 2025.

## 1. Report Generation Workflow

### Complete Process Flow:
```
1. User completes assessment
2. System calculates FCI score
3. Report is generated with assessment data
4. PDF is created using PDFKit
5. Report is saved and made available for download
```

## 2. Database Schema Issues Found and Fixed

### Problem: Column Name Mismatches
The backend code referenced columns that don't exist in the actual database schema.

#### Buildings Table
- **Code Expected**: `building_type`, `address`
- **Actual Columns**: `type`, `street_address`

#### Assessments Table
- **Code Expected**: `assessment_type`, `assigned_to`, `completion_date`
- **Actual Columns**: `type`, `assigned_to_user_id`, `completed_at`

#### Reports Table
- **Code Expected**: `generated_by`
- **Actual Column**: `created_by_user_id`

#### Elements Table
- **Code Expected**: `name`, `minor_group`, `replacement_unit_cost`
- **Actual Columns**: `individual_element`, `group_element`

## 3. Backend Files That Need Fixes

### Files Modified:
1. **`backend/src/controllers/buildings.controller.ts`**
   - Fixed column references in SELECT and INSERT queries
   - Updated RETURNING clauses

2. **`backend/src/controllers/assessments.controller.ts`**
   - Fixed `assigned_to` → `assigned_to_user_id`
   - Fixed `assessment_type` → `type`
   - Fixed `completion_date` → `completed_at`

3. **`backend/src/controllers/reports.controller.ts`**
   - Fixed `generated_by` → `created_by_user_id`
   - Fixed `building_type` → `type`
   - Fixed `assessment_type` → `type`
   - Fixed `completion_date` → `completed_at`

4. **`backend/src/services/fci.service.ts`**
   - Fixed `completion_date` → `completed_at`

5. **`backend/src/services/reportGenerator.service.ts`**
   - Fixed `assigned_to` → `assigned_to_user_id`
   - Fixed elements query to use correct columns

6. **`backend/src/services/report-generator.service.ts`**
   - Fixed similar column references

## 4. API Endpoint Structure

### Assessment Creation
```javascript
POST /api/assessments
Body: {
  building_id: string,
  type: 'field_assessment' | 'pre_assessment',
  status: 'pending',
  notes: string,
  start_date: ISO string
}
```

### Assessment Update
```javascript
PUT /api/assessments/:id
Body: {
  status: 'in_progress',
  fci_score: number,
  total_repair_cost: number,
  immediate_repair_cost: number,
  short_term_repair_cost: number,
  long_term_repair_cost: number,
  replacement_value: number
}
```

### Assessment Completion
```javascript
POST /api/assessments/:id/complete
Body: {} // Empty body, FCI calculation happens server-side
```

### Report Generation
```javascript
POST /api/reports/generate/:assessmentId
Headers: { Authorization: 'Bearer token' }
```

### PDF Download
```javascript
GET /api/reports/download/assessment/:assessmentId
Headers: { Authorization: 'Bearer token' }
Response: PDF Buffer
```

## 5. Frontend Changes Needed

### Assessment Completion Flow
The frontend needs to follow this exact sequence:

```javascript
// 1. Update assessment with costs
await api.put(`/assessments/${assessmentId}`, {
  status: 'in_progress',
  fci_score: calculatedFCI,
  total_repair_cost: totalCost,
  immediate_repair_cost: priority1Cost,
  short_term_repair_cost: priority2Cost,
  long_term_repair_cost: priority3Cost,
  replacement_value: buildingReplacementValue
});

// 2. Complete the assessment
await api.post(`/assessments/${assessmentId}/complete`, {});

// 3. Generate the report
await api.post(`/reports/generate/${assessmentId}`, {});

// 4. Download PDF
const response = await api.get(`/reports/download/assessment/${assessmentId}`, {
  responseType: 'blob'
});
```

## 6. Critical Schema Fixes SQL Script

```sql
-- This script documents the actual schema that the code expects
-- Run this to verify your database matches

-- Check column names in buildings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
ORDER BY ordinal_position;

-- Expected columns in buildings:
-- id, name, type (not building_type), street_address (not address), 
-- construction_type, year_built, square_footage, state, city, zip_code,
-- cost_per_sqft, replacement_value, image_url, status, created_by_user_id,
-- organization_id, created_at, updated_at

-- Check column names in assessments table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;

-- Expected columns in assessments:
-- id, building_id, type (not assessment_type), description, status,
-- scheduled_date, started_at, completed_at (not completion_date),
-- assigned_to_user_id (not assigned_to), created_by_user_id,
-- notes, total_repair_cost, fci_score, replacement_value,
-- immediate_repair_cost, short_term_repair_cost, long_term_repair_cost,
-- assessor_name, organization_id, created_at, updated_at

-- Check column names in reports table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- Expected columns in reports:
-- id, assessment_id, building_id, title, description, report_type,
-- status, assessment_date, report_date, created_by_user_id (not generated_by),
-- assessor_name, fci_score, total_repair_cost, replacement_value,
-- immediate_repair_cost, short_term_repair_cost, long_term_repair_cost,
-- element_count, deficiency_count, executive_summary, recommendations,
-- systems_data, pdf_url, excel_url, created_at, updated_at
```

## 7. Testing Checklist

- [ ] Backend server runs without errors
- [ ] Can create a new building
- [ ] Can create a new assessment
- [ ] Can add assessment elements
- [ ] Can update assessment with costs
- [ ] Can complete assessment
- [ ] Can generate report
- [ ] Can download PDF
- [ ] PDF contains all expected data

## 8. Sample Working Implementation

See `create-sample-assessment.js` for a complete working example that:
1. Creates a building
2. Creates an assessment
3. Adds assessment elements with deficiencies
4. Updates and completes the assessment
5. Generates a report
6. Downloads the PDF

## 9. Common Errors and Solutions

### Error: "column X does not exist"
**Solution**: Check the actual database schema and update the query to use the correct column name.

### Error: "Assessment must be completed"
**Solution**: Ensure the assessment status is set to 'completed' before generating report.

### Error: "Route not found"
**Solution**: Use PUT instead of PATCH for updates, and check the exact route paths.

### Error: "Assessment type must be either pre_assessment or field_assessment"
**Solution**: Use the correct assessment type values, not 'facility_condition'.

## 10. Summary of Key Fixes

1. **Database column names must match exactly** - no aliases in INSERT/UPDATE
2. **Assessment type values** are 'pre_assessment' or 'field_assessment'
3. **Use PUT for updates**, not PATCH
4. **Complete assessment** using `/complete` endpoint before generating report
5. **Elements table** uses 'individual_element' not 'name'
6. **All user ID columns** end with '_user_id' not just the relationship name

## Next Steps for Frontend

1. Update all API calls to match the working endpoints
2. Ensure proper sequencing of assessment completion → report generation
3. Handle PDF download as blob and save/display
4. Add error handling for each step
5. Test end-to-end with real user data