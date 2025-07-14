#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Onyx System Status\n');

// Test 1: Check if backend is running
console.log('1. Checking backend status...');
try {
  const response = execSync('curl -s http://localhost:5001/api/health || curl -s http://localhost:5000/api/health || curl -s http://localhost:3001/api/health', { encoding: 'utf8' });
  if (response.includes('success') || response.includes('healthy')) {
    console.log('✅ Backend is running and healthy');
  } else {
    console.log('❌ Backend is not responding properly');
    console.log('Response:', response);
  }
} catch (error) {
  console.log('❌ Backend is not running on any expected port (3001, 5000, 5001)');
}

// Test 2: Check frontend build
console.log('\n2. Checking frontend build...');
try {
  const buildResult = execSync('cd /Users/josephagunbiade/Desktop/studio/onyx && npm run build', { encoding: 'utf8' });
  console.log('✅ Frontend builds successfully');
} catch (error) {
  console.log('❌ Frontend build failed:');
  console.log(error.stdout || error.message);
}

// Test 3: Check for lint issues
console.log('\n3. Checking for lint issues...');
try {
  const lintResult = execSync('cd /Users/josephagunbiade/Desktop/studio/onyx && npm run lint', { encoding: 'utf8' });
  console.log('✅ No lint issues found');
} catch (error) {
  console.log('❌ Lint issues found:');
  console.log(error.stdout || error.message);
}

// Test 4: Check database connectivity
console.log('\n4. Checking database connectivity...');
try {
  const dbResult = execSync('cd /Users/josephagunbiade/Desktop/studio/onyx/backend && node check-db.js', { encoding: 'utf8' });
  console.log('✅ Database connectivity check:');
  console.log(dbResult);
} catch (error) {
  console.log('❌ Database connectivity issues:');
  console.log(error.stdout || error.message);
}

// Test 5: Check assessments list page for flickering fix
console.log('\n5. Checking assessments list page implementation...');
const assessmentsPagePath = '/Users/josephagunbiade/Desktop/studio/onyx/src/pages/assessments/index.tsx';
try {
  const assessmentsCode = fs.readFileSync(assessmentsPagePath, 'utf8');
  
  // Check for flickering fix indicators
  const hasUseEffect = assessmentsCode.includes('useEffect(() => {');
  const hasFetchAssessments = assessmentsCode.includes('fetchAssessments();');
  const hasEmptyDeps = assessmentsCode.includes('}, []);');
  const hasTransformData = assessmentsCode.includes('assessments.map(assessment');
  
  if (hasUseEffect && hasFetchAssessments && hasEmptyDeps && hasTransformData) {
    console.log('✅ Assessments list page has proper data fetching and transformation');
  } else {
    console.log('⚠️ Assessments list page may have issues:');
    console.log('   - useEffect found:', hasUseEffect);
    console.log('   - fetchAssessments found:', hasFetchAssessments);
    console.log('   - Empty deps found:', hasEmptyDeps);
    console.log('   - Data transformation found:', hasTransformData);
  }
} catch (error) {
  console.log('❌ Could not read assessments page file');
}

console.log('\n📊 System Assessment Summary:');
console.log('=====================================');
console.log('Please review the results above to determine:');
console.log('- Current system status (working/broken)');
console.log('- Any immediate issues found');
console.log('- Whether the Assessment System is fully functional');
console.log('- Next steps needed (if any)');