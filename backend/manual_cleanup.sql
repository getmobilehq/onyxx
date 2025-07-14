-- ONYX Database Cleanup Script
-- Run this script to clean up assessments and assessment_elements tables
-- 
-- To execute this script, use:
-- psql postgresql://jojo:Montg0m3r!@localhost:5432/onyx -f manual_cleanup.sql
-- OR
-- psql -h localhost -U jojo -d onyx -f manual_cleanup.sql
-- (you'll be prompted for the password: Montg0m3r!)

\echo '=== ONYX Database Cleanup Script ==='
\echo ''

-- 1. Current data counts
\echo '1. Current data counts:'
SELECT 
    table_name,
    count
FROM (
    SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
    UNION ALL
    SELECT COUNT(*), 'assessment_elements' FROM assessment_elements
    UNION ALL
    SELECT COUNT(*), 'buildings' FROM buildings
    UNION ALL
    SELECT COUNT(*), 'users' FROM users
) counts
ORDER BY table_name;

\echo ''
\echo '2. Sample assessments before deletion:'
SELECT 
    id, 
    building_id, 
    user_id, 
    type, 
    status, 
    created_at::date as created_date
FROM assessments 
LIMIT 5;

\echo ''
\echo '3. Sample assessment elements before deletion:'
SELECT 
    id, 
    assessment_id, 
    element_type, 
    is_accessible,
    created_at::date as created_date
FROM assessment_elements 
LIMIT 5;

\echo ''
\echo '4. Deleting all assessment_elements...'
DELETE FROM assessment_elements;

\echo ''
\echo '5. Deleting all assessments...'
DELETE FROM assessments;

\echo ''
\echo '6. Verification after deletion:'
SELECT 
    table_name,
    count
FROM (
    SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
    UNION ALL
    SELECT COUNT(*), 'assessment_elements' FROM assessment_elements
) counts
ORDER BY table_name;

\echo ''
\echo '7. Available buildings for new assessments:'
SELECT 
    id, 
    name, 
    type, 
    address || ', ' || city || ', ' || state || ' ' || zip_code as full_address,
    created_at::date as created_date
FROM buildings 
ORDER BY id;

\echo ''
\echo '8. Available users:'
SELECT 
    id, 
    email, 
    role,
    created_at::date as created_date
FROM users 
ORDER BY id;

\echo ''
\echo '=== Cleanup completed successfully! ==='