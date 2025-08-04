# Quick Signup Fix

The signup error "Invalid reference" is likely due to foreign key constraint issues. Here are the immediate steps to fix:

## Option 1: Temporary Fix - Allow NULL organization_id

1. **Remove foreign key constraint temporarily**:
```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_organization;
```

2. **Allow NULL organization_id**:
```sql  
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
```

3. **Modify registration to not require organization**:
```typescript
// In auth.controller.ts, change:
const organizationId = null; // Instead of hardcoded UUID
```

## Option 2: Ensure Organization Exists

Run this SQL to verify and create default organization:

```sql
-- Check if default org exists
SELECT * FROM organizations WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- If not exists, create it
INSERT INTO organizations (id, name, description, subscription_plan) 
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Default Organization', 
  'Initial organization for new users',
  'professional'
) ON CONFLICT (id) DO NOTHING;
```

## Option 3: Check Database State

The issue might be that the backend is connecting to a different database or the constraints weren't properly created.

**Immediate Action**: Try Option 1 for quick fix, then investigate further.