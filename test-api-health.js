// Test if the API is working and deployment has taken effect
import axios from 'axios';

async function testAPIHealth() {
  const API_URL = 'https://onyx-backend-f7vh.onrender.com/api';
  
  console.log('🔍 Testing API health and deployment status...');
  
  try {
    // Test health endpoint if it exists
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed or no health endpoint');
  }
  
  try {
    // Test login with known user to see if API is working
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'joseph@univelcity.com',
      password: 'password123'
    });
    
    console.log('✅ Login test PASSED - API is working!');
    console.log('User:', loginResponse.data.data.user);
  } catch (loginError) {
    console.log('❌ Login test failed:');
    console.log('Status:', loginError.response?.status);
    console.log('Error:', loginError.response?.data);
  }
  
  console.log('\\n🧪 Now testing problematic signup data...');
  
  try {
    const signupResponse = await axios.post(`${API_URL}/auth/register`, {
      name: "Test User",
      email: "test" + Date.now() + "@test.com",
      password: "TestPass123",
      role: "admin"
    });
    
    console.log('✅ Signup with different data SUCCESS!');
    console.log('Response:', signupResponse.data);
  } catch (signupError) {
    console.log('❌ Even different signup data failed:');
    console.log('Status:', signupError.response?.status);
    console.log('Error:', JSON.stringify(signupError.response?.data, null, 2));
  }
}

testAPIHealth().catch(console.error);