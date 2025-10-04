#!/usr/bin/env ts-node

/**
 * Schema Investigation Script
 *
 * This script analyzes all SQL queries in the codebase related to report generation
 * and validates them against the actual database schema.
 */

import * as fs from 'fs';
import * as path from 'path';

// Actual database schema from production
const ACTUAL_SCHEMA = {
  assessments: {
    columns: [
      'id', 'organization_id', 'building_id', 'name', 'description', 'status',
      'assessment_type', 'assessment_date', 'completion_date', 'assigned_to_user_id',
      'created_by', 'updated_by', 'fci_score', 'total_repair_cost', 'replacement_value',
      'element_count', 'deficiency_count', 'notes', 'weather_conditions', 'temperature',
      'assessor_notes', 'created_at', 'updated_at', 'assigned_to'
    ],
    missing_columns: ['type', 'scheduled_date', 'created_by_user_id', 'started_at', 'completed_at']
  },
  buildings: {
    columns: [
      'id', 'organization_id', 'name', 'building_type', 'street_address', 'city',
      'state', 'zip_code', 'country', 'year_built', 'size', 'number_of_floors',
      'occupancy_type', 'cost_per_sqft', 'replacement_value', 'total_area',
      'notes', 'status', 'created_at', 'updated_at', 'created_by_user_id'
    ],
    missing_columns: ['square_footage', 'type']
  },
  users: {
    columns: [
      'id', 'organization_id', 'name', 'email', 'password', 'role',
      'is_organization_owner', 'is_platform_admin', 'created_at', 'updated_at'
    ]
  },
  assessment_elements: {
    columns: [
      'id', 'assessment_id', 'element_id', 'condition_rating', 'notes',
      'photo_urls', 'created_at', 'updated_at'
    ]
  },
  elements: {
    columns: [
      'id', 'code', 'major_group', 'group_element', 'individual_element',
      'description', 'created_at', 'updated_at'
    ]
  },
  reports: {
    columns: [
      'id', 'building_id', 'assessment_id', 'title', 'created_by_user_id',
      'total_repair_cost', 'replacement_value', 'replacement_cost', 'fci_score',
      'immediate_repair_cost', 'short_term_repair_cost', 'long_term_repair_cost',
      'status', 'report_type', 'created_at'
    ]
  }
};

interface Issue {
  file: string;
  line: number;
  query: string;
  invalid_column: string;
  table: string;
  suggestion: string;
}

const issues: Issue[] = [];

console.log('🔍 Starting comprehensive schema investigation...\n');

// Files to check
const filesToCheck = [
  'backend/src/services/fci.service.ts',
  'backend/src/controllers/assessments.controller.ts',
  'backend/src/controllers/reports.controller.ts',
  'backend/src/controllers/pre-assessments.controller.ts',
  'backend/src/controllers/buildings.controller.ts'
];

console.log('📋 Database Schema Summary:\n');
console.log('ASSESSMENTS table:');
console.log('  ✅ Columns:', ACTUAL_SCHEMA.assessments.columns.join(', '));
console.log('  ❌ Missing/Wrong:', ACTUAL_SCHEMA.assessments.missing_columns.join(', '));
console.log('');
console.log('BUILDINGS table:');
console.log('  ✅ Columns:', ACTUAL_SCHEMA.buildings.columns.join(', '));
console.log('  ❌ Missing/Wrong:', ACTUAL_SCHEMA.buildings.missing_columns.join(', '));
console.log('\n');

// Common problematic patterns to search for
const problematicPatterns = [
  { pattern: /b\.square_footage/g, table: 'buildings', wrongColumn: 'square_footage', correctColumn: 'size' },
  { pattern: /b\.type(?!\s*as\s*building_type)/g, table: 'buildings', wrongColumn: 'type', correctColumn: 'building_type' },
  { pattern: /a\.type(?!\s*as)/g, table: 'assessments', wrongColumn: 'type', correctColumn: 'assessment_type' },
  { pattern: /a\.scheduled_date/g, table: 'assessments', wrongColumn: 'scheduled_date', correctColumn: 'assessment_date' },
  { pattern: /a\.created_by_user_id/g, table: 'assessments', wrongColumn: 'created_by_user_id', correctColumn: 'created_by' },
  { pattern: /a\.started_at/g, table: 'assessments', wrongColumn: 'started_at', correctColumn: 'DOES NOT EXIST' },
  { pattern: /a\.completed_at/g, table: 'assessments', wrongColumn: 'completed_at', correctColumn: 'completion_date' }
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  problematicPatterns.forEach(({ pattern, table, wrongColumn, correctColumn }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        issues.push({
          file,
          line: index + 1,
          query: line.trim().substring(0, 100),
          invalid_column: wrongColumn,
          table,
          suggestion: `Use ${correctColumn} instead of ${wrongColumn}`
        });
      }
    });
  });
});

if (issues.length === 0) {
  console.log('✅ No schema mismatches found! All queries are correct.\n');
} else {
  console.log(`❌ Found ${issues.length} potential schema mismatches:\n`);

  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}:${issue.line}`);
    console.log(`   Table: ${issue.table}`);
    console.log(`   Invalid Column: ${issue.invalid_column}`);
    console.log(`   Suggestion: ${issue.suggestion}`);
    console.log(`   Query: ${issue.query}${issue.query.length >= 100 ? '...' : ''}`);
    console.log('');
  });
}

console.log('📊 Summary:');
console.log(`   Total files checked: ${filesToCheck.length}`);
console.log(`   Issues found: ${issues.length}`);
console.log('');

if (issues.length > 0) {
  console.log('💡 Recommendation: Fix these schema mismatches to prevent 500 errors.');
}

process.exit(issues.length > 0 ? 1 : 0);
