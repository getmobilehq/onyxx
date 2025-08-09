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

-- Create index for quick token lookup
CREATE INDEX idx_tokens_code ON tokens(code);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Add is_platform_admin column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT FALSE;

-- Add invited_by column to track who invited a user
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Add signup_token column to track which token was used for signup
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_token UUID REFERENCES tokens(id);