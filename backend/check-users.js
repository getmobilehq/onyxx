#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');
    
    // Get all users
    const result = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Run the create-test-user.js script to create one');
    } else {
      console.log(`✅ Found ${result.rows.length} users:\n`);
      
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. User Details:`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Name: ${user.name}`);
        console.log(`   🎭 Role: ${user.role}`);
        console.log(`   📅 Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log('');
      });
      
      console.log('💡 To login, use one of these emails with the password you set during registration');
      console.log('💡 If you forgot your password, run: node reset-user-password.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

// Create a quick test user
async function createQuickUser() {
  try {
    console.log('\n📝 Creating a quick test user...\n');
    
    const email = 'admin@onyx.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      ['Admin User', email, hashedPassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Quick test user created!');
      console.log('📧 Email: admin@onyx.com');
      console.log('🔐 Password: admin123');
      console.log('🎭 Role: admin');
    } else {
      console.log('ℹ️ User admin@onyx.com already exists');
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
}

async function main() {
  await checkUsers();
  
  // Ask if they want to create a quick test user
  console.log('\n❓ Would you like to create a quick test user?');
  console.log('   Run: node check-users.js --create');
}

// Check command line arguments
if (process.argv.includes('--create')) {
  createQuickUser().then(() => pool.end());
} else {
  main().then(() => pool.end());
}