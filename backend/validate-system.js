#!/usr/bin/env node

/**
 * System Validation Script
 * Validates that the entire Onyx system is working correctly
 */

require('dotenv').config({ path: './.env.production' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const color = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue
  }[type] || colors.reset;
  
  console.log(`${color}${message}${colors.reset}`);
}

async function validateSystem() {
  const client = await pool.connect();
  const errors = [];
  const warnings = [];
  const successes = [];
  
  try {
    log('\n🔍 SYSTEM VALIDATION STARTING...\n', 'info');
    
    // 1. Validate Buildings
    log('📊 Validating Buildings...', 'info');
    const buildings = await client.query(`
      SELECT 
        id, name, square_footage, cost_per_sqft, replacement_value,
        CASE 
          WHEN replacement_value < 1000 THEN 'ERROR: Invalid replacement value'
          WHEN replacement_value < 100000 THEN 'WARNING: Low replacement value'
          ELSE 'OK'
        END as status
      FROM buildings
    `);
    
    buildings.rows.forEach(building => {
      const msg = `  ${building.name}: $${(building.replacement_value || 0).toLocaleString()} (${building.square_footage || 0} sqft @ $${building.cost_per_sqft || 0}/sqft)`;
      if (building.status.includes('ERROR')) {
        errors.push(msg);
        log(msg + ' ❌', 'error');
      } else if (building.status.includes('WARNING')) {
        warnings.push(msg);
        log(msg + ' ⚠️', 'warning');
      } else {
        successes.push('Buildings have valid replacement values');
        log(msg + ' ✅', 'success');
      }
    });
    
    // 2. Validate Assessments
    log('\n📋 Validating Assessments...', 'info');
    const assessments = await client.query(`
      SELECT 
        a.id, a.name, a.status, b.name as building_name,
        COUNT(ae.id) as element_count,
        SUM(COALESCE(ae.total_repair_cost, 0)) as total_repair_cost
      FROM assessments a
      JOIN buildings b ON a.building_id = b.id
      LEFT JOIN assessment_elements ae ON ae.assessment_id = a.id
      WHERE a.status = 'completed'
      GROUP BY a.id, a.name, a.status, b.name
    `);
    
    if (assessments.rows.length === 0) {
      warnings.push('No completed assessments found');
      log('  ⚠️ No completed assessments found', 'warning');
    } else {
      assessments.rows.forEach(assessment => {
        const msg = `  ${assessment.name || 'Assessment'} for ${assessment.building_name}: ${assessment.element_count} elements, $${parseFloat(assessment.total_repair_cost).toLocaleString()} repair cost`;
        if (assessment.element_count === 0) {
          warnings.push(msg + ' - No elements');
          log(msg + ' ⚠️', 'warning');
        } else {
          successes.push('Assessments have elements and costs');
          log(msg + ' ✅', 'success');
        }
      });
    }
    
    // 3. Validate Reports
    log('\n📈 Validating Reports...', 'info');
    const reports = await client.query(`
      SELECT 
        r.id, r.title, r.fci_score, r.total_repair_cost, r.replacement_value,
        b.name as building_name,
        CASE 
          WHEN r.fci_score <= 0.1 THEN 'Good'
          WHEN r.fci_score <= 0.3 THEN 'Fair'
          WHEN r.fci_score <= 0.5 THEN 'Poor'
          ELSE 'Critical'
        END as condition
      FROM reports r
      JOIN buildings b ON r.building_id = b.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    
    if (reports.rows.length === 0) {
      warnings.push('No reports found');
      log('  ⚠️ No reports found', 'warning');
    } else {
      reports.rows.forEach(report => {
        const fciPercent = (report.fci_score * 100).toFixed(2);
        const msg = `  ${report.building_name}: FCI ${fciPercent}% (${report.condition}) - $${parseFloat(report.total_repair_cost).toLocaleString()} / $${parseFloat(report.replacement_value).toLocaleString()}`;
        
        if (report.replacement_value < 1000) {
          errors.push(msg + ' - Invalid replacement value');
          log(msg + ' ❌', 'error');
        } else if (report.fci_score === 0 && report.total_repair_cost > 0) {
          warnings.push(msg + ' - FCI calculation error');
          log(msg + ' ⚠️', 'warning');
        } else {
          successes.push('Reports have valid FCI calculations');
          log(msg + ' ✅', 'success');
        }
      });
    }
    
    // 4. Validate Elements
    log('\n🔧 Validating Building Elements...', 'info');
    const elements = await client.query(`
      SELECT COUNT(*) as total,
        COUNT(DISTINCT category) as categories
      FROM elements
    `);
    
    const elementData = elements.rows[0];
    if (elementData.total < 10) {
      errors.push(`Only ${elementData.total} elements in database`);
      log(`  ❌ Only ${elementData.total} elements found (minimum 10 required)`, 'error');
    } else {
      successes.push(`${elementData.total} elements available`);
      log(`  ✅ ${elementData.total} elements across ${elementData.categories} categories`, 'success');
    }
    
    // 5. Validate Assessment Elements with Costs
    log('\n💰 Validating Assessment Element Costs...', 'info');
    const elementCosts = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN total_repair_cost > 0 THEN 1 END) as with_costs,
        AVG(total_repair_cost) as avg_cost,
        MIN(total_repair_cost) as min_cost,
        MAX(total_repair_cost) as max_cost
      FROM assessment_elements
      WHERE assessment_id IN (
        SELECT id FROM assessments WHERE status = 'completed'
      )
    `);
    
    const costData = elementCosts.rows[0];
    if (costData.total > 0) {
      const pctWithCosts = ((costData.with_costs / costData.total) * 100).toFixed(1);
      const msg = `  ${costData.with_costs}/${costData.total} elements have costs (${pctWithCosts}%)`;
      
      if (pctWithCosts < 50) {
        warnings.push(msg);
        log(msg + ' ⚠️', 'warning');
      } else {
        successes.push('Most assessment elements have cost data');
        log(msg + ' ✅', 'success');
      }
      
      if (costData.avg_cost > 0) {
        log(`  Average cost: $${parseFloat(costData.avg_cost).toLocaleString()}`, 'info');
        log(`  Range: $${parseFloat(costData.min_cost).toLocaleString()} - $${parseFloat(costData.max_cost).toLocaleString()}`, 'info');
      }
    }
    
    // 6. Check Database Connectivity
    log('\n🔌 Checking Database Connectivity...', 'info');
    const dbCheck = await client.query('SELECT NOW() as time, current_database() as database');
    log(`  ✅ Connected to ${dbCheck.rows[0].database} at ${new Date(dbCheck.rows[0].time).toLocaleString()}`, 'success');
    successes.push('Database connection working');
    
    // Summary
    log('\n' + '='.repeat(50), 'info');
    log('📊 VALIDATION SUMMARY', 'info');
    log('='.repeat(50), 'info');
    
    if (errors.length > 0) {
      log(`\n❌ ERRORS (${errors.length}):`, 'error');
      errors.forEach(err => log(`  • ${err}`, 'error'));
    }
    
    if (warnings.length > 0) {
      log(`\n⚠️  WARNINGS (${warnings.length}):`, 'warning');
      warnings.forEach(warn => log(`  • ${warn}`, 'warning'));
    }
    
    if (successes.length > 0) {
      log(`\n✅ SUCCESS (${successes.length}):`, 'success');
      const uniqueSuccesses = [...new Set(successes)];
      uniqueSuccesses.forEach(success => log(`  • ${success}`, 'success'));
    }
    
    // Overall Status
    log('\n' + '='.repeat(50), 'info');
    if (errors.length === 0) {
      if (warnings.length === 0) {
        log('🎉 SYSTEM STATUS: EXCELLENT - All validations passed!', 'success');
      } else {
        log('✅ SYSTEM STATUS: GOOD - Working with minor warnings', 'success');
      }
      log('\n🚀 The system is ready for use at https://www.onyxreport.com', 'info');
    } else {
      log('❌ SYSTEM STATUS: NEEDS ATTENTION - Critical errors found', 'error');
      log('\n⚠️  Please run: node apply-all-fixes.js', 'warning');
    }
    
  } catch (error) {
    log(`\n❌ VALIDATION ERROR: ${error.message}`, 'error');
  } finally {
    client.release();
    pool.end();
  }
}

// Run validation
validateSystem().then(() => {
  process.exit(0);
}).catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'error');
  process.exit(1);
});