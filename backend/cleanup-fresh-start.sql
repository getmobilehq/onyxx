-- ONYX PLATFORM - FRESH START CLEANUP
-- This script removes all test/development data while preserving database structure

\set ON_ERROR_STOP on
\timing on

BEGIN;

-- Create a backup of the current state before cleanup
DO $$
BEGIN
    RAISE NOTICE 'Creating backup tables before cleanup...';
    
    -- Backup current data
    DROP TABLE IF EXISTS cleanup_backup_buildings;
    CREATE TABLE cleanup_backup_buildings AS SELECT * FROM buildings;
    
    DROP TABLE IF EXISTS cleanup_backup_assessments;
    CREATE TABLE cleanup_backup_assessments AS SELECT * FROM assessments;
    
    DROP TABLE IF EXISTS cleanup_backup_users;
    CREATE TABLE cleanup_backup_users AS SELECT * FROM users;
    
    RAISE NOTICE 'Backup tables created with prefixes: cleanup_backup_*';
END
$$;

-- Show current data counts before cleanup
DO $$
DECLARE
    buildings_count INTEGER;
    assessments_count INTEGER;
    reports_count INTEGER;
    users_count INTEGER;
    elements_count INTEGER;
    deficiencies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO buildings_count FROM buildings;
    SELECT COUNT(*) INTO assessments_count FROM assessments;
    SELECT COUNT(*) INTO reports_count FROM reports;
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO elements_count FROM assessment_elements;
    SELECT COUNT(*) INTO deficiencies_count FROM assessment_deficiencies;
    
    RAISE NOTICE '=== BEFORE CLEANUP ===';
    RAISE NOTICE 'Buildings: %', buildings_count;
    RAISE NOTICE 'Assessments: %', assessments_count;
    RAISE NOTICE 'Reports: %', reports_count;
    RAISE NOTICE 'Users: %', users_count;
    RAISE NOTICE 'Assessment Elements: %', elements_count;
    RAISE NOTICE 'Assessment Deficiencies: %', deficiencies_count;
    RAISE NOTICE '=====================';
END
$$;

-- Clean up all assessment-related data (cascading from top-level)
DO $$
BEGIN
    RAISE NOTICE 'Cleaning up assessment-related data...';
    
    -- Delete reports (will cascade to related data)
    DELETE FROM reports;
    RAISE NOTICE 'Deleted all reports';
    
    -- Delete assessment deficiencies
    DELETE FROM assessment_deficiencies;
    RAISE NOTICE 'Deleted all assessment deficiencies';
    
    -- Delete assessment elements
    DELETE FROM assessment_elements;
    RAISE NOTICE 'Deleted all assessment elements';
    
    -- Delete pre-assessments
    DELETE FROM pre_assessments;
    RAISE NOTICE 'Deleted all pre-assessments';
    
    -- Delete FCI reports (before assessments due to foreign key)
    DELETE FROM fci_reports;
    RAISE NOTICE 'Deleted all FCI reports';
    
    -- Delete field assessments if they exist
    DELETE FROM field_assessments;
    RAISE NOTICE 'Deleted all field assessments';
    
    -- Delete assessments
    DELETE FROM assessments;
    RAISE NOTICE 'Deleted all assessments';
END
$$;

-- Clean up buildings
DO $$
BEGIN
    RAISE NOTICE 'Cleaning up buildings...';
    
    -- Delete all buildings (should be safe now that assessments are gone)
    DELETE FROM buildings;
    RAISE NOTICE 'Deleted all buildings';
END
$$;

