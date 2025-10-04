-- Check what columns actually exist in elements table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'elements' 
ORDER BY ordinal_position;
