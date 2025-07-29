-- Create sample buildings for testing
-- Organization ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (Demo Organization)
-- User ID: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11 (Admin User)

INSERT INTO buildings (
    id,
    organization_id,
    name,
    address,
    city,
    state,
    zip_code,
    building_type,
    year_built,
    square_footage,
    number_of_floors,
    primary_use,
    construction_type,
    replacement_value,
    status,
    created_by
) VALUES 
(
    gen_random_uuid(),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Office Building',
    '123 Business Plaza',
    'New York',
    'NY',
    '10001',
    'Office',
    2015,
    25000,
    5,
    'Commercial Office',
    'Steel Frame',
    3750000.00,
    'active',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    gen_random_uuid(),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Warehouse Facility',
    '456 Industrial Way',
    'Brooklyn',
    'NY',
    '11201',
    'Warehouse',
    2010,
    50000,
    1,
    'Storage and Distribution',
    'Pre-engineered Metal',
    5000000.00,
    'active',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
),
(
    gen_random_uuid(),
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Research Laboratory',
    '789 Science Drive',
    'Boston',
    'MA',
    '02101',
    'Laboratory',
    2020,
    15000,
    3,
    'Research and Development',
    'Concrete',
    4500000.00,
    'active',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Sample buildings created successfully!';
    RAISE NOTICE '3 buildings added to Demo Organization';
END $$;