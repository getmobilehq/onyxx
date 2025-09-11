-- ONYX REPORT DATABASE SCHEMA EXPORT
-- Complete PostgreSQL schema for Onyx Report application
-- Generated from production database

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS assessment_deficiencies CASCADE;
DROP TABLE IF EXISTS assessment_elements CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS pre_assessments CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS elements CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- Multi-tenant architecture - each organization is isolated
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'professional',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_tokens INTEGER DEFAULT 100,
    subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subscription_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. USERS TABLE
-- User management with role-based access control
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assessor' CHECK (role IN ('admin', 'manager', 'assessor')),
    phone VARCHAR(50),
    job_title VARCHAR(100),
    avatar_url TEXT,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    refresh_token TEXT,
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id)
);

-- ============================================================================
-- 3. TOKENS TABLE
-- Registration tokens system (legacy - now simplified registration)
-- ============================================================================
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    organization_name VARCHAR(255),
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. BUILDINGS TABLE
-- Building inventory management with complete facility details
-- ============================================================================
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    street_address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    type VARCHAR(100), -- office, retail, industrial, etc.
    building_type VARCHAR(255) DEFAULT 'Office', -- Normalized building type
    year_built INTEGER,
    square_footage INTEGER,
    number_of_floors INTEGER,
    primary_use VARCHAR(200),
    occupancy_type VARCHAR(100),
    construction_type VARCHAR(100),
    last_renovation_year INTEGER,
    owner_name VARCHAR(255),
    owner_contact VARCHAR(255),
    manager_name VARCHAR(255),
    manager_contact VARCHAR(255),
    description TEXT,
    notes TEXT,
    image_url TEXT,
    replacement_value NUMERIC(15, 2),
    cost_per_sqft NUMERIC(10, 2) DEFAULT 0.00,
    annual_operating_cost NUMERIC(12, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_by_user_id UUID -- Additional creator reference
);

-- ============================================================================
-- 5. ELEMENTS TABLE
-- Uniformat II building elements classification system
-- ============================================================================
CREATE TABLE elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    major_group VARCHAR(100), -- A - Substructure, B - Shell, etc.
    group_element VARCHAR(200), -- A10 - Foundations, B10 - Superstructure, etc.
    individual_element VARCHAR(300), -- A1010 - Standard Foundations, etc.
    category VARCHAR(100),
    description TEXT,
    parent_code VARCHAR(20),
    level INTEGER,
    typical_life_years INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. ASSESSMENTS TABLE
-- Main assessment records with workflow status tracking
-- ============================================================================
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    type VARCHAR(100) DEFAULT 'routine', -- Legacy field
    assessment_type VARCHAR(255) DEFAULT 'field_assessment',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    start_date TIMESTAMP,
    completed_at TIMESTAMP,
    completion_date TIMESTAMP, -- Duplicate for compatibility
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_to UUID, -- Additional assignee reference
    weather_conditions VARCHAR(100),
    temperature_f INTEGER,
    total_deficiency_cost NUMERIC(12, 2) DEFAULT 0,
    priority_1_cost NUMERIC(12, 2) DEFAULT 0,
    priority_2_cost NUMERIC(12, 2) DEFAULT 0,
    priority_3_cost NUMERIC(12, 2) DEFAULT 0,
    priority_4_cost NUMERIC(12, 2) DEFAULT 0,
    fci_score NUMERIC(5, 4),
    overall_condition VARCHAR(50),
    assessor_notes TEXT,
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id),
    created_by UUID -- Additional creator reference
);

-- ============================================================================
-- 7. ASSESSMENT_ELEMENTS TABLE
-- Junction table linking assessments to elements with condition ratings
-- ============================================================================
CREATE TABLE assessment_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    element_id UUID REFERENCES elements(id),
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    condition_notes TEXT,
    quantity NUMERIC(10, 2),
    unit_of_measure VARCHAR(50),
    unit_cost NUMERIC(10, 2),
    total_cost NUMERIC(12, 2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 4),
    deficiency_type VARCHAR(100),
    action_required VARCHAR(100),
    estimated_remaining_life_years INTEGER,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, element_id)
);

