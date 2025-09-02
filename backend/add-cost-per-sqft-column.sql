-- Add cost_per_sqft column to buildings table
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS cost_per_sqft DECIMAL(10, 2) DEFAULT 200;

-- Add replacement_value column if it doesn't exist
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS replacement_value DECIMAL(15, 2);

-- Update replacement values for existing buildings based on their type and size
UPDATE buildings
SET replacement_value = square_footage * cost_per_sqft
WHERE replacement_value IS NULL AND square_footage IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN buildings.cost_per_sqft IS 'Cost per square foot for replacement value calculation';
COMMENT ON COLUMN buildings.replacement_value IS 'Total replacement value (square_footage * cost_per_sqft)';

-- Update existing buildings with proper cost_per_sqft based on their building type
UPDATE buildings SET cost_per_sqft = 297.50 WHERE type = 'Single-story Office' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 605.00 WHERE type = 'Mid-rise Office' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 737.50 WHERE type = 'High-rise Office' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 300.00 WHERE type = 'High-end Executive Office' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 140.00 WHERE type = 'Basic Warehouse' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 280.00 WHERE type = 'Light Industrial Warehouse' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 545.00 WHERE type = 'Manufacturing Facility' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 800.00 WHERE type = 'Laboratory Facility' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 750.50 WHERE type = 'Medical Office Building' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 704.50 WHERE type = 'Specialty Clinic' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 1086.50 WHERE type = 'Acute Care Hospital' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 160.00 WHERE type = 'Motel (2–3 stories)' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 559.00 WHERE type = '3-star Hotel' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 802.50 WHERE type = '5-star Hotel' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 362.50 WHERE type = 'Primary/Secondary School' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 675.00 WHERE type = 'University Classroom/Lab' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 353.50 WHERE type = 'Dormitories' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 409.50 WHERE type = 'Neighborhood Strip Center' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 526.00 WHERE type = 'Shopping Mall' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 331.50 WHERE type = 'Standalone Retail Store' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 295.00 WHERE type = 'Standard Apartments' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 913.50 WHERE type = 'Community Centers' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 1010.00 WHERE type = 'Museums/Performing Arts Centers' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 580.00 WHERE type = 'Police Stations' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 150.50 WHERE type = 'Multi-level Garage (Basic)' AND cost_per_sqft = 200;
UPDATE buildings SET cost_per_sqft = 143.00 WHERE type = 'Low-grade Parking Garage' AND cost_per_sqft = 200;

-- Recalculate replacement values with correct cost_per_sqft
UPDATE buildings
SET replacement_value = square_footage * cost_per_sqft
WHERE square_footage IS NOT NULL;

-- Success message (PostgreSQL doesn't support RAISE NOTICE outside functions/procedures)
-- The migration is complete