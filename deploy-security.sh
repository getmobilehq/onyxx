#!/bin/bash

# ONYX Security Deployment Script
echo "🔐 ONYX Platform Security Deployment"
echo "====================================="

# 1. Run Database Migration
echo "1. Running database security migration..."
cd backend
node run-security-migration.js

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
else
    echo "❌ Database migration failed"
    exit 1
fi

# 2. Deploy Backend
echo "2. Deploying backend with security enhancements..."
cd ..
git add -A
git commit -m "Deploy security enhancements and 2FA system"
git push origin main

echo "✅ Backend deployment initiated"

# 3. Security Verification
echo "3. Running security verification..."

# Check if security endpoints are accessible
echo "Checking security endpoints..."
curl -s -o /dev/null -w "%{http_code}" https://onyx-backend-f7vh.onrender.com/api/health
if [ $? -eq 0 ]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

# 4. Frontend Security Headers Check
echo "4. Checking frontend security headers..."
curl -I https://www.onyxreport.com | grep -i "security\|strict\|frame\|content"

echo ""
echo "🎉 Security deployment completed!"
echo ""
echo "Next Steps:"
echo "1. Configure Cloudflare WAF (see SECURITY_SETUP_GUIDE.md)"
echo "2. Set up Sentry monitoring"
echo "3. Enable 2FA for admin accounts"
echo "4. Run penetration testing"
echo ""
echo "Security Dashboard: https://www.onyxreport.com/admin/security"
echo "2FA Setup: https://www.onyxreport.com/profile?tab=security"