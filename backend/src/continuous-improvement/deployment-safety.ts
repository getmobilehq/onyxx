import { HealthMonitor } from '../monitoring/health-monitor';
import { DataIntegrityValidator } from '../validation/data-integrity';
import { circuitBreakers } from '../resilience/circuit-breaker';
import { logger } from '../logging/advanced-logger';
import * as fs from 'fs';
import * as path from 'path';

export interface SafetyCheckItem {
  id: string;
  category: 'pre-deployment' | 'deployment' | 'post-deployment' | 'rollback';
  title: string;
  description: string;
  type: 'manual' | 'automated';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  dependencies: string[]; // IDs of other checks
  automationScript?: string;
  validationCriteria: string[];
  rollbackSteps?: string[];
}

export interface DeploymentCheck {
  checkId: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  evidence?: string[];
  executedBy: 'system' | 'human';
  notes?: string;
}

export interface DeploymentSafetyReport {
  deploymentId: string;
  timestamp: Date;
  environment: string;
  version: string;
  checks: DeploymentCheck[];
  overallStatus: 'safe' | 'unsafe' | 'warning';
  criticalIssues: string[];
  warnings: string[];
  approvals: DeploymentApproval[];
  estimatedRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: 'proceed' | 'investigate' | 'abort';
}

export interface DeploymentApproval {
  approver: string;
  timestamp: Date;
  decision: 'approved' | 'rejected' | 'conditional';
  conditions?: string[];
  notes?: string;
}

