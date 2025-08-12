-- PRODUCTION DATABASE MIGRATION
-- Run this on your Render PostgreSQL database after backend deployment
-- Date: 2025-08-09

-- ============================================
-- STEP 1: Create tokens table and indexes
-- ============================================

-- Create tokens table for paid signup codes
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    organization_name VARCHAR(255),
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for quick token lookup
CREATE INDEX IF NOT EXISTS idx_tokens_code ON tokens(code);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);

-- ============================================
-- STEP 2: Update users table with new columns
-- ============================================

-- Add is_platform_admin column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE;

-- Add invited_by column to track who invited a user
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Add signup_token column to track which token was used for signup
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_token UUID REFERENCES tokens(id);

-- ============================================
-- STEP 3: Create platform admin user
-- ============================================

-- Create a platform admin user for testing
-- Email: admin@platform.onyx.com
-- Password: Admin123!
INSERT INTO users (
    id,
    name,
    email,
    password_hash,
    role,
    is_platform_admin,
    created_at
) VALUES (
    gen_random_uuid(),
    'Platform Admin',
    'admin@platform.onyx.com',
    '$2a$10$ZpZOoL0eVcxJW.xgUx0Zj.VgKXHLhvxRSJhCphJYMqQdC.UJHxg5y', -- Admin123!
    'admin',
    true,
    NOW()
) ON CONFLICT (email) 
DO UPDATE SET is_platform_admin = true;

-- ============================================
-- STEP 4: Create sample token for testing
-- ============================================

-- Create a sample active token for testing
INSERT INTO tokens (
    code,
    status,
    organization_name,
    expires_at,
    created_at,
    created_by
) VALUES (
    'ONX-TEST-2024-DEMO',
    'active',
    'Demo Organization',
    NOW() + INTERVAL '30 days',
    NOW(),
    (SELECT id FROM users WHERE email = 'admin@platform.onyx.com')
) ON CONFLICT (code) DO NOTHING;

-- ============================================
-- STEP 5: Update existing admin to platform admin (optional)
-- ============================================

-- Make the existing admin@onyx.com a platform admin as well (optional)
UPDATE users 
SET is_platform_admin = true 
WHERE email = 'admin@onyx.com';

-- ============================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- ============================================

-- Check if tokens table was created
SELECT COUNT(*) as tokens_table_exists FROM information_schema.tables 
WHERE table_name = 'tokens';

-- Check if platform admin was created
SELECT email, is_platform_admin FROM users 
WHERE is_platform_admin = true;

-- Check if test token was created
SELECT code, status, organization_name, expires_at 
FROM tokens 
WHERE code = 'ONX-TEST-2024-DEMO';

-- Check new columns in users table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_platform_admin', 'invited_by', 'signup_token');