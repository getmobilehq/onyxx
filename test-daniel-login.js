// Test login for Daniel Jumbo's account
import axios from 'axios';

async function testDanielLogin() {
  const API_URL = 'https://onyx-backend-f7vh.onrender.com/api';
  
  console.log('🔍 Testing login for Daniel Jumbo...');
  
  const loginData = {
    email: 'onyxsolutions001@gmail.com',
    password: '#Solutions321'
  };
  
  console.log('📤 Attempting login with:');
  console.log('   Email:', loginData.email);
  console.log('   Password: [HIDDEN]');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ LOGIN SUCCESSFUL!');
    console.log('👤 User Details:');
    console.log('   Name:', response.data.data.user.name);
    console.log('   Email:', response.data.data.user.email);
    console.log('   Role:', response.data.data.user.role);
    console.log('   User ID:', response.data.data.user.id);
    console.log('\n🔐 Access Token:', response.data.data.tokens.accessToken.substring(0, 50) + '...');
    console.log('\n✨ Daniel can now access the dashboard at onyxreport.com');
    
  } catch (error) {
    console.log('\n❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This means either:');
      console.log('   1. The password is incorrect');
      console.log('   2. The account doesn\'t exist');
      console.log('   3. The account was created but with a different password');
    }
  }
}

testDanielLogin().catch(console.error);