/**
 * Remove Foreign Key Constraints Temporarily
 * This will allow signup to work while we debug the constraint issues
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
  ssl: false
});

async function removeConstraints() {
  console.log('🔧 Removing foreign key constraints temporarily...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    await client.query('BEGIN');
    
    try {
      // Remove foreign key constraint from users table
      await client.query(`
        ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_organization;
      `);
      console.log('✅ Removed fk_users_organization constraint');
      
      // Allow NULL organization_id
      await client.query(`
        ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
      `);
      console.log('✅ Made organization_id nullable');
      
      // Check for other constraints that might cause issues
      const constraintCheck = await client.query(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'users'
          AND tc.constraint_type = 'FOREIGN KEY';
      `);
      
      console.log('\n🔗 Remaining foreign key constraints on users table:');
      if (constraintCheck.rows.length > 0) {
        constraintCheck.rows.forEach(constraint => {
          console.log(`   ${constraint.constraint_name}: ${constraint.column_name} (${constraint.constraint_type})`);
        });
      } else {
        console.log('   No foreign key constraints found');
      }
      
      await client.query('COMMIT');
      console.log('\n✅ Constraints removed successfully!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    
  } catch (error) {
    console.error('\n❌ Failed to remove constraints:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

removeConstraints().catch(console.error);