-- ============================================================================
-- 8. ASSESSMENT_DEFICIENCIES TABLE
-- Detailed deficiency tracking with cost estimation
-- ============================================================================
CREATE TABLE assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_element_id UUID REFERENCES assessment_elements(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    estimated_cost NUMERIC(12, 2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. PRE_ASSESSMENTS TABLE
-- Pre-assessment phase data collection
-- ============================================================================
CREATE TABLE pre_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100),
    assessment_date DATE,
    assessment_scope TEXT,
    building_size INTEGER,
    building_type VARCHAR(100),
    replacement_value NUMERIC(15, 2),
    selected_elements JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '{}'::jsonb,
    additional_notes TEXT,
    assessor_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id UUID REFERENCES users(id)
);

-- ============================================================================
-- 10. REPORTS TABLE
-- Generated reports with PDF storage and approval workflow
-- ============================================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id),
    assessment_id UUID REFERENCES assessments(id),
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    executive_summary TEXT,
    findings JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    data JSONB DEFAULT '{}'::jsonb,
    generated_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 11. AUDIT_LOGS TABLE
-- Security and compliance audit trail
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations indexes
CREATE INDEX idx_organizations_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_created ON organizations(created_at);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_role ON users(role);

-- Buildings indexes
CREATE INDEX idx_buildings_organization ON buildings(organization_id);
CREATE INDEX idx_buildings_type ON buildings(building_type);
CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_buildings_created ON buildings(created_at);

-- Elements indexes
CREATE INDEX idx_elements_code ON elements(code);
CREATE INDEX idx_elements_major_group ON elements(major_group);
CREATE INDEX idx_elements_active ON elements(is_active);

