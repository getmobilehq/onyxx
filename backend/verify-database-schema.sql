-- Database Schema Verification Script
-- This script checks for missing columns that the backend expects

-- Check users table for missing columns
SELECT 'Checking users table...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_organization_owner') as has_is_org_owner,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') as has_password_hash,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') as has_org_id;

-- Check organizations table
SELECT 'Checking organizations table...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- Check buildings table
SELECT 'Checking buildings table...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
ORDER BY ordinal_position;

-- Check assessments table
SELECT 'Checking assessments table...' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
ORDER BY ordinal_position;

-- Check for common missing columns
SELECT 'Missing columns check...' as status;
-- Check if assessments has all needed columns
SELECT 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'fci_score') as assessments_has_fci,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assessments' AND column_name = 'total_deficiency_cost') as assessments_has_total_cost;