const bcryptjs = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.production' });

console.log('Connecting to production database...');
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createUserInProduction() {
  try {
    // Hash the password with bcryptjs (what the auth controller uses)
    const password = 'Acc355c0d3';
    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);
    
    console.log('Creating user with bcryptjs hashed password...');
    
    // First, get the organization ID (assuming Univelcity organization exists)
    const orgQuery = `
      SELECT id FROM organizations WHERE name ILIKE '%univelcity%' LIMIT 1
    `;
    const orgResult = await pool.query(orgQuery);
    
    let organizationId;
    if (orgResult.rows.length > 0) {
      organizationId = orgResult.rows[0].id;
      console.log('Found Univelcity organization:', organizationId);
    } else {
      // Create Univelcity organization
      const createOrgQuery = `
        INSERT INTO organizations (id, name, subscription_plan, subscription_status, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Univelcity', 'professional', 'active', NOW(), NOW())
        RETURNING id
      `;
      const newOrgResult = await pool.query(createOrgQuery);
      organizationId = newOrgResult.rows[0].id;
      console.log('Created Univelcity organization:', organizationId);
    }
    
    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await pool.query(existingUserQuery, ['joseph@univelcity.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists. Updating password...');
      
      // Update existing user
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, 
            name = $2,
            role = $3
        WHERE email = $4
        RETURNING id, name, email, role
      `;
      
      const result = await pool.query(updateQuery, [
        hashedPassword,
        'Joseph Agunbiade',
        'manager', // Non-admin role
        'joseph@univelcity.com'
      ]);
      
      console.log('✅ User updated successfully:');
      console.log(result.rows[0]);
      
    } else {
      console.log('Creating new user in production database...');
      
      // Create new user
      const insertQuery = `
        INSERT INTO users (id, name, email, password_hash, role, organization_id, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
        RETURNING id, name, email, role, organization_id
      `;
      
      const result = await pool.query(insertQuery, [
        'Joseph Agunbiade',
        'joseph@univelcity.com',
        hashedPassword,
        'manager', // Non-admin role
        organizationId
      ]);
      
      console.log('✅ User created successfully in production:');
      console.log(result.rows[0]);
    }
    
    // Verify the user can be found
    const verifyQuery = `
      SELECT u.id, u.name, u.email, u.role, u.organization_id, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.email = $1
    `;
    
    const verifyResult = await pool.query(verifyQuery, ['joseph@univelcity.com']);
    console.log('\n📋 User verification:');
    console.log(verifyResult.rows[0]);
    
    console.log('\n🎉 Production user creation completed!');
    console.log('\n📝 Login credentials:');
    console.log('URL: https://onyx-frontend.onrender.com');
    console.log('Email: joseph@univelcity.com');
    console.log('Password: Acc355c0d3');
    console.log('Role: manager (non-admin)');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.error('Error details:', error.message);
  } finally {
    await pool.end();
  }
}

createUserInProduction();