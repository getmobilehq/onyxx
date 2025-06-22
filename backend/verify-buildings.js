// Verify buildings in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function verifyBuildings() {
  try {
    console.log('🔍 Checking buildings in database...\n');
    
    // Get all buildings
    const result = await pool.query(`
      SELECT id, name, type, year_built, square_footage, city, state, created_at
      FROM buildings
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total buildings in database: ${result.rows.length}\n`);
    
    if (result.rows.length === 0) {
      console.log('❌ No buildings found in database!');
      console.log('   The frontend must be showing mock data.');
    } else {
      console.log('🏢 Buildings in database:');
      result.rows.forEach((building, index) => {
        console.log(`\n${index + 1}. ${building.name}`);
        console.log(`   Type: ${building.type}`);
        console.log(`   Location: ${building.city}, ${building.state}`);
        console.log(`   Year Built: ${building.year_built}`);
        console.log(`   Size: ${building.square_footage.toLocaleString()} sq ft`);
        console.log(`   Added: ${new Date(building.created_at).toLocaleDateString()}`);
      });
      
      console.log('\n✅ These buildings should match what you see in the frontend!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyBuildings();