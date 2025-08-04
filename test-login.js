// Test login functionality
import axios from 'axios';

async function testLogin() {
  const API_URL = 'https://onyx-backend-f7vh.onrender.com/api';
  
  console.log('🔍 Testing login with existing user...');
  
  const loginData = {
    email: 'admin@onyx.com',
    password: 'password123'
  };
  
  console.log('📤 Login attempt:', { email: loginData.email });
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Error Data:', error.response?.data);
  }
}

testLogin();