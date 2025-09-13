-- =============================================================================
-- ONYX FACILITY CONDITION ASSESSMENT PLATFORM
-- Complete Database Schema - PostgreSQL
-- Version: 2.0
-- Generated: 2025-09-13
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ORGANIZATIONS TABLE
-- Core multi-tenant organization structure
-- =============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Company Information
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Address Information
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Branding
    logo_url TEXT,
    
    -- Subscription Information
    subscription_plan VARCHAR(50) DEFAULT 'professional',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_tokens INTEGER DEFAULT 100,
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- USERS TABLE
-- User accounts with authentication and preferences
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'assessor' CHECK (role IN ('admin', 'manager', 'assessor', 'viewer')),
    
    -- Contact Information
    phone VARCHAR(50),
    job_title VARCHAR(100),
    avatar_url TEXT,
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_organization_owner BOOLEAN DEFAULT false,
    is_platform_admin BOOLEAN DEFAULT false,
    
    -- Invitation & Signup
    invited_by UUID REFERENCES users(id),
    signup_token UUID,
    
    -- Security & Authentication
    last_login TIMESTAMP,
    last_password_change TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    lock_reason VARCHAR(255),
    locked_at TIMESTAMP,
    require_password_change BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- Email Preferences
    email_notifications BOOLEAN DEFAULT true,
    email_marketing BOOLEAN DEFAULT false,
    email_security_alerts BOOLEAN DEFAULT true,
    email_reports BOOLEAN DEFAULT true,
    preferred_email_format VARCHAR(20) DEFAULT 'html',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- BUILDINGS TABLE
-- Building inventory with detailed characteristics
-- =============================================================================
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT,
    
    -- Location
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Building Characteristics
    type VARCHAR(100), -- Also aliased as building_type in queries
    year_built INTEGER,
    square_footage INTEGER,
    number_of_floors INTEGER,
    primary_use VARCHAR(200),
    occupancy_type VARCHAR(100),
    construction_type VARCHAR(100),
    last_renovation_year INTEGER,
    
    -- Ownership & Management
    owner_name VARCHAR(255),
    owner_contact VARCHAR(255),
    manager_name VARCHAR(255),
    manager_contact VARCHAR(255),
    
    -- Financial Information
    cost_per_sqft DECIMAL(10, 2) DEFAULT 200.00,
    replacement_value DECIMAL(15, 2),
    annual_operating_cost DECIMAL(12, 2),
    
    -- Media
    image_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    -- Audit Fields
    created_by_user_id UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add alias column for backward compatibility
ALTER TABLE buildings ADD COLUMN building_type VARCHAR(100) GENERATED ALWAYS AS (type) STORED;

-- =============================================================================
-- ASSESSMENTS TABLE
-- Assessment records with FCI calculations
-- =============================================================================
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Assessment Information
    type VARCHAR(100) DEFAULT 'routine',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- Scheduling & Timing
    scheduled_date DATE,
    start_date TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Assignment
    assigned_to_user_id UUID REFERENCES users(id),
    
    -- Environmental Conditions
    weather_conditions VARCHAR(100),
    temperature_f INTEGER,
    
    -- Financial Data
    total_deficiency_cost DECIMAL(12, 2) DEFAULT 0,
    priority_1_cost DECIMAL(12, 2) DEFAULT 0,
    priority_2_cost DECIMAL(12, 2) DEFAULT 0,
    priority_3_cost DECIMAL(12, 2) DEFAULT 0,
    priority_4_cost DECIMAL(12, 2) DEFAULT 0,
    
    -- FCI Results
    fci_score DECIMAL(5, 4),
    overall_condition VARCHAR(50),
    
    -- Notes & Recommendations
    assessor_notes TEXT,
    recommendations TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Audit Fields
    created_by_user_id UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add alias columns for backward compatibility
ALTER TABLE assessments ADD COLUMN assessment_type VARCHAR(100) GENERATED ALWAYS AS (type) STORED;
ALTER TABLE assessments ADD COLUMN completion_date TIMESTAMP GENERATED ALWAYS AS (completed_at) STORED;
ALTER TABLE assessments ADD COLUMN assigned_to UUID GENERATED ALWAYS AS (assigned_to_user_id) STORED;
ALTER TABLE assessments ADD COLUMN created_by UUID GENERATED ALWAYS AS (created_by_user_id) STORED;

-- =============================================================================
-- ELEMENTS TABLE
-- Uniformat II building elements classification
-- =============================================================================
CREATE TABLE elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Element Identification
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    
    -- Uniformat II Classification
    major_group VARCHAR(255), -- e.g., "A - Substructure"
    group_element VARCHAR(255), -- e.g., "A10 - Foundations"
    individual_element VARCHAR(255), -- e.g., "A1010 - Standard Foundations"
    
    -- Hierarchy
    parent_code VARCHAR(20),
    level INTEGER,
    
    -- Lifecycle Information
    typical_life_years INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add alias column for backward compatibility
ALTER TABLE elements ADD COLUMN element_name VARCHAR(255) GENERATED ALWAYS AS (name) STORED;

-- =============================================================================
-- ASSESSMENT_ELEMENTS TABLE
-- Junction table linking assessments to elements with condition data
-- =============================================================================
CREATE TABLE assessment_elements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    element_id UUID REFERENCES elements(id),
    
    -- Condition Assessment
    condition_rating INTEGER CHECK (condition_rating >= 1 AND condition_rating <= 5),
    notes TEXT,
    
    -- Quantities & Costs
    quantity DECIMAL(10, 2),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    
    -- Priority & Action
    priority INTEGER CHECK (priority >= 1 AND priority <= 4),
    deficiency_type VARCHAR(100),
    action_required VARCHAR(100),
    estimated_remaining_life_years INTEGER,
    
    -- Media
    photo_urls JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add alias columns for backward compatibility
ALTER TABLE assessment_elements ADD COLUMN condition_notes TEXT GENERATED ALWAYS AS (notes) STORED;
ALTER TABLE assessment_elements ADD COLUMN images JSONB GENERATED ALWAYS AS (photo_urls) STORED;

-- =============================================================================
-- ASSESSMENT_DEFICIENCIES TABLE
-- Detailed deficiency tracking for assessment elements
-- =============================================================================
CREATE TABLE assessment_deficiencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_element_id UUID REFERENCES assessment_elements(id) ON DELETE CASCADE,
    
    -- Deficiency Classification
    category VARCHAR(50) CHECK (category IN (
        'Life Safety & Code Compliance',
        'Critical Systems',
        'Energy Efficiency',
        'Asset Life Cycle',
        'User Experience',
        'Equity & Accessibility'
    )),
    severity VARCHAR(50),
    
    -- Details
    description TEXT NOT NULL,
    cost DECIMAL(12, 2),
    priority INTEGER CHECK (priority >= 1 AND priority <= 4),
    
    -- Media
    photos JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add alias column for backward compatibility
ALTER TABLE assessment_deficiencies ADD COLUMN estimated_cost DECIMAL(12, 2) GENERATED ALWAYS AS (cost) STORED;

-- =============================================================================
-- REPORTS TABLE
-- Generated assessment reports with FCI analysis
-- =============================================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    
    -- Report Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) DEFAULT 'facility_condition',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Dates
    assessment_date DATE,
    report_date DATE DEFAULT CURRENT_DATE,
    
    -- Personnel
    created_by_user_id UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    assessor_name VARCHAR(100),
    
    -- FCI & Financial Data
    fci_score DECIMAL(5, 4),
    total_repair_cost DECIMAL(12, 2),
    replacement_value DECIMAL(12, 2),
    immediate_repair_cost DECIMAL(12, 2),
    short_term_repair_cost DECIMAL(12, 2),
    long_term_repair_cost DECIMAL(12, 2),
    
    -- Content Metrics
    element_count INTEGER DEFAULT 0,
    deficiency_count INTEGER DEFAULT 0,
    
    -- Report Content
    executive_summary TEXT,
    findings JSONB DEFAULT '{}'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    systems_data JSONB DEFAULT '{}'::jsonb,
    
    -- File References
    pdf_url TEXT,
    excel_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Add alias columns for backward compatibility
ALTER TABLE reports ADD COLUMN generated_by UUID GENERATED ALWAYS AS (created_by_user_id) STORED;
ALTER TABLE reports ADD COLUMN generated_at TIMESTAMP GENERATED ALWAYS AS (created_at) STORED;
ALTER TABLE reports ADD COLUMN data JSONB GENERATED ALWAYS AS (systems_data) STORED;
ALTER TABLE reports ADD COLUMN replacement_cost DECIMAL(12, 2) GENERATED ALWAYS AS (replacement_value) STORED;

-- =============================================================================
-- TOKENS TABLE
-- Access token management for user invitations
-- =============================================================================
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    organization_name VARCHAR(255),
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- EMAIL_SUBSCRIPTIONS TABLE
-- Email notification preferences
-- =============================================================================
CREATE TABLE email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50),
    frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
    filters JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECURITY & AUDIT TABLES
-- =============================================================================

-- Security Events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login Attempts
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN,
    failure_reason VARCHAR(255),
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- EMAIL SYSTEM TABLES
-- =============================================================================

-- Email Logs
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255),
    subject VARCHAR(500),
    template_id UUID,
    status VARCHAR(50),
    mailgun_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500),
    html_template TEXT,
    text_template TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Report Subscriptions
CREATE TABLE report_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50),
    frequency VARCHAR(20),
    filters JSONB DEFAULT '{}'::jsonb,
    email_format VARCHAR(20) DEFAULT 'pdf',
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PRE_ASSESSMENTS TABLE
-- Pre-assessment planning data
-- =============================================================================
CREATE TABLE pre_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id),
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

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organizations
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);

-- Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Buildings
CREATE INDEX idx_buildings_organization ON buildings(organization_id);
CREATE INDEX idx_buildings_name ON buildings(name);
CREATE INDEX idx_buildings_type ON buildings(type);
CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_buildings_created_by ON buildings(created_by_user_id);

-- Assessments
CREATE INDEX idx_assessments_organization ON assessments(organization_id);
CREATE INDEX idx_assessments_building ON assessments(building_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_assessments_assigned_to ON assessments(assigned_to_user_id);
CREATE INDEX idx_assessments_completed ON assessments(completed_at);
CREATE INDEX idx_assessments_created_by ON assessments(created_by_user_id);

-- Elements
CREATE INDEX idx_elements_code ON elements(code);
CREATE INDEX idx_elements_major_group ON elements(major_group);
CREATE INDEX idx_elements_active ON elements(is_active);

-- Assessment Elements
CREATE INDEX idx_assessment_elements_assessment ON assessment_elements(assessment_id);
CREATE INDEX idx_assessment_elements_element ON assessment_elements(element_id);
CREATE INDEX idx_assessment_elements_condition ON assessment_elements(condition_rating);

-- Assessment Deficiencies
CREATE INDEX idx_deficiencies_element ON assessment_deficiencies(assessment_element_id);
CREATE INDEX idx_deficiencies_category ON assessment_deficiencies(category);
CREATE INDEX idx_deficiencies_priority ON assessment_deficiencies(priority);

-- Reports
CREATE INDEX idx_reports_organization ON reports(organization_id);
CREATE INDEX idx_reports_building ON reports(building_id);
CREATE INDEX idx_reports_assessment ON reports(assessment_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_by ON reports(created_by_user_id);

-- Tokens
CREATE INDEX idx_tokens_code ON tokens(code);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_expires ON tokens(expires_at);

-- Security & Audit
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at);
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);

-- Email System
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_subscriptions_user ON email_subscriptions(user_id);
CREATE INDEX idx_report_subscriptions_user ON report_subscriptions(user_id);

-- =============================================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_elements_updated_at BEFORE UPDATE ON assessment_elements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_deficiencies_updated_at BEFORE UPDATE ON assessment_deficiencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_subscriptions_updated_at BEFORE UPDATE ON report_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pre_assessments_updated_at BEFORE UPDATE ON pre_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- GRANT PERMISSIONS (Adjust based on your database user)
-- =============================================================================

-- Example: Grant all privileges to the application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO onyx_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO onyx_app_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO onyx_app_user;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================