-- Comprehensive Data Migration Script for Onyx Platform
-- This script ensures data integrity and handles migrations safely

-- Enable detailed logging
\set ON_ERROR_STOP on
\timing on

BEGIN;

-- Create backup tables for safety
DO $$
BEGIN
    -- Backup existing data before any migrations
    RAISE NOTICE 'Creating backup tables...';
    
    -- Backup assessments
    DROP TABLE IF EXISTS assessments_backup;
    CREATE TABLE assessments_backup AS SELECT * FROM assessments;
    
    -- Backup assessment_elements
    DROP TABLE IF EXISTS assessment_elements_backup;
    CREATE TABLE assessment_elements_backup AS SELECT * FROM assessment_elements;
    
    -- Backup assessment_deficiencies if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_deficiencies') THEN
        DROP TABLE IF EXISTS assessment_deficiencies_backup;
        CREATE TABLE assessment_deficiencies_backup AS SELECT * FROM assessment_deficiencies;
    END IF;
    
    -- Backup reports if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') THEN
        DROP TABLE IF EXISTS reports_backup;
        CREATE TABLE reports_backup AS SELECT * FROM reports;
    END IF;
    
    -- Backup pre_assessments
    DROP TABLE IF EXISTS pre_assessments_backup;
    CREATE TABLE pre_assessments_backup AS SELECT * FROM pre_assessments;
    
    RAISE NOTICE 'Backup tables created successfully.';
END
$$;

-- Verify and update assessment data integrity
DO $$
DECLARE
    missing_assessments INTEGER;
    orphaned_elements INTEGER;
    orphaned_deficiencies INTEGER;
BEGIN
    RAISE NOTICE 'Checking data integrity...';
    
    -- Check for missing assessment records
    SELECT COUNT(*) INTO missing_assessments
    FROM assessment_elements ae
    LEFT JOIN assessments a ON ae.assessment_id = a.id
    WHERE a.id IS NULL;
    
    IF missing_assessments > 0 THEN
        RAISE WARNING 'Found % assessment_elements with missing assessment records', missing_assessments;
        
        -- Create placeholder assessments for orphaned elements
        INSERT INTO assessments (id, building_id, status, created_at, updated_at)
        SELECT DISTINCT 
            ae.assessment_id,
            COALESCE(ae.building_id, gen_random_uuid()), -- Use element's building_id or generate one
            'completed',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        FROM assessment_elements ae
        LEFT JOIN assessments a ON ae.assessment_id = a.id
        WHERE a.id IS NULL;
        
        RAISE NOTICE 'Created % placeholder assessment records', missing_assessments;
    END IF;
    
    -- Check for orphaned assessment_deficiencies
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_deficiencies') THEN
        SELECT COUNT(*) INTO orphaned_deficiencies
        FROM assessment_deficiencies ad
        LEFT JOIN assessment_elements ae ON ad.assessment_element_id = ae.id
        WHERE ae.id IS NULL;
        
        IF orphaned_deficiencies > 0 THEN
            RAISE WARNING 'Found % orphaned assessment_deficiencies records', orphaned_deficiencies;
            -- Delete orphaned deficiencies
            DELETE FROM assessment_deficiencies 
            WHERE assessment_element_id NOT IN (SELECT id FROM assessment_elements);
            RAISE NOTICE 'Cleaned up % orphaned deficiency records', orphaned_deficiencies;
        END IF;
    END IF;
    
    RAISE NOTICE 'Data integrity check completed.';
END
$$;

