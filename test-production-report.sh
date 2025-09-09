#!/bin/bash

# Test script to verify report generation works after migration

echo "Testing Onyx Production Report Generation"
echo "========================================="

# Step 1: Login to get token
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "https://manage.onyxreport.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@onyx.com", "password": "password123"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Login successful"

# Step 2: Get completed assessments
echo "2. Getting completed assessments..."
ASSESSMENT_ID=$(curl -s -X GET "https://manage.onyxreport.com/api/assessments?status=completed" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ASSESSMENT_ID" ]; then
  echo "❌ No completed assessments found"
  exit 1
fi

echo "✅ Found assessment: $ASSESSMENT_ID"

# Step 3: Generate report
echo "3. Generating report..."
RESPONSE=$(curl -s -X POST "https://manage.onyxreport.com/api/reports/generate/$ASSESSMENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Report generation successful!"
  REPORT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "Report ID: $REPORT_ID"
else
  echo "❌ Report generation failed"
  echo "$RESPONSE"
fi