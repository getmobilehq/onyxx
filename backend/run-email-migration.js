/**
 * Email Tables Migration Script
 * Run this to create email-related tables in production database
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

async function runEmailMigration() {
  console.log('📧 Starting email tables migration...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-email-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Connect to database
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Start transaction
    await client.query('BEGIN');
    console.log('🔄 Transaction started');
    
    // Execute the migration
    await client.query(sql);
    console.log('✅ Email tables created successfully');
    
    // Verify tables were created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'email_logs',
        'email_templates', 
        'email_subscriptions',
        'report_subscriptions',
        'email_delivery_tracking',
        'email_security_events'
      )
      ORDER BY table_name;
    `;
    
    const result = await client.query(verifyQuery);
    console.log('\n📊 Created email tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Verify email templates were inserted
    const templatesQuery = `
      SELECT name, category 
      FROM email_templates 
      ORDER BY name;
    `;
    const templatesResult = await client.query(templatesQuery);
    console.log('\n📄 Email templates installed:');
    templatesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.name} (${row.category})`);
    });
    
    // Check for users that will get security alert subscriptions
    const adminQuery = `
      SELECT COUNT(*) as admin_count 
      FROM users 
      WHERE role = 'admin';
    `;
    const adminResult = await client.query(adminQuery);
    console.log(`\n👥 Admin users for security alerts: ${adminResult.rows[0].admin_count}`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Email migration completed successfully!');
    
    // Test Mailgun configuration
    console.log('\n📧 Testing Mailgun configuration...');
    const mailgunTest = await testMailgunConfig();
    if (mailgunTest.success) {
      console.log('✅ Mailgun configuration verified');
    } else {
      console.log('⚠️ Mailgun configuration needs setup:', mailgunTest.message);
    }
    
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

async function testMailgunConfig() {
  try {
    const requiredEnvVars = [
      'MAILGUN_API_KEY',
      'MAILGUN_DOMAIN', 
      'FROM_EMAIL',
      'FROM_NAME'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        success: false,
        message: `Missing environment variables: ${missingVars.join(', ')}`
      };
    }
    
    return {
      success: true,
      message: 'All Mailgun environment variables configured'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

// Run the migration
runEmailMigration().catch(console.error);