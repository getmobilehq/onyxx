#!/bin/bash

# ONYX Database Migration Script
# This script runs the database setup for the Render PostgreSQL instance

DATABASE_URL="postgresql://realjumbo:Lq9Fc7E2bmsl3w01DCV1P1OpdpEP8Opr@dpg-d240atvgi27c738goi7g-a.oregon-postgres.render.com/adakole_onyx232"

echo "🚀 Starting ONYX database migration..."
echo "📊 Database: adakole_onyx232"
echo ""

# Run the setup script
psql "$DATABASE_URL" < backend/setup-database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database migration completed successfully!"
    echo ""
    echo "📝 Default credentials:"
    echo "   Email: admin@onyx.com"
    echo "   Password: password123"
    echo ""
    echo "🔗 Backend URL: https://manage.onyxreport.com"
else
    echo ""
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi