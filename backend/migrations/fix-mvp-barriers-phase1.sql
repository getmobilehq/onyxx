-- Phase 1: Critical Database Schema Fixes for MVP
-- Fixes building data storage and column mapping issues

-- ============================================
-- Fix 1.1: Buildings Table Schema Issues
-- ============================================

DO $$ 
BEGIN
    -- Ensure square_footage column exists and is properly mapped
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buildings' AND column_name = 'square_footage') THEN
        ALTER TABLE buildings ADD COLUMN square_footage INTEGER;
        RAISE NOTICE 'Added square_footage column to buildings table';
    END IF;
    
    -- Ensure replacement_value column exists and has proper type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'replacement_value') THEN
        -- Update the column type if it exists
        ALTER TABLE buildings ALTER COLUMN replacement_value TYPE NUMERIC(12,2);
        RAISE NOTICE 'Updated replacement_value column type in buildings table';
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE buildings ADD COLUMN replacement_value NUMERIC(12,2);
        RAISE NOTICE 'Added replacement_value column to buildings table';
    END IF;
    
    -- Copy size data to square_footage if size column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'size') THEN
        UPDATE buildings SET square_footage = size WHERE square_footage IS NULL AND size IS NOT NULL;
        RAISE NOTICE 'Copied size data to square_footage column';
    END IF;
END $$;

-- ============================================
-- Fix 1.2: Reports Table Column Consistency
-- ============================================

DO $$ 
BEGIN
    -- The backend code tries to insert 'replacement_cost' but table has 'replacement_value'
    -- We'll add a computed column or alias to handle this
    
    -- Check if replacement_cost column exists, if not create alias/view
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'replacement_cost') THEN
        -- Add replacement_cost as alias to replacement_value
        ALTER TABLE reports ADD COLUMN replacement_cost NUMERIC(12,2);
        RAISE NOTICE 'Added replacement_cost column to reports table';
        
        -- Copy existing data from replacement_value to replacement_cost
        UPDATE reports SET replacement_cost = replacement_value WHERE replacement_cost IS NULL;
        RAISE NOTICE 'Copied replacement_value data to replacement_cost';
    END IF;
END $$;

-- ============================================
-- Fix 1.3: Ensure Assessment-Building Relationship
-- ============================================

DO $$ 
BEGIN
    -- Ensure assessments can properly reference buildings
    -- Add index for performance
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessments_building_id') THEN
        CREATE INDEX idx_assessments_building_id ON assessments(building_id);
        RAISE NOTICE 'Added index for assessments-building relationship';
    END IF;
    
    -- Add index for assessment completion queries
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessments_status') THEN
        CREATE INDEX idx_assessments_status ON assessments(status);
        RAISE NOTICE 'Added index for assessment status queries';
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Check buildings table structure
SELECT 'Buildings table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
AND column_name IN ('square_footage', 'replacement_value', 'size', 'type')
ORDER BY ordinal_position;

-- Check reports table structure  
SELECT 'Reports table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('replacement_value', 'replacement_cost')
ORDER BY ordinal_position;