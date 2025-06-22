import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../../ONYX.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ ONYX.sql file not found!');
      console.log('Make sure ONYX.sql is in the root directory');
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Database migration completed successfully!');
    
    // Create default admin user if none exists
    const adminCheck = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('📝 Creating default admin user...');
      
      // Create admin user with password 'admin123'
      const bcrypt = require('bcryptjs');
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
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();