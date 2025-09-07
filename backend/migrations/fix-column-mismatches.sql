-- Migration to fix column name mismatches in production database
-- Run these commands in PGAdmin or Render database console

-- ============================================
-- STEP 1: Check current columns in buildings table
-- ============================================
\d buildings

-- ============================================
-- STEP 2: Fix buildings table columns
-- ============================================

-- Check if 'building_type' exists and 'type' doesn't, then rename it
DO $$ 
BEGIN
    -- Rename building_type to type if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'building_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'buildings' AND column_name = 'type') THEN
        ALTER TABLE buildings RENAME COLUMN building_type TO type;
        RAISE NOTICE 'Renamed building_type to type';
    END IF;

    -- Rename address to street_address if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'address')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'buildings' AND column_name = 'street_address') THEN
        ALTER TABLE buildings RENAME COLUMN address TO street_address;
        RAISE NOTICE 'Renamed address to street_address';
    END IF;

    -- Add type column if it doesn't exist at all
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buildings' AND column_name = 'type') THEN
        ALTER TABLE buildings ADD COLUMN type VARCHAR(255) DEFAULT 'Office';
        RAISE NOTICE 'Added type column';
    END IF;
END $$;

-- ============================================
-- STEP 3: Check current columns in assessments table
-- ============================================
\d assessments

-- ============================================
-- STEP 4: Fix assessments table columns
-- ============================================

DO $$ 
BEGIN
    -- Rename created_by to created_by_user_id if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'created_by')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'assessments' AND column_name = 'created_by_user_id') THEN
        ALTER TABLE assessments RENAME COLUMN created_by TO created_by_user_id;
        RAISE NOTICE 'Renamed created_by to created_by_user_id';
    END IF;

    -- Rename assigned_to to assigned_to_user_id if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'assigned_to')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'assessments' AND column_name = 'assigned_to_user_id') THEN
        ALTER TABLE assessments RENAME COLUMN assigned_to TO assigned_to_user_id;
        RAISE NOTICE 'Renamed assigned_to to assigned_to_user_id';
    END IF;

    -- Rename completion_date to completed_at if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'completion_date')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'assessments' AND column_name = 'completed_at') THEN
        ALTER TABLE assessments RENAME COLUMN completion_date TO completed_at;
        RAISE NOTICE 'Renamed completion_date to completed_at';
    END IF;

    -- Rename assessment_type to type if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'assessment_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'assessments' AND column_name = 'type') THEN
        ALTER TABLE assessments RENAME COLUMN assessment_type TO type;
        RAISE NOTICE 'Renamed assessment_type to type';
    END IF;

    -- Add created_by_user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'created_by_user_id') THEN
        ALTER TABLE assessments ADD COLUMN created_by_user_id UUID;
        -- Copy data from assigned_to_user_id if it exists
        UPDATE assessments SET created_by_user_id = assigned_to_user_id 
        WHERE created_by_user_id IS NULL;
        RAISE NOTICE 'Added created_by_user_id column';
    END IF;
END $$;

-- ============================================
-- STEP 5: Fix reports table columns (if needed)
-- ============================================

DO $$ 
BEGIN
    -- Rename generated_by to created_by_user_id if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reports' AND column_name = 'generated_by')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'reports' AND column_name = 'created_by_user_id') THEN
        ALTER TABLE reports RENAME COLUMN generated_by TO created_by_user_id;
        RAISE NOTICE 'Renamed generated_by to created_by_user_id in reports';
    END IF;
END $$;

-- ============================================
-- STEP 6: Verify all changes
-- ============================================

-- Check buildings table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
AND column_name IN ('type', 'building_type', 'street_address', 'address')
ORDER BY ordinal_position;

-- Check assessments table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN ('created_by_user_id', 'created_by', 'assigned_to_user_id', 'assigned_to', 'completed_at', 'completion_date', 'type', 'assessment_type')
ORDER BY ordinal_position;

-- Check reports table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('created_by_user_id', 'generated_by')
ORDER BY ordinal_position;