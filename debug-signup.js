// Debug signup issue
import axios from 'axios';

async function testSignup() {
  const API_URL = 'https://onyx-backend-f7vh.onrender.com/api';
  
  console.log('🔍 Testing signup with backend API:', API_URL);
  
  const testUser = {
    name: 'Test User Debug',
    email: 'debug' + Date.now() + '@onyxtest.com',
    password: 'debugpass123',
    role: 'admin'
  };
  
  console.log('📤 Sending registration data:', testUser);
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Data:', error.response?.data);
    console.log('Full Error:', error.message);
  }
}

testSignup();