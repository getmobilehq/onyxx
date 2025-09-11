import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface TableInfo {
  table_name: string;
  columns: ColumnInfo[];
  row_count?: number;
}

async function auditDatabaseSchema() {
  console.log('🔍 Starting Database Schema Audit...\n');
  
  try {
    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`📊 Found ${tables.length} tables in database:\n`);
    console.log(tables.map(t => `  - ${t}`).join('\n'));
    console.log('\n' + '='.repeat(80) + '\n');
    
    const tableInfo: TableInfo[] = [];
    
    // Get detailed information for each table
    for (const tableName of tables) {
      const columnsQuery = `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      
      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const countResult = await pool.query(countQuery);
      const rowCount = parseInt(countResult.rows[0].count);
      
      tableInfo.push({
        table_name: tableName,
        columns: columnsResult.rows,
        row_count: rowCount
      });
      
      console.log(`📋 Table: ${tableName} (${rowCount} rows)`);
      console.log('Columns:');
      
      columnsResult.rows.forEach((col: ColumnInfo) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const dataType = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`  - ${col.column_name}: ${dataType} ${nullable}${defaultVal}`);
      });
      
      console.log('\n' + '-'.repeat(80) + '\n');
    }
    
    // Check for foreign key relationships
    const foreignKeysQuery = `
      SELECT
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;
    
    const foreignKeysResult = await pool.query(foreignKeysQuery);
    
    console.log('🔗 Foreign Key Relationships:\n');
    if (foreignKeysResult.rows.length > 0) {
      foreignKeysResult.rows.forEach(fk => {
        console.log(`  ${fk.source_table}.${fk.source_column} → ${fk.target_table}.${fk.target_column}`);
      });
    } else {
      console.log('  No foreign key constraints found');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Check for potential issues
    console.log('⚠️  Potential Schema Issues:\n');
    
    const issues: string[] = [];
    
    // Check for missing indexes on foreign keys
    for (const fk of foreignKeysResult.rows) {
      const indexQuery = `
        SELECT COUNT(*) as count
        FROM pg_indexes
        WHERE tablename = $1
          AND indexdef LIKE '%${fk.source_column}%'
      `;
      const indexResult = await pool.query(indexQuery, [fk.source_table]);
      if (indexResult.rows[0].count === '0') {
        issues.push(`Missing index on foreign key: ${fk.source_table}.${fk.source_column}`);
      }
    }
    
    // Check for tables without primary keys
    for (const table of tables) {
      const pkQuery = `
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE table_name = $1
          AND constraint_type = 'PRIMARY KEY'
      `;
      const pkResult = await pool.query(pkQuery, [table]);
      if (pkResult.rows[0].count === '0') {
        issues.push(`Table without primary key: ${table}`);
      }
    }
    
    // Check for potential naming inconsistencies
    const expectedTables = [
      'organizations', 'users', 'buildings', 'elements', 
      'assessments', 'assessment_elements', 'reports'
    ];
    
    for (const expected of expectedTables) {
      if (!tables.includes(expected)) {
        issues.push(`Expected table not found: ${expected}`);
      }
    }
    
    // Check for column naming patterns
    for (const table of tableInfo) {
      // Check for ID columns
      const hasId = table.columns.some(col => col.column_name === 'id');
      if (!hasId && !table.table_name.includes('_')) {
        issues.push(`Table missing 'id' column: ${table.table_name}`);
      }
      
      // Check for timestamp columns
      const hasCreatedAt = table.columns.some(col => 
        col.column_name === 'created_at' || col.column_name === 'createdat'
      );
      const hasUpdatedAt = table.columns.some(col => 
        col.column_name === 'updated_at' || col.column_name === 'updatedat'
      );
      
      if (!hasCreatedAt) {
        issues.push(`Table missing 'created_at' column: ${table.table_name}`);
      }
      if (!hasUpdatedAt) {
        issues.push(`Table missing 'updated_at' column: ${table.table_name}`);
      }
    }
    
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
    } else {
      console.log('  ✅ No critical schema issues detected');
    }
    
    // Generate schema documentation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const auditReport = {
      timestamp,
      database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown',
      tables: tableInfo,
      foreign_keys: foreignKeysResult.rows,
      issues,
      summary: {
        total_tables: tables.length,
        total_columns: tableInfo.reduce((sum, t) => sum + t.columns.length, 0),
        total_relationships: foreignKeysResult.rows.length,
        total_issues: issues.length
      }
    };
    
    // Save audit report
    const reportPath = path.join(process.cwd(), `schema-audit-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
    
    console.log('\n' + '='.repeat(80) + '\n');
    console.log(`📁 Audit report saved to: ${reportPath}`);
    console.log('\n✅ Schema audit complete!\n');
    
    // Generate SQL for fixing common issues
    console.log('🔧 Suggested SQL Fixes:\n');
    
    // Add missing columns
    const fixSQL: string[] = [];
    
    for (const table of tableInfo) {
      if (!table.columns.some(col => col.column_name === 'created_at')) {
        fixSQL.push(`ALTER TABLE ${table.table_name} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      }
      if (!table.columns.some(col => col.column_name === 'updated_at')) {
        fixSQL.push(`ALTER TABLE ${table.table_name} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
      }
    }
    
    // Add missing indexes on foreign keys
    for (const fk of foreignKeysResult.rows) {
      fixSQL.push(`CREATE INDEX idx_${fk.source_table}_${fk.source_column} ON ${fk.source_table}(${fk.source_column});`);
    }
    
    if (fixSQL.length > 0) {
      console.log(fixSQL.join('\n'));
      
      // Save fixes to file
      const fixPath = path.join(process.cwd(), `schema-fixes-${timestamp}.sql`);
      fs.writeFileSync(fixPath, fixSQL.join('\n'));
      console.log(`\n📁 SQL fixes saved to: ${fixPath}`);
    } else {
      console.log('No automatic fixes available');
    }
    
  } catch (error) {
    console.error('❌ Error during schema audit:', error);
  } finally {
    await pool.end();
  }
}

// Run the audit
auditDatabaseSchema().catch(console.error);