-- Migrate localStorage assessment data to proper database structure
DO $$
DECLARE
    assessment_record RECORD;
    pre_assessment_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Migrating assessment workflow data...';
    
    -- Update assessments that might be missing key fields
    FOR assessment_record IN 
        SELECT id, building_id, status, created_at 
        FROM assessments 
        WHERE status IS NULL OR status = ''
    LOOP
        -- Set default status for assessments without status
        UPDATE assessments 
        SET status = CASE 
            WHEN EXISTS (
                SELECT 1 FROM assessment_elements 
                WHERE assessment_id = assessment_record.id 
                AND condition_rating IS NOT NULL
            ) THEN 'completed'
            ELSE 'in_progress'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = assessment_record.id;
    END LOOP;
    
    -- Ensure all assessments have corresponding pre-assessments
    FOR assessment_record IN 
        SELECT a.id, a.building_id, a.created_at, b.name as building_name, b.type as building_type, b.square_footage
        FROM assessments a
        JOIN buildings b ON a.building_id = b.id
    LOOP
        -- Check if pre-assessment exists
        SELECT EXISTS (
            SELECT 1 FROM pre_assessments 
            WHERE assessment_id = assessment_record.id
        ) INTO pre_assessment_exists;
        
        IF NOT pre_assessment_exists THEN
            -- Create default pre-assessment
            INSERT INTO pre_assessments (
                assessment_id,
                building_id,
                assessment_type,
                assessment_date,
                assessment_scope,
                building_size,
                building_type,
                replacement_value,
                selected_elements,
                checklist,
                status,
                created_at,
                updated_at
            ) VALUES (
                assessment_record.id,
                assessment_record.building_id,
                'Annual',
                assessment_record.created_at::date,
                'Full',
                COALESCE(assessment_record.square_footage, 10000),
                assessment_record.building_type,
                COALESCE(assessment_record.square_footage, 10000) * 250, -- Default $250/sqft
                '[]'::jsonb, -- Empty elements array
                '{
                    "buildingPlans": false,
                    "accessPermissions": false,
                    "safetyEquipment": false,
                    "previousReports": false,
                    "keyStakeholders": false,
                    "weatherConditions": false,
                    "emergencyProcedures": false,
                    "equipmentCalibration": false
                }'::jsonb,
                'completed',
                assessment_record.created_at,
                CURRENT_TIMESTAMP
            );
            
            RAISE NOTICE 'Created pre-assessment for assessment %', assessment_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Assessment workflow migration completed.';
END
$$;

-- Update FCI calculations and ensure data consistency
DO $$
DECLARE
    assessment_record RECORD;
    total_repair_cost DECIMAL(12,2);
    total_elements INTEGER;
    fci_score DECIMAL(10,6);
    replacement_value DECIMAL(12,2);
BEGIN
    RAISE NOTICE 'Updating FCI calculations...';
    
    FOR assessment_record IN 
        SELECT a.id, a.building_id, pa.replacement_value
        FROM assessments a
        LEFT JOIN pre_assessments pa ON a.id = pa.assessment_id
    LOOP
        -- Calculate total repair cost from deficiencies
        SELECT COALESCE(SUM(ad.cost), 0) INTO total_repair_cost
        FROM assessment_elements ae
        LEFT JOIN assessment_deficiencies ad ON ae.id = ad.assessment_element_id
        WHERE ae.assessment_id = assessment_record.id;
        
        -- Get replacement value
        SELECT COALESCE(pa.replacement_value, 1000000) INTO replacement_value
        FROM pre_assessments pa
        WHERE pa.assessment_id = assessment_record.id;
        
        -- Calculate FCI
        IF replacement_value > 0 THEN
            fci_score := total_repair_cost / replacement_value;
        ELSE
            fci_score := 0;
        END IF;
        
        -- Update assessment with calculated values
        UPDATE assessments 
        SET 
            total_repair_cost = total_repair_cost,
            fci_score = fci_score,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = assessment_record.id;
        
        RAISE DEBUG 'Updated FCI for assessment %: % (repair: %, replacement: %)', 
                   assessment_record.id, fci_score, total_repair_cost, replacement_value;
    END LOOP;
    
    RAISE NOTICE 'FCI calculations updated.';
END
$$;

