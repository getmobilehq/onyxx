-- ONYX Database Setup Script for Render PostgreSQL
-- Database: adakole_onyx232
-- Run this script in order to set up all tables

-- 1. Create Organizations table
CREATE TABLE IF NOT EXISTS organizations (
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

-- 2. Create Users table with organization reference
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assessor',
    phone VARCHAR(50),
    job_title VARCHAR(100),
    avatar_url TEXT,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    building_type VARCHAR(100),
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
    replacement_value DECIMAL(15, 2),
    annual_operating_cost DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- 4. Create Elements table (Uniformat II classification)
CREATE TABLE IF NOT EXISTS elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    parent_code VARCHAR(20),
    level INTEGER,
    typical_life_years INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Assessments table with additional columns
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100) DEFAULT 'routine',
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_date DATE,
    start_date TIMESTAMP,
    completion_date TIMESTAMP,
    assigned_to UUID REFERENCES users(id),
    weather_conditions VARCHAR(100),
    temperature_f INTEGER,
    total_deficiency_cost DECIMAL(12, 2) DEFAULT 0,
    priority_1_cost DECIMAL(12, 2) DEFAULT 0,
    priority_2_cost DECIMAL(12, 2) DEFAULT 0,
    priority_3_cost DECIMAL(12, 2) DEFAULT 0,
    priority_4_cost DECIMAL(12, 2) DEFAULT 0,
    fci_score DECIMAL(5, 4),
    overall_condition VARCHAR(50),
    assessor_notes TEXT,
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- 6. Create Assessment Elements table
CREATE TABLE IF NOT EXISTS assessment_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    element_id UUID REFERENCES elements(id),
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    condition_notes TEXT,
    quantity DECIMAL(10, 2),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 4),
    deficiency_type VARCHAR(100),
    action_required VARCHAR(100),
    estimated_remaining_life_years INTEGER,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Assessment Deficiencies table
CREATE TABLE IF NOT EXISTS assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_element_id UUID REFERENCES assessment_elements(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(12, 2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Reports table
CREATE TABLE IF NOT EXISTS reports (
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

-- 9. Create Pre-Assessments table
CREATE TABLE IF NOT EXISTS pre_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100),
    assessment_date DATE,
    assessment_scope TEXT,
    building_size INTEGER,
    building_type VARCHAR(100),
    replacement_value DECIMAL(15, 2),
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

-- 10. Create Audit Logs table for security
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Create indexes for better performance
CREATE INDEX idx_buildings_org ON buildings(organization_id);
CREATE INDEX idx_assessments_building ON assessments(building_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessment_elements_assessment ON assessment_elements(assessment_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Insert default organization
INSERT INTO organizations (id, name, email, subscription_plan, subscription_status, subscription_tokens)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Organization',
    'admin@onyx.com',
    'professional',
    'active',
    100
) ON CONFLICT (id) DO NOTHING;

-- Insert admin user (password: password123)
INSERT INTO users (id, organization_id, name, email, password, role)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Admin User',
    'admin@onyx.com',
    '$2a$10$rM6hFkCHAxBqHQAORafVB.R0l9j1V2XeU6D1FdO2.sH2LKI8FxXDO',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Seed Uniformat II elements
INSERT INTO elements (code, name, category, level, typical_life_years) VALUES
-- A - Substructure
('A', 'Substructure', 'Substructure', 1, 75),
('A10', 'Foundations', 'Substructure', 2, 75),
('A20', 'Basement Construction', 'Substructure', 2, 75),

-- B - Shell
('B', 'Shell', 'Shell', 1, 50),
('B10', 'Superstructure', 'Shell', 2, 75),
('B20', 'Exterior Enclosure', 'Shell', 2, 40),
('B30', 'Roofing', 'Shell', 2, 20),

-- C - Interiors
('C', 'Interiors', 'Interiors', 1, 20),
('C10', 'Interior Construction', 'Interiors', 2, 30),
('C20', 'Stairs', 'Interiors', 2, 50),
('C30', 'Interior Finishes', 'Interiors', 2, 15),

-- D - Services
('D', 'Services', 'Services', 1, 25),
('D10', 'Conveying', 'Services', 2, 25),
('D20', 'Plumbing', 'Services', 2, 30),
('D30', 'HVAC', 'Services', 2, 20),
('D40', 'Fire Protection', 'Services', 2, 30),
('D50', 'Electrical', 'Services', 2, 30),

-- E - Equipment & Furnishings
('E', 'Equipment & Furnishings', 'Equipment', 1, 15),
('E10', 'Equipment', 'Equipment', 2, 15),
('E20', 'Furnishings', 'Equipment', 2, 10),

-- F - Special Construction & Demolition
('F', 'Special Construction & Demolition', 'Special', 1, 30),
('F10', 'Special Construction', 'Special', 2, 30),
('F20', 'Facility Remediation', 'Special', 2, 0),

-- G - Building Sitework
('G', 'Building Sitework', 'Sitework', 1, 25),
('G10', 'Site Preparation', 'Sitework', 2, 0),
('G20', 'Site Improvements', 'Sitework', 2, 25),
('G30', 'Site Civil/Mechanical Utilities', 'Sitework', 2, 40),
('G40', 'Site Electrical Utilities', 'Sitework', 2, 30)
ON CONFLICT (code) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'Default admin user: admin@onyx.com / password123';
END $$;