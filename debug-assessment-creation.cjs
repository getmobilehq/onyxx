#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function debugAssessmentCreation() {
  console.log('🔍 Debugging Assessment Creation...\n');
  
  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'joseph@univelcity.com', // Change this to your email
      password: 'password123'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful, got token\n');
    
    // Step 2: Get buildings to pick one
    console.log('2️⃣ Getting buildings...');
    const buildingsResponse = await axios.get(`${API_URL}/buildings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (buildingsResponse.data.data.buildings.length === 0) {
      console.log('❌ No buildings found. Please add a building first.');
      return;
    }
    
    const building = buildingsResponse.data.data.buildings[0];
    console.log(`✅ Found building: ${building.name} (ID: ${building.id})\n`);
    
    // Step 3: Create assessment
    console.log('3️⃣ Creating assessment...');
    const assessmentData = {
      building_id: building.id,
      type: 'pre_assessment',
      description: `Pre-assessment for ${building.name}`,
      scheduled_date: new Date().toISOString(),
    };
    
    console.log('📋 Assessment data:', assessmentData);
    
    const createResponse = await axios.post(`${API_URL}/assessments`, assessmentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Assessment created successfully!');
    console.log('📊 Response:', createResponse.data);
    
    const assessment = createResponse.data.data.assessment;
    console.log('\n🎯 Assessment Details:');
    console.log(`   ID: ${assessment.id}`);
    console.log(`   Building: ${assessment.building_id}`);
    console.log(`   Type: ${assessment.type}`);
    console.log(`   Status: ${assessment.status}`);
    console.log(`   Created: ${assessment.created_at}`);
    
    // Step 4: Try to fetch assessments (this might be what's hanging)
    console.log('\n4️⃣ Testing fetchAssessments...');
    const fetchResponse = await axios.get(`${API_URL}/assessments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Fetch assessments successful!');
    console.log(`📊 Found ${fetchResponse.data.data.assessments.length} assessments`);
    
    // Step 5: Test specific assessment fetch
    console.log('\n5️⃣ Testing get assessment by ID...');
    const getResponse = await axios.get(`${API_URL}/assessments/${assessment.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Get assessment by ID successful!');
    console.log('📊 Assessment details:', getResponse.data.data.assessment);
    
  } catch (error) {
    console.log('❌ Error occurred:');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response:', error.response.data);
    } else {
      console.log('❗ Error:', error.message);
    }
  }
}

debugAssessmentCreation();