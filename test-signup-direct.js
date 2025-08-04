// Test signup directly with database to verify our changes
import axios from 'axios';

async function testFullFlow() {
  const API_URL = 'https://onyx-backend-f7vh.onrender.com/api';
  
  console.log('🔍 Testing complete flow...');
  
  // 1. Test health check
  console.log('\n1. Testing health check...');
  try {
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ Health:', health.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }
  
  // 2. Test organizations endpoint (should work without authentication)
  console.log('\n2. Testing organizations endpoint...');
  try {
    // First get a valid token from login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@onyx.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Got auth token');
    
    // Now test organizations endpoint
    const orgsResponse = await axios.get(`${API_URL}/organizations/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Organizations endpoint works:', orgsResponse.data);
    
  } catch (error) {
    console.log('⚠️ Organizations test:', error.response?.data || error.message);
  }
  
  // 3. Test signup with unique email
  console.log('\n3. Testing signup...');
  const uniqueEmail = `testuser${Date.now()}@newarchtest.com`;
  
  try {
    const signupResponse = await axios.post(`${API_URL}/auth/register`, {
      name: 'New Architecture Test User',
      email: uniqueEmail,
      password: 'testpass123',
      role: 'admin'
    });
    
    console.log('✅ SIGNUP SUCCESS!');
    console.log('User:', signupResponse.data.data.user);
    console.log('Has Token:', !!signupResponse.data.data.tokens.accessToken);
    
    // 4. Test login with the new user
    console.log('\n4. Testing login with new user...');
    const loginTest = await axios.post(`${API_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'testpass123'
    });
    
    console.log('✅ NEW USER LOGIN SUCCESS!');
    console.log('User data:', loginTest.data.data.user);
    
  } catch (error) {
    console.log('❌ Signup still failing:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testFullFlow();