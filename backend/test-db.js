require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Running ONYX.sql to create tables...');
      const fs = require('fs');
      const path = require('path');
      const sqlPath = path.join(__dirname, '../ONYX.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      await pool.query(sql);
      console.log('✅ Tables created successfully!');
    }
    
    // Check for admin user
    const adminCheck = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('📝 Creating default admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4)`,
        ['Admin User', 'admin@onyx.com', passwordHash, 'admin']
      );
      
      console.log('✅ Default admin user created:');
      console.log('   Email: admin@onyx.com');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();