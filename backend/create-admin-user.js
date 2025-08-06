/**
 * Create Admin User for Daniel Jumbo
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

async function createAdminUser() {
  console.log('🔧 Creating admin account for Daniel Jumbo...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    const email = 'onyxsolutions001@gmail.com';
    const password = '#Solutions321';
    const name = 'Daniel Jumbo';
    const role = 'admin';
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User with this email already exists!');
      console.log('User ID:', existingUser.rows[0].id);
      client.release();
      await pool.end();
      return;
    }
    
    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user without organization (can be added later)
    console.log('👤 Creating user...');
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, organization_id, created_at`,
      [name, email, passwordHash, role]
    );
    
    const user = result.rows[0];
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Role:', user.role);
    console.log('🆔 User ID:', user.id);
    console.log('🏢 Organization:', user.organization_id || 'None (can be added later)');
    console.log('📅 Created:', user.created_at);
    
    console.log('\n✨ Daniel Jumbo can now login with:');
    console.log('   Email: onyxsolutions001@gmail.com');
    console.log('   Password: #Solutions321');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser().catch(console.error);