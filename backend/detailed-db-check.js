/**
 * Detailed Database Check
 * Check all constraints, triggers, and schema details that might affect user insertion
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

async function detailedCheck() {
  console.log('🔍 Detailed database schema check...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // 1. Check users table schema
    const schemaQuery = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users table schema:');
    schemaQuery.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // 2. Check all constraints on users table
    const constraintsQuery = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'users'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `);
    
    console.log('\n🔗 All constraints on users table:');
    constraintsQuery.rows.forEach(constraint => {
      console.log(`   ${constraint.constraint_type}: ${constraint.constraint_name}`);
      if (constraint.column_name) {
        console.log(`      Column: ${constraint.column_name}`);
      }
      if (constraint.foreign_table_name) {
        console.log(`      References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      }
    });
    
    // 3. Check triggers on users table
    const triggersQuery = await client.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'users';
    `);
    
    console.log('\n⚡ Triggers on users table:');
    if (triggersQuery.rows.length > 0) {
      triggersQuery.rows.forEach(trigger => {
        console.log(`   ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`      Action: ${trigger.action_statement}`);
      });
    } else {
      console.log('   No triggers found');
    }
    
    // 4. Test insertion manually
    console.log('\n🧪 Testing manual user insertion...');
    
    try {
      // First, let's see if we can insert without organization_id at all
      const testInsert = await client.query(`
        INSERT INTO users (name, email, password_hash, role) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, name, email, role, organization_id;
      `, [
        'Manual Test User',
        `manualtest${Date.now()}@dbtest.com`,
        '$2a$10$hashedpasswordexample',
        'admin'
      ]);
      
      console.log('✅ Manual insertion SUCCESS!');
      console.log('   Created user:', testInsert.rows[0]);
      
      // Clean up test user
      await client.query('DELETE FROM users WHERE id = $1', [testInsert.rows[0].id]);
      console.log('   Test user cleaned up');
      
    } catch (insertError) {
      console.log('❌ Manual insertion FAILED:');
      console.log('   Error code:', insertError.code);
      console.log('   Error message:', insertError.message);
      console.log('   Error detail:', insertError.detail);
    }
    
    client.release();
    
  } catch (error) {
    console.error('\n❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

detailedCheck().catch(console.error);