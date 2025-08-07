/**
 * Reset Daniel Jumbo's password to ensure it works
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: false
});

async function resetDanielPassword() {
  console.log('🔧 Resetting Daniel Jumbo\'s password...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    const email = 'onyxsolutions001@gmail.com';
    const newPassword = '#Solutions321';
    
    // Generate a fresh password hash
    console.log('🔐 Generating fresh password hash...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    const updateResult = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, name, email',
      [passwordHash, email]
    );
    
    if (updateResult.rows.length === 0) {
      console.log('❌ User not found with email:', email);
      client.release();
      await pool.end();
      return;
    }
    
    console.log('✅ Password updated successfully!');
    console.log('User:', updateResult.rows[0]);
    
    // Test the new password
    console.log('\n🧪 Testing new password...');
    const testResult = await client.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [email]
    );
    
    const isPasswordValid = await bcrypt.compare(newPassword, testResult.rows[0].password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('\n🎉 Daniel can now login with:');
      console.log('   Email: onyxsolutions001@gmail.com');
      console.log('   Password: #Solutions321');
    } else {
      console.log('❌ Password verification failed - something is wrong');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await pool.end();
  }
}

resetDanielPassword().catch(console.error);