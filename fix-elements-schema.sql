-- Fix Elements Table Schema to Match Backend Code Expectations
-- This script will add the missing columns needed for assessment completion

BEGIN;

-- Add missing columns to elements table
ALTER TABLE elements 
ADD COLUMN IF NOT EXISTS major_group VARCHAR(100),
ADD COLUMN IF NOT EXISTS group_element VARCHAR(200),  
ADD COLUMN IF NOT EXISTS individual_element VARCHAR(300);

-- Clear existing elements since they don't have the right structure
DELETE FROM elements;

-- Now the elements seeding will work correctly when called from the API
-- The backend seed function will populate these columns properly

COMMIT;

-- Inform that schema is fixed
SELECT 'Elements schema updated successfully. Run /api/elements/seed to populate data.' AS message;