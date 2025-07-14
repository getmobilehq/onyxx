require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./dist/config/database').default;
const { v4: uuidv4 } = require('uuid');

const createUser = async () => {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('🆕 Create New User\n');
    
    const email = await question('📧 Email: ');
    const name = await question('👤 Name: ');
    const password = await question('🔐 Password: ');
    const role = await question('🎭 Role (admin/manager/assessor) [default: admin]: ') || 'admin';
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log(`\n❌ User with email ${email} already exists`);
      rl.close();
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Get first organization (or create one)
    let orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
    let organizationId;
    
    if (orgResult.rows.length === 0) {
      // Create default organization
      const newOrg = await pool.query(
        `INSERT INTO organizations (id, name, address, phone, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [uuidv4(), 'Default Organization', '123 Main St', '555-0123', 'admin@onyx.com']
      );
      organizationId = newOrg.rows[0].id;
    } else {
      organizationId = orgResult.rows[0].id;
    }

    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, role`,
      [uuidv4(), name, email, passwordHash, role, organizationId]
    );

    console.log('\n✅ User created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   👤 Name: ${result.rows[0].name}`);
    console.log(`   📧 Email: ${result.rows[0].email}`);
    console.log(`   🎭 Role: ${result.rows[0].role}`);
    console.log(`   🔐 Password: ${password}`);
    console.log('\n💡 You can now login with these credentials');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
    rl.close();
    process.exit(1);
  }
};

createUser();