const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testCompatibility() {
  try {
    const password = 'Acc355c0d3';
    
    // Get stored hash
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE email = 'joseph@univelcity.com'"
    );
    const storedHash = result.rows[0].password_hash;
    
    console.log('Testing password:', password);
    console.log('Stored hash:', storedHash);
    console.log('');
    
    // Test with bcrypt (what we used to create)
    console.log('Testing with bcrypt:');
    const bcryptValid = await bcrypt.compare(password, storedHash);
    console.log('✅ bcrypt says:', bcryptValid);
    
    // Test with bcryptjs (what auth controller uses)
    console.log('\nTesting with bcryptjs:');
    const bcryptjsValid = await bcryptjs.compare(password, storedHash);
    console.log('✅ bcryptjs says:', bcryptjsValid);
    
    // Create new hash with bcryptjs and update user
    if (bcryptjsValid) {
      console.log('\n✅ Both libraries are compatible!');
    } else {
      console.log('\n❌ Libraries are NOT compatible. Creating new hash with bcryptjs...');
      
      const newHash = await bcryptjs.hash(password, 10);
      console.log('New bcryptjs hash:', newHash);
      
      // Update user password
      await pool.query(
        "UPDATE users SET password_hash = $1 WHERE email = $2",
        [newHash, 'joseph@univelcity.com']
      );
      
      console.log('✅ Password updated with bcryptjs hash');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testCompatibility();