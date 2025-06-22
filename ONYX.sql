
-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'assessor')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BUILDINGS
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL,
    construction_type VARCHAR(100),
    year_built INT,
    square_footage INT,
    state VARCHAR(100),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    street_address TEXT,
    cost_per_sqft DECIMAL(10, 2),
    image_url TEXT,
    created_by_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ELEMENTS
CREATE TABLE elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    major_group VARCHAR(100),
    group_element VARCHAR(100),
    individual_element VARCHAR(150)
);

-- PRE-ASSESSMENTS
CREATE TABLE pre_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id),
    element_id UUID REFERENCES elements(id),
    useful_life INT,
    install_year INT,
    repair_frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FIELD ASSESSMENTS
CREATE TABLE field_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id),
    element_id UUID REFERENCES elements(id),
    condition VARCHAR(20) CHECK (condition IN ('Excellent', 'Fair', 'Needs Attention')),
    repair_cost DECIMAL(12, 2),
    assessor_id UUID REFERENCES users(id),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FCI REPORTS
CREATE TABLE fci_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES buildings(id),
    total_repair_cost DECIMAL(12, 2),
    replacement_cost DECIMAL(12, 2),
    fci_score DECIMAL(5, 4),
    report_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REFERENCE BUILDING COSTS
CREATE TABLE reference_building_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_type VARCHAR(100),
    cost_per_sqft DECIMAL(10, 2)
);
