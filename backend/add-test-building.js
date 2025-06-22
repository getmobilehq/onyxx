// Add a unique test building to prove API is working
require('dotenv').config();
const axios = require('axios');

async function addTestBuilding() {
  try {
    // First, login to get a token
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@onyx.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful!\n');
    
    // Create a unique test building
    const uniqueName = `API Test Building ${Date.now()}`;
    const testBuilding = {
      name: uniqueName,
      type: 'Test Building',
      construction_type: 'API Test',
      year_built: 2024,
      square_footage: 99999,
      state: 'API',
      city: 'Test City',
      zip_code: '12345',
      street_address: '123 API Test Street',
      cost_per_sqft: 999.99,
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400'
    };
    
    console.log('🏢 Creating test building:', uniqueName);
    
    const response = await axios.post(
      'http://localhost:5001/api/buildings',
      testBuilding,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Building created successfully!');
    console.log('📍 Building ID:', response.data.data.building.id);
    console.log('\n🔍 Now refresh your buildings page in the browser.');
    console.log('   You should see:', uniqueName);
    console.log('   With 99,999 sq ft size');
    console.log('\n✨ If you see this building, the API is definitely working!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

addTestBuilding();