-- Simple migration to update FCI calculations

BEGIN;

-- Update FCI calculations for all assessments
DO $$
DECLARE
    assessment_record RECORD;
    calc_total_repair_cost DECIMAL(12,2);
    calc_fci_score DECIMAL(10,6);
    calc_replacement_value DECIMAL(12,2);
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Updating FCI calculations for all assessments...';
    
    FOR assessment_record IN 
        SELECT a.id, a.building_id, pa.replacement_value
        FROM assessments a
        LEFT JOIN pre_assessments pa ON a.id = pa.assessment_id
    LOOP
        -- Calculate total repair cost from deficiencies
        SELECT COALESCE(SUM(ad.cost), 0) INTO calc_total_repair_cost
        FROM assessment_elements ae
        LEFT JOIN assessment_deficiencies ad ON ae.id = ad.assessment_element_id
        WHERE ae.assessment_id = assessment_record.id;
        
        -- Get replacement value from pre-assessment or set default
        SELECT COALESCE(pa.replacement_value, 1000000) INTO calc_replacement_value
        FROM pre_assessments pa
        WHERE pa.assessment_id = assessment_record.id;
        
        -- If no pre-assessment replacement value, calculate based on building
        IF calc_replacement_value = 1000000 THEN
            SELECT COALESCE(b.square_footage * 250, 1000000) INTO calc_replacement_value
            FROM buildings b 
            WHERE b.id = assessment_record.building_id;
        END IF;
        
        -- Calculate FCI
        IF calc_replacement_value > 0 THEN
            calc_fci_score := calc_total_repair_cost / calc_replacement_value;
        ELSE
            calc_fci_score := 0;
        END IF;
        
        -- Update assessment with calculated values
        UPDATE assessments 
        SET 
            total_repair_cost = calc_total_repair_cost,
            fci_score = calc_fci_score,
            replacement_value = calc_replacement_value,
            immediate_repair_cost = calc_total_repair_cost * 0.3,
            short_term_repair_cost = calc_total_repair_cost * 0.4,
            long_term_repair_cost = calc_total_repair_cost * 0.3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = assessment_record.id;
        
        updated_count := updated_count + 1;
        
        IF updated_count % 10 = 0 THEN
            RAISE NOTICE 'Updated % assessments...', updated_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated FCI calculations for % assessments.', updated_count;
END
$$;

-- Generate basic reports for completed assessments without reports
DO $$
DECLARE
    assessment_record RECORD;
    report_exists BOOLEAN;
    default_user_id UUID;
    created_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Generating reports for completed assessments...';
    
    -- Get a default user ID for reports
    SELECT id INTO default_user_id FROM users LIMIT 1;
    
    IF default_user_id IS NULL THEN
        RAISE WARNING 'No users found in system. Cannot create reports.';
        RETURN;
    END IF;
    
    FOR assessment_record IN 
        SELECT a.id, a.building_id, a.total_repair_cost, a.fci_score, a.created_at,
               a.replacement_value, a.immediate_repair_cost, a.short_term_repair_cost, a.long_term_repair_cost,
               b.name as building_name, pa.assessor_name
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
            -- Create basic report
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
                assessor_name,
                executive_summary,
                created_by_user_id,
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
                COALESCE(assessment_record.immediate_repair_cost, 0),
                COALESCE(assessment_record.short_term_repair_cost, 0),
                COALESCE(assessment_record.long_term_repair_cost, 0),
                (SELECT COUNT(*) FROM assessment_elements WHERE assessment_id = assessment_record.id),
                (SELECT COUNT(*) FROM assessment_deficiencies ad 
                 JOIN assessment_elements ae ON ad.assessment_element_id = ae.id 
                 WHERE ae.assessment_id = assessment_record.id),
                COALESCE(assessment_record.assessor_name, 'System Generated'),
                'This facility condition assessment reveals an FCI score of ' || 
                COALESCE(assessment_record.fci_score, 0)::text || 
                ', indicating the overall condition of ' || assessment_record.building_name || '.',
                default_user_id,
                assessment_record.created_at,
                CURRENT_TIMESTAMP
            );
            
            created_count := created_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Generated % new reports.', created_count;
END
$$;

-- Final summary
DO $$
DECLARE
    total_assessments INTEGER;
    total_elements INTEGER;
    total_deficiencies INTEGER;
    total_reports INTEGER;
    total_pre_assessments INTEGER;
    avg_fci DECIMAL(10,6);
    completed_assessments INTEGER;
    max_fci DECIMAL(10,6);
    min_fci DECIMAL(10,6);
BEGIN
    RAISE NOTICE 'Migration Summary Report...';
    
    SELECT COUNT(*) INTO total_assessments FROM assessments;
    SELECT COUNT(*) INTO total_elements FROM assessment_elements;
    SELECT COUNT(*) INTO total_pre_assessments FROM pre_assessments;
    SELECT COUNT(*) INTO total_deficiencies FROM assessment_deficiencies;
    SELECT COUNT(*) INTO total_reports FROM reports;
    SELECT COUNT(*) INTO completed_assessments FROM assessments WHERE status = 'completed';
    
    SELECT AVG(fci_score), MAX(fci_score), MIN(fci_score) 
    INTO avg_fci, max_fci, min_fci
    FROM assessments WHERE fci_score > 0;
    
    RAISE NOTICE '=========================================';
    RAISE NOTICE '     ONYX DATA MIGRATION COMPLETE      ';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Total Assessments: %', total_assessments;
    RAISE NOTICE 'Completed Assessments: %', completed_assessments;
    RAISE NOTICE 'Total Assessment Elements: %', total_elements;
    RAISE NOTICE 'Total Deficiencies: %', total_deficiencies;
    RAISE NOTICE 'Total Pre-Assessments: %', total_pre_assessments;
    RAISE NOTICE 'Total Reports: %', total_reports;
    RAISE NOTICE '-----------------------------------------';
    RAISE NOTICE 'FCI Statistics:';
    RAISE NOTICE '  Average FCI: %', COALESCE(ROUND(avg_fci, 4), 0);
    RAISE NOTICE '  Minimum FCI: %', COALESCE(ROUND(min_fci, 4), 0);
    RAISE NOTICE '  Maximum FCI: %', COALESCE(ROUND(max_fci, 4), 0);
    RAISE NOTICE '=========================================';
    
    IF completed_assessments > 0 AND total_reports >= completed_assessments THEN
        RAISE NOTICE 'SUCCESS: All assessments have data integrity!';
    ELSE
        RAISE WARNING 'Please review: Some assessments may need attention.';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END
$$;

COMMIT;