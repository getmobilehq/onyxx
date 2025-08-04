/**
 * Check Database State
 * Verify organizations and users setup
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
  ssl: false // No SSL for now
});

async function checkDbState() {
  console.log('🔍 Checking database state...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check organizations
    const orgsResult = await client.query('SELECT id, name FROM organizations ORDER BY created_at');
    console.log('\n🏢 Organizations:');
    orgsResult.rows.forEach(org => {
      console.log(`   ${org.id} - ${org.name}`);
    });
    
    // Check users
    const usersResult = await client.query('SELECT id, name, email, organization_id FROM users ORDER BY created_at');
    console.log('\n👥 Users:');
    usersResult.rows.forEach(user => {
      console.log(`   ${user.id} - ${user.email} (org: ${user.organization_id || 'NULL'})`);
    });
    
    // Check if default org ID exists
    const defaultOrgResult = await client.query(`
      SELECT id FROM organizations WHERE name = 'Default Organization'
    `);
    
    if (defaultOrgResult.rows.length > 0) {
      console.log(`\n✅ Default organization ID: ${defaultOrgResult.rows[0].id}`);
    } else {
      console.log('\n❌ Default organization not found!');
    }
    
    // Check foreign key constraints
    const constraintsResult = await client.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'users'
        AND kcu.column_name = 'organization_id';
    `);
    
    console.log('\n🔗 Foreign Key Constraints for users.organization_id:');
    if (constraintsResult.rows.length > 0) {
      constraintsResult.rows.forEach(fk => {
        console.log(`   ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('   No foreign key constraints found');
    }
    
    client.release();
    
  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

checkDbState().catch(console.error);