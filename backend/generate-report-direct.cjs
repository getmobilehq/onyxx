#!/usr/bin/env node

/**
 * Direct Report Generation Script
 * 
 * This script directly generates a report for a completed assessment
 * by connecting to the database and creating the report entry.
 * 
 * Usage: node generate-report-direct.js
 */

require('dotenv').config({ path: './.env.production' });
const { Pool } = require('pg');

const assessmentId = 'd8fe2945-4eee-4263-8328-5e6dd405acc5';
const buildingId = '7fcc6a37-5537-4f0c-a4b7-21518de1e4c8';

// Create PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function generateReport() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking assessment status...');
    
    // First, check if assessment exists and is completed
    const assessmentCheck = await client.query(
      `SELECT a.*, b.name as building_name, b.square_footage, b.replacement_value,
              u.name as assessor_name
       FROM assessments a
       JOIN buildings b ON a.building_id = b.id
       JOIN users u ON a.assigned_to_user_id = u.id
       WHERE a.id = $1`,
      [assessmentId]
    );
    
    if (assessmentCheck.rows.length === 0) {
      console.error('❌ Assessment not found');
      return;
    }
    
    const assessment = assessmentCheck.rows[0];
    console.log('✅ Found assessment:', {
      id: assessment.id,
      status: assessment.status,
      building: assessment.building_name
    });
    
    if (assessment.status !== 'completed') {
      console.log('⚠️ Assessment is not completed. Status:', assessment.status);
      console.log('Updating assessment status to completed...');
      
      await client.query(
        `UPDATE assessments SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [assessmentId]
      );
    }
    
    // Calculate FCI data
    console.log('📊 Calculating FCI data...');
    
    const fciData = await client.query(`
      SELECT 
        SUM(COALESCE(ae.total_repair_cost, 0)) as total_repair_cost,
        SUM(CASE WHEN ae.priority = '1' THEN COALESCE(ae.total_repair_cost, 0) ELSE 0 END) as immediate_repair_cost,
        SUM(CASE WHEN ae.priority = '2' THEN COALESCE(ae.total_repair_cost, 0) ELSE 0 END) as short_term_repair_cost,
        SUM(CASE WHEN ae.priority = '3' THEN COALESCE(ae.total_repair_cost, 0) ELSE 0 END) as long_term_repair_cost
      FROM assessment_elements ae
      WHERE ae.assessment_id = $1
    `, [assessmentId]);
    
    const repairs = fciData.rows[0];
    const totalRepairCost = parseFloat(repairs.total_repair_cost || 0);
    const replacementValue = parseFloat(assessment.replacement_value || 1);
    const fciScore = replacementValue > 0 ? totalRepairCost / replacementValue : 0;
    
    console.log('📈 FCI Calculation:', {
      totalRepairCost,
      replacementValue,
      fciScore: fciScore.toFixed(4),
      immediateRepairs: repairs.immediate_repair_cost || 0,
      shortTermRepairs: repairs.short_term_repair_cost || 0,
      longTermRepairs: repairs.long_term_repair_cost || 0
    });
    
    // Check if report already exists
    const existingReport = await client.query(
      `SELECT id FROM reports WHERE assessment_id = $1`,
      [assessmentId]
    );
    
    if (existingReport.rows.length > 0) {
      console.log('ℹ️ Report already exists. Updating...');
      
      const updateResult = await client.query(`
        UPDATE reports SET
          total_repair_cost = $1,
          replacement_value = $2,
          fci_score = $3,
          immediate_repair_cost = $4,
          short_term_repair_cost = $5,
          long_term_repair_cost = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE assessment_id = $7
        RETURNING id
      `, [
        totalRepairCost,
        replacementValue,
        fciScore,
        repairs.immediate_repair_cost || 0,
        repairs.short_term_repair_cost || 0,
        repairs.long_term_repair_cost || 0,
        assessmentId
      ]);
      
      console.log('✅ Report updated successfully! Report ID:', updateResult.rows[0].id);
    } else {
      console.log('📝 Creating new report...');
      
      // Get a user ID for the report (using the assessor)
      const userId = assessment.assigned_to_user_id || assessment.created_by;
      
      const insertResult = await client.query(`
        INSERT INTO reports (
          building_id, 
          assessment_id, 
          title, 
          created_by_user_id,
          total_repair_cost, 
          replacement_value, 
          fci_score, 
          immediate_repair_cost, 
          short_term_repair_cost,
          long_term_repair_cost, 
          status, 
          report_type, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        buildingId,
        assessmentId,
        `FCI Report - ${assessment.building_name}`,
        userId,
        totalRepairCost,
        replacementValue,
        fciScore,
        repairs.immediate_repair_cost || 0,
        repairs.short_term_repair_cost || 0,
        repairs.long_term_repair_cost || 0,
        'draft',
        'facility_condition',
      ]);
      
      console.log('✅ Report created successfully! Report ID:', insertResult.rows[0].id);
    }
    
    // Fetch the complete report data
    const reportData = await client.query(`
      SELECT r.*, b.name as building_name, u.name as created_by_name
      FROM reports r
      JOIN buildings b ON r.building_id = b.id
      JOIN users u ON r.created_by_user_id = u.id
      WHERE r.assessment_id = $1
    `, [assessmentId]);
    
    if (reportData.rows.length > 0) {
      const report = reportData.rows[0];
      console.log('\n📊 Report Summary:');
      console.log('=====================================');
      console.log(`Building: ${report.building_name}`);
      console.log(`FCI Score: ${(report.fci_score * 100).toFixed(2)}%`);
      console.log(`Total Repair Cost: $${report.total_repair_cost.toLocaleString()}`);
      console.log(`Replacement Value: $${report.replacement_value.toLocaleString()}`);
      console.log(`Report Status: ${report.status}`);
      console.log('=====================================');
      console.log('\n🎉 You can now view the report at:');
      console.log(`https://www.onyxreport.com/reports?buildingId=${buildingId}`);
    }
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Run the script
generateReport().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});