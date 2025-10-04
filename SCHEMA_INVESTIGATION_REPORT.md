# Schema Investigation Report - Report Generation
**Date**: October 4, 2025
**Status**: 🔴 CRITICAL ISSUES FOUND

## Executive Summary
Found **multiple schema mismatches** in controllers and services that will cause 500 errors during report generation and related operations.

---

## Actual Database Schema (from Production)

### ASSESSMENTS Table
**Existing Columns:**
- `id`, `organization_id`, `building_id`, `name`, `description`, `status`
- `assessment_type` (NOT `type`)
- `assessment_date` (NOT `scheduled_date`)
- `completion_date` (NOT `completed_at`)
- `assigned_to_user_id`
- `created_by` (NOT `created_by_user_id`)
- `updated_by`, `fci_score`, `total_repair_cost`, `replacement_value`
- `element_count`, `deficiency_count`, `notes`, `weather_conditions`, `temperature`
- `assessor_notes`, `created_at`, `updated_at`, `assigned_to` (generated column)

**Missing/Wrong Columns:**
- ❌ `type` → Should be `assessment_type`
- ❌ `scheduled_date` → Should be `assessment_date`
- ❌ `created_by_user_id` → Should be `created_by`
- ❌ `started_at` → DOES NOT EXIST
- ❌ `completed_at` → Should be `completion_date`

### BUILDINGS Table
**Existing Columns:**
- `id`, `organization_id`, `name`
- `building_type` (NOT `type`)
- `street_address`, `city`, `state`, `zip_code`, `country`
- `year_built`
- `size` (NOT `square_footage`)
- `number_of_floors`, `occupancy_type`, `cost_per_sqft`, `replacement_value`
- `total_area`, `notes`, `status`, `created_at`, `updated_at`, `created_by_user_id`

**Missing/Wrong Columns:**
- ❌ `square_footage` → Should be `size`
- ❌ `type` → Should be `building_type`
- ❌ `construction_type` → DOES NOT EXIST

---

## Issues Found

### 🔴 CRITICAL - Buildings Controller
**File**: `backend/src/controllers/buildings.controller.ts`

**Issues**:
1. Line 30: `SELECT b.square_footage` → Should be `b.size`
2. Line 90: `SELECT square_footage` → Should be `size`
3. Line 137-179: INSERT statement uses `square_footage` → Should be `size`
4. Line 30, 90: `SELECT b.type` → Should be `b.building_type`
5. Line 30, 90: `SELECT construction_type` → Column DOES NOT EXIST
6. Lines 253-313: UPDATE queries reference `square_footage` → Should be `size`

**Impact**:
- Creating buildings will fail (500 error)
- Fetching building list will fail (500 error)
- Updating buildings will fail (500 error)

---

### 🔴 CRITICAL - Reports Controller
**File**: `backend/src/controllers/reports.controller.ts`

**Issues**:
1. Line 254: `b.square_footage` → Should be `b.size`
2. Line 519: `b.square_footage` → Should be `b.size`
3. Line 519: `b.type` → Should be `b.building_type`

**Impact**:
- Report generation will fail (500 error)
- FCI calculations will be incorrect

---

### 🟡 FIXED - Assessments Controller
**File**: `backend/src/controllers/assessments.controller.ts`

**Issues**:
1. Line 238: `b.square_footage` → Should be `b.size` ❓ (need to verify)
2. ✅ Line 1015: Already fixed to `b.size as square_footage`

**Status**: Partially fixed

---

### ✅ FIXED - FCI Service
**File**: `backend/src/services/fci.service.ts`

**Status**: ✅ Already fixed (Line 45: uses `b.size as square_footage`)

---

## Required Fixes

### Priority 1 - CRITICAL (Breaks Core Functionality)

#### 1. Buildings Controller
```typescript
// Line 30 - getAllBuildings query
SELECT b.id, b.name, b.building_type, b.year_built, b.size,
// Remove: construction_type (doesn't exist)

// Line 90 - getBuildingById query
SELECT id, name, building_type, year_built, size,
// Remove: construction_type, type

// Line 137-179 - createBuilding INSERT
size,  // NOT square_footage
building_type,  // NOT type
// Remove: construction_type

// Line 253 - updateBuilding fields
'name', 'building_type', 'year_built', 'size',  // NOT square_footage

// Line 286-295 - Update replacement value calculation
SELECT size, cost_per_sqft  // NOT square_footage
const newSize = updateFields.size !== undefined ? updateFields.size : current.size;
```

#### 2. Reports Controller
```typescript
// Line 254
b.size as square_footage,  // NOT b.square_footage
b.building_type,  // NOT b.type

// Line 519
b.size as square_footage,  // NOT b.square_footage
b.building_type  // NOT b.type
```

#### 3. Assessments Controller
```typescript
// Line 238 - Verify and fix if needed
b.size as square_footage,  // NOT b.square_footage
```

---

## Testing Checklist

After fixes are applied, test:
- [ ] Create new building
- [ ] Fetch building list
- [ ] Update building details
- [ ] Create assessment
- [ ] Complete assessment
- [ ] Generate FCI report
- [ ] View report details

---

## Recommendation

**URGENT**: Apply all fixes immediately. These schema mismatches are causing:
1. ❌ Building creation failures
2. ❌ Building list page failures
3. ❌ Report generation failures
4. ❌ Assessment workflow interruptions

**Estimated Fix Time**: 15-20 minutes
**Deployment**: Required immediately after fixes
