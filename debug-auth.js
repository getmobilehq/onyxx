#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

console.log('🔍 Debugging Onyx Authentication System...\n');

async function testBackend() {
  console.log('1️⃣ Testing if backend is running...');
  
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Backend is running!');
    console.log('📊 Response:', response.data);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Backend is NOT running or not accessible');
    console.log('🔗 Expected URL:', `${API_URL}/health`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solution: Start the backend server with:');
      console.log('   cd backend && npm run dev');
    } else {
      console.log('❗ Error:', error.message);
    }
    console.log('');
    return false;
  }
}

async function testRegistration() {
  console.log('2️⃣ Testing user registration...');
  
  const testUser = {
    name: 'Debug Test User',
    email: 'debug@example.com',
    password: 'test123456',
    role: 'admin'
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ Registration successful!');
    console.log('👤 User created:', {
      id: response.data.data.user.id,
      email: response.data.data.user.email,
      name: response.data.data.user.name,
      role: response.data.data.user.role
    });
    console.log('🔑 Tokens received:', {
      accessToken: response.data.data.tokens.accessToken ? '✅ Present' : '❌ Missing',
      refreshToken: response.data.data.tokens.refreshToken ? '✅ Present' : '❌ Missing'
    });
    console.log('');
    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.log('❌ Registration failed');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response:', error.response.data);
      
      if (error.response.status === 409) {
        console.log('💡 User might already exist, trying login instead...');
        return await testLogin(testUser.email, testUser.password);
      }
    } else {
      console.log('❗ Error:', error.message);
    }
    console.log('');
    return null;
  }
}

async function testLogin(email = 'test@example.com', password = 'test123456') {
  console.log('3️⃣ Testing user login...');
  console.log(`📧 Email: ${email}`);
  console.log(`🔐 Password: ${password}`);
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    console.log('✅ Login successful!');
    console.log('👤 User:', {
      id: response.data.data.user.id,
      email: response.data.data.user.email,
      name: response.data.data.user.name,
      role: response.data.data.user.role
    });
    console.log('🔑 Tokens received:', {
      accessToken: response.data.data.tokens.accessToken ? '✅ Present' : '❌ Missing',
      refreshToken: response.data.data.tokens.refreshToken ? '✅ Present' : '❌ Missing'
    });
    console.log('');
    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.log('❌ Login failed');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('💡 Solutions:');
        console.log('   - Check if user exists in database');
        console.log('   - Verify password is correct');
        console.log('   - Try registering a new user first');
      }
    } else {
      console.log('❗ Error:', error.message);
    }
    console.log('');
    return null;
  }
}

async function testProtectedEndpoint(token) {
  if (!token) {
    console.log('4️⃣ Skipping protected endpoint test (no token)');
    console.log('');
    return;
  }
  
  console.log('4️⃣ Testing protected endpoint...');
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Protected endpoint works!');
    console.log('👤 Current user:', response.data.data.user);
    console.log('');
  } catch (error) {
    console.log('❌ Protected endpoint failed');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response:', error.response.data);
    } else {
      console.log('❗ Error:', error.message);
    }
    console.log('');
  }
}

async function runDebug() {
  const backendRunning = await testBackend();
  
  if (!backendRunning) {
    console.log('🛑 Cannot continue without backend. Please start the backend first.');
    console.log('');
    console.log('📋 To start backend:');
    console.log('   cd /Users/josephagunbidae/Desktop/studio/onyx/backend');
    console.log('   npm install');
    console.log('   npm run dev');
    console.log('');
    return;
  }
  
  // Try existing user first
  let token = await testLogin();
  
  // If login fails, try registration
  if (!token) {
    token = await testRegistration();
  }
  
  // Test protected endpoint
  await testProtectedEndpoint(token);
  
  console.log('🎯 Summary:');
  console.log('- Backend status:', backendRunning ? '✅ Running' : '❌ Not running');
  console.log('- Authentication:', token ? '✅ Working' : '❌ Failed');
  console.log('');
  
  if (token) {
    console.log('🎉 Authentication system is working correctly!');
    console.log('💡 You can now use these credentials in the frontend:');
    console.log('   Email: debug@example.com');
    console.log('   Password: test123456');
  } else {
    console.log('❗ Authentication system needs attention');
    console.log('💡 Next steps:');
    console.log('   1. Check backend logs for errors');
    console.log('   2. Verify database connection');
    console.log('   3. Check if all required tables exist');
  }
}

runDebug().catch(console.error);