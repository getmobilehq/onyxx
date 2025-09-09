// Test backend health and individual endpoints
import axios from 'axios';

const API_URL = 'https://manage.onyxreport.com/api';

async function testBackend() {
  console.log('🔍 Testing backend endpoints...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test validation with minimal data
    console.log('\n2. Testing registration validation...');
    
    // Test with empty data to see validation errors
    try {
      await axios.post(`${API_URL}/auth/register`, {});
    } catch (error) {
      console.log('📋 Validation errors:', error.response?.data);
    }
    
    // Test with partial data
    try {
      await axios.post(`${API_URL}/auth/register`, {
        name: 'Test',
        email: 'invalid-email',
        password: '123'
      });
    } catch (error) {
      console.log('📋 Partial data errors:', error.response?.data);
    }
    
  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
    console.log('Response data:', error.response?.data);
  }
}

testBackend();