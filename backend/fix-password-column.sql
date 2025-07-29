-- Fix password column name in users table
-- This script renames 'password' to 'password_hash' to match backend expectations

-- Rename the column
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- Verify the change
\d users;