#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Onyx Backend...\n');

// Change to backend directory
process.chdir(__dirname);

console.log('📋 Current directory:', process.cwd());

// Run migration first
console.log('\n🗃️  Running database migration...');
const migrate = spawn('node', ['manual-migrate.js'], { 
  stdio: 'inherit',
  cwd: __dirname 
});

migrate.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Migration completed successfully!');
    console.log('\n🚀 Starting development server...');
    
    // Start the dev server
    const dev = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    dev.on('close', (devCode) => {
      process.exit(devCode);
    });
    
  } else {
    console.error('❌ Migration failed with code:', code);
    process.exit(1);
  }
});

migrate.on('error', (err) => {
  console.error('❌ Failed to run migration:', err.message);
  process.exit(1);
});