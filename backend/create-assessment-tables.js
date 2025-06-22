#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function createAssessmentTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating assessment tables...\n');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create assessments table
    console.log('📋 Creating assessments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('pre_assessment', 'field_assessment')),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        scheduled_date TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        assigned_to_user_id UUID REFERENCES users(id),
        created_by_user_id UUID NOT NULL REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Assessments table created');
    
    // Create assessment_elements table for tracking individual element assessments
    console.log('📋 Creating assessment_elements table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessment_elements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        element_id UUID NOT NULL REFERENCES elements(id),
        condition_rating INT CHECK (condition_rating >= 1 AND condition_rating <= 5),
        notes TEXT,
        photo_urls JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assessment_id, element_id)
      )
    `);
    console.log('✅ Assessment elements table created');
    
    // Create indexes for better performance
    console.log('📋 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assessments_building_id ON assessments(building_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
      CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
      CREATE INDEX IF NOT EXISTS idx_assessments_assigned_to ON assessments(assigned_to_user_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_elements_assessment_id ON assessment_elements(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_assessment_elements_element_id ON assessment_elements(element_id);
    `);
    console.log('✅ Indexes created');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n✅ All assessment tables created successfully!');
    
    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('assessments', 'assessment_elements')
      ORDER BY table_name
    `);
    
    console.log('📋 Assessment-related tables in database:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error.message);
    console.error(error);
  } finally {
    client.release();
    pool.end();
  }
}

createAssessmentTables();