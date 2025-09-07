-- Migration to add missing columns that the backend code expects
-- This fixes the 500 errors during assessment completion

-- ============================================
-- STEP 1: Fix buildings table
-- ============================================

DO $$ 
BEGIN
    -- Add building_type column (code expects this exact name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buildings' AND column_name = 'building_type') THEN
        ALTER TABLE buildings ADD COLUMN building_type VARCHAR(255) DEFAULT 'Office';
        RAISE NOTICE 'Added building_type column to buildings table';
    END IF;
    
    -- Copy data from type to building_type if type exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'type') THEN
        UPDATE buildings SET building_type = type WHERE building_type IS NULL OR building_type = 'Office';
        RAISE NOTICE 'Copied type data to building_type';
    END IF;
END $$;

-- ============================================
-- STEP 2: Fix assessments table
-- ============================================

DO $$ 
BEGIN
    -- Add created_by column (code expects this exact name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'created_by') THEN
        ALTER TABLE assessments ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column to assessments table';
    END IF;
    
    -- Add assigned_to column (code expects this exact name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'assigned_to') THEN
        ALTER TABLE assessments ADD COLUMN assigned_to UUID;
        RAISE NOTICE 'Added assigned_to column to assessments table';
    END IF;
    
    -- Add completion_date column (code expects this exact name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'completion_date') THEN
        ALTER TABLE assessments ADD COLUMN completion_date TIMESTAMP;
        RAISE NOTICE 'Added completion_date column to assessments table';
    END IF;
    
    -- Add assessment_type column (code expects this exact name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'assessments' AND column_name = 'assessment_type') THEN
        ALTER TABLE assessments ADD COLUMN assessment_type VARCHAR(255) DEFAULT 'field_assessment';
        RAISE NOTICE 'Added assessment_type column to assessments table';
    END IF;
    
    -- Copy data from existing columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'created_by_user_id') THEN
        UPDATE assessments SET created_by = created_by_user_id WHERE created_by IS NULL;
        RAISE NOTICE 'Copied created_by_user_id data to created_by';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'assigned_to_user_id') THEN
        UPDATE assessments SET assigned_to = assigned_to_user_id WHERE assigned_to IS NULL;
        RAISE NOTICE 'Copied assigned_to_user_id data to assigned_to';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'completed_at') THEN
        UPDATE assessments SET completion_date = completed_at WHERE completion_date IS NULL;
        RAISE NOTICE 'Copied completed_at data to completion_date';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'assessments' AND column_name = 'type') THEN
        UPDATE assessments SET assessment_type = type WHERE assessment_type = 'field_assessment';
        RAISE NOTICE 'Copied type data to assessment_type';
    END IF;
END $$;

-- ============================================
-- STEP 3: Fix reports table
-- ============================================

DO $$ 
BEGIN
    -- Add generated_by column (code expects this exact name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'generated_by') THEN
        ALTER TABLE reports ADD COLUMN generated_by UUID;
        RAISE NOTICE 'Added generated_by column to reports table';
    END IF;
    
    -- Copy data from created_by_user_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reports' AND column_name = 'created_by_user_id') THEN
        UPDATE reports SET generated_by = created_by_user_id WHERE generated_by IS NULL;
        RAISE NOTICE 'Copied created_by_user_id data to generated_by';
    END IF;
END $$;

-- ============================================
-- STEP 4: Fix elements table
-- ============================================

DO $$ 
BEGIN
    -- Add name column if missing (code expects this)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elements' AND column_name = 'name') THEN
        ALTER TABLE elements ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Added name column to elements table';
    END IF;
    
    -- Copy data from element_name if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'elements' AND column_name = 'element_name') THEN
        UPDATE elements SET name = element_name WHERE name IS NULL;
        RAISE NOTICE 'Copied element_name data to name';
    END IF;
END $$;

-- ============================================
-- STEP 5: Verify all changes
-- ============================================

\echo 'Buildings table columns:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
AND column_name IN ('building_type', 'type', 'street_address')
ORDER BY ordinal_position;

\echo 'Assessments table columns:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN ('created_by', 'assigned_to', 'completion_date', 'assessment_type')
ORDER BY ordinal_position;

\echo 'Reports table columns:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('generated_by')
ORDER BY ordinal_position;

\echo 'Elements table columns:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'elements' 
AND column_name IN ('name', 'element_name')
ORDER BY ordinal_position;