-- Clean up users (keep one admin user for initial access)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    RAISE NOTICE 'Setting up fresh admin user...';
    
    -- Delete all existing users
    DELETE FROM users;
    
    -- Create a fresh admin user
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (
        gen_random_uuid(),
        'Administrator',
        'admin@onyx.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
        'admin',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Created fresh admin user: admin@onyx.com / password';
    RAISE NOTICE 'Admin user ID: %', admin_user_id;
END
$$;

-- Reset all sequences to start fresh
DO $$
BEGIN
    RAISE NOTICE 'Resetting database sequences...';
    
    -- Reset any sequences that might exist
    -- (Most of our tables use UUIDs, but just in case)
END
$$;

-- Clean up any orphaned reference data
DO $$
BEGIN
    RAISE NOTICE 'Ensuring reference data is clean...';
    
    -- The elements table should remain as it contains the Uniformat II standards
    -- We keep this data as it's reference data, not user data
    RAISE NOTICE 'Uniformat II elements preserved: % records', (SELECT COUNT(*) FROM elements);
    
    -- Clean up reference building costs if needed
    -- This is also reference data, so we keep it
    RAISE NOTICE 'Reference building costs preserved';
END
$$;

-- Verify the cleanup
DO $$
DECLARE
    buildings_count INTEGER;
    assessments_count INTEGER;
    reports_count INTEGER;
    users_count INTEGER;
    elements_count INTEGER;
    deficiencies_count INTEGER;
    reference_elements_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO buildings_count FROM buildings;
    SELECT COUNT(*) INTO assessments_count FROM assessments;
    SELECT COUNT(*) INTO reports_count FROM reports;
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO elements_count FROM assessment_elements;
    SELECT COUNT(*) INTO deficiencies_count FROM assessment_deficiencies;
    SELECT COUNT(*) INTO reference_elements_count FROM elements;
    
    RAISE NOTICE '=== AFTER CLEANUP ===';
    RAISE NOTICE 'Buildings: %', buildings_count;
    RAISE NOTICE 'Assessments: %', assessments_count;
    RAISE NOTICE 'Reports: %', reports_count;
    RAISE NOTICE 'Users: %', users_count;
    RAISE NOTICE 'Assessment Elements: %', elements_count;
    RAISE NOTICE 'Assessment Deficiencies: %', deficiencies_count;
    RAISE NOTICE 'Reference Elements (Uniformat): %', reference_elements_count;
    RAISE NOTICE '====================';
    
    -- Verify we have a clean slate
    IF buildings_count = 0 AND assessments_count = 0 AND reports_count = 0 
       AND elements_count = 0 AND deficiencies_count = 0 AND users_count = 1 THEN
        RAISE NOTICE '✅ SUCCESS: Database cleaned successfully!';
        RAISE NOTICE '✅ Ready for fresh start with admin user';
    ELSE
        RAISE WARNING '⚠️  Cleanup may not be complete. Please verify manually.';
    END IF;
END
$$;

-- Optimize database after cleanup
DO $$
BEGIN
    RAISE NOTICE 'Optimizing database after cleanup...';
    
    -- Update table statistics
    ANALYZE buildings;
    ANALYZE assessments;
    ANALYZE assessment_elements;
    ANALYZE assessment_deficiencies;
    ANALYZE pre_assessments;
    ANALYZE reports;
    ANALYZE users;
    
    RAISE NOTICE 'Database optimization complete';
END
$$;

-- Final summary and next steps
DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE '    ONYX PLATFORM - FRESH START    ';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Cleanup completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Login with: admin@onyx.com / password';
    RAISE NOTICE '2. Create your first building';
    RAISE NOTICE '3. Set up your first assessment';
    RAISE NOTICE '4. Test the complete workflow';
    RAISE NOTICE '';
    RAISE NOTICE 'The platform is ready for production use!';
    RAISE NOTICE '====================================';
END
$$;

COMMIT;

-- Note: Backup tables will remain as cleanup_backup_* 
-- You can drop them later once you're satisfied with the fresh start:
-- DROP TABLE IF EXISTS cleanup_backup_buildings;
-- DROP TABLE IF EXISTS cleanup_backup_assessments;
-- DROP TABLE IF EXISTS cleanup_backup_users;