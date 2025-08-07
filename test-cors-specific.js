// Test CORS specifically with the exact domain from the browser error
import axios from 'axios';

async function testCORSFromWWW() {
  const API_URL = 'https://onyx-backend-f7vh.onrender.com/api';
  
  console.log('🔍 Testing CORS from www.onyxreport.com domain...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, 
      {
        email: 'onyxsolutions001@gmail.com',
        password: '#Solutions321'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.onyxreport.com',
          'Referer': 'https://www.onyxreport.com/login'
        }
      }
    );
    
    console.log('✅ CORS and login working!');
    console.log('User:', response.data.data.user);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed with status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('❌ Network/CORS error:', error.message);
      console.log('Code:', error.code);
    }
  }
  
  // Also test a simple health check with CORS headers
  console.log('\n🏥 Testing health endpoint with CORS...');
  
  try {
    const healthResponse = await axios.get(`${API_URL}/health`, {
      headers: {
        'Origin': 'https://www.onyxreport.com'
      }
    });
    
    console.log('✅ Health check with CORS working:', healthResponse.data);
  } catch (healthError) {
    console.log('❌ Health check CORS failed:', healthError.message);
  }
}

testCORSFromWWW().catch(console.error);