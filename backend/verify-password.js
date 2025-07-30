const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyPassword() {
  try {
    // Get user's password hash
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE email = 'joseph@univelcity.com'"
    );
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    const storedHash = result.rows[0].password_hash;
    const testPassword = 'Acc355c0d3';
    
    console.log('Stored hash:', storedHash);
    console.log('Testing password:', testPassword);
    
    // Test password
    const isValid = await bcrypt.compare(testPassword, storedHash);
    console.log('Password is valid:', isValid);
    
    // Let's also create a new hash to compare
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('\nNew hash would be:', newHash);
    console.log('New hash validates:', await bcrypt.compare(testPassword, newHash));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyPassword();