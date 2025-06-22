// Database status checker
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Test connection
    const timeResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    console.log('📅 Server time:', timeResult.rows[0].now);
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   ❌ No tables found');
    } else {
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    }
    
    // Check users
    const usersExist = tablesResult.rows.some(row => row.table_name === 'users');
    if (usersExist) {
      const usersResult = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at');
      console.log('\n👥 Users in database:');
      if (usersResult.rows.length === 0) {
        console.log('   ❌ No users found');
      } else {
        usersResult.rows.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        });
      }
      
      // Check for admin
      const adminResult = await pool.query("SELECT * FROM users WHERE role = 'admin'");
      if (adminResult.rows.length > 0) {
        console.log('✅ Admin user exists');
      } else {
        console.log('❌ No admin user found');
      }
    } else {
      console.log('\n❌ Users table does not exist');
    }
    
    console.log('\n📊 Database Summary:');
    console.log(`   Total tables: ${tablesResult.rows.length}`);
    if (usersExist) {
      const userCount = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`   Total users: ${userCount.rows[0].count}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Start PostgreSQL: brew services start postgresql');
      console.error('   2. Check if database "onyx" exists');
      console.error('   3. Verify user "jojo" has access');
    }
    
    process.exit(1);
  }
}

checkDatabase();