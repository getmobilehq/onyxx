/**
 * Remove Foreign Key Constraint from Production Database
 * This fixes the signup error: "violates foreign key constraint users_organization_id_fkey"
 */

const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function removeForeignKeyConstraint() {
  console.log('🔧 Removing foreign key constraint from users table...');
  console.log('📍 Database:', connectionString.split('@')[1]?.split('/')[0] || 'production');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // First, check if the constraint exists
    console.log('\n🔍 Checking for foreign key constraints on users.organization_id...');
    const constraintCheck = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'users'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'users_organization_id_fkey';
    `);
    
    if (constraintCheck.rows.length === 0) {
      console.log('✅ No foreign key constraint found - already removed!');
      client.release();
      await pool.end();
      return;
    }
    
    console.log('❌ Found constraint:', constraintCheck.rows[0].constraint_name);
    
    // Remove the foreign key constraint
    console.log('\n🗑️ Dropping foreign key constraint...');
    await client.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
    `);
    
    console.log('✅ Foreign key constraint removed successfully!');
    
    // Verify removal
    console.log('\n🔍 Verifying constraint removal...');
    const verifyCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'users'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'users_organization_id_fkey';
    `);
    
    if (verifyCheck.rows[0].count === '0') {
      console.log('✅ Confirmed: Foreign key constraint has been removed');
      console.log('\n🎉 Users can now sign up without an organization!');
    } else {
      console.log('⚠️ Warning: Constraint might still exist');
    }
    
    // Show current constraints
    console.log('\n📋 Current constraints on users table:');
    const currentConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'users'
      ORDER BY tc.constraint_type;
    `);
    
    currentConstraints.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_type}: ${constraint.constraint_name}`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error removing constraint:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

removeForeignKeyConstraint().catch(console.error);