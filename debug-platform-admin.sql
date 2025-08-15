-- Debug script to check platform admin status

-- 1. Check if admin@onyx.com has platform admin status
SELECT 
    id,
    email, 
    name, 
    role, 
    is_platform_admin,
    organization_id
FROM users 
WHERE email = 'admin@onyx.com';

-- 2. Check all platform admins in the system
SELECT 
    email, 
    name, 
    is_platform_admin 
FROM users 
WHERE is_platform_admin = true;

-- 3. Check if the is_platform_admin column exists
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'is_platform_admin';

-- 4. If admin@onyx.com is not a platform admin, update it
UPDATE users 
SET is_platform_admin = true 
WHERE email = 'admin@onyx.com';

-- 5. Verify the update
SELECT 
    email, 
    is_platform_admin 
FROM users 
WHERE email = 'admin@onyx.com';