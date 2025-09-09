// Test the exact signup data you're using
import axios from 'axios';

async function testYourSignup() {
  const API_URL = 'https://manage.onyxreport.com/api';
  
  console.log('🔍 Testing your exact signup data...');
  
  const signupData = {
    name: "joseph jones",
    email: "josephagunbiadehq@gmail.com", 
    password: "Acc355c0d3",
    role: "admin"
  };
  
  console.log('📤 Sending your data:', signupData);
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, signupData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SIGNUP SUCCESS!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Signup failed:');
    console.log('Status:', error.response?.status);
    console.log('Full Error Data:', JSON.stringify(error.response?.data, null, 2));
    
    // Check if this email already exists
    if (error.response?.data?.message?.includes('already exists') || error.response?.status === 409) {
      console.log('\n💡 This email might already be registered. Try logging in instead:');
      
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email: signupData.email,
          password: signupData.password
        });
        
        console.log('✅ LOGIN SUCCESS with existing account!');
        console.log('User:', loginResponse.data.data.user);
      } catch (loginError) {
        console.log('❌ Login also failed:', loginError.response?.data);
      }
    }
  }
}

testYourSignup();