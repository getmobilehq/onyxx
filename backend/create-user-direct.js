require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./dist/config/database').default;
const { v4: uuidv4 } = require('uuid');

const createUser = async () => {
  // User details - modify these as needed
  const userDetails = {
    email: 'newuser@onyx.com',
    name: 'New User',
    password: 'password123',
    role: 'admin'
  };

  try {
    console.log('🆕 Creating new user...\n');
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [userDetails.email]
    );

    if (existingUser.rows.length > 0) {
      console.log(`❌ User with email ${userDetails.email} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userDetails.password, 10);

    // Create user (with correct columns)
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, name, email, role`,
      [uuidv4(), userDetails.name, userDetails.email, passwordHash, userDetails.role]
    );

    console.log('✅ User created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   👤 Name: ${result.rows[0].name}`);
    console.log(`   📧 Email: ${result.rows[0].email}`);
    console.log(`   🎭 Role: ${result.rows[0].role}`);
    console.log(`   🔐 Password: ${userDetails.password}`);
    console.log('\n💡 You can now login with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

createUser();