-- Assessments indexes
CREATE INDEX idx_assessments_building ON assessments(building_id);
CREATE INDEX idx_assessments_organization ON assessments(organization_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_assigned ON assessments(assigned_to_user_id);
CREATE INDEX idx_assessments_created ON assessments(created_at);
CREATE INDEX idx_assessments_completed ON assessments(completed_at);

-- Assessment Elements indexes
CREATE INDEX idx_assessment_elements_assessment ON assessment_elements(assessment_id);
CREATE INDEX idx_assessment_elements_element ON assessment_elements(element_id);
CREATE INDEX idx_assessment_elements_rating ON assessment_elements(condition_rating);

-- Assessment Deficiencies indexes
CREATE INDEX idx_deficiencies_element ON assessment_deficiencies(assessment_element_id);
CREATE INDEX idx_deficiencies_category ON assessment_deficiencies(category);
CREATE INDEX idx_deficiencies_priority ON assessment_deficiencies(priority);

-- Reports indexes
CREATE INDEX idx_reports_organization ON reports(organization_id);
CREATE INDEX idx_reports_building ON reports(building_id);
CREATE INDEX idx_reports_assessment ON reports(assessment_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_generated ON reports(generated_at);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- SAMPLE DATA INSERTS
-- ============================================================================

-- Insert default organization
INSERT INTO organizations (id, name, email) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Demo Organization', 'admin@onyx.com');

-- Insert default admin user
INSERT INTO users (id, organization_id, name, email, password_hash, role) VALUES 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User', 'admin@onyx.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');

-- ============================================================================
-- UNIFORMAT II ELEMENTS DATA
-- ============================================================================

-- A - SUBSTRUCTURE
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('A1010', 'A1010 - Standard Foundations', 'A - Substructure', 'A10 - Foundations', 'A1010 - Standard Foundations'),
('A1020', 'A1020 - Special Foundations', 'A - Substructure', 'A10 - Foundations', 'A1020 - Special Foundations'),
('A2010', 'A2010 - Basement Excavation', 'A - Substructure', 'A20 - Basement Construction', 'A2010 - Basement Excavation'),
('A2020', 'A2020 - Basement Walls', 'A - Substructure', 'A20 - Basement Construction', 'A2020 - Basement Walls');

-- B - SHELL
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('B1010', 'B1010 - Floor Construction', 'B - Shell', 'B10 - Superstructure', 'B1010 - Floor Construction'),
('B1020', 'B1020 - Roof Construction', 'B - Shell', 'B10 - Superstructure', 'B1020 - Roof Construction'),
('B2010', 'B2010 - Exterior Walls', 'B - Shell', 'B20 - Exterior Enclosure', 'B2010 - Exterior Walls'),
('B2020', 'B2020 - Exterior Windows', 'B - Shell', 'B20 - Exterior Enclosure', 'B2020 - Exterior Windows'),
('B2030', 'B2030 - Exterior Doors', 'B - Shell', 'B20 - Exterior Enclosure', 'B2030 - Exterior Doors'),
('B3010', 'B3010 - Roof Coverings', 'B - Shell', 'B30 - Roofing', 'B3010 - Roof Coverings'),
('B3020', 'B3020 - Roof Openings', 'B - Shell', 'B30 - Roofing', 'B3020 - Roof Openings');

-- C - INTERIORS
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('C1010', 'C1010 - Partitions', 'C - Interiors', 'C10 - Interior Construction', 'C1010 - Partitions'),
('C1020', 'C1020 - Interior Doors', 'C - Interiors', 'C10 - Interior Construction', 'C1020 - Interior Doors'),
('C1030', 'C1030 - Fittings', 'C - Interiors', 'C10 - Interior Construction', 'C1030 - Fittings'),
('C2010', 'C2010 - Stair Construction', 'C - Interiors', 'C20 - Stairs', 'C2010 - Stair Construction'),
('C2020', 'C2020 - Stair Finishes', 'C - Interiors', 'C20 - Stairs', 'C2020 - Stair Finishes'),
('C3010', 'C3010 - Wall Finishes', 'C - Interiors', 'C30 - Interior Finishes', 'C3010 - Wall Finishes'),
('C3020', 'C3020 - Floor Finishes', 'C - Interiors', 'C30 - Interior Finishes', 'C3020 - Floor Finishes'),
('C3030', 'C3030 - Ceiling Finishes', 'C - Interiors', 'C30 - Interior Finishes', 'C3030 - Ceiling Finishes');

-- D - SERVICES
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('D1010', 'D1010 - Elevators & Lifts', 'D - Services', 'D10 - Conveying', 'D1010 - Elevators & Lifts'),
('D1020', 'D1020 - Escalators', 'D - Services', 'D10 - Conveying', 'D1020 - Escalators'),
('D2010', 'D2010 - Plumbing Fixtures', 'D - Services', 'D20 - Plumbing', 'D2010 - Plumbing Fixtures'),
('D2020', 'D2020 - Domestic Water Distribution', 'D - Services', 'D20 - Plumbing', 'D2020 - Domestic Water Distribution'),
('D2030', 'D2030 - Sanitary Drainage', 'D - Services', 'D20 - Plumbing', 'D2030 - Sanitary Drainage'),
('D3010', 'D3010 - Energy Supply', 'D - Services', 'D30 - HVAC', 'D3010 - Energy Supply'),
('D3020', 'D3020 - Heat Generating Systems', 'D - Services', 'D30 - HVAC', 'D3020 - Heat Generating Systems'),
('D3030', 'D3030 - Cooling Generating Systems', 'D - Services', 'D30 - HVAC', 'D3030 - Cooling Generating Systems'),
('D3040', 'D3040 - Distribution Systems', 'D - Services', 'D30 - HVAC', 'D3040 - Distribution Systems'),
('D3050', 'D3050 - Terminal & Package Units', 'D - Services', 'D30 - HVAC', 'D3050 - Terminal & Package Units'),
('D4010', 'D4010 - Sprinklers', 'D - Services', 'D40 - Fire Protection', 'D4010 - Sprinklers'),
('D4020', 'D4020 - Standpipes', 'D - Services', 'D40 - Fire Protection', 'D4020 - Standpipes'),
('D5010', 'D5010 - Electrical Service & Distribution', 'D - Services', 'D50 - Electrical', 'D5010 - Electrical Service & Distribution'),
('D5020', 'D5020 - Lighting & Branch Wiring', 'D - Services', 'D50 - Electrical', 'D5020 - Lighting & Branch Wiring'),
('D5030', 'D5030 - Communications & Security', 'D - Services', 'D50 - Electrical', 'D5030 - Communications & Security');

-- E - EQUIPMENT & FURNISHINGS
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('E1010', 'E1010 - Commercial Equipment', 'E - Equipment & Furnishings', 'E10 - Equipment', 'E1010 - Commercial Equipment'),
('E1020', 'E1020 - Institutional Equipment', 'E - Equipment & Furnishings', 'E10 - Equipment', 'E1020 - Institutional Equipment'),
('E2010', 'E2010 - Fixed Furnishings', 'E - Equipment & Furnishings', 'E20 - Furnishings', 'E2010 - Fixed Furnishings');

-- F - SPECIAL CONSTRUCTION
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('F1010', 'F1010 - Special Structures', 'F - Special Construction', 'F10 - Special Construction', 'F1010 - Special Structures'),
('F2010', 'F2010 - Building Elements Demolition', 'F - Special Construction', 'F20 - Selective Demolition', 'F2010 - Building Elements Demolition');

-- G - BUILDING SITEWORK
INSERT INTO elements (code, name, major_group, group_element, individual_element) VALUES 
('G1010', 'G1010 - Site Clearing', 'G - Building Sitework', 'G10 - Site Preparation', 'G1010 - Site Clearing'),
('G2010', 'G2010 - Roadways', 'G - Building Sitework', 'G20 - Site Improvements', 'G2010 - Roadways'),
('G2020', 'G2020 - Parking Lots', 'G - Building Sitework', 'G20 - Site Improvements', 'G2020 - Parking Lots'),
('G2030', 'G2030 - Pedestrian Paving', 'G - Building Sitework', 'G20 - Site Improvements', 'G2030 - Pedestrian Paving'),
('G2040', 'G2040 - Site Development', 'G - Building Sitework', 'G20 - Site Improvements', 'G2040 - Site Development'),
('G2050', 'G2050 - Landscaping', 'G - Building Sitework', 'G20 - Site Improvements', 'G2050 - Landscaping'),
('G3010', 'G3010 - Water Supply', 'G - Building Sitework', 'G30 - Site Civil/Mechanical Utilities', 'G3010 - Water Supply'),
('G3020', 'G3020 - Sanitary Sewer', 'G - Building Sitework', 'G30 - Site Civil/Mechanical Utilities', 'G3020 - Sanitary Sewer'),
('G3030', 'G3030 - Storm Sewer', 'G - Building Sitework', 'G30 - Site Civil/Mechanical Utilities', 'G3030 - Storm Sewer'),
('G4010', 'G4010 - Electrical Distribution', 'G - Building Sitework', 'G40 - Site Electrical Utilities', 'G4010 - Electrical Distribution'),
('G4020', 'G4020 - Site Lighting', 'G - Building Sitework', 'G40 - Site Electrical Utilities', 'G4020 - Site Lighting');

-- ============================================================================
-- SCHEMA EXPORT COMPLETE
-- ============================================================================

-- Database Information
SELECT 'ONYX REPORT DATABASE SCHEMA EXPORTED SUCCESSFULLY' as status;
SELECT 'Total Tables: 11' as info;
SELECT 'Total Elements: 50 Uniformat II Classifications' as elements;
SELECT 'Default Admin: admin@onyx.com / password123' as credentials;

-- End of Schema Export