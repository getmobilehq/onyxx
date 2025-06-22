// Smart migration script for Onyx - handles existing tables
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function runSmartMigration() {
  try {
    console.log('🔄 Running smart database migration...');
    
    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'buildings', 'elements', 'pre_assessments', 'field_assessments', 'fci_reports', 'reference_building_costs')
    `);
    
    const existingTables = tablesCheck.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    if (existingTables.length === 0) {
      // No tables exist, run full migration
      console.log('📝 No tables found, creating all tables...');
      const sqlPath = path.join(__dirname, '../ONYX.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('✅ All tables created successfully!');
    } else {
      console.log('✅ Tables already exist, skipping table creation');
    }
    
    // Check for admin user
    const adminCheck = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('📝 Creating default admin user...');
      
      // Create admin user with password 'admin123'
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4)`,
        [
          'Admin User',
          'admin@onyx.com',
          passwordHash,
          'admin'
        ]
      );
      
      console.log('✅ Default admin user created:');
      console.log('   Email: admin@onyx.com');
      console.log('   Password: admin123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Verify the setup
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Total users in database: ${userCount.rows[0].count}`);
    
    // Check if we have all required tables
    const requiredTables = ['users', 'buildings', 'elements', 'pre_assessments', 'field_assessments', 'fci_reports', 'reference_building_costs'];
    const finalCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
    `, [requiredTables]);
    
    const presentTables = finalCheck.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !presentTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      console.log('💡 You may need to run the full ONYX.sql script manually');
    } else {
      console.log('✅ All required tables are present');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nYou can now start the backend server with:');
    console.log('  npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Cannot connect to PostgreSQL. Please ensure:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. The database "onyx" exists');
      console.error('   3. User "jojo" has access with password');
      console.error('   4. The connection string is correct: postgresql://jojo:Montg0m3r!@localhost:5432/onyx');
    } else if (error.code === '42P07') {
      console.error('\n💡 Tables already exist. This is normal if you\'ve run the migration before.');
      console.error('   The script will now check for admin user...');
      
      // Continue with admin user check even if tables exist
      try {
        const adminCheck = await pool.query(
          "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
        );
        
        if (adminCheck.rows.length === 0) {
          console.log('\n📝 Creating default admin user...');
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
        
        console.log('\n🎉 Setup completed successfully!');
        process.exit(0);
      } catch (adminError) {
        console.error('❌ Failed to create admin user:', adminError.message);
        process.exit(1);
      }
    }
    
    process.exit(1);
  }
}

runSmartMigration();