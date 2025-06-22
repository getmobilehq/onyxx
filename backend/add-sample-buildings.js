// Add sample buildings to the database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const sampleBuildings = [
  {
    name: 'Oak Tower Office Complex',
    type: 'Office Building',
    construction_type: 'Steel Frame',
    year_built: 2010,
    square_footage: 150000,
    state: 'NY',
    city: 'New York',
    zip_code: '10001',
    street_address: '123 Business Ave',
    cost_per_sqft: 300.00,
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    status: 'assessed'
  },
  {
    name: 'Riverside Apartments',
    type: 'Residential Complex',
    construction_type: 'Concrete',
    year_built: 2015,
    square_footage: 200000,
    state: 'CA',
    city: 'Riverside',
    zip_code: '92501',
    street_address: '456 River Road',
    cost_per_sqft: 200.00,
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
    status: 'assessed'
  },
  {
    name: 'Central Mall',
    type: 'Retail',
    construction_type: 'Steel Frame',
    year_built: 2005,
    square_footage: 500000,
    state: 'TX',
    city: 'Dallas',
    zip_code: '75001',
    street_address: '789 Shopping Blvd',
    cost_per_sqft: 180.00,
    image_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6',
    status: 'assessed'
  },
  {
    name: 'Tech Campus Building A',
    type: 'Office Building',
    construction_type: 'Steel Frame',
    year_built: 2018,
    square_footage: 180000,
    state: 'CA',
    city: 'Palo Alto',
    zip_code: '94025',
    street_address: '321 Innovation Way',
    cost_per_sqft: 400.00,
    image_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    status: 'pending'
  },
  {
    name: 'Memorial Hospital - East Wing',
    type: 'Healthcare',
    construction_type: 'Concrete',
    year_built: 2012,
    square_footage: 120000,
    state: 'IL',
    city: 'Chicago',
    zip_code: '60601',
    street_address: '555 Health Center Dr',
    cost_per_sqft: 750.00,
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
    status: 'assessed'
  },
  {
    name: 'Greenfield Elementary School',
    type: 'Educational',
    construction_type: 'Masonry',
    year_built: 1998,
    square_footage: 80000,
    state: 'OH',
    city: 'Columbus',
    zip_code: '43301',
    street_address: '100 Education Lane',
    cost_per_sqft: 220.00,
    image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
    status: 'assessed'
  },
  {
    name: 'Northside Warehouse',
    type: 'Industrial',
    construction_type: 'Steel Frame',
    year_built: 2008,
    square_footage: 250000,
    state: 'MI',
    city: 'Detroit',
    zip_code: '48201',
    street_address: '2000 Industrial Pkwy',
    cost_per_sqft: 120.00,
    image_url: 'https://images.unsplash.com/photo-1553413077-190dd305871c',
    status: 'pending'
  },
  {
    name: 'City Hall',
    type: 'Government',
    construction_type: 'Masonry',
    year_built: 1985,
    square_footage: 100000,
    state: 'FL',
    city: 'Miami',
    zip_code: '33101',
    street_address: '1 Civic Center Plaza',
    cost_per_sqft: 280.00,
    image_url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b',
    status: 'assessed'
  }
];

async function addSampleBuildings() {
  try {
    console.log('🏢 Adding sample buildings to database...\n');

    // Get admin user ID
    const adminResult = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (adminResult.rows.length === 0) {
      console.error('❌ No admin user found. Please run migration first.');
      process.exit(1);
    }

    const adminId = adminResult.rows[0].id;
    console.log('👤 Found admin user:', adminId);

    // Check if buildings already exist
    const existingBuildings = await pool.query('SELECT COUNT(*) FROM buildings');
    const buildingCount = parseInt(existingBuildings.rows[0].count);

    if (buildingCount > 0) {
      console.log(`📋 Found ${buildingCount} existing buildings`);
      console.log('🤔 Do you want to add more sample buildings? (y/n)');
      
      // For automation, we'll skip if buildings exist
      console.log('✅ Skipping - buildings already exist');
      
      // Show existing buildings
      const existing = await pool.query('SELECT id, name, type FROM buildings ORDER BY created_at');
      console.log('\n🏢 Existing buildings:');
      existing.rows.forEach((building, index) => {
        console.log(`   ${index + 1}. ${building.name} (${building.type})`);
      });
      
      process.exit(0);
    }

    let addedCount = 0;

    for (const building of sampleBuildings) {
      try {
        const result = await pool.query(
          `INSERT INTO buildings (
            name, type, construction_type, year_built, square_footage,
            state, city, zip_code, street_address, cost_per_sqft, 
            image_url, created_by_user_id, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id, name`,
          [
            building.name,
            building.type,
            building.construction_type,
            building.year_built,
            building.square_footage,
            building.state,
            building.city,
            building.zip_code,
            building.street_address,
            building.cost_per_sqft,
            building.image_url,
            adminId,
            building.status
          ]
        );

        console.log(`✅ Added: ${result.rows[0].name}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Failed to add ${building.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully added ${addedCount} buildings!`);
    
    // Verify the data
    const finalCount = await pool.query('SELECT COUNT(*) FROM buildings');
    console.log(`📊 Total buildings in database: ${finalCount.rows[0].count}`);

    console.log('\n🚀 You can now test the buildings API:');
    console.log('   GET http://localhost:5001/api/buildings');
    console.log('\n💡 Login to frontend and check the buildings page!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add sample buildings:', error.message);
    process.exit(1);
  }
}

addSampleBuildings();