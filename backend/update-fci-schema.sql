-- Update FCI reports table to include additional fields for detailed cost breakdown

ALTER TABLE fci_reports 
ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id),
ADD COLUMN IF NOT EXISTS immediate_repair_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS short_term_repair_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS long_term_repair_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS condition_rating VARCHAR(20);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_fci_reports_assessment_id ON fci_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_fci_reports_building_id ON fci_reports(building_id);

-- Update existing records to set default values for new columns
UPDATE fci_reports 
SET 
  immediate_repair_cost = COALESCE(immediate_repair_cost, total_repair_cost * 0.3),
  short_term_repair_cost = COALESCE(short_term_repair_cost, total_repair_cost * 0.4),
  long_term_repair_cost = COALESCE(long_term_repair_cost, total_repair_cost * 0.3),
  condition_rating = COALESCE(condition_rating, 
    CASE 
      WHEN fci_score <= 0.05 THEN 'Good'
      WHEN fci_score <= 0.10 THEN 'Fair'
      WHEN fci_score <= 0.30 THEN 'Poor'
      ELSE 'Critical'
    END
  )
WHERE immediate_repair_cost IS NULL 
   OR short_term_repair_cost IS NULL 
   OR long_term_repair_cost IS NULL 
   OR condition_rating IS NULL;