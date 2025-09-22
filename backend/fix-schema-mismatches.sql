-- Fix Schema Mismatches Script
-- This script adds missing columns and fixes schema inconsistencies

-- 1. Add missing columns to assessment_elements table
ALTER TABLE assessment_elements 
ADD COLUMN IF NOT EXISTS repair_cost NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(total_repair_cost, 0)) STORED;

ALTER TABLE assessment_elements 
ADD COLUMN IF NOT EXISTS priority_level INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN priority = 'critical' OR priority = '1' THEN 1
    WHEN priority = 'high' OR priority = '2' THEN 2
    WHEN priority = 'medium' OR priority = '3' THEN 3
    WHEN priority = 'low' OR priority = '4' THEN 4
    ELSE 3
  END
) STORED;

-- 2. Update buildings with realistic replacement values
UPDATE buildings 
SET replacement_value = 
  CASE 
    WHEN square_footage IS NOT NULL AND square_footage > 0 THEN
      square_footage * COALESCE(cost_per_sqft, 200)
    ELSE 
      2000000 -- Default $2M for buildings without square footage
  END
WHERE replacement_value IS NULL OR replacement_value <= 1;

-- 3. Add cost_per_sqft if missing
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS cost_per_sqft NUMERIC(10,2) DEFAULT 200.00;

-- 4. Update existing buildings with proper cost_per_sqft
UPDATE buildings 
SET cost_per_sqft = 
  CASE building_type
    WHEN 'office' THEN 250.00
    WHEN 'warehouse' THEN 150.00
    WHEN 'retail' THEN 200.00
    WHEN 'industrial' THEN 175.00
    WHEN 'medical' THEN 350.00
    ELSE 200.00
  END
WHERE cost_per_sqft IS NULL OR cost_per_sqft = 200.00;

-- 5. Ensure Demo Office Building has proper data
UPDATE buildings 
SET 
  square_footage = COALESCE(square_footage, 25000),
  cost_per_sqft = 250.00,
  replacement_value = 25000 * 250.00
WHERE id = '7fcc6a37-5537-4f0c-a4b7-21518de1e4c8';

-- 6. Update assessment_elements with repair costs based on condition
UPDATE assessment_elements ae
SET total_repair_cost = 
  CASE 
    WHEN ae.condition_rating = 5 THEN rc.replacement_cost * 0.90  -- Critical - 90% of replacement
    WHEN ae.condition_rating = 4 THEN rc.replacement_cost * 0.65  -- Poor - 65% of replacement
    WHEN ae.condition_rating = 3 THEN rc.replacement_cost * 0.35  -- Fair - 35% of replacement
    WHEN ae.condition_rating = 2 THEN rc.replacement_cost * 0.15  -- Good - 15% of replacement
    WHEN ae.condition_rating = 1 THEN rc.replacement_cost * 0.05  -- Excellent - 5% of replacement
    ELSE rc.replacement_cost * 0.20  -- Default 20%
  END
FROM (
  SELECT 
    ae2.id,
    COALESCE(ae2.replacement_cost, b.replacement_value * 0.01) as replacement_cost
  FROM assessment_elements ae2
  JOIN assessments a ON ae2.assessment_id = a.id
  JOIN buildings b ON a.building_id = b.id
) rc
WHERE ae.id = rc.id 
  AND (ae.total_repair_cost IS NULL OR ae.total_repair_cost = 0);

-- 7. Set priority based on condition rating if not set
UPDATE assessment_elements
SET priority = 
  CASE 
    WHEN condition_rating >= 4 THEN 'critical'
    WHEN condition_rating = 3 THEN 'high'
    WHEN condition_rating = 2 THEN 'medium'
    ELSE 'low'
  END
WHERE priority IS NULL;

-- 8. Update any reports with proper replacement values
UPDATE reports r
SET 
  replacement_value = b.replacement_value,
  fci_score = 
    CASE 
      WHEN b.replacement_value > 0 THEN 
        COALESCE(r.total_repair_cost, 0) / b.replacement_value
      ELSE 0
    END
FROM buildings b
WHERE r.building_id = b.id
  AND (r.replacement_value IS NULL OR r.replacement_value <= 1);

-- 9. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_elements_assessment_id ON assessment_elements(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_building_id ON assessments(building_id);
CREATE INDEX IF NOT EXISTS idx_reports_building_id ON reports(building_id);
CREATE INDEX IF NOT EXISTS idx_reports_assessment_id ON reports(assessment_id);

-- Show summary of changes
SELECT 
  'Buildings Updated' as change_type,
  COUNT(*) as count
FROM buildings
WHERE replacement_value > 1
UNION ALL
SELECT 
  'Assessment Elements with Costs' as change_type,
  COUNT(*) as count
FROM assessment_elements
WHERE total_repair_cost > 0
UNION ALL
SELECT 
  'Reports with Valid FCI' as change_type,
  COUNT(*) as count
FROM reports
WHERE fci_score > 0;