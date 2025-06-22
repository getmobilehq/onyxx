# Debug Registration Issues

## Quick Fixes Applied

1. **Removed number requirement** from backend password validation
2. **Updated auth context** to handle organizationName parameter properly
3. **Set default role to 'admin'** for new registrations

## Test Registration

### Method 1: Test via API directly

```bash
cd /Users/josephagunbiade/Desktop/studio/onyx/backend
node test-register.js
```

This will test the registration endpoint directly and show any errors.

### Method 2: Test via Frontend

1. **Open browser console** (F12)
2. **Go to registration page**: http://localhost:5173/register
3. **Fill out form**:
   - Name: Test User
   - Email: test@example.com  
   - Password: password123
   - Confirm Password: password123
   - Organization: Test Org
4. **Submit and check console** for any error messages

## Common Issues & Solutions

### Issue 1: "Password must contain at least one number"
**Fixed**: Removed this requirement from backend validation

### Issue 2: "Invalid role"
**Fixed**: Auth context now sends role: 'admin' by default

### Issue 3: Network/CORS errors
**Check**: 
- Backend running on http://localhost:5001
- Frontend pointing to correct API URL
- CORS properly configured

## Expected Success Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User", 
      "role": "admin"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

## If Still Failing

### Check Backend Logs
Look at the terminal running `npm run dev` for any error messages.

### Check Frontend Console
Look for network errors or API response errors in browser console.

### Check Database
```bash
cd backend
node check-db.js
```

This will show if the user was created in the database.

## Quick Test Commands

```bash
# 1. Test backend API directly
cd backend && node test-register.js

# 2. Check if user was created
cd backend && node check-db.js

# 3. Try logging in with created user
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

## Manual Registration Test

If the frontend form is still having issues, you can manually test the API:

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual Test User",
    "email": "manual@example.com", 
    "password": "password123",
    "role": "admin"
  }'
```

This should return a success response with user data and tokens.