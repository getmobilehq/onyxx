// Check and optionally clean test buildings
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkBuildings() {
  try {
    console.log('🔍 Checking all buildings in database...\n');
    
    // Get all buildings
    const result = await pool.query(`
      SELECT id, name, type, city, state, image_url, created_at
      FROM buildings
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total buildings: ${result.rows.length}\n`);
    
    // Separate test buildings from real buildings
    const testBuildings = result.rows.filter(b => b.name.includes('API Test Building'));
    const realBuildings = result.rows.filter(b => !b.name.includes('API Test Building'));
    
    console.log('🏢 Real Buildings:');
    realBuildings.forEach((building, index) => {
      console.log(`${index + 1}. ${building.name} (${building.city}, ${building.state})`);
      console.log(`   Type: ${building.type}`);
      console.log(`   Image: ${building.image_url ? '✅ Has image' : '❌ No image'}`);
      console.log('');
    });
    
    if (testBuildings.length > 0) {
      console.log(`\n🧪 Test Buildings Found: ${testBuildings.length}`);
      testBuildings.forEach(building => {
        console.log(`- ${building.name} (ID: ${building.id})`);
      });
      
      console.log('\n💡 To remove test buildings, run:');
      console.log('   node check-and-clean-buildings.js --clean-test');
    }
    
    // Clean test buildings if requested
    if (process.argv.includes('--clean-test')) {
      console.log('\n🧹 Cleaning test buildings...');
      const deleteResult = await pool.query(
        "DELETE FROM buildings WHERE name LIKE 'API Test Building%'"
      );
      console.log(`✅ Removed ${deleteResult.rowCount} test buildings`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBuildings();