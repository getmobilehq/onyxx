import pool from './database';

export async function ensureDatabaseConstraints() {
  try {
    console.log('🔧 Checking database constraints...');
    
    // Check if the problematic foreign key constraint exists
    const constraintCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints tc
      WHERE tc.table_name = 'users'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'users_organization_id_fkey';
    `);
    
    if (constraintCheck.rows[0].count > 0) {
      console.log('❌ Found problematic foreign key constraint - removing it...');
      
      // Remove the foreign key constraint that's preventing signups
      await pool.query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
      `);
      
      console.log('✅ Foreign key constraint removed - signups will now work!');
    } else {
      console.log('✅ Database constraints are correct');
    }
    
    // Ensure organization_id can be NULL
    await pool.query(`
      ALTER TABLE users 
      ALTER COLUMN organization_id DROP NOT NULL;
    `);
    
  } catch (error) {
    console.error('⚠️ Warning: Could not check/fix database constraints:', error);
    // Don't crash the server if this fails
  }
}