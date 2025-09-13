-- =============================================================================
-- ONYX PLATFORM - SEED DATA
-- Essential data for initial setup and testing
-- =============================================================================

-- =============================================================================
-- SAMPLE ORGANIZATION
-- =============================================================================
INSERT INTO organizations (id, name, description, industry, size, city, state, country, subscription_plan, subscription_status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Demo Organization',
    'Sample organization for testing and demonstration purposes',
    'Education',
    'Medium (100-500 employees)',
    'New York',
    'NY',
    'USA',
    'professional',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SAMPLE USERS
-- Default password for all users: "password123"
-- Hash generated with bcrypt rounds=10
-- =============================================================================

-- Admin User
INSERT INTO users (
    id, organization_id, name, email, password_hash, role, 
    is_organization_owner, is_active, email_notifications, email_reports
)
VALUES (
    '97fd2f33-4cca-4f1d-88ed-8ae842c45382',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Admin User',
    'admin@onyx.com',
    '$2b$10$8K1p/a0dF.DQN.R1LIQ5O.5F2Z.Vy.xrKv9F5yHhGqFzT5uL7T7Hi',
    'admin',
    true,
    true,
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Manager User
INSERT INTO users (
    id, organization_id, name, email, password_hash, role, 
    is_active, email_notifications, email_reports
)
VALUES (
    '97fd2f33-4cca-4f1d-88ed-8ae842c45383',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Manager User',
    'manager@onyx.com',
    '$2b$10$8K1p/a0dF.DQN.R1LIQ5O.5F2Z.Vy.xrKv9F5yHhGqFzT5uL7T7Hi',
    'manager',
    true,
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Assessor User
INSERT INTO users (
    id, organization_id, name, email, password_hash, role, 
    is_active, email_notifications, email_reports
)
VALUES (
    '97fd2f33-4cca-4f1d-88ed-8ae842c45384',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Assessor User',
    'assessor@onyx.com',
    '$2b$10$8K1p/a0dF.DQN.R1LIQ5O.5F2Z.Vy.xrKv9F5yHhGqFzT5uL7T7Hi',
    'assessor',
    true,
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- UNIFORMAT II BUILDING ELEMENTS
-- Standard building classification system
-- =============================================================================

-- A - SUBSTRUCTURE
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'A1010', 'Standard Foundations', 'A - Substructure', 'A10 - Foundations', 'A1010 - Standard Foundations', 3, 75),
('550e8400-e29b-41d4-a716-446655440002', 'A1020', 'Special Foundations', 'A - Substructure', 'A10 - Foundations', 'A1020 - Special Foundations', 3, 75),
('550e8400-e29b-41d4-a716-446655440003', 'A1030', 'Slab on Grade', 'A - Substructure', 'A10 - Foundations', 'A1030 - Slab on Grade', 3, 50),
('550e8400-e29b-41d4-a716-446655440004', 'A2010', 'Basement Excavation', 'A - Substructure', 'A20 - Basement Construction', 'A2010 - Basement Excavation', 3, 100),
('550e8400-e29b-41d4-a716-446655440005', 'A2020', 'Basement Walls', 'A - Substructure', 'A20 - Basement Construction', 'A2020 - Basement Walls', 3, 75);

-- B - SHELL
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'B1010', 'Floor Construction', 'B - Shell', 'B10 - Superstructure', 'B1010 - Floor Construction', 3, 50),
('550e8400-e29b-41d4-a716-446655440011', 'B1020', 'Roof Construction', 'B - Shell', 'B10 - Superstructure', 'B1020 - Roof Construction', 3, 30),
('550e8400-e29b-41d4-a716-446655440012', 'B2010', 'Exterior Walls', 'B - Shell', 'B20 - Exterior Enclosure', 'B2010 - Exterior Walls', 3, 50),
('550e8400-e29b-41d4-a716-446655440013', 'B2020', 'Exterior Windows', 'B - Shell', 'B20 - Exterior Enclosure', 'B2020 - Exterior Windows', 3, 25),
('550e8400-e29b-41d4-a716-446655440014', 'B2030', 'Exterior Doors', 'B - Shell', 'B20 - Exterior Enclosure', 'B2030 - Exterior Doors', 3, 25),
('550e8400-e29b-41d4-a716-446655440015', 'B3010', 'Roof Coverings', 'B - Shell', 'B30 - Roofing', 'B3010 - Roof Coverings', 3, 20),
('550e8400-e29b-41d4-a716-446655440016', 'B3020', 'Roof Openings', 'B - Shell', 'B30 - Roofing', 'B3020 - Roof Openings', 3, 20);

-- C - INTERIORS
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'C1010', 'Partitions', 'C - Interiors', 'C10 - Interior Construction', 'C1010 - Partitions', 3, 30),
('550e8400-e29b-41d4-a716-446655440021', 'C1020', 'Interior Doors', 'C - Interiors', 'C10 - Interior Construction', 'C1020 - Interior Doors', 3, 25),
('550e8400-e29b-41d4-a716-446655440022', 'C1030', 'Fittings', 'C - Interiors', 'C10 - Interior Construction', 'C1030 - Fittings', 3, 15),
('550e8400-e29b-41d4-a716-446655440023', 'C2010', 'Stair Construction', 'C - Interiors', 'C20 - Stairs', 'C2010 - Stair Construction', 3, 50),
('550e8400-e29b-41d4-a716-446655440024', 'C3010', 'Wall Finishes', 'C - Interiors', 'C30 - Interior Finishes', 'C3010 - Wall Finishes', 3, 15),
('550e8400-e29b-41d4-a716-446655440025', 'C3020', 'Floor Finishes', 'C - Interiors', 'C30 - Interior Finishes', 'C3020 - Floor Finishes', 3, 15),
('550e8400-e29b-41d4-a716-446655440026', 'C3030', 'Ceiling Finishes', 'C - Interiors', 'C30 - Interior Finishes', 'C3030 - Ceiling Finishes', 3, 20);

-- D - SERVICES
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'D1010', 'Elevators & Lifts', 'D - Services', 'D10 - Conveying', 'D1010 - Elevators & Lifts', 3, 25),
('550e8400-e29b-41d4-a716-446655440031', 'D1020', 'Escalators', 'D - Services', 'D10 - Conveying', 'D1020 - Escalators', 3, 20),
('550e8400-e29b-41d4-a716-446655440032', 'D2010', 'Plumbing Fixtures', 'D - Services', 'D20 - Plumbing', 'D2010 - Plumbing Fixtures', 3, 20),
('550e8400-e29b-41d4-a716-446655440033', 'D2020', 'Domestic Water Distribution', 'D - Services', 'D20 - Plumbing', 'D2020 - Domestic Water Distribution', 3, 30),
('550e8400-e29b-41d4-a716-446655440034', 'D2030', 'Sanitary Waste', 'D - Services', 'D20 - Plumbing', 'D2030 - Sanitary Waste', 3, 40),
('550e8400-e29b-41d4-a716-446655440035', 'D3010', 'Energy Supply', 'D - Services', 'D30 - HVAC', 'D3010 - Energy Supply', 3, 20),
('550e8400-e29b-41d4-a716-446655440036', 'D3020', 'Heat Generating Systems', 'D - Services', 'D30 - HVAC', 'D3020 - Heat Generating Systems', 3, 20),
('550e8400-e29b-41d4-a716-446655440037', 'D3030', 'Cooling Generating Systems', 'D - Services', 'D30 - HVAC', 'D3030 - Cooling Generating Systems', 3, 20),
('550e8400-e29b-41d4-a716-446655440038', 'D3040', 'Distribution Systems', 'D - Services', 'D30 - HVAC', 'D3040 - Distribution Systems', 3, 25),
('550e8400-e29b-41d4-a716-446655440039', 'D3050', 'Terminal & Package Units', 'D - Services', 'D30 - HVAC', 'D3050 - Terminal & Package Units', 3, 15),
('550e8400-e29b-41d4-a716-446655440040', 'D4010', 'Sprinklers', 'D - Services', 'D40 - Fire Protection', 'D4010 - Sprinklers', 3, 30),
('550e8400-e29b-41d4-a716-446655440041', 'D4020', 'Standpipes', 'D - Services', 'D40 - Fire Protection', 'D4020 - Standpipes', 3, 40),
('550e8400-e29b-41d4-a716-446655440042', 'D4030', 'Fire Detection & Alarm', 'D - Services', 'D40 - Fire Protection', 'D4030 - Fire Detection & Alarm', 3, 15),
('550e8400-e29b-41d4-a716-446655440043', 'D5010', 'Electrical Service & Distribution', 'D - Services', 'D50 - Electrical', 'D5010 - Electrical Service & Distribution', 3, 30),
('550e8400-e29b-41d4-a716-446655440044', 'D5020', 'Lighting & Branch Wiring', 'D - Services', 'D50 - Electrical', 'D5020 - Lighting & Branch Wiring', 3, 25),
('550e8400-e29b-41d4-a716-446655440045', 'D5030', 'Communications & Security', 'D - Services', 'D50 - Electrical', 'D5030 - Communications & Security', 3, 15),
('550e8400-e29b-41d4-a716-446655440046', 'D5090', 'Other Electrical Systems', 'D - Services', 'D50 - Electrical', 'D5090 - Other Electrical Systems', 3, 20);

