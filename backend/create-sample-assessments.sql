-- Create sample assessments for testing analytics
-- Organization ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (Demo Organization)
-- User ID: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (Admin User)

-- Get building IDs first
DO $$
DECLARE
    building1_id UUID;
    building2_id UUID;
    building3_id UUID;
BEGIN
    -- Get the building IDs
    SELECT id INTO building1_id FROM buildings WHERE name = 'Main Office Building' LIMIT 1;
    SELECT id INTO building2_id FROM buildings WHERE name = 'Warehouse Facility' LIMIT 1;
    SELECT id INTO building3_id FROM buildings WHERE name = 'Research Laboratory' LIMIT 1;

    -- Insert sample assessments
    INSERT INTO assessments (
        id,
        organization_id,
        building_id,
        assessment_type,
        status,
        scheduled_date,
        start_date,
        completion_date,
        assigned_to,
        total_deficiency_cost,
        fci_score,
        overall_condition,
        assessor_notes,
        created_by
    ) VALUES 
    (
        gen_random_uuid(),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        building1_id,
        'routine',
        'completed',
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_TIMESTAMP - INTERVAL '30 days',
        CURRENT_TIMESTAMP - INTERVAL '25 days',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        75000.00,
        0.02,
        'Good',
        'Building assessment completed. Total Repair Cost: $75,000. FCI Score: 0.02. Overall condition is good with minor maintenance needed.',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ),
    (
        gen_random_uuid(),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        building2_id,
        'routine',
        'completed',
        CURRENT_DATE - INTERVAL '20 days',
        CURRENT_TIMESTAMP - INTERVAL '20 days',
        CURRENT_TIMESTAMP - INTERVAL '15 days',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        125000.00,
        0.025,
        'Good',
        'Warehouse assessment completed. Total Repair Cost: $125,000. FCI Score: 0.025. Facility in good condition with some HVAC updates needed.',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ),
    (
        gen_random_uuid(),
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        building3_id,
        'routine',
        'completed',
        CURRENT_DATE - INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        45000.00,
        0.01,
        'Excellent',
        'Laboratory assessment completed. Total Repair Cost: $45,000. FCI Score: 0.01. New building in excellent condition.',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    );

    RAISE NOTICE 'Sample assessments created successfully!';
    RAISE NOTICE '3 completed assessments added for analytics testing';
END $$;