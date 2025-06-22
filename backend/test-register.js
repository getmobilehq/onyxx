// Test registration endpoint
const axios = require('axios');

async function testRegister() {
  try {
    console.log('🧪 Testing registration endpoint...\n');
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123456',
      role: 'admin'
    };
    
    console.log('📤 Sending registration request:', {
      ...testUser,
      password: '***hidden***'
    });
    
    const response = await axios.post('http://localhost:5001/api/auth/register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('📧 User created:', response.data.data.user);
    console.log('🔑 Tokens received:', {
      accessToken: response.data.data.tokens.accessToken ? '✅ Present' : '❌ Missing',
      refreshToken: response.data.data.tokens.refreshToken ? '✅ Present' : '❌ Missing'
    });
    
  } catch (error) {
    console.error('❌ Registration failed:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
      if (error.response.data.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

testRegister();