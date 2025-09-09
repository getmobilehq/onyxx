const axios = require('axios');

async function debugAssessment() {
  const assessmentId = 'da5031dc-9e28-490f-82fe-a426a96d7396';
  const apiUrl = 'https://onyx-backend-f7vh.onrender.com/api';
  
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${apiUrl}/auth/login`, {
      email: 'admin@onyx.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data.tokens;
    console.log('✅ Login successful');
    
    // Get the assessment details
    console.log(`📋 Fetching assessment details...`);
    const assessmentResponse = await axios.get(
      `${apiUrl}/assessments/${assessmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const assessment = assessmentResponse.data.data;
    console.log('✅ Assessment details retrieved!');
    console.log('Assessment data:', JSON.stringify(assessment, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugAssessment();