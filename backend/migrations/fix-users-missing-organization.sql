-- Fix users without organization_id
-- This migration creates a default organization for orphaned users and assigns them to it

BEGIN;

-- Step 1: Check if there are users without organization_id
DO $$
DECLARE
    orphaned_users_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_users_count
    FROM users
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Found % users without organization_id', orphaned_users_count;
END $$;

-- Step 2: Create a default organization if it doesn't exist
INSERT INTO organizations (id, name, subscription_tier, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Default Organization',
    'free',
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Step 3: Get or create default organization
DO $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Try to get existing "Default Organization"
    SELECT id INTO default_org_id
    FROM organizations
    WHERE name = 'Default Organization'
    LIMIT 1;

    -- If no default org exists, create one
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (id, name, subscription_tier, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Default Organization',
            'free',
            NOW(),
            NOW()
        )
        RETURNING id INTO default_org_id;
    END IF;

    RAISE NOTICE 'Default organization ID: %', default_org_id;

    -- Step 4: Update users without organization_id
    UPDATE users
    SET organization_id = default_org_id,
        updated_at = NOW()
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Updated users with organization_id: %', default_org_id;
END $$;

-- Step 5: Verify the fix
DO $$
DECLARE
    remaining_orphans INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_orphans
    FROM users
    WHERE organization_id IS NULL;

    IF remaining_orphans > 0 THEN
        RAISE WARNING 'Still have % users without organization_id!', remaining_orphans;
    ELSE
        RAISE NOTICE 'Success! All users now have organization_id';
    END IF;
END $$;

COMMIT;

-- Show summary
SELECT
    o.id as organization_id,
    o.name as organization_name,
    COUNT(u.id) as user_count
FROM organizations o
LEFT JOIN users u ON u.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY user_count DESC;
