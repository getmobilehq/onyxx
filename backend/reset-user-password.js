#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function resetPassword() {
  try {
    // Get email from command line or use default
    const email = process.argv[2] || 'joseph@univelcity.com';
    const newPassword = 'password123';
    
    console.log(`🔐 Resetting password for: ${email}\n`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE email = $2 
       RETURNING id, name, email, role`,
      [hashedPassword, email]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Password reset successful!');
      console.log('\n📋 User Details:');
      console.log(`   👤 Name: ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   🔐 New Password: ${newPassword}`);
      console.log('\n💡 You can now login with these credentials');
    } else {
      console.log(`❌ No user found with email: ${email}`);
      console.log('💡 Run "node check-users.js" to see all users');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

resetPassword();