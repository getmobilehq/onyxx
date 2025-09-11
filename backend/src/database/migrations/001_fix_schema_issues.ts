import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('🔧 Starting schema fixes migration...');

  // 1. Add missing updated_at columns
  const tablesToAddUpdatedAt = [
    'cleanup_backup_users',
    'elements', 
    'fci_reports',
    'field_assessments',
    'reference_building_costs',
    'tokens',
    'users'
  ];

  for (const table of tablesToAddUpdatedAt) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(table, 'updated_at');
      if (!hasColumn) {
        console.log(`  Adding updated_at to ${table}`);
        await knex.schema.alterTable(table, (t) => {
          t.timestamp('updated_at').defaultTo(knex.fn.now());
        });
      }
    }
  }

  // 2. Add missing created_at columns
  const tablesToAddCreatedAt = [
    'elements',
    'reference_building_costs'
  ];

  for (const table of tablesToAddCreatedAt) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(table, 'created_at');
      if (!hasColumn) {
        console.log(`  Adding created_at to ${table}`);
        await knex.schema.alterTable(table, (t) => {
          t.timestamp('created_at').defaultTo(knex.fn.now());
        });
      }
    }
  }

  // 3. Create indexes for foreign keys
  const indexesToCreate = [
    { table: 'assessment_deficiencies', column: 'assessment_element_id' },
    { table: 'assessment_elements', column: 'assessment_id' },
    { table: 'assessment_elements', column: 'element_id' },
    { table: 'assessments', column: 'assigned_to_user_id' },
    { table: 'assessments', column: 'building_id' },
    { table: 'assessments', column: 'created_by_user_id' },
    { table: 'assessments', column: 'organization_id' },
    { table: 'buildings', column: 'created_by_user_id' },
    { table: 'buildings', column: 'organization_id' },
    { table: 'fci_reports', column: 'assessment_id' },
    { table: 'fci_reports', column: 'building_id' },
    { table: 'fci_reports', column: 'created_by' },
    { table: 'field_assessments', column: 'assessor_id' },
    { table: 'field_assessments', column: 'building_id' },
    { table: 'field_assessments', column: 'element_id' },
    { table: 'pre_assessments', column: 'assessment_id' },
    { table: 'pre_assessments', column: 'building_id' },
    { table: 'pre_assessments', column: 'created_by_user_id' },
    { table: 'reports', column: 'assessment_id' },
    { table: 'reports', column: 'building_id' },
    { table: 'reports', column: 'created_by_user_id' },
    { table: 'tokens', column: 'created_by' },
    { table: 'tokens', column: 'used_by' },
    { table: 'users', column: 'invited_by' },
    { table: 'users', column: 'signup_token' }
  ];

  for (const index of indexesToCreate) {
    const hasTable = await knex.schema.hasTable(index.table);
    if (hasTable) {
      const indexName = `idx_${index.table}_${index.column}`;
      
      // Check if index already exists
      const indexExists = await knex.raw(`
        SELECT COUNT(*) as count 
        FROM pg_indexes 
        WHERE tablename = ? 
        AND indexname = ?
      `, [index.table, indexName]);
      
      if (indexExists.rows[0].count === '0') {
        console.log(`  Creating index: ${indexName}`);
        await knex.raw(`CREATE INDEX ${indexName} ON ${index.table}(${index.column})`);
      }
    }
  }

  // 4. Create migration tracking table
  const hasMigrationAudit = await knex.schema.hasTable('migration_audit');
  if (!hasMigrationAudit) {
    console.log('  Creating migration_audit table');
    await knex.schema.createTable('migration_audit', (table) => {
      table.increments('id');
      table.string('migration_name');
      table.timestamp('executed_at').defaultTo(knex.fn.now());
      table.json('schema_snapshot');
    });
  }

  // 5. Log this migration
  await knex('migration_audit').insert({
    migration_name: '001_fix_schema_issues',
    schema_snapshot: JSON.stringify({
      timestamp: new Date().toISOString(),
      fixes_applied: {
        updated_at_columns: tablesToAddUpdatedAt,
        created_at_columns: tablesToAddCreatedAt,
        indexes_created: indexesToCreate.length
      }
    })
  });

  console.log('✅ Schema fixes migration complete!');
}

export async function down(knex: Knex): Promise<void> {
  console.log('⏪ Rolling back schema fixes migration...');

  // Remove added columns
  const tablesToRemoveUpdatedAt = [
    'cleanup_backup_users',
    'elements',
    'fci_reports', 
    'field_assessments',
    'reference_building_costs',
    'tokens',
    'users'
  ];

  for (const table of tablesToRemoveUpdatedAt) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(table, 'updated_at');
      if (hasColumn) {
        await knex.schema.alterTable(table, (t) => {
          t.dropColumn('updated_at');
        });
      }
    }
  }

  const tablesToRemoveCreatedAt = [
    'elements',
    'reference_building_costs'
  ];

  for (const table of tablesToRemoveCreatedAt) {
    const hasTable = await knex.schema.hasTable(table);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(table, 'created_at');
      if (hasColumn) {
        await knex.schema.alterTable(table, (t) => {
          t.dropColumn('created_at');
        });
      }
    }
  }

  // Remove indexes
  const indexesToDrop = [
    { table: 'assessment_deficiencies', column: 'assessment_element_id' },
    { table: 'assessment_elements', column: 'assessment_id' },
    { table: 'assessment_elements', column: 'element_id' },
    { table: 'assessments', column: 'assigned_to_user_id' },
    { table: 'assessments', column: 'building_id' },
    { table: 'assessments', column: 'created_by_user_id' },
    { table: 'assessments', column: 'organization_id' },
    { table: 'buildings', column: 'created_by_user_id' },
    { table: 'buildings', column: 'organization_id' },
    { table: 'fci_reports', column: 'assessment_id' },
    { table: 'fci_reports', column: 'building_id' },
    { table: 'fci_reports', column: 'created_by' },
    { table: 'field_assessments', column: 'assessor_id' },
    { table: 'field_assessments', column: 'building_id' },
    { table: 'field_assessments', column: 'element_id' },
    { table: 'pre_assessments', column: 'assessment_id' },
    { table: 'pre_assessments', column: 'building_id' },
    { table: 'pre_assessments', column: 'created_by_user_id' },
    { table: 'reports', column: 'assessment_id' },
    { table: 'reports', column: 'building_id' },
    { table: 'reports', column: 'created_by_user_id' },
    { table: 'tokens', column: 'created_by' },
    { table: 'tokens', column: 'used_by' },
    { table: 'users', column: 'invited_by' },
    { table: 'users', column: 'signup_token' }
  ];

  for (const index of indexesToDrop) {
    const indexName = `idx_${index.table}_${index.column}`;
    await knex.raw(`DROP INDEX IF EXISTS ${indexName}`);
  }

  // Drop migration audit table
  await knex.schema.dropTableIfExists('migration_audit');

  console.log('✅ Rollback complete!');
}