#!/bin/bash

# Fix password column name in Render PostgreSQL database

DATABASE_URL="postgresql://realjumbo:Lq9Fc7E2bmsl3w01DCV1P1OpdpEP8Opr@dpg-d240atvgi27c738goi7g-a.oregon-postgres.render.com/adakole_onyx232"

echo "🔧 Fixing password column name in users table..."
echo "📊 Database: adakole_onyx232"
echo ""

# Run the fix script
psql "$DATABASE_URL" < backend/fix-password-column.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Column renamed successfully!"
    echo "   password → password_hash"
    echo ""
    echo "🔗 Login should now work at: https://onyx-frontend.onrender.com"
    echo "📝 Credentials: admin@onyx.com / password123"
else
    echo ""
    echo "❌ Column rename failed. Please check the error messages above."
    exit 1
fi