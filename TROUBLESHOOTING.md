# Troubleshooting Guide

## Current Issue: "relation 'users' already exists"

This error means the database tables were already created. Here's how to fix it:

## Step 1: Check Database Status

```bash
cd /Users/josephagunbiade/Desktop/studio/onyx/backend
node check-db.js
```

This will show you:
- ✅ Database connection status
- 📋 What tables exist
- 👥 What users are in the database
- ✅ Whether admin user exists

## Step 2: Run Smart Migration

```bash
node smart-migrate.js
```

This script handles existing tables and will:
- Skip table creation if they exist
- Create admin user if missing
- Verify database setup

## Step 3: Start Backend

```bash
npm run dev
```

## Common Issues and Solutions

### 1. "Connection refused" (ECONNREFUSED)

**Problem**: PostgreSQL is not running

**Solutions**:
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql

# Or restart it
brew services restart postgresql
```

### 2. "database 'onyx' does not exist"

**Problem**: Database hasn't been created

**Solutions**:
```bash
# Connect to PostgreSQL
psql -U jojo postgres

# Create database
CREATE DATABASE onyx;

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE onyx TO jojo;

# Exit
\q
```

### 3. "password authentication failed for user 'jojo'"

**Problem**: User doesn't exist or wrong password

**Solutions**:
```bash
# Connect as superuser
psql postgres

# Create user
CREATE USER jojo WITH PASSWORD 'Montg0m3r!';

# Grant permissions
ALTER USER jojo CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE onyx TO jojo;

# Exit
\q
```

### 4. "relation 'users' already exists"

**Problem**: Tables were created before

**Solution**: Use the smart migration script:
```bash
node smart-migrate.js
```

### 5. TypeScript compilation errors

**Problem**: Code doesn't match database schema

**Solutions**:
```bash
# Clean build
rm -rf dist
npm run build

# Check for errors
npm run dev
```

### 6. "Admin user already exists"

**Problem**: This is not actually a problem!

**Solution**: This is normal. The script detected an existing admin user and skipped creation.

### 7. Port 5000 already in use

**Problem**: Another service is using port 5000

**Solutions**:
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or change port in .env
echo "PORT=5001" >> .env
```

## Step-by-Step Recovery

If you're stuck, follow these steps in order:

### 1. Check PostgreSQL
```bash
brew services list | grep postgresql
# Should show "started"
```

### 2. Check Database
```bash
psql -U jojo -d onyx -c "SELECT version();"
# Should connect successfully
```

### 3. Check Tables
```bash
node check-db.js
# Shows current database state
```

### 4. Run Migration
```bash
node smart-migrate.js
# Handles existing tables properly
```

### 5. Start Backend
```bash
npm run dev
# Should start without errors
```

### 6. Test API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@onyx.com","password":"admin123"}'
```

## Expected Success Output

When everything works, you should see:

### Migration Success:
```
🔄 Running smart database migration...
📋 Existing tables: ['users', 'buildings', ...]
✅ Tables already exist, skipping table creation
✅ Admin user already exists
📊 Total users in database: 1
✅ All required tables are present
🎉 Migration completed successfully!
```

### Backend Start Success:
```
[nodemon] starting `ts-node ./src/server.ts`
🚀 Server running on http://localhost:5000
```

### API Test Success:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@onyx.com",
      "name": "Admin User",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

## Get Help

If you're still stuck:

1. Run `node check-db.js` and share the output
2. Run `npm run dev` and share any error messages
3. Check the PostgreSQL logs: `tail -f /usr/local/var/log/postgresql.log`

## Default Credentials

Once everything is working:
- **Email**: admin@onyx.com  
- **Password**: admin123
- **Role**: admin