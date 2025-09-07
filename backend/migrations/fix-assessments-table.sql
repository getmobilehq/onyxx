-- Fix assessments table column names based on actual production schema

-- 1. Rename assessment_type to type
ALTER TABLE assessments RENAME COLUMN assessment_type TO type;

-- 2. Rename completion_date to completed_at  
ALTER TABLE assessments RENAME COLUMN completion_date TO completed_at;

-- 3. Rename assigned_to to assigned_to_user_id
ALTER TABLE assessments RENAME COLUMN assigned_to TO assigned_to_user_id;

-- 4. Rename created_by to created_by_user_id
ALTER TABLE assessments RENAME COLUMN created_by TO created_by_user_id;

-- 5. Verify the changes
\d assessments