#!/usr/bin/env node

console.log('🚀 Starting Onyx Backend Setup...\n');

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.error('❌ .env file not found!');
  console.log('Please create a .env file with your database configuration.');
  process.exit(1);
}

console.log('📋 Current directory:', __dirname);
console.log('📋 Node version:', process.version);

// Step 1: Install dependencies if needed
if (!fs.existsSync('node_modules')) {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Step 2: Build TypeScript
console.log('\n🔨 Building TypeScript...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Step 3: Run migration
console.log('\n🗃️  Running database migration...');
try {
  require('./manual-migrate.js');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\nTo run migration manually:');
  console.log('  node manual-migrate.js');
}

console.log('\n✅ Setup complete! To start the server:');
console.log('  npm run dev     # For development');
console.log('  npm start       # For production');
console.log('\nThe API will be available at: http://localhost:5000');