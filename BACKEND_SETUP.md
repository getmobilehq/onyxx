# Backend Setup Instructions

## Prerequisites

1. **PostgreSQL** must be installed and running
2. **Node.js 18+** must be installed
3. **Database** named `onyx` must exist with proper user access

## Quick Start

### Option 1: Manual Steps

```bash
# 1. Navigate to backend directory
cd /Users/josephagunbiade/Desktop/studio/onyx/backend

# 2. Install dependencies (if not already done)
npm install

# 3. Run migration to create tables and admin user
node manual-migrate.js

# 4. Start development server
npm run dev
```

### Option 2: Using Quick Start Script

```bash
cd /Users/josephagunbiade/Desktop/studio/onyx/backend
node quick-start.js
```

## What the Migration Does

1. **Creates all database tables** from ONYX.sql:
   - users
   - buildings  
   - elements
   - pre_assessments
   - field_assessments
   - fci_reports
   - reference_building_costs

2. **Creates default admin user**:
   - Email: `admin@onyx.com`
   - Password: `admin123`
   - Role: `admin`

## Expected Output

When successful, you should see:

```
🔄 Running database migration...
✅ Database migration completed successfully!
📝 Creating default admin user...
✅ Default admin user created:
   Email: admin@onyx.com
   Password: admin123

📊 Total users in database: 1

[nodemon] starting `ts-node ./src/server.ts`
🚀 Server running on http://localhost:5000
```

## Troubleshooting

### Database Connection Issues

If you see connection errors:

1. **Check PostgreSQL is running**:
   ```bash
   brew services list | grep postgresql
   # or
   pg_ctl status
   ```

2. **Verify database exists**:
   ```bash
   psql -U jojo -d onyx -c "SELECT version();"
   ```

3. **Check connection string** in `.env`:
   ```
   DATABASE_URL=postgresql://jojo:Montg0m3r!@localhost:5432/onyx
   ```

### TypeScript Compilation Errors

If you see TypeScript errors:

1. **Clean and rebuild**:
   ```bash
   rm -rf dist
   npm run build
   ```

2. **Check node_modules**:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Port Already in Use

If port 5000 is in use:

1. **Change port** in `.env`:
   ```
   PORT=5001
   ```

2. **Update frontend API URL** in `/Users/josephagunbiade/Desktop/studio/onyx/.env`:
   ```
   VITE_API_URL=http://localhost:5001/api
   ```

## API Endpoints Available

Once running, these endpoints will be available:

### Authentication
- ✅ `POST http://localhost:5000/api/auth/login`
- ✅ `POST http://localhost:5000/api/auth/register`
- ✅ `POST http://localhost:5000/api/auth/refresh`
- ✅ `GET http://localhost:5000/api/auth/me`

### Users (Protected)
- ✅ `GET http://localhost:5000/api/users` (Admin/Manager only)
- ✅ `GET http://localhost:5000/api/users/:id`
- ✅ `PUT http://localhost:5000/api/users/:id`
- ✅ `DELETE http://localhost:5000/api/users/:id` (Admin only)
- ✅ `POST http://localhost:5000/api/users/invite` (Admin/Manager only)

## Testing the API

You can test the API using curl or Postman:

### Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@onyx.com","password":"admin123"}'
```

Expected response:
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

## Next Steps

Once the backend is running:

1. **Start the frontend** in a new terminal:
   ```bash
   cd /Users/josephagunbiade/Desktop/studio/onyx
   npm install  # Install axios if not done
   npm run dev
   ```

2. **Test authentication** by logging in with:
   - Email: `admin@onyx.com`
   - Password: `admin123`

3. **Implement remaining controllers**:
   - Buildings controller
   - Assessments controller
   - Reports controller
   - Elements controller

## Files Created/Modified

### New Files
- `manual-migrate.js` - Manual migration script
- `quick-start.js` - Quick start script
- `test-db.js` - Database connection test

### Modified Files
- `src/controllers/auth.controller.ts` - Updated for simplified schema
- `src/controllers/user.controller.ts` - Updated for simplified schema  
- `src/routes/auth.routes.ts` - Updated validation
- `src/routes/user.routes.ts` - Updated validation
- `src/types/user.types.ts` - Already correct for simplified schema