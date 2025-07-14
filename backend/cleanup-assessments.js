const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'jojo',
  host: 'localhost',
  database: 'onyx',
  password: 'Montg0m3r!',
  port: 5432,
});

async function cleanupAssessments() {
  const client = await pool.connect();
  
  try {
    console.log('=== Database Cleanup Script ===\n');
    
    // 1. Check current data counts
    console.log('1. Current data counts:');
    const countQuery = `
      SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
      UNION ALL
      SELECT COUNT(*), 'assessment_elements' FROM assessment_elements
      UNION ALL
      SELECT COUNT(*), 'buildings' FROM buildings
      UNION ALL
      SELECT COUNT(*), 'users' FROM users
      ORDER BY table_name;
    `;
    const counts = await client.query(countQuery);
    counts.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} records`);
    });
    
    // 2. Show sample assessments before deletion
    console.log('\n2. Sample assessments before deletion:');
    const assessments = await client.query(
      'SELECT id, building_id, created_by_user_id, type, status, created_at FROM assessments LIMIT 5'
    );
    if (assessments.rows.length > 0) {
      assessments.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Building: ${row.building_id}, User: ${row.created_by_user_id}, Type: ${row.type}, Status: ${row.status}`);
      });
    } else {
      console.log('   No assessments found.');
    }
    
    // 3. Show sample assessment elements before deletion
    console.log('\n3. Sample assessment elements before deletion:');
    const elements = await client.query(
      'SELECT id, assessment_id, element_id, condition_rating FROM assessment_elements LIMIT 5'
    );
    if (elements.rows.length > 0) {
      elements.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Assessment: ${row.assessment_id}, Element: ${row.element_id}, Rating: ${row.condition_rating}`);
      });
    } else {
      console.log('   No assessment elements found.');
    }
    
    // 4. Delete all assessment elements (due to foreign key constraints)
    console.log('\n4. Deleting all assessment_elements...');
    const deleteElements = await client.query('DELETE FROM assessment_elements');
    console.log(`   Deleted ${deleteElements.rowCount} assessment elements.`);
    
    // 5. Delete all assessments
    console.log('\n5. Deleting all assessments...');
    const deleteAssessments = await client.query('DELETE FROM assessments');
    console.log(`   Deleted ${deleteAssessments.rowCount} assessments.`);
    
    // 6. Verify deletion
    console.log('\n6. Verification after deletion:');
    const verifyQuery = `
      SELECT COUNT(*) as count, 'assessments' as table_name FROM assessments
      UNION ALL
      SELECT COUNT(*), 'assessment_elements' FROM assessment_elements;
    `;
    const verify = await client.query(verifyQuery);
    verify.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} records`);
    });
    
    // 7. Show available buildings
    console.log('\n7. Available buildings for new assessments:');
    const buildings = await client.query(
      'SELECT id, name, type, street_address, city, state FROM buildings ORDER BY id'
    );
    if (buildings.rows.length > 0) {
      buildings.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Name: ${row.name}, Type: ${row.type}`);
        console.log(`      Address: ${row.street_address}, ${row.city}, ${row.state}`);
      });
    } else {
      console.log('   No buildings found.');
    }
    
    // 8. Show available users
    console.log('\n8. Available users:');
    const users = await client.query('SELECT id, email, role FROM users ORDER BY id');
    if (users.rows.length > 0) {
      users.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Email: ${row.email}, Role: ${row.role}`);
      });
    } else {
      console.log('   No users found.');
    }
    
    console.log('\n=== Cleanup completed successfully! ===');
    
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
cleanupAssessments().catch(console.error);