# Database Migrations

## Fix Orphaned Users (Missing organization_id)

### Problem
Some users in the database don't have an `organization_id`, which causes errors when they try to create assessments or perform other organization-scoped operations.

### Solution
Run the migration script to fix orphaned users:

```bash
cd backend
npm run fix:orphaned-users
```

### What It Does
1. Identifies all users without an `organization_id`
2. Creates a "Default Organization" if it doesn't exist
3. Assigns all orphaned users to the default organization
4. Verifies the fix was successful
5. Shows a summary of organizations and user counts

### Important Notes
- **Users must log out and log back in** after the migration for the changes to take effect in their JWT tokens
- The script is idempotent - safe to run multiple times
- Creates an organization called "Default Organization" with a free tier subscription

### Manual SQL Method
If you prefer to run the SQL directly:

```bash
psql $DATABASE_URL -f backend/migrations/fix-users-missing-organization.sql
```

### After Running the Migration
1. Users should log out
2. Log back in to get a new JWT token with the correct `organization_id`
3. Assessment creation and other features will now work properly

### Verification
Check if any users still lack organization_id:

```sql
SELECT id, email, name, organization_id
FROM users
WHERE organization_id IS NULL;
```

Expected result: 0 rows (empty result)
