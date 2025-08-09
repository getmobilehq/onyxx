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