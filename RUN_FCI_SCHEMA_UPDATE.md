# FCI Schema Update Instructions

## Method 1: Using Terminal (Recommended)

1. **Open Terminal** and navigate to your backend directory:
   ```bash
   cd /Users/josephagunbiade/Desktop/studio/onyx/backend
   ```

2. **Run the Node.js update script**:
   ```bash
   node run-fci-update.js
   ```

## Method 2: Using psql Command Line

1. **Open Terminal** and run:
   ```bash
   psql -U jojo -d onyx -f /Users/josephagunbiade/Desktop/studio/onyx/backend/update-fci-schema.sql
   ```
   
2. **Enter your password** when prompted: `Montg0m3r!`

## Method 3: Manual SQL Execution

If the above methods don't work, you can manually run the SQL commands:

1. **Connect to your database** using any PostgreSQL client (pgAdmin, DBeaver, etc.)

2. **Run these SQL commands one by one**:

```sql
-- Add new columns to fci_reports table
ALTER TABLE fci_reports 
ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES assessments(id),
ADD COLUMN IF NOT EXISTS immediate_repair_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS short_term_repair_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS long_term_repair_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS condition_rating VARCHAR(20);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fci_reports_assessment_id ON fci_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_fci_reports_building_id ON fci_reports(building_id);

-- Update existing records with default values
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
```

## Verification

After running the update, verify it worked by checking your database:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fci_reports' 
ORDER BY column_name;

-- Check if indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'fci_reports';
```

## What This Update Does

1. **Adds new columns** to the `fci_reports` table:
   - `assessment_id` - Links FCI reports to specific assessments
   - `immediate_repair_cost` - Costs requiring immediate attention
   - `short_term_repair_cost` - Costs for 1-3 year repairs
   - `long_term_repair_cost` - Costs for 3-5 year repairs
   - `condition_rating` - Text rating (Good, Fair, Poor, Critical)

2. **Creates indexes** for better query performance

3. **Updates existing records** with calculated default values

Once this is complete, your FCI calculation system will be fully functional!