/**
 * Check if the user already exists in the database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: false
});

async function checkUser() {
  console.log('🔍 Checking if user already exists...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    const email = 'josephagunbiadehq@gmail.com';
    
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log(`❌ User with email "${email}" already exists!`);
      console.log('User details:', result.rows[0]);
      console.log('\n💡 This explains the signup failure. User needs to login instead.');
    } else {
      console.log(`✅ No user found with email "${email}"`);
      console.log('Signup should work for this email.');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser().catch(console.error);