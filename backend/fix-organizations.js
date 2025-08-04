/**
 * Fix Organizations Migration
 * Run this to ensure organizations table exists and default org is created
 */

const { Pool } = require('pg');
require('dotenv').config();

// Use production database URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Parse connection string to determine SSL requirements
let poolConfig = { connectionString };

if (connectionString.includes('amazonaws.com') || connectionString.includes('render.com')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

console.log('🔗 Connecting to database with SSL:', !!poolConfig.ssl);

const pool = new Pool(poolConfig);

async function fixOrganizations() {
  console.log('🔧 Fixing organizations setup...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Start transaction
    await client.query('BEGIN');
    console.log('🔄 Transaction started');
    
    // 1. Check if organizations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'organizations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📦 Creating organizations table...');
      
      // Create organizations table
      await client.query(`
        CREATE TABLE organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          industry VARCHAR(100),
          size VARCHAR(50),
          website VARCHAR(255),
          phone VARCHAR(50),
          address VARCHAR(255),
          city VARCHAR(100),
          state VARCHAR(50),
          zip_code VARCHAR(20),
          country VARCHAR(100),
          subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'professional', 'enterprise')),
          subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended')),
          subscription_expires_at TIMESTAMP WITH TIME ZONE,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Organizations table created');
    } else {
      console.log('✅ Organizations table already exists');
    }
    
    // 2. Check if users table has organization_id column
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
      );
    `);
    
    if (!columnCheck.rows[0].exists) {
      console.log('🔧 Adding organization_id to users table...');
      
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN organization_id UUID,
        ADD COLUMN is_organization_owner BOOLEAN DEFAULT false;
      `);
      
      console.log('✅ Users table updated');
    } else {
      console.log('✅ Users table already has organization_id');
    }
    
    // 3. Check if default organization exists
    const defaultOrgCheck = await client.query(`
      SELECT id FROM organizations WHERE name = 'Default Organization';
    `);
    
    if (defaultOrgCheck.rows.length === 0) {
      console.log('🏢 Creating default organization...');
      
      await client.query(`
        INSERT INTO organizations (id, name, description, subscription_plan) 
        VALUES (
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          'Default Organization', 
          'Initial organization for existing data',
          'professional'
        );
      `);
      
      console.log('✅ Default organization created');
    } else {
      console.log('✅ Default organization already exists');
    }
    
    // 4. Update existing users to belong to default organization
    const updateResult = await client.query(`
      UPDATE users 
      SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      WHERE organization_id IS NULL;
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} users with default organization`);
    
    // 5. Try to add foreign key constraint (may already exist)
    try {
      await client.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_organization
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint added');
    } catch (constraintError) {
      if (constraintError.message.includes('already exists')) {
        console.log('✅ Foreign key constraint already exists');
      } else {
        console.log('⚠️ Could not add foreign key constraint:', constraintError.message);
      }
    }
    
    // 6. Verify setup
    const verifyQuery = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as org_count,
        (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL) as users_with_org,
        (SELECT COUNT(*) FROM users WHERE organization_id IS NULL) as users_without_org
    `);
    
    const stats = verifyQuery.rows[0];
    console.log('\n📊 Database Status:');
    console.log(`   Organizations: ${stats.org_count}`);
    console.log(`   Users with org: ${stats.users_with_org}`);
    console.log(`   Users without org: ${stats.users_without_org}`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Organizations fix completed successfully!');
    
    // Release client
    client.release();
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    
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

// Run the fix
fixOrganizations().catch(console.error);