-- Generate reports for completed assessments that don't have them
DO $$
DECLARE
    assessment_record RECORD;
    report_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Generating missing reports...';
    
    -- Check if reports table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') THEN
        FOR assessment_record IN 
            SELECT a.id, a.building_id, a.total_repair_cost, a.fci_score, a.created_at,
                   b.name as building_name, b.city, b.state, b.type as building_type, b.square_footage,
                   pa.replacement_value, pa.assessor_name
            FROM assessments a
            JOIN buildings b ON a.building_id = b.id
            LEFT JOIN pre_assessments pa ON a.id = pa.assessment_id
            WHERE a.status = 'completed'
        LOOP
            -- Check if report exists
            SELECT EXISTS (
                SELECT 1 FROM reports 
                WHERE assessment_id = assessment_record.id
            ) INTO report_exists;
            
            IF NOT report_exists THEN
                -- Create report
                INSERT INTO reports (
                    assessment_id,
                    building_id,
                    title,
                    description,
                    report_type,
                    status,
                    assessment_date,
                    fci_score,
                    total_repair_cost,
                    replacement_value,
                    immediate_repair_cost,
                    short_term_repair_cost,
                    long_term_repair_cost,
                    element_count,
                    deficiency_count,
                    building_name,
                    city,
                    state,
                    building_type,
                    square_footage,
                    assessor_name,
                    executive_summary,
                    created_at,
                    updated_at
                ) VALUES (
                    assessment_record.id,
                    assessment_record.building_id,
                    'Facility Condition Assessment - ' || assessment_record.building_name,
                    'Comprehensive facility condition assessment report',
                    'facility_condition',
                    'published',
                    assessment_record.created_at::date,
                    COALESCE(assessment_record.fci_score, 0),
                    COALESCE(assessment_record.total_repair_cost, 0),
                    COALESCE(assessment_record.replacement_value, 0),
                    COALESCE(assessment_record.total_repair_cost * 0.3, 0), -- 30% immediate
                    COALESCE(assessment_record.total_repair_cost * 0.4, 0), -- 40% short-term
                    COALESCE(assessment_record.total_repair_cost * 0.3, 0), -- 30% long-term
                    (SELECT COUNT(*) FROM assessment_elements WHERE assessment_id = assessment_record.id),
                    (SELECT COUNT(*) FROM assessment_deficiencies ad 
                     JOIN assessment_elements ae ON ad.assessment_element_id = ae.id 
                     WHERE ae.assessment_id = assessment_record.id),
                    assessment_record.building_name,
                    assessment_record.city,
                    assessment_record.state,
                    assessment_record.building_type,
                    assessment_record.square_footage,
                    COALESCE(assessment_record.assessor_name, 'System Generated'),
                    'This facility condition assessment reveals an FCI score of ' || 
                    COALESCE(assessment_record.fci_score, 0)::text || 
                    ', indicating the overall condition of the building.',
                    assessment_record.created_at,
                    CURRENT_TIMESTAMP
                );
                
                RAISE NOTICE 'Generated report for assessment %', assessment_record.id;
            END IF;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Report generation completed.';
END
$$;

-- Add any missing indexes for performance
DO $$
BEGIN
    RAISE NOTICE 'Creating performance indexes...';
    
    -- Assessments indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_building_id ON assessments(building_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_status ON assessments(status);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
    
    -- Assessment elements indexes
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_elements_assessment_id ON assessment_elements(assessment_id);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_elements_element_id ON assessment_elements(element_id);
    
    -- Assessment deficiencies indexes (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_deficiencies') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_deficiencies_element_id ON assessment_deficiencies(assessment_element_id);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_deficiencies_category ON assessment_deficiencies(category);
    END IF;
    
    -- Reports indexes (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_assessment_id ON reports(assessment_id);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_building_id ON reports(building_id);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status ON reports(status);
    END IF;
    
    RAISE NOTICE 'Performance indexes created.';
END
$$;

-- Final data validation
DO $$
DECLARE
    total_assessments INTEGER;
    total_elements INTEGER;
    total_deficiencies INTEGER;
    total_reports INTEGER;
    total_pre_assessments INTEGER;
BEGIN
    RAISE NOTICE 'Performing final data validation...';
    
    SELECT COUNT(*) INTO total_assessments FROM assessments;
    SELECT COUNT(*) INTO total_elements FROM assessment_elements;
    SELECT COUNT(*) INTO total_pre_assessments FROM pre_assessments;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_deficiencies') THEN
        SELECT COUNT(*) INTO total_deficiencies FROM assessment_deficiencies;
    ELSE
        total_deficiencies := 0;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') THEN
        SELECT COUNT(*) INTO total_reports FROM reports;
    ELSE
        total_reports := 0;
    END IF;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Total Assessments: %', total_assessments;
    RAISE NOTICE 'Total Assessment Elements: %', total_elements;
    RAISE NOTICE 'Total Deficiencies: %', total_deficiencies;
    RAISE NOTICE 'Total Pre-Assessments: %', total_pre_assessments;
    RAISE NOTICE 'Total Reports: %', total_reports;
    RAISE NOTICE '========================';
    
    -- Validate referential integrity
    PERFORM 1 FROM assessments a
    LEFT JOIN buildings b ON a.building_id = b.id
    WHERE b.id IS NULL;
    
    IF FOUND THEN
        RAISE WARNING 'Some assessments reference non-existent buildings!';
    ELSE
        RAISE NOTICE 'All assessments have valid building references.';
    END IF;
    
    RAISE NOTICE 'Data migration completed successfully!';
END
$$;

COMMIT;

-- Clean up backup tables (uncomment if you want to keep them)
-- DROP TABLE IF EXISTS assessments_backup;
-- DROP TABLE IF EXISTS assessment_elements_backup;
-- DROP TABLE IF EXISTS assessment_deficiencies_backup;
-- DROP TABLE IF EXISTS reports_backup;
-- DROP TABLE IF EXISTS pre_assessments_backup;

\echo 'Migration completed successfully! Backup tables preserved for safety.'