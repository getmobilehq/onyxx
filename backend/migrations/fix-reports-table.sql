-- Migration to fix reports table name mismatch in production
-- Run this on the production database

-- Check if fci_reports exists and reports doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fci_reports') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        -- Rename the table
        ALTER TABLE fci_reports RENAME TO reports;
        
        -- Update any constraints, indexes, or sequences
        ALTER TABLE reports RENAME CONSTRAINT fci_reports_pkey TO reports_pkey;
        ALTER SEQUENCE IF EXISTS fci_reports_id_seq RENAME TO reports_id_seq;
        
        -- Update foreign key constraints if any
        ALTER TABLE IF EXISTS reports 
            RENAME CONSTRAINT fci_reports_assessment_id_fkey TO reports_assessment_id_fkey;
        ALTER TABLE IF EXISTS reports 
            RENAME CONSTRAINT fci_reports_building_id_fkey TO reports_building_id_fkey;
        ALTER TABLE IF EXISTS reports 
            RENAME CONSTRAINT fci_reports_created_by_user_id_fkey TO reports_created_by_user_id_fkey;
            
        RAISE NOTICE 'Successfully renamed fci_reports to reports';
    ELSE
        RAISE NOTICE 'Table reports already exists or fci_reports not found - no action needed';
    END IF;
END $$;

-- Verify the change
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('reports', 'fci_reports');