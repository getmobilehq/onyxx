/**
 * Verify Daniel Jumbo's account and test password
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

async function verifyAccount() {
  console.log('🔍 Verifying Daniel Jumbo\'s account...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    const email = 'onyxsolutions001@gmail.com';
    const password = '#Solutions321';
    
    // Get user from database
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ No user found with email:', email);
      client.release();
      await pool.end();
      return;
    }
    
    const user = result.rows[0];
    console.log('\n✅ User found in database:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Created:', user.created_at);
    console.log('   Organization:', user.organization_id || 'None');
    
    // Test password
    console.log('\n🔐 Testing password...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n💡 Login should work with these credentials.');
      console.log('   If login is still failing, it might be an API issue.');
    } else {
      console.log('❌ Password does NOT match!');
      console.log('   The stored password hash doesn\'t match "#Solutions321"');
      
      // Let's update the password to ensure it works
      console.log('\n🔧 Updating password to ensure it matches...');
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(password, salt);
      
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, user.id]
      );
      
      console.log('✅ Password has been updated!');
      console.log('   Daniel can now login with:');
      console.log('   Email: onyxsolutions001@gmail.com');
      console.log('   Password: #Solutions321');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyAccount().catch(console.error);