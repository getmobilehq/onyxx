-- Complete the data migration with fixed variable names

BEGIN;

-- Update FCI calculations and ensure data consistency
DO $$
DECLARE
    assessment_record RECORD;
    calc_total_repair_cost DECIMAL(12,2);
    calc_fci_score DECIMAL(10,6);
    calc_replacement_value DECIMAL(12,2);
BEGIN
    RAISE NOTICE 'Updating FCI calculations...';
    
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
        
        -- Get replacement value
        SELECT COALESCE(pa.replacement_value, 1000000) INTO calc_replacement_value
        FROM pre_assessments pa
        WHERE pa.assessment_id = assessment_record.id;
        
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
        
        RAISE DEBUG 'Updated FCI for assessment %: % (repair: %, replacement: %)', 
                   assessment_record.id, calc_fci_score, calc_total_repair_cost, calc_replacement_value;
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
    
    FOR assessment_record IN 
        SELECT a.id, a.building_id, a.total_repair_cost, a.fci_score, a.created_at,
               a.replacement_value, a.immediate_repair_cost, a.short_term_repair_cost, a.long_term_repair_cost,
               b.name as building_name, b.city, b.state, b.type as building_type, b.square_footage,
               pa.assessor_name
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
                COALESCE(assessment_record.immediate_repair_cost, 0),
                COALESCE(assessment_record.short_term_repair_cost, 0),
                COALESCE(assessment_record.long_term_repair_cost, 0),
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
            
            RAISE NOTICE 'Generated report for assessment % for building %', assessment_record.id, assessment_record.building_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Report generation completed.';
END
$$;

-- Final validation and summary
DO $$
DECLARE
    total_assessments INTEGER;
    total_elements INTEGER;
    total_deficiencies INTEGER;
    total_reports INTEGER;
    total_pre_assessments INTEGER;
    avg_fci DECIMAL(10,6);
    completed_assessments INTEGER;
BEGIN
    RAISE NOTICE 'Performing final data validation...';
    
    SELECT COUNT(*) INTO total_assessments FROM assessments;
    SELECT COUNT(*) INTO total_elements FROM assessment_elements;
    SELECT COUNT(*) INTO total_pre_assessments FROM pre_assessments;
    SELECT COUNT(*) INTO total_deficiencies FROM assessment_deficiencies;
    SELECT COUNT(*) INTO total_reports FROM reports;
    SELECT COUNT(*) INTO completed_assessments FROM assessments WHERE status = 'completed';
    SELECT AVG(fci_score) INTO avg_fci FROM assessments WHERE fci_score > 0;
    
    RAISE NOTICE '=== FINAL MIGRATION SUMMARY ===';
    RAISE NOTICE 'Total Assessments: %', total_assessments;
    RAISE NOTICE 'Completed Assessments: %', completed_assessments;
    RAISE NOTICE 'Total Assessment Elements: %', total_elements;
    RAISE NOTICE 'Total Deficiencies: %', total_deficiencies;
    RAISE NOTICE 'Total Pre-Assessments: %', total_pre_assessments;
    RAISE NOTICE 'Total Reports: %', total_reports;
    RAISE NOTICE 'Average FCI Score: %', COALESCE(ROUND(avg_fci, 4), 0);
    RAISE NOTICE '================================';
    
    -- Validate that all completed assessments have reports
    IF completed_assessments = total_reports THEN
        RAISE NOTICE 'SUCCESS: All completed assessments have corresponding reports!';
    ELSE
        RAISE WARNING 'MISMATCH: % completed assessments but only % reports', completed_assessments, total_reports;
    END IF;
    
    RAISE NOTICE 'Complete data migration finished successfully!';
END
$$;

COMMIT;