#!/usr/bin/env ts-node

/**
 * Fix Orphaned Users Script
 *
 * This script fixes users who don't have an organization_id by:
 * 1. Creating a default organization
 * 2. Assigning all orphaned users to it
 *
 * Usage:
 *   npm run fix:orphaned-users
 *   or
 *   npx ts-node backend/scripts/fix-orphaned-users.ts
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixOrphanedUsers() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking for users without organization_id...\n');

    // Step 1: Check for orphaned users
    const orphanedCheck = await client.query(`
      SELECT id, email, name, role, created_at
      FROM users
      WHERE organization_id IS NULL
      ORDER BY created_at DESC
    `);

    if (orphanedCheck.rows.length === 0) {
      console.log('✅ No orphaned users found. All users have organization_id!');
      return;
    }

    console.log(`⚠️  Found ${orphanedCheck.rows.length} users without organization_id:\n`);
    orphanedCheck.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - Role: ${user.role}`);
    });

    console.log('\n🔧 Creating default organization...\n');

    // Step 2: Create or get default organization
    const orgResult = await client.query(`
      INSERT INTO organizations (name, subscription_tier, created_at, updated_at)
      VALUES ('Default Organization', 'free', NOW(), NOW())
      ON CONFLICT (name) DO UPDATE
      SET updated_at = NOW()
      RETURNING id, name
    `);

    const defaultOrg = orgResult.rows[0];
    console.log(`✅ Default organization ready: "${defaultOrg.name}" (${defaultOrg.id})\n`);

    // Step 3: Update orphaned users
    console.log('🔄 Assigning orphaned users to default organization...\n');

    const updateResult = await client.query(`
      UPDATE users
      SET organization_id = $1,
          updated_at = NOW()
      WHERE organization_id IS NULL
      RETURNING id, email, name
    `, [defaultOrg.id]);

    console.log(`✅ Updated ${updateResult.rows.length} users:\n`);
    updateResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`);
    });

    // Step 4: Verify fix
    console.log('\n🔍 Verifying fix...\n');

    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE organization_id IS NULL
    `);

    const remainingOrphans = parseInt(verifyResult.rows[0].count);

    if (remainingOrphans > 0) {
      console.log(`❌ Warning: Still have ${remainingOrphans} users without organization_id!`);
    } else {
      console.log('✅ Success! All users now have organization_id\n');
    }

    // Step 5: Show summary
    const summaryResult = await client.query(`
      SELECT
        o.id as organization_id,
        o.name as organization_name,
        COUNT(u.id) as user_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      GROUP BY o.id, o.name
      ORDER BY user_count DESC
    `);

    console.log('📊 Organization Summary:\n');
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.organization_name}: ${row.user_count} users`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n💡 Note: Users need to log out and log in again for the changes to take effect in their JWT tokens.');

  } catch (error) {
    console.error('❌ Error fixing orphaned users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
fixOrphanedUsers()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