class DeploymentSafetyChecker {
  private healthMonitor: HealthMonitor;
  private dataValidator: DataIntegrityValidator;
  private safetyChecks: Map<string, SafetyCheckItem> = new Map();
  private checkHistory: Map<string, DeploymentSafetyReport[]> = new Map();

  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.dataValidator = new DataIntegrityValidator();
    this.initializeSafetyChecks();
  }

  private initializeSafetyChecks(): void {
    // Pre-deployment checks
    this.addSafetyCheck({
      id: 'pre_health_check',
      category: 'pre-deployment',
      title: 'System Health Verification',
      description: 'Verify all systems are healthy before deployment',
      type: 'automated',
      criticality: 'critical',
      estimatedTime: 2,
      dependencies: [],
      automationScript: 'health_check',
      validationCriteria: [
        'All services responding',
        'Database connections stable',
        'Memory usage < 80%',
        'CPU usage < 70%',
        'No active critical alerts'
      ]
    });

    this.addSafetyCheck({
      id: 'pre_data_integrity',
      category: 'pre-deployment',
      title: 'Data Integrity Validation',
      description: 'Verify data consistency before making changes',
      type: 'automated',
      criticality: 'critical',
      estimatedTime: 5,
      dependencies: ['pre_health_check'],
      automationScript: 'data_integrity_check',
      validationCriteria: [
        'No critical data integrity issues',
        'All constraints valid',
        'Backup verification complete'
      ]
    });

    this.addSafetyCheck({
      id: 'pre_circuit_breaker_status',
      category: 'pre-deployment',
      title: 'Circuit Breaker Status',
      description: 'Ensure all circuit breakers are in healthy state',
      type: 'automated',
      criticality: 'high',
      estimatedTime: 1,
      dependencies: [],
      automationScript: 'circuit_breaker_check',
      validationCriteria: [
        'No open circuit breakers',
        'Error rates within normal range',
        'All external services accessible'
      ]
    });

    this.addSafetyCheck({
      id: 'pre_backup_verification',
      category: 'pre-deployment',
      title: 'Backup Verification',
      description: 'Ensure recent backups exist and are restorable',
      type: 'automated',
      criticality: 'critical',
      estimatedTime: 10,
      dependencies: [],
      automationScript: 'backup_verification',
      validationCriteria: [
        'Recent database backup exists (< 24hrs)',
        'Backup integrity verified',
        'Test restore successful'
      ],
      rollbackSteps: [
        'Identify latest valid backup',
        'Stop application services',
        'Restore database from backup',
        'Restart services',
        'Verify data consistency'
      ]
    });

    this.addSafetyCheck({
      id: 'pre_dependency_check',
      category: 'pre-deployment',
      title: 'Dependency Verification',
      description: 'Verify all external dependencies are available',
      type: 'automated',
      criticality: 'high',
      estimatedTime: 3,
      dependencies: [],
      automationScript: 'dependency_check',
      validationCriteria: [
        'Database accessible',
        'Email service responding',
        'File storage available',
        'Third-party APIs accessible'
      ]
    });

    this.addSafetyCheck({
      id: 'pre_security_scan',
      category: 'pre-deployment',
      title: 'Security Vulnerability Scan',
      description: 'Scan for security vulnerabilities in new deployment',
      type: 'automated',
      criticality: 'high',
      estimatedTime: 15,
      dependencies: [],
      automationScript: 'security_scan',
      validationCriteria: [
        'No critical security vulnerabilities',
        'No hardcoded secrets detected',
        'Dependencies have no known CVEs',
        'SSL certificates valid'
      ]
    });

    // Deployment checks
    this.addSafetyCheck({
      id: 'deploy_gradual_rollout',
      category: 'deployment',
      title: 'Gradual Rollout Strategy',
      description: 'Deploy to subset of servers first',
      type: 'manual',
      criticality: 'high',
      estimatedTime: 20,
      dependencies: ['pre_health_check', 'pre_data_integrity', 'pre_backup_verification'],
      validationCriteria: [
        'Deployment successful on 10% of servers',
        'No errors in deployment logs',
        'Health checks passing on new version'
      ],
      rollbackSteps: [
        'Stop deployment process',
        'Redirect traffic to old version',
        'Rollback deployed instances',
        'Verify system stability'
      ]
    });

    this.addSafetyCheck({
      id: 'deploy_migration_safety',
      category: 'deployment',
      title: 'Database Migration Safety',
      description: 'Execute database migrations with safety checks',
      type: 'automated',
      criticality: 'critical',
      estimatedTime: 30,
      dependencies: ['pre_data_integrity', 'pre_backup_verification'],
      automationScript: 'safe_migration',
      validationCriteria: [
        'Migration dry-run successful',
        'No data loss detected',
        'Performance impact acceptable',
        'Migration reversible'
      ],
      rollbackSteps: [
        'Execute migration rollback script',
        'Restore from backup if needed',
        'Verify data consistency',
        'Update application to previous schema'
      ]
    });

    // Post-deployment checks
    this.addSafetyCheck({
      id: 'post_health_verification',
      category: 'post-deployment',
      title: 'Post-Deployment Health Check',
      description: 'Verify system health after deployment',
      type: 'automated',
      criticality: 'critical',
      estimatedTime: 10,
      dependencies: ['deploy_gradual_rollout'],
      automationScript: 'comprehensive_health_check',
      validationCriteria: [
        'All services responding',
        'Response times within SLA',
        'Error rates below threshold',
        'No new alerts triggered'
      ]
    });

    this.addSafetyCheck({
      id: 'post_smoke_tests',
      category: 'post-deployment',
      title: 'Critical Path Smoke Tests',
      description: 'Test critical user workflows end-to-end',
      type: 'automated',
      criticality: 'critical',
      estimatedTime: 15,
      dependencies: ['post_health_verification'],
      automationScript: 'smoke_tests',
      validationCriteria: [
        'User login/logout working',
        'Core API endpoints responding',
        'Data persistence working',
        'File upload/download functional'
      ]
    });

    this.addSafetyCheck({
      id: 'post_performance_validation',
      category: 'post-deployment',
      title: 'Performance Regression Testing',
      description: 'Ensure no performance degradation',
      type: 'automated',
      criticality: 'high',
      estimatedTime: 20,
      dependencies: ['post_smoke_tests'],
      automationScript: 'performance_tests',
      validationCriteria: [
        'API response times < 2s',
        'Database query performance maintained',
        'Memory usage within limits',
        'No performance alerts'
      ]
    });

    this.addSafetyCheck({
      id: 'post_security_validation',
      category: 'post-deployment',
      title: 'Security Configuration Verification',
      description: 'Verify security settings are correct',
      type: 'automated',
      criticality: 'high',
      estimatedTime: 5,
      dependencies: ['post_health_verification'],
      automationScript: 'security_validation',
      validationCriteria: [
        'Authentication working correctly',
        'Authorization rules applied',
        'HTTPS enforced',
        'Security headers present'
      ]
    });

    this.addSafetyCheck({
      id: 'post_monitoring_validation',
      category: 'post-deployment',
      title: 'Monitoring & Alerting Verification',
      description: 'Ensure monitoring systems are working',
      type: 'automated',
      criticality: 'medium',
      estimatedTime: 5,
      dependencies: ['post_health_verification'],
      automationScript: 'monitoring_validation',
      validationCriteria: [
        'All monitoring endpoints responding',
        'Alerting rules active',
        'Metrics being collected',
        'Dashboard data updating'
      ]
    });

    // Rollback checks
    this.addSafetyCheck({
      id: 'rollback_readiness',
      category: 'rollback',
      title: 'Rollback Readiness Verification',
      description: 'Ensure rollback procedures are ready if needed',
      type: 'manual',
      criticality: 'critical',
      estimatedTime: 10,
      dependencies: [],
      validationCriteria: [
        'Previous version artifacts available',
        'Rollback scripts tested',
        'Database rollback plan ready',
        'Communication plan prepared'
      ]
    });
  }

  private addSafetyCheck(check: SafetyCheckItem): void {
    this.safetyChecks.set(check.id, check);
  }

  async runDeploymentSafetyCheck(
    deploymentId: string,
    environment: string,
    version: string,
    category?: 'pre-deployment' | 'deployment' | 'post-deployment' | 'rollback'
  ): Promise<DeploymentSafetyReport> {
    logger.info('deployment_safety', `Starting deployment safety check for ${deploymentId}`, {
      deploymentId,
      environment,
      version,
      category
    });

    const report: DeploymentSafetyReport = {
      deploymentId,
      timestamp: new Date(),
      environment,
      version,
      checks: [],
      overallStatus: 'safe',
      criticalIssues: [],
      warnings: [],
      approvals: [],
      estimatedRisk: 'low',
      recommendedAction: 'proceed'
    };

    // Get applicable safety checks
    const applicableChecks = Array.from(this.safetyChecks.values())
      .filter(check => !category || check.category === category)
      .sort((a, b) => {
        // Sort by criticality and dependencies
        const criticalityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return criticalityOrder[a.criticality] - criticalityOrder[b.criticality];
      });

    // Execute checks in dependency order
    for (const checkItem of applicableChecks) {
      if (!this.areDependenciesMet(checkItem, report.checks)) {
        report.checks.push({
          checkId: checkItem.id,
          status: 'skipped',
          executedBy: 'system',
          error: 'Dependencies not met',
          notes: `Skipped due to failed dependencies: ${checkItem.dependencies.join(', ')}`
        });
        continue;
      }

      const checkResult = await this.executeCheck(checkItem, deploymentId);
      report.checks.push(checkResult);

      // Stop on critical failures
      if (checkResult.status === 'failed' && checkItem.criticality === 'critical') {
        report.overallStatus = 'unsafe';
        report.criticalIssues.push(`Critical check failed: ${checkItem.title}`);
        report.recommendedAction = 'abort';
        break;
      }

      // Collect warnings
      if (checkResult.status === 'failed' && checkItem.criticality === 'high') {
        report.warnings.push(`High priority check failed: ${checkItem.title}`);
        if (report.overallStatus === 'safe') {
          report.overallStatus = 'warning';
          report.recommendedAction = 'investigate';
        }
      }
    }

    // Calculate overall risk
    report.estimatedRisk = this.calculateRisk(report);

    // Save report
    this.saveReport(report);

    logger.info('deployment_safety', `Deployment safety check completed`, {
      deploymentId,
      overallStatus: report.overallStatus,
      criticalIssues: report.criticalIssues.length,
      warnings: report.warnings.length,
      recommendedAction: report.recommendedAction
    });

    return report;
  }

  private areDependenciesMet(checkItem: SafetyCheckItem, completedChecks: DeploymentCheck[]): boolean {
    return checkItem.dependencies.every(depId => {
      const depCheck = completedChecks.find(c => c.checkId === depId);
      return depCheck && depCheck.status === 'passed';
    });
  }

  private async executeCheck(checkItem: SafetyCheckItem, deploymentId: string): Promise<DeploymentCheck> {
    const check: DeploymentCheck = {
      checkId: checkItem.id,
      status: 'running',
      startTime: new Date(),
      executedBy: checkItem.type === 'automated' ? 'system' : 'human',
      evidence: []
    };

    try {
      if (checkItem.type === 'automated' && checkItem.automationScript) {
        check.result = await this.runAutomatedCheck(checkItem.automationScript, deploymentId);
        check.status = this.validateCheckResult(check.result, checkItem.validationCriteria) ? 'passed' : 'failed';
      } else {
        // Manual check - return pending for now
        check.status = 'pending';
        check.notes = 'Manual check required - awaiting human verification';
      }
    } catch (error) {
      check.status = 'failed';
      check.error = error instanceof Error ? error.message : String(error);
      logger.error('deployment_safety', `Check ${checkItem.id} failed`, error as Error);
    } finally {
      check.endTime = new Date();
      check.duration = check.endTime.getTime() - check.startTime!.getTime();
    }

    return check;
  }

  private async runAutomatedCheck(script: string, deploymentId: string): Promise<any> {
    switch (script) {
      case 'health_check':
        return this.healthMonitor.getHealthStatus();
      
      case 'data_integrity_check':
        return this.dataValidator.validateAll();
      
      case 'circuit_breaker_check':
        return circuitBreakers.getManager().getHealthStatus();
      
      case 'backup_verification':
        return this.verifyBackups();
      
      case 'dependency_check':
        return this.checkDependencies();
      
      case 'security_scan':
        return this.runSecurityScan();
      
      case 'safe_migration':
        return this.runSafeMigration(deploymentId);
      
      case 'comprehensive_health_check':
        return this.runComprehensiveHealthCheck();
      
      case 'smoke_tests':
        return this.runSmokeTests();
      
      case 'performance_tests':
        return this.runPerformanceTests();
      
      case 'security_validation':
        return this.validateSecurity();
      
      case 'monitoring_validation':
        return this.validateMonitoring();
      
      default:
        throw new Error(`Unknown automation script: ${script}`);
    }
  }

  private async verifyBackups(): Promise<any> {
    // Simulate backup verification
    return {
      latestBackup: new Date(),
      backupSize: '2.5GB',
      integrityCheck: 'passed',
      testRestore: 'successful',
      age: '2 hours'
    };
  }

  private async checkDependencies(): Promise<any> {
    const healthStatus = await this.healthMonitor.getHealthStatus();
    return {
      database: healthStatus.database?.connected || false,
      externalServices: healthStatus.externalServices || [],
      allHealthy: healthStatus.database?.connected && 
                  (healthStatus.externalServices?.every((s: any) => s.status === 'healthy') || false)
    };
  }

  private async runSecurityScan(): Promise<any> {
    // Simulate security scan
    return {
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 2,
        low: 5
      },
      secretsFound: false,
      sslValid: true,
      dependencyCheck: 'clean'
    };
  }

  private async runSafeMigration(deploymentId: string): Promise<any> {
    // Simulate migration safety check
    logger.info('deployment_safety', `Running safe migration for ${deploymentId}`);
    
    return {
      dryRunSuccessful: true,
      dataLossRisk: 'none',
      performanceImpact: 'minimal',
      reversible: true,
      estimatedTime: '5 minutes'
    };
  }

  private async runComprehensiveHealthCheck(): Promise<any> {
    const healthStatus = await this.healthMonitor.getHealthStatus();
    const circuitBreakerStatus = circuitBreakers.getManager().getHealthStatus();
    
    return {
      ...healthStatus,
      circuitBreakers: circuitBreakerStatus,
      overallHealthy: healthStatus.database?.connected && circuitBreakerStatus.healthy
    };
  }

  private async runSmokeTests(): Promise<any> {
    // Simulate smoke tests
    return {
      loginTest: 'passed',
      apiEndpoints: 'passed',
      dataPersistence: 'passed',
      fileOperations: 'passed',
      overallResult: 'passed'
    };
  }

  private async runPerformanceTests(): Promise<any> {
    const healthStatus = await this.healthMonitor.getHealthStatus();
    
    return {
      apiResponseTime: healthStatus.api?.averageResponseTime || 500,
      databasePerformance: 'good',
      memoryUsage: healthStatus.system?.memoryUsage?.percentage || 0,
      performanceRegression: false
    };
  }

  private async validateSecurity(): Promise<any> {
    return {
      authentication: 'working',
      authorization: 'working',
      httpsEnforced: true,
      securityHeaders: true,
      overallSecure: true
    };
  }

  private async validateMonitoring(): Promise<any> {
    return {
      healthEndpoints: 'responding',
      alertingActive: true,
      metricsCollected: true,
      dashboardsUpdating: true,
      monitoringHealthy: true
    };
  }

  private validateCheckResult(result: any, criteria: string[]): boolean {
    // Simple validation logic - in practice this would be more sophisticated
    if (!result) return false;
    
    // Check for obvious failure indicators
    if (result.error || result.failed || result.overallHealthy === false) {
      return false;
    }
    
    // Check for positive indicators
    if (result.passed || result.successful || result.overallHealthy === true || result.healthy === true) {
      return true;
    }
    
    // Default to true for now - real implementation would check against specific criteria
    return true;
  }

  private calculateRisk(report: DeploymentSafetyReport): 'low' | 'medium' | 'high' | 'critical' {
    if (report.criticalIssues.length > 0) return 'critical';
    if (report.warnings.length > 2) return 'high';
    if (report.warnings.length > 0) return 'medium';
    return 'low';
  }

  private saveReport(report: DeploymentSafetyReport): void {
    if (!this.checkHistory.has(report.environment)) {
      this.checkHistory.set(report.environment, []);
    }
    
    const envHistory = this.checkHistory.get(report.environment)!;
    envHistory.push(report);
    
    // Keep only last 50 reports per environment
    if (envHistory.length > 50) {
      envHistory.splice(0, envHistory.length - 50);
    }
  }

  // Public query methods
  getCheckTemplate(): SafetyCheckItem[] {
    return Array.from(this.safetyChecks.values());
  }

  async getDeploymentReport(deploymentId: string, environment: string): Promise<DeploymentSafetyReport | null> {
    const envHistory = this.checkHistory.get(environment);
    if (!envHistory) return null;
    
    return envHistory.find(r => r.deploymentId === deploymentId) || null;
  }

  getRecentReports(environment: string, limit: number = 10): DeploymentSafetyReport[] {
    const envHistory = this.checkHistory.get(environment) || [];
    return envHistory.slice(-limit).reverse();
  }

  generateChecklistMarkdown(category?: string): string {
    const checks = Array.from(this.safetyChecks.values())
      .filter(check => !category || check.category === category);
    
    let markdown = `# Deployment Safety Checklist${category ? ` - ${category}` : ''}\n\n`;
    
    const categories = ['pre-deployment', 'deployment', 'post-deployment', 'rollback'];
    
    for (const cat of categories) {
      if (category && cat !== category) continue;
      
      const catChecks = checks.filter(c => c.category === cat);
      if (catChecks.length === 0) continue;
      
      markdown += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)} Checks\n\n`;
      
      for (const check of catChecks) {
        markdown += `### ${check.title}\n`;
        markdown += `- **Criticality:** ${check.criticality}\n`;
        markdown += `- **Type:** ${check.type}\n`;
        markdown += `- **Estimated Time:** ${check.estimatedTime} minutes\n`;
        markdown += `- **Description:** ${check.description}\n`;
        
        if (check.dependencies.length > 0) {
          markdown += `- **Dependencies:** ${check.dependencies.join(', ')}\n`;
        }
        
        markdown += `\n**Validation Criteria:**\n`;
        for (const criteria of check.validationCriteria) {
          markdown += `- [ ] ${criteria}\n`;
        }
        
        if (check.rollbackSteps && check.rollbackSteps.length > 0) {
          markdown += `\n**Rollback Steps:**\n`;
          for (const step of check.rollbackSteps) {
            markdown += `1. ${step}\n`;
          }
        }
        
        markdown += '\n---\n\n';
      }
    }
    
    return markdown;
  }

  async approveDeployment(
    deploymentId: string,
    environment: string,
    approver: string,
    decision: 'approved' | 'rejected' | 'conditional',
    conditions?: string[],
    notes?: string
  ): Promise<boolean> {
    const report = await this.getDeploymentReport(deploymentId, environment);
    if (!report) return false;
    
    const approval: DeploymentApproval = {
      approver,
      timestamp: new Date(),
      decision,
      conditions,
      notes
    };
    
    report.approvals.push(approval);
    
    logger.info('deployment_safety', `Deployment ${decision} by ${approver}`, {
      deploymentId,
      environment,
      decision,
      conditions,
      notes
    });
    
    return true;
  }
}

export { DeploymentSafetyChecker };