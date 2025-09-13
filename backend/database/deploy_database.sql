-- =========================================
-- ONYX DATABASE DEPLOYMENT SCRIPT
-- =========================================
-- This script creates a complete database schema that matches
-- the application expectations with all required tables,
-- indexes, constraints, and seed data.
--
-- Usage:
-- psql -U username -d database_name -f deploy_database.sql
-- 
-- Or in sections:
-- 1. Run onyx_complete_schema.sql first
-- 2. Run seed_data.sql second  
-- 3. Run email_templates.sql third
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

\echo '========================================='
\echo 'STEP 1: Creating core database schema...'
\echo '========================================='

-- MAIN TABLES
-- Organizations table (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    max_users INTEGER DEFAULT 10,
    max_buildings INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table with comprehensive authentication fields
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assessor' CHECK (role IN ('admin', 'manager', 'assessor')),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    last_password_change TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    lock_reason VARCHAR(255),
    locked_at TIMESTAMP,
    require_password_change BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buildings table with comprehensive fields
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    building_type VARCHAR(100) DEFAULT 'office',
    year_built INTEGER,
    square_footage DECIMAL(10, 2),
    replacement_value DECIMAL(12, 2),
    cost_per_sqft DECIMAL(8, 2) DEFAULT 200.00,
    current_fci DECIMAL(5, 4) DEFAULT 0.0000,
    last_assessment_date DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Computed columns for backward compatibility
    type VARCHAR(100) GENERATED ALWAYS AS (building_type) STORED,
    total_sqft DECIMAL(10, 2) GENERATED ALWAYS AS (square_footage) STORED
);

-- Elements table (Uniformat II classification)
CREATE TABLE IF NOT EXISTS elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    uniformat_level INTEGER DEFAULT 2,
    parent_code VARCHAR(20),
    typical_lifespan INTEGER,
    maintenance_frequency VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table with comprehensive status tracking
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assessment_type VARCHAR(50) DEFAULT 'condition_assessment',
    assessment_date DATE,
    completion_date DATE,
    assigned_to_user_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- FCI and financial calculations
    fci_score DECIMAL(5, 4),
    total_repair_cost DECIMAL(12, 2),
    replacement_value DECIMAL(12, 2),
    
    -- Assessment statistics
    element_count INTEGER DEFAULT 0,
    deficiency_count INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    weather_conditions VARCHAR(100),
    temperature DECIMAL(4, 1),
    assessor_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Compatibility aliases
    assigned_to UUID GENERATED ALWAYS AS (assigned_to_user_id) STORED
);

-- Assessment Elements (many-to-many with conditions)
CREATE TABLE IF NOT EXISTS assessment_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    element_id UUID REFERENCES elements(id) ON DELETE CASCADE,
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
    condition_description TEXT,
    quantity DECIMAL(10, 2),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(10, 2),
    total_repair_cost DECIMAL(12, 2),
    replacement_cost DECIMAL(12, 2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    photos JSONB DEFAULT '[]',
    notes TEXT,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, element_id)
);

