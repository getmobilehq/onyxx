// Check if Jones Towers exists in database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkJonesTower() {
  try {
    console.log('🔍 Searching for Jones Towers...\n');
    
    // Search for Jones Towers
    const result = await pool.query(`
      SELECT id, name, type, city, state, created_at, created_by_user_id
      FROM buildings
      WHERE name ILIKE '%jones%'
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Found Jones Towers:');
      result.rows.forEach(building => {
        console.log('\n📍 Building Details:');
        console.log('   ID:', building.id);
        console.log('   Name:', building.name);
        console.log('   Type:', building.type);
        console.log('   Location:', `${building.city}, ${building.state}`);
        console.log('   Created:', new Date(building.created_at).toLocaleString());
        console.log('   Created by:', building.created_by_user_id || 'Unknown');
      });
    } else {
      console.log('❌ Jones Towers not found in database');
    }
    
    // Show total building count
    const countResult = await pool.query('SELECT COUNT(*) FROM buildings');
    console.log(`\n📊 Total buildings in database: ${countResult.rows[0].count}`);
    
    // Show latest 5 buildings
    const latestResult = await pool.query(`
      SELECT name, created_at 
      FROM buildings 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📅 Latest 5 buildings:');
    latestResult.rows.forEach((building, index) => {
      console.log(`${index + 1}. ${building.name} - ${new Date(building.created_at).toLocaleString()}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkJonesTower();