#!/bin/bash

echo "🧪 Testing Report Generation Flow with Production Schema"
echo "========================================================"
echo ""

# You'll need to replace this with an actual completed assessment ID from production
ASSESSMENT_ID="${1:-3e7610fe-f661-4ac8-bcff-4f27aaae7456}"

echo "📋 Test Assessment ID: $ASSESSMENT_ID"
echo ""

# Test the endpoint
echo "🔍 Step 1: Testing generate-report endpoint..."
curl -X POST "https://onyx-backend-f7vh.onrender.com/api/assessments/${ASSESSMENT_ID}/generate-report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -v 2>&1 | grep -E "HTTP|success|error|message" | head -20

echo ""
echo "✅ Test complete"
