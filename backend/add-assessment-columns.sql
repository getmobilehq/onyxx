-- Add missing columns to assessments table for FCI calculations

BEGIN;

-- Add total_repair_cost column
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS total_repair_cost DECIMAL(12, 2) DEFAULT 0;

-- Add fci_score column  
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS fci_score DECIMAL(10, 6) DEFAULT 0;

-- Add replacement_value column
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS replacement_value DECIMAL(12, 2) DEFAULT 0;

-- Add immediate_repair_cost column
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS immediate_repair_cost DECIMAL(12, 2) DEFAULT 0;

-- Add short_term_repair_cost column
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS short_term_repair_cost DECIMAL(12, 2) DEFAULT 0;

-- Add long_term_repair_cost column
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS long_term_repair_cost DECIMAL(12, 2) DEFAULT 0;

-- Add assessor_name column
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS assessor_name VARCHAR(100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_fci_score ON assessments(fci_score);
CREATE INDEX IF NOT EXISTS idx_assessments_total_repair_cost ON assessments(total_repair_cost);

-- Add comments for documentation
COMMENT ON COLUMN assessments.total_repair_cost IS 'Total cost of all repair items for this assessment';
COMMENT ON COLUMN assessments.fci_score IS 'Facility Condition Index: total_repair_cost / replacement_value';
COMMENT ON COLUMN assessments.replacement_value IS 'Current replacement value of the building';
COMMENT ON COLUMN assessments.immediate_repair_cost IS 'Cost of repairs needed immediately';
COMMENT ON COLUMN assessments.short_term_repair_cost IS 'Cost of repairs needed within 1-3 years';
COMMENT ON COLUMN assessments.long_term_repair_cost IS 'Cost of repairs needed within 3-5 years';
COMMENT ON COLUMN assessments.assessor_name IS 'Name of the person who conducted the assessment';

COMMIT;