-- E - EQUIPMENT & FURNISHINGS
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'E1010', 'Commercial Equipment', 'E - Equipment & Furnishings', 'E10 - Equipment', 'E1010 - Commercial Equipment', 3, 15),
('550e8400-e29b-41d4-a716-446655440051', 'E1020', 'Institutional Equipment', 'E - Equipment & Furnishings', 'E10 - Equipment', 'E1020 - Institutional Equipment', 3, 15),
('550e8400-e29b-41d4-a716-446655440052', 'E1090', 'Other Equipment', 'E - Equipment & Furnishings', 'E10 - Equipment', 'E1090 - Other Equipment', 3, 10),
('550e8400-e29b-41d4-a716-446655440053', 'E2010', 'Fixed Furnishings', 'E - Equipment & Furnishings', 'E20 - Furnishings', 'E2010 - Fixed Furnishings', 3, 15),
('550e8400-e29b-41d4-a716-446655440054', 'E2020', 'Movable Furnishings', 'E - Equipment & Furnishings', 'E20 - Furnishings', 'E2020 - Movable Furnishings', 3, 10);

-- F - SPECIAL CONSTRUCTION & DEMOLITION
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440060', 'F1010', 'Special Structures', 'F - Special Construction', 'F10 - Special Construction', 'F1010 - Special Structures', 3, 40),
('550e8400-e29b-41d4-a716-446655440061', 'F1020', 'Integrated Construction', 'F - Special Construction', 'F10 - Special Construction', 'F1020 - Integrated Construction', 3, 30),
('550e8400-e29b-41d4-a716-446655440062', 'F2010', 'Building Elements Demolition', 'F - Special Construction', 'F20 - Selective Building Demolition', 'F2010 - Building Elements Demolition', 3, 1),
('550e8400-e29b-41d4-a716-446655440063', 'F2020', 'Hazardous Components Abatement', 'F - Special Construction', 'F20 - Selective Building Demolition', 'F2020 - Hazardous Components Abatement', 3, 1);

-- G - BUILDING SITEWORK
INSERT INTO elements (id, code, name, major_group, group_element, individual_element, level, typical_life_years) VALUES
('550e8400-e29b-41d4-a716-446655440070', 'G1010', 'Site Preparation', 'G - Building Sitework', 'G10 - Site Preparation', 'G1010 - Site Preparation', 3, 100),
('550e8400-e29b-41d4-a716-446655440071', 'G1020', 'Site Improvements', 'G - Building Sitework', 'G10 - Site Preparation', 'G1020 - Site Improvements', 3, 25),
('550e8400-e29b-41d4-a716-446655440072', 'G1030', 'Site Mechanical Utilities', 'G - Building Sitework', 'G10 - Site Preparation', 'G1030 - Site Mechanical Utilities', 3, 40),
('550e8400-e29b-41d4-a716-446655440073', 'G1040', 'Site Electrical Utilities', 'G - Building Sitework', 'G10 - Site Preparation', 'G1040 - Site Electrical Utilities', 3, 30),
('550e8400-e29b-41d4-a716-446655440074', 'G2010', 'Roadways', 'G - Building Sitework', 'G20 - Site Improvements', 'G2010 - Roadways', 3, 20),
('550e8400-e29b-41d4-a716-446655440075', 'G2020', 'Parking Lots', 'G - Building Sitework', 'G20 - Site Improvements', 'G2020 - Parking Lots', 3, 15),
('550e8400-e29b-41d4-a716-446655440076', 'G2030', 'Pedestrian Paving', 'G - Building Sitework', 'G20 - Site Improvements', 'G2030 - Pedestrian Paving', 3, 25),
('550e8400-e29b-41d4-a716-446655440077', 'G2040', 'Site Development', 'G - Building Sitework', 'G20 - Site Improvements', 'G2040 - Site Development', 3, 30),
('550e8400-e29b-41d4-a716-446655440078', 'G3010', 'Water Supply', 'G - Building Sitework', 'G30 - Site Mechanical Utilities', 'G3010 - Water Supply', 3, 40),
('550e8400-e29b-41d4-a716-446655440079', 'G3020', 'Sanitary Sewer', 'G - Building Sitework', 'G30 - Site Mechanical Utilities', 'G3020 - Sanitary Sewer', 3, 50),
('550e8400-e29b-41d4-a716-446655440080', 'G3030', 'Storm Sewer', 'G - Building Sitework', 'G30 - Site Mechanical Utilities', 'G3030 - Storm Sewer', 3, 50),
('550e8400-e29b-41d4-a716-446655440081', 'G3040', 'Heating Distribution', 'G - Building Sitework', 'G30 - Site Mechanical Utilities', 'G3040 - Heating Distribution', 3, 30),
('550e8400-e29b-41d4-a716-446655440082', 'G3050', 'Cooling Distribution', 'G - Building Sitework', 'G30 - Site Mechanical Utilities', 'G3050 - Cooling Distribution', 3, 30),
('550e8400-e29b-41d4-a716-446655440083', 'G4010', 'Electrical Distribution', 'G - Building Sitework', 'G40 - Site Electrical Utilities', 'G4010 - Electrical Distribution', 3, 40),
('550e8400-e29b-41d4-a716-446655440084', 'G4020', 'Site Lighting', 'G - Building Sitework', 'G40 - Site Electrical Utilities', 'G4020 - Site Lighting', 3, 20),
('550e8400-e29b-41d4-a716-446655440085', 'G4030', 'Site Communications & Security', 'G - Building Sitework', 'G40 - Site Electrical Utilities', 'G4030 - Site Communications & Security', 3, 15);

-- =============================================================================
-- EMAIL TEMPLATES
-- =============================================================================
INSERT INTO email_templates (id, name, subject, html_template, text_template, category, is_active)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440100',
    'welcome',
    'Welcome to Onyx - Your Account is Ready',
    '<h1>Welcome to Onyx!</h1><p>Your facility assessment account is ready.</p>',
    'Welcome to Onyx! Your facility assessment account is ready.',
    'onboarding',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440101',
    'assessment_completed',
    'Assessment Completed - {{building_name}}',
    '<h1>Assessment Complete</h1><p>The assessment for {{building_name}} has been completed.</p>',
    'Assessment Complete: The assessment for {{building_name}} has been completed.',
    'notifications',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    'report_generated',
    'Report Generated - {{building_name}}',
    '<h1>Report Ready</h1><p>Your facility condition report for {{building_name}} is ready for review.</p>',
    'Report Ready: Your facility condition report for {{building_name}} is ready for review.',
    'notifications',
    true
);

-- =============================================================================
-- SAMPLE BUILDING TYPES FOR COST CALCULATION
-- =============================================================================

-- Sample building for demonstration
INSERT INTO buildings (
    id, organization_id, name, address, city, state, zip_code,
    type, year_built, square_footage, cost_per_sqft, replacement_value,
    created_by_user_id, status
)
VALUES (
    '8a706aa0-a1d6-402f-8ccf-06cda3ae4f1d',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Sample Office Building',
    '123 Main Street',
    'New York',
    'NY',
    '10001',
    'Office',
    1985,
    50000,
    250.00,
    12500000.00,
    '97fd2f33-4cca-4f1d-88ed-8ae842c45382',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- DEFAULT ACCESS TOKENS
-- =============================================================================
INSERT INTO tokens (id, code, status, organization_name, expires_at, created_by)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440200',
    'ONX-DEMO-TEST-01',
    'active',
    'Demo Access Token',
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    '97fd2f33-4cca-4f1d-88ed-8ae842c45382'
) ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- BUILDING COST REFERENCES BY TYPE
-- This helps with automatic replacement value calculations
-- =============================================================================

-- Sample building types with typical costs per square foot
-- These can be used by the application for replacement value estimates

/*
BUILDING TYPE REFERENCE COSTS (USD per sq ft):
- Office: $200-300
- Warehouse: $80-120  
- Retail: $150-250
- School: $180-280
- Hospital: $400-600
- Industrial: $100-180
- Residential: $120-200
- Mixed Use: $180-250
*/

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
SELECT 'Database seed data installation completed successfully!' as status;
SELECT 
    (SELECT COUNT(*) FROM organizations) as organizations_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM elements) as elements_count,
    (SELECT COUNT(*) FROM email_templates) as email_templates_count,
    (SELECT COUNT(*) FROM buildings) as buildings_count,
    (SELECT COUNT(*) FROM tokens) as tokens_count;