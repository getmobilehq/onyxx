const axios = require('axios');

const API_URL = 'https://manage.onyxreport.com/api';

async function testLogin() {
  console.log('Testing login for joseph@univelcity.com...\n');
  
  try {
    // Test login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'joseph@univelcity.com',
      password: 'Acc355c0d3'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    
    const { accessToken } = loginResponse.data.data.tokens;
    
    // Test /auth/me endpoint
    console.log('\n📋 Testing /auth/me endpoint...');
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ /auth/me successful!');
    console.log('User data:', JSON.stringify(meResponse.data.data.user, null, 2));
    
    // Test buildings endpoint
    console.log('\n🏢 Testing /buildings endpoint...');
    const buildingsResponse = await axios.get(`${API_URL}/buildings`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ /buildings successful!');
    console.log('Buildings count:', buildingsResponse.data.data.buildings.length);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLogin();