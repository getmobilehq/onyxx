-- Check current data counts
SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
UNION ALL
SELECT COUNT(*), 'assessment_elements' FROM assessment_elements
UNION ALL
SELECT COUNT(*), 'buildings' FROM buildings
UNION ALL
SELECT COUNT(*), 'users' FROM users;

-- Display some sample data before deletion
SELECT 'Current Assessments:' as info;
SELECT id, building_id, user_id, type, status, created_at FROM assessments LIMIT 5;

SELECT 'Current Assessment Elements:' as info;
SELECT id, assessment_id, element_type, is_accessible, created_at FROM assessment_elements LIMIT 5;

-- Delete all records from assessment_elements first (due to foreign key constraints)
DELETE FROM assessment_elements;

-- Delete all records from assessments
DELETE FROM assessments;

-- Verify deletion
SELECT 'After Deletion:' as info;
SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
UNION ALL
SELECT COUNT(*), 'assessment_elements' FROM assessment_elements;

-- Show existing buildings that can be used for new assessments
SELECT 'Available Buildings:' as info;
SELECT id, name, type, address, city, state, created_at FROM buildings;

-- Show existing users
SELECT 'Available Users:' as info;
SELECT id, email, role, created_at FROM users;