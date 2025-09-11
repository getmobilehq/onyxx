import { Pool } from 'pg';
import { z } from 'zod';

/**
 * Advanced Data Integrity Validation System
 * Ensures data consistency, referential integrity, and business rule compliance
 */

interface IntegrityCheckResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  affected_records?: number;
  fix_query?: string;
}

interface ValidationReport {
  timestamp: string;
  overall_status: 'healthy' | 'issues_found' | 'critical_errors';
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  checks: IntegrityCheckResult[];
  recommendations: string[];
}

export class DataIntegrityValidator {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Run comprehensive data integrity checks
   */
  async runIntegrityChecks(): Promise<ValidationReport> {
    console.log('🔍 Starting data integrity validation...\n');

    const checks: IntegrityCheckResult[] = [];
    const recommendations: string[] = [];

    try {
      // Run all integrity checks
      checks.push(await this.checkOrphanedRecords());
      checks.push(await this.checkReferentialIntegrity());
      checks.push(await this.checkDataConsistency());
      checks.push(await this.checkBusinessRuleCompliance());
      checks.push(await this.checkDataQuality());
      checks.push(await this.checkPerformanceIssues());
      checks.push(await this.checkSecurityVulnerabilities());

      // Calculate summary statistics
      const passed = checks.filter(c => c.status === 'pass').length;
      const failed = checks.filter(c => c.status === 'fail').length;
      const warnings = checks.filter(c => c.status === 'warning').length;

      // Determine overall status
      let overallStatus: 'healthy' | 'issues_found' | 'critical_errors' = 'healthy';
      if (failed > 0) {
        overallStatus = 'critical_errors';
      } else if (warnings > 0) {
        overallStatus = 'issues_found';
      }

      // Generate recommendations
      if (failed > 0) {
        recommendations.push('Critical data integrity issues found. Immediate attention required.');
      }
      if (warnings > 0) {
        recommendations.push('Data quality issues detected. Consider implementing fixes.');
      }
      if (checks.some(c => c.check.includes('Performance'))) {
        recommendations.push('Database performance could be improved with optimization.');
      }

      return {
        timestamp: new Date().toISOString(),
        overall_status: overallStatus,
        total_checks: checks.length,
        passed,
        failed,
        warnings,
        checks,
        recommendations
      };

    } catch (error) {
      console.error('Error during integrity checks:', error);
      throw error;
    }
  }

  /**
   * Check for orphaned records (records with invalid foreign keys)
   */
  private async checkOrphanedRecords(): Promise<IntegrityCheckResult> {
    try {
      const orphanedQueries = [
        {
          name: 'Assessments with invalid building_id',
          query: `
            SELECT count(*) as count
            FROM assessments a
            LEFT JOIN buildings b ON a.building_id = b.id
            WHERE b.id IS NULL AND a.building_id IS NOT NULL
          `,
          fix: `DELETE FROM assessments WHERE building_id NOT IN (SELECT id FROM buildings)`
        },
        {
          name: 'Assessment elements with invalid assessment_id',
          query: `
            SELECT count(*) as count
            FROM assessment_elements ae
            LEFT JOIN assessments a ON ae.assessment_id = a.id
            WHERE a.id IS NULL
          `,
          fix: `DELETE FROM assessment_elements WHERE assessment_id NOT IN (SELECT id FROM assessments)`
        },
        {
          name: 'Assessment elements with invalid element_id',
          query: `
            SELECT count(*) as count
            FROM assessment_elements ae
            LEFT JOIN elements e ON ae.element_id = e.id
            WHERE e.id IS NULL
          `,
          fix: `DELETE FROM assessment_elements WHERE element_id NOT IN (SELECT id FROM elements)`
        },
        {
          name: 'Reports with invalid building_id',
          query: `
            SELECT count(*) as count
            FROM reports r
            LEFT JOIN buildings b ON r.building_id = b.id
            WHERE b.id IS NULL
          `,
          fix: `DELETE FROM reports WHERE building_id NOT IN (SELECT id FROM buildings)`
        }
      ];

      let totalOrphaned = 0;
      const details: any[] = [];

      for (const check of orphanedQueries) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalOrphaned += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count,
            fix_query: check.fix
          });
        }
      }

      if (totalOrphaned > 0) {
        return {
          check: 'Orphaned Records',
          status: 'fail',
          message: `Found ${totalOrphaned} orphaned records`,
          details,
          affected_records: totalOrphaned,
          fix_query: 'Run individual fix queries for each orphaned type'
        };
      }

      return {
        check: 'Orphaned Records',
        status: 'pass',
        message: 'No orphaned records found'
      };

    } catch (error) {
      return {
        check: 'Orphaned Records',
        status: 'fail',
        message: 'Error checking orphaned records',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Check referential integrity constraints
   */
  private async checkReferentialIntegrity(): Promise<IntegrityCheckResult> {
    try {
      const integrityChecks = [
        {
          name: 'User organization consistency',
          query: `
            SELECT count(*) as count
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            WHERE u.organization_id IS NOT NULL AND o.id IS NULL
          `
        },
        {
          name: 'Building creator consistency',
          query: `
            SELECT count(*) as count
            FROM buildings b
            LEFT JOIN users u ON b.created_by_user_id = u.id
            WHERE b.created_by_user_id IS NOT NULL AND u.id IS NULL
          `
        },
        {
          name: 'Assessment assignee consistency',
          query: `
            SELECT count(*) as count
            FROM assessments a
            LEFT JOIN users u ON a.assigned_to_user_id = u.id
            WHERE a.assigned_to_user_id IS NOT NULL AND u.id IS NULL
          `
        }
      ];

      let totalIssues = 0;
      const details: any[] = [];

      for (const check of integrityChecks) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalIssues += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count
          });
        }
      }

      if (totalIssues > 0) {
        return {
          check: 'Referential Integrity',
          status: 'fail',
          message: `Found ${totalIssues} referential integrity violations`,
          details,
          affected_records: totalIssues
        };
      }

      return {
        check: 'Referential Integrity',
        status: 'pass',
        message: 'All referential integrity constraints satisfied'
      };

    } catch (error) {
      return {
        check: 'Referential Integrity',
        status: 'fail',
        message: 'Error checking referential integrity',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Check data consistency and business rules
   */
  private async checkDataConsistency(): Promise<IntegrityCheckResult> {
    try {
      const consistencyChecks = [
        {
          name: 'Assessment dates consistency',
          query: `
            SELECT count(*) as count
            FROM assessments
            WHERE completed_at < started_at
               OR started_at < scheduled_date - INTERVAL '7 days'
          `,
          message: 'Assessments with illogical date sequences'
        },
        {
          name: 'Building year built validation',
          query: `
            SELECT count(*) as count
            FROM buildings
            WHERE year_built > EXTRACT(YEAR FROM CURRENT_DATE)
               OR year_built < 1800
          `,
          message: 'Buildings with invalid construction years'
        },
        {
          name: 'Negative financial values',
          query: `
            SELECT count(*) as count
            FROM assessments
            WHERE total_repair_cost < 0
               OR replacement_value < 0
               OR immediate_repair_cost < 0
          `,
          message: 'Assessments with negative cost values'
        },
        {
          name: 'FCI calculation consistency',
          query: `
            SELECT count(*) as count
            FROM assessments
            WHERE fci_score IS NOT NULL
              AND replacement_value > 0
              AND total_repair_cost > 0
              AND ABS(fci_score - (total_repair_cost / replacement_value)) > 0.01
          `,
          message: 'Assessments with incorrect FCI calculations'
        },
        {
          name: 'Element condition rating validity',
          query: `
            SELECT count(*) as count
            FROM assessment_elements
            WHERE condition_rating IS NOT NULL
              AND (condition_rating < 1 OR condition_rating > 5)
          `,
          message: 'Assessment elements with invalid condition ratings'
        }
      ];

      let totalIssues = 0;
      const details: any[] = [];

      for (const check of consistencyChecks) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalIssues += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count,
            message: check.message
          });
        }
      }

      if (totalIssues > 0) {
        return {
          check: 'Data Consistency',
          status: totalIssues > 10 ? 'fail' : 'warning',
          message: `Found ${totalIssues} data consistency issues`,
          details,
          affected_records: totalIssues
        };
      }

      return {
        check: 'Data Consistency',
        status: 'pass',
        message: 'All data consistency checks passed'
      };

    } catch (error) {
      return {
        check: 'Data Consistency',
        status: 'fail',
        message: 'Error checking data consistency',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Check business rule compliance
   */
  private async checkBusinessRuleCompliance(): Promise<IntegrityCheckResult> {
    try {
      const businessRuleChecks = [
        {
          name: 'Completed assessments must have elements',
          query: `
            SELECT count(*) as count
            FROM assessments a
            LEFT JOIN assessment_elements ae ON a.id = ae.assessment_id
            WHERE a.status = 'completed'
              AND ae.id IS NULL
          `,
          rule: 'Completed assessments must have at least one assessed element'
        },
        {
          name: 'Assessments with fair/poor ratings must have deficiencies',
          query: `
            SELECT count(*) as count
            FROM assessment_elements ae
            LEFT JOIN assessment_deficiencies ad ON ae.id = ad.assessment_element_id
            WHERE ae.condition_rating IN (1, 2, 3)
              AND ad.id IS NULL
          `,
          rule: 'Elements rated Fair (3) or below should have documented deficiencies'
        },
        {
          name: 'Organizations must have at least one admin user',
          query: `
            SELECT count(*) as count
            FROM organizations o
            LEFT JOIN users u ON o.id = u.organization_id AND u.role = 'admin'
            WHERE u.id IS NULL
          `,
          rule: 'Each organization must have at least one admin user'
        },
        {
          name: 'Buildings must have positive square footage',
          query: `
            SELECT count(*) as count
            FROM buildings
            WHERE square_footage IS NULL OR square_footage <= 0
          `,
          rule: 'Buildings must have valid square footage for calculations'
        }
      ];

      let totalViolations = 0;
      const details: any[] = [];

      for (const check of businessRuleChecks) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalViolations += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count,
            rule: check.rule
          });
        }
      }

      if (totalViolations > 0) {
        return {
          check: 'Business Rules',
          status: 'warning',
          message: `Found ${totalViolations} business rule violations`,
          details,
          affected_records: totalViolations
        };
      }

      return {
        check: 'Business Rules',
        status: 'pass',
        message: 'All business rules compliant'
      };

    } catch (error) {
      return {
        check: 'Business Rules',
        status: 'fail',
        message: 'Error checking business rules',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Check data quality issues
   */
  private async checkDataQuality(): Promise<IntegrityCheckResult> {
    try {
      const qualityChecks = [
        {
          name: 'Missing required building information',
          query: `
            SELECT count(*) as count
            FROM buildings
            WHERE name IS NULL OR name = ''
               OR type IS NULL OR type = ''
               OR square_footage IS NULL
          `,
          impact: 'Affects assessment calculations and reporting'
        },
        {
          name: 'Duplicate building names in same organization',
          query: `
            SELECT count(*) as count
            FROM (
              SELECT organization_id, name, count(*)
              FROM buildings
              WHERE organization_id IS NOT NULL
              GROUP BY organization_id, name
              HAVING count(*) > 1
            ) duplicates
          `,
          impact: 'May cause confusion in building selection'
        },
        {
          name: 'Assessments missing critical timestamps',
          query: `
            SELECT count(*) as count
            FROM assessments
            WHERE status = 'completed'
              AND (started_at IS NULL OR completed_at IS NULL)
          `,
          impact: 'Affects assessment timeline reporting'
        },
        {
          name: 'Elements with excessive notes length',
          query: `
            SELECT count(*) as count
            FROM assessment_elements
            WHERE length(notes) > 1000
          `,
          impact: 'May indicate data entry issues or need for structured data'
        }
      ];

      let totalQualityIssues = 0;
      const details: any[] = [];

      for (const check of qualityChecks) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalQualityIssues += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count,
            impact: check.impact
          });
        }
      }

      if (totalQualityIssues > 0) {
        return {
          check: 'Data Quality',
          status: 'warning',
          message: `Found ${totalQualityIssues} data quality issues`,
          details,
          affected_records: totalQualityIssues
        };
      }

      return {
        check: 'Data Quality',
        status: 'pass',
        message: 'Data quality is acceptable'
      };

    } catch (error) {
      return {
        check: 'Data Quality',
        status: 'fail',
        message: 'Error checking data quality',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Check for performance issues
   */
  private async checkPerformanceIssues(): Promise<IntegrityCheckResult> {
    try {
      const performanceChecks = [
        {
          name: 'Large tables without recent analysis',
          query: `
            SELECT count(*) as count
            FROM pg_stat_user_tables
            WHERE n_tup_ins + n_tup_upd + n_tup_del > 1000
              AND (last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days')
          `,
          recommendation: 'Run ANALYZE on these tables'
        },
        {
          name: 'Tables with high dead tuple ratio',
          query: `
            SELECT count(*) as count
            FROM pg_stat_user_tables
            WHERE n_dead_tup > 0
              AND (n_dead_tup::float / NULLIF(n_live_tup, 0)) > 0.1
          `,
          recommendation: 'Consider running VACUUM on these tables'
        },
        {
          name: 'Missing indexes on foreign keys',
          query: `
            SELECT count(*) as count
            FROM (
              SELECT DISTINCT schemaname, tablename, attname
              FROM pg_stats
              WHERE schemaname = 'public'
                AND attname LIKE '%_id'
                AND tablename NOT IN (
                  SELECT DISTINCT tablename
                  FROM pg_indexes
                  WHERE schemaname = 'public'
                    AND indexdef LIKE '%' || attname || '%'
                )
            ) missing_indexes
          `,
          recommendation: 'Add indexes on foreign key columns'
        }
      ];

      let totalPerformanceIssues = 0;
      const details: any[] = [];

      for (const check of performanceChecks) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalPerformanceIssues += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count,
            recommendation: check.recommendation
          });
        }
      }

      if (totalPerformanceIssues > 0) {
        return {
          check: 'Performance Issues',
          status: 'warning',
          message: `Found ${totalPerformanceIssues} performance optimization opportunities`,
          details,
          affected_records: totalPerformanceIssues
        };
      }

      return {
        check: 'Performance Issues',
        status: 'pass',
        message: 'No significant performance issues detected'
      };

    } catch (error) {
      return {
        check: 'Performance Issues',
        status: 'fail',
        message: 'Error checking performance issues',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Check for security vulnerabilities
   */
  private async checkSecurityVulnerabilities(): Promise<IntegrityCheckResult> {
    try {
      const securityChecks = [
        {
          name: 'Users with weak passwords (development only)',
          query: `
            SELECT count(*) as count
            FROM users
            WHERE password_hash IS NULL
               OR length(password_hash) < 30
          `,
          severity: 'high',
          note: 'Password hashes should be properly salted and hashed'
        },
        {
          name: 'Users without organization assignment',
          query: `
            SELECT count(*) as count
            FROM users
            WHERE organization_id IS NULL
              AND role != 'platform_admin'
          `,
          severity: 'medium',
          note: 'Users should be assigned to organizations for proper access control'
        },
        {
          name: 'Organizations without admin users',
          query: `
            SELECT count(*) as count
            FROM organizations o
            LEFT JOIN users u ON o.id = u.organization_id AND u.role = 'admin'
            WHERE u.id IS NULL
          `,
          severity: 'medium',
          note: 'Organizations should have at least one admin user'
        }
      ];

      let totalSecurityIssues = 0;
      const details: any[] = [];

      for (const check of securityChecks) {
        const result = await this.pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        totalSecurityIssues += count;

        if (count > 0) {
          details.push({
            check: check.name,
            count,
            severity: check.severity,
            note: check.note
          });
        }
      }

      if (totalSecurityIssues > 0) {
        return {
          check: 'Security Vulnerabilities',
          status: 'warning',
          message: `Found ${totalSecurityIssues} potential security issues`,
          details,
          affected_records: totalSecurityIssues
        };
      }

      return {
        check: 'Security Vulnerabilities',
        status: 'pass',
        message: 'No security vulnerabilities detected'
      };

    } catch (error) {
      return {
        check: 'Security Vulnerabilities',
        status: 'fail',
        message: 'Error checking security vulnerabilities',
        details: error instanceof Error ? error.message : error
      };
    }
  }

  /**
   * Auto-fix certain data integrity issues
   */
  async autoFixIssues(checkName: string, dryRun: boolean = true): Promise<{
    success: boolean;
    message: string;
    affectedRows?: number;
    query?: string;
  }> {
    const report = await this.runIntegrityChecks();
    const check = report.checks.find(c => c.check === checkName);

    if (!check || check.status === 'pass') {
      return {
        success: false,
        message: 'No issues found for this check'
      };
    }

    if (!check.fix_query) {
      return {
        success: false,
        message: 'No automatic fix available for this check'
      };
    }

    if (dryRun) {
      return {
        success: true,
        message: 'Dry run - would execute fix query',
        query: check.fix_query
      };
    }

    try {
      const result = await this.pool.query(check.fix_query);
      return {
        success: true,
        message: 'Fix applied successfully',
        affectedRows: result.rowCount || 0,
        query: check.fix_query
      };
    } catch (error) {
      return {
        success: false,
        message: `Error applying fix: ${error instanceof Error ? error.message : error}`,
        query: check.fix_query
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * CLI interface for data integrity validation
 */
export async function runIntegrityValidationCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  const validator = new DataIntegrityValidator();

  try {
    switch (command) {
      case 'check':
      case 'validate':
        const report = await validator.runIntegrityChecks();
        
        console.log('🔍 Data Integrity Validation Report');
        console.log('='.repeat(50));
        console.log(`Overall Status: ${report.overall_status.toUpperCase()}`);
        console.log(`Total Checks: ${report.total_checks}`);
        console.log(`✅ Passed: ${report.passed}`);
        console.log(`⚠️  Warnings: ${report.warnings}`);
        console.log(`❌ Failed: ${report.failed}\n`);

        // Show detailed results
        report.checks.forEach((check, index) => {
          const icon = check.status === 'pass' ? '✅' : 
                       check.status === 'warning' ? '⚠️' : '❌';
          
          console.log(`${index + 1}. ${icon} ${check.check}`);
          console.log(`   Status: ${check.status.toUpperCase()}`);
          console.log(`   Message: ${check.message}`);
          
          if (check.affected_records) {
            console.log(`   Affected Records: ${check.affected_records}`);
          }
          
          if (check.details && Array.isArray(check.details)) {
            check.details.forEach(detail => {
              console.log(`   - ${detail.check || 'Detail'}: ${detail.count || detail.message}`);
            });
          }
          
          console.log('');
        });

        // Show recommendations
        if (report.recommendations.length > 0) {
          console.log('📋 Recommendations:');
          report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
          });
        }

        // Exit with error code if issues found
        if (report.overall_status === 'critical_errors') {
          process.exit(1);
        }
        break;

      case 'fix':
        const checkName = args[1];
        const dryRun = !args.includes('--execute');
        
        if (!checkName) {
          console.error('Please specify a check name to fix');
          process.exit(1);
        }

        const fixResult = await validator.autoFixIssues(checkName, dryRun);
        
        if (fixResult.success) {
          console.log(`✅ ${fixResult.message}`);
          if (fixResult.affectedRows !== undefined) {
            console.log(`Affected rows: ${fixResult.affectedRows}`);
          }
          if (fixResult.query) {
            console.log(`Query: ${fixResult.query}`);
          }
        } else {
          console.error(`❌ ${fixResult.message}`);
          process.exit(1);
        }
        break;

      default:
        console.log(`
🔍 Data Integrity Validation CLI

Usage:
  npm run validate:data <command> [options]

Commands:
  check, validate    Run all integrity checks
  fix <check_name>   Fix issues for specific check

Options:
  --execute         Actually execute fix (default is dry run)

Examples:
  npm run validate:data check
  npm run validate:data fix "Orphaned Records"
  npm run validate:data fix "Orphaned Records" --execute
        `);
        break;
    }
  } catch (error) {
    console.error('Validation CLI error:', error);
    process.exit(1);
  } finally {
    await validator.cleanup();
  }
}

// Export singleton instance
export const dataIntegrityValidator = new DataIntegrityValidator();

export default DataIntegrityValidator;

// Run CLI if this file is executed directly
if (require.main === module) {
  runIntegrityValidationCLI();
}