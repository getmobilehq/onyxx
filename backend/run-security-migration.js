/**
 * Security Tables Migration Script
 * Run this to create security tables in production database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use production database URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});

async function runMigration() {
  console.log('🔐 Starting security tables migration...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-security-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Start transaction
    await client.query('BEGIN');
    console.log('🔄 Transaction started');
    
    // Execute the migration
    await client.query(sql);
    console.log('✅ Security tables created successfully');
    
    // Verify tables were created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'security_events', 
        'login_attempts', 
        'ip_whitelist', 
        'user_sessions',
        'password_history',
        'api_keys',
        'audit_logs'
      )
      ORDER BY table_name;
    `;
    
    const result = await client.query(verifyQuery);
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!');
    
    // Release client
    client.release();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    // Rollback on error
    try {
      await pool.query('ROLLBACK');
      console.log('🔄 Transaction rolled back');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
    }
    
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);