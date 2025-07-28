-- Add Organizations Support to Onyx Database
-- This migration adds multi-tenant support through organizations

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'professional', 'enterprise')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add organization_id to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS is_organization_owner BOOLEAN DEFAULT false;

-- 3. Add organization_id to buildings table  
ALTER TABLE buildings
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 4. Add organization_id to assessments table
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 5. Create a default organization for existing data
INSERT INTO organizations (id, name, description, subscription_plan) 
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Default Organization', 
    'Initial organization for existing data',
    'professional'
) ON CONFLICT (id) DO NOTHING;

-- 6. Update existing records to belong to default organization
UPDATE users 
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE organization_id IS NULL;

UPDATE buildings 
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE organization_id IS NULL;

UPDATE assessments 
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE organization_id IS NULL;

-- 7. Make the first admin user the owner of the default organization
UPDATE users 
SET is_organization_owner = true 
WHERE email = 'admin@onyx.com' 
AND organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- 8. Add foreign key constraints
ALTER TABLE users
ADD CONSTRAINT fk_users_organization
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;

ALTER TABLE buildings
ADD CONSTRAINT fk_buildings_organization
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;

ALTER TABLE assessments
ADD CONSTRAINT fk_assessments_organization
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE CASCADE;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_organization_id ON buildings(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessments_organization_id ON assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_plan ON organizations(subscription_plan);

-- 10. Create organization statistics view
CREATE OR REPLACE VIEW organization_stats AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT b.id) as total_buildings,
    COUNT(DISTINCT a.id) as total_assessments,
    COUNT(DISTINCT CASE WHEN a.status = 'in_progress' THEN a.id END) as active_assessments
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
LEFT JOIN buildings b ON b.organization_id = o.id
LEFT JOIN assessments a ON a.organization_id = o.id
GROUP BY o.id, o.name;

-- 11. Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE
    ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();