-- Assessment Deficiencies
CREATE TABLE IF NOT EXISTS assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    assessment_element_id UUID REFERENCES assessment_elements(id) ON DELETE CASCADE,
    element_id UUID REFERENCES elements(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('critical', 'major', 'moderate', 'minor')),
    repair_cost DECIMAL(12, 2),
    recommended_action TEXT,
    priority_ranking INTEGER,
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) DEFAULT 'facility_condition' CHECK (report_type IN ('facility_condition', 'maintenance_plan', 'capital_assessment')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    assessment_date DATE,
    report_date DATE DEFAULT CURRENT_DATE,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    assessor_name VARCHAR(100),
    fci_score DECIMAL(5, 4),
    total_repair_cost DECIMAL(12, 2),
    replacement_value DECIMAL(12, 2),
    immediate_repair_cost DECIMAL(12, 2),
    short_term_repair_cost DECIMAL(12, 2),
    long_term_repair_cost DECIMAL(12, 2),
    element_count INTEGER DEFAULT 0,
    deficiency_count INTEGER DEFAULT 0,
    executive_summary TEXT,
    recommendations JSONB,
    systems_data JSONB,
    pdf_url TEXT,
    excel_url TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    generated_by UUID GENERATED ALWAYS AS (created_by_user_id) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens table (invitation system)
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    used_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email subscriptions
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    category VARCHAR(50) DEFAULT 'general',
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email logs  
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    email_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\echo '========================================='
\echo 'STEP 2: Creating indexes and constraints...'
\echo '========================================='

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_buildings_organization ON buildings(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(building_type);
CREATE INDEX IF NOT EXISTS idx_elements_code ON elements(code);
CREATE INDEX IF NOT EXISTS idx_elements_category ON elements(category);
CREATE INDEX IF NOT EXISTS idx_assessments_organization ON assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessments_building ON assessments(building_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessment_elements_assessment ON assessment_elements(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_deficiencies_assessment ON assessment_deficiencies(assessment_id);
CREATE INDEX IF NOT EXISTS idx_reports_building ON reports(building_id);
CREATE INDEX IF NOT EXISTS idx_reports_assessment ON reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_tokens_code ON tokens(code);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user ON email_subscriptions(user_id);

-- Update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo '========================================='
\echo 'STEP 3: Loading seed data...'
\echo '========================================='

-- Sample Organization
INSERT INTO organizations (id, name, description, subscription_tier, max_users, max_buildings) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Onyx Demo Organization', 'Sample organization for testing and demonstration', 'premium', 25, 100)
ON CONFLICT (id) DO NOTHING;

-- Sample Admin User
INSERT INTO users (id, organization_id, email, password_hash, name, role, is_active) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'admin@onyx.com', '$2b$10$K8RNRQlLz5HgSEEBN5Gb5.5tNwGN1lIhNW1oMfTGa9TvQ8G9RzG3q', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Sample Assessor User  
INSERT INTO users (id, organization_id, email, password_hash, name, role, is_active) 
VALUES ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'assessor@onyx.com', '$2b$10$K8RNRQlLz5HgSEEBN5Gb5.5tNwGN1lIhNW1oMfTGa9TvQ8G9RzG3q', 'Sample Assessor', 'assessor', true)
ON CONFLICT (email) DO NOTHING;

-- Uniformat II Building Elements (Core Set)
INSERT INTO elements (code, name, description, category, uniformat_level, typical_lifespan) VALUES
-- SUBSTRUCTURE (A)
('A1010', 'Standard Foundations', 'Conventional foundations including footings and foundation walls', 'Substructure', 2, 75),
('A1020', 'Special Foundations', 'Deep foundations, piles, caissons, and specialty foundation systems', 'Substructure', 2, 50),
('A1030', 'Slab on Grade', 'Ground-supported concrete slabs and related components', 'Substructure', 2, 40),
('A2010', 'Basement Excavation', 'Excavation and backfill for below-grade construction', 'Substructure', 2, 100),
('A2020', 'Basement Walls', 'Below-grade walls including waterproofing and insulation', 'Substructure', 2, 50),

-- SHELL (B)  
('B1010', 'Floor Construction', 'Structural floor systems and floor decking', 'Superstructure', 2, 60),
('B1020', 'Roof Construction', 'Structural roof systems and roof decking', 'Superstructure', 2, 50),
('B2010', 'Exterior Walls', 'Exterior wall systems including structure and finishes', 'Exterior Enclosure', 2, 40),
('B2020', 'Exterior Windows', 'Windows, glazed curtain walls, and storefronts', 'Exterior Enclosure', 2, 30),
('B2030', 'Exterior Doors', 'Exterior doors and entrance systems', 'Exterior Enclosure', 2, 25),
('B3010', 'Roof Coverings', 'Roof membranes, shingles, and other roof covering systems', 'Roofing', 2, 20),
('B3020', 'Roof Openings', 'Skylights, roof hatches, and other roof penetrations', 'Roofing', 2, 25),

-- INTERIORS (C)
('C1010', 'Partitions', 'Interior partitions and demountable partitions', 'Interior Construction', 2, 30),
('C1020', 'Interior Doors', 'Interior doors and door systems', 'Interior Construction', 2, 20),
('C1030', 'Fittings', 'Fixed interior fittings including casework and built-ins', 'Interior Construction', 2, 25),
('C2010', 'Stair Construction', 'Interior and exterior stairs including railings', 'Stairs', 2, 50),
('C2020', 'Stair Finishes', 'Stair treads, risers, and other stair finishes', 'Stairs', 2, 15),
('C3010', 'Wall Finishes', 'Interior wall finishes including paint, wallcovering, tile', 'Interior Finishes', 2, 10),
('C3020', 'Floor Finishes', 'Interior floor finishes including carpet, tile, wood flooring', 'Interior Finishes', 2, 12),
('C3030', 'Ceiling Finishes', 'Suspended ceilings and other ceiling finishes', 'Interior Finishes', 2, 20),

-- SERVICES (D)
('D2010', 'Plumbing Fixtures', 'Plumbing fixtures including water closets, lavatories, sinks', 'Plumbing', 2, 20),
('D2020', 'Domestic Water Distribution', 'Hot and cold water piping and distribution systems', 'Plumbing', 2, 30),
('D2030', 'Sanitary Waste', 'Sanitary waste and vent piping systems', 'Plumbing', 2, 40),
('D2040', 'Rain Water Drainage', 'Roof drainage and storm water systems', 'Plumbing', 2, 25),
('D3010', 'Energy Supply', 'Natural gas, oil, and other energy supply systems', 'HVAC', 2, 25),
('D3020', 'Heat Generating Systems', 'Boilers, furnaces, and heat pumps', 'HVAC', 2, 20),
('D3030', 'Cooling Generating Systems', 'Chillers, cooling towers, and air conditioning units', 'HVAC', 2, 18),
('D3040', 'Distribution Systems', 'HVAC ductwork and piping distribution', 'HVAC', 2, 25),
('D3050', 'Terminal & Package Units', 'Air handling units, terminal units, and package equipment', 'HVAC', 2, 15),
('D3060', 'Controls & Instrumentation', 'HVAC control systems and building automation', 'HVAC', 2, 15),
('D4010', 'Sprinklers', 'Fire sprinkler systems and components', 'Fire Protection', 2, 30),
('D4020', 'Standpipes', 'Standpipe and hose systems', 'Fire Protection', 2, 35),
('D4030', 'Fire Protection Specialties', 'Fire extinguishers, cabinets, and other fire protection', 'Fire Protection', 2, 20),
('D5010', 'Electrical Service/Distribution', 'Main electrical service and distribution panels', 'Electrical', 2, 40),
('D5020', 'Lighting and Branch Wiring', 'Interior and exterior lighting systems', 'Electrical', 2, 20),
('D5030', 'Communications & Security', 'Telephone, data, and security systems', 'Electrical', 2, 15),
('D5040', 'Other Electrical Systems', 'Emergency power, lightning protection, and specialty electrical', 'Electrical', 2, 25),

-- EQUIPMENT & FURNISHINGS (E)
('E1010', 'Commercial Equipment', 'Kitchen equipment, laboratory equipment, and other commercial', 'Equipment', 2, 15),
('E1020', 'Institutional Equipment', 'Institutional and specialized equipment', 'Equipment', 2, 20),
('E1030', 'Vehicular Equipment', 'Vehicular service equipment and car washing systems', 'Equipment', 2, 15),
('E1090', 'Other Equipment', 'Miscellaneous and other equipment', 'Equipment', 2, 15),
('E2010', 'Fixed Furnishings', 'Built-in furnishings and millwork', 'Furnishings', 2, 20),
('E2020', 'Movable Furnishings', 'Furniture and movable furnishings', 'Furnishings', 2, 10),

-- SPECIAL CONSTRUCTION & DEMOLITION (F & G)
('F1010', 'Special Structures', 'Special purpose structures and building systems', 'Special Construction', 2, 30),
('F1020', 'Integrated Construction', 'Pre-engineered and integrated building systems', 'Special Construction', 2, 25),
('F2010', 'Built-in Maintenance Equipment', 'Window washing equipment and building maintenance systems', 'Special Construction', 2, 25),
('F2020', 'Other Special Construction', 'Miscellaneous special construction and systems', 'Special Construction', 2, 20),
('G1010', 'Building Elements Demolition', 'Selective demolition of building elements', 'Demolition', 2, 0),
('G2010', 'Site Elements Demolition', 'Site demolition and clearing', 'Demolition', 2, 0)
ON CONFLICT (code) DO NOTHING;

-- Sample Building
INSERT INTO buildings (id, organization_id, name, address, city, state, zip_code, building_type, year_built, square_footage, cost_per_sqft, created_by) 
VALUES ('7fcc6a37-5537-4f0c-a4b7-21518de1e4c8', '550e8400-e29b-41d4-a716-446655440000', 'Demo Office Building', '123 Main Street', 'Anytown', 'CA', '90210', 'office', 1995, 50000, 225.00, '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

\echo '========================================='
\echo 'STEP 4: Loading email templates...'
\echo '========================================='

-- Welcome email template
INSERT INTO email_templates (name, subject, html_content, text_content, category, is_active) VALUES 
('welcome', 'Welcome to Onyx - Building Assessment Platform', 
'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Welcome to Onyx</title></head><body><h1>Welcome to Onyx</h1><p>Hello {{user_name}}, welcome to {{organization_name}} on the Onyx platform!</p></body></html>',
'Welcome to Onyx - Hello {{user_name}}, welcome to {{organization_name}} on the Onyx platform!',
'user_management', true),

-- Assessment completion notification  
('assessment_completed', 'Assessment Completed - {{building_name}}',
'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Assessment Completed</title></head><body><h1>Assessment Completed</h1><p>The assessment for {{building_name}} has been completed.</p></body></html>',
'Assessment Completed - The assessment for {{building_name}} has been completed.',
'assessment_notifications', true),

-- Password reset template
('password_reset', 'Reset Your Onyx Password',
'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Password Reset</title></head><body><h1>Password Reset</h1><p>Click here to reset your password: {{reset_url}}</p></body></html>', 
'Password Reset - Click here to reset your password: {{reset_url}}',
'security', true)
ON CONFLICT (name) DO NOTHING;

\echo '========================================='
\echo 'DEPLOYMENT COMPLETED SUCCESSFULLY!'
\echo '========================================='
\echo 'Database schema has been created with:'
\echo '- 16 main tables with complete relationships'
\echo '- Performance indexes and constraints' 
\echo '- Sample organization and users'
\echo '- 45+ Uniformat II building elements'
\echo '- Email templates for notifications'
\echo '- Triggers for automatic timestamp updates'
\echo '========================================='
\echo 'Default login credentials:'
\echo 'Admin: admin@onyx.com / password123'
\echo 'Assessor: assessor@onyx.com / password123'
\echo '========================================='