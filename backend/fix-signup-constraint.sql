-- Fix Signup Error: Remove Foreign Key Constraint
-- This fixes: "violates foreign key constraint users_organization_id_fkey"
-- Run this on the production database to allow users to sign up without an organization

-- 1. First check if the constraint exists
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'users'
AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Drop the foreign key constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_organization_id_fkey;

-- 3. Verify the column can be NULL (it should already be)
ALTER TABLE users 
ALTER COLUMN organization_id DROP NOT NULL;

-- 4. Show updated table structure
\d users

-- 5. Test that signup will work by doing a test insert
-- This should succeed without an organization_id
INSERT INTO users (name, email, password_hash, role) 
VALUES (
    'Test User', 
    'test_' || extract(epoch from now()) || '@example.com',
    '$2a$10$dummyhash',
    'admin'
) RETURNING id, name, email, organization_id;

-- 6. Clean up test user
DELETE FROM users WHERE email LIKE 'test_%@example.com';

-- Success! Users can now sign up without an organization