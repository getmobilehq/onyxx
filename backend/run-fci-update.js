const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection using the same config as your backend
const pool = new Pool({
  user: 'jojo',
  host: 'localhost',
  database: 'onyx',
  password: 'Montg0m3r!',
  port: 5432,
});

async function runFCISchemaUpdate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting FCI schema update...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'update-fci-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📁 Loaded SQL file:', sqlPath);
    
    // Execute the SQL commands
    await client.query(sql);
    
    console.log('✅ FCI schema update completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying schema changes...');
    
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'fci_reports' 
      AND column_name IN ('assessment_id', 'immediate_repair_cost', 'short_term_repair_cost', 'long_term_repair_cost', 'condition_rating')
      ORDER BY column_name;
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('📊 New columns added:');
      columnCheck.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  No new columns found - they may already exist');
    }
    
    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'fci_reports' 
      AND indexname LIKE 'idx_fci_reports_%';
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log('📇 Indexes created:');
      indexCheck.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    }
    
    console.log('\n🎉 Schema update verification complete!');
    
  } catch (error) {
    console.error('❌ Error running FCI schema update:', error);
    console.error('Error details:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the update
runFCISchemaUpdate().catch(console.error);