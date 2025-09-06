-- Simple step-by-step migration commands
-- Run each command one at a time in the Render database shell

-- Step 1: Check current tables
\dt

-- Step 2: Check if fci_reports exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'fci_reports';

-- Step 3: Check if reports already exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'reports';

-- Step 4: If fci_reports exists and reports doesn't, rename it
ALTER TABLE fci_reports RENAME TO reports;

-- Step 5: Verify the change worked
\dt reports

-- Step 6: Check the table structure
\d reports