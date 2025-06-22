# How to Run the Migration

Since the tables already exist, you need to run the smart migration script that handles existing tables.

## Step 1: Run Smart Migration

Open your terminal and run:

```bash
cd /Users/josephagunbiade/Desktop/studio/onyx/backend
node smart-migrate.js
```

This script will:
- ✅ Check which tables already exist
- ✅ Skip table creation if they exist
- ✅ Create the admin user if it doesn't exist
- ✅ Verify all required tables are present

## Step 2: Expected Output

You should see something like:

```
🔄 Running smart database migration...
📋 Existing tables: ['users', 'buildings', ...]
✅ Tables already exist, skipping table creation
📝 Creating default admin user...
✅ Default admin user created:
   Email: admin@onyx.com
   Password: admin123

📊 Total users in database: 1
✅ All required tables are present

🎉 Migration completed successfully!

You can now start the backend server with:
  npm run dev
```

## Step 3: Start the Backend

After migration completes successfully:

```bash
npm run dev
```

You should see:

```
[nodemon] starting `ts-node ./src/server.ts`
🚀 Server running on http://localhost:5000
```

## If You Get Errors

### "Admin user already exists"
This is fine! It means the admin user was created previously.

### "Connection refused"
- Make sure PostgreSQL is running
- Check your .env file has the correct DATABASE_URL

### "Permission denied"
- Make sure the user 'jojo' has access to the 'onyx' database

## Quick Test

Once the backend is running, test it:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@onyx.com","password":"admin123"}'
```

You should get a successful login response with tokens.

## Default Credentials

- **Email**: admin@onyx.com
- **Password**: admin123
- **Role**: admin

Use these credentials to log into the frontend application.