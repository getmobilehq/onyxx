import { HealthMonitor } from './health-monitor';
import { AlertSystem } from './alert-system';
import { DataIntegrityValidator } from '../validation/data-integrity';
import cron from 'node-cron';

export interface IncidentConfig {
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoRemediation: boolean;
  remediationSteps: RemediationStep[];
  escalationThreshold: number; // minutes before escalation
  cooldownPeriod: number; // minutes between same incident detections
}

export interface RemediationStep {
  id: string;
  name: string;
  type: 'restart_service' | 'clear_cache' | 'run_migration' | 'validate_data' | 'scale_resources' | 'custom_script';
  config: Record<string, any>;
  timeout: number; // seconds
  retries: number;
}

export interface IncidentLog {
  id: string;
  incidentType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  status: 'detected' | 'in_progress' | 'resolved' | 'escalated' | 'failed';
  autoRemediation: boolean;
  remediationSteps: string[];
  resolutionTime?: number; // milliseconds
  escalated: boolean;
  metadata: Record<string, any>;
}

class IncidentResponseSystem {
  private healthMonitor: HealthMonitor;
  private alertSystem: AlertSystem;
  private dataValidator: DataIntegrityValidator;
  private incidentConfigs: Map<string, IncidentConfig> = new Map();
  private activeIncidents: Map<string, IncidentLog> = new Map();
  private incidentHistory: IncidentLog[] = [];
  private lastIncidentTime: Map<string, Date> = new Map();
  
  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.alertSystem = new AlertSystem();
    this.dataValidator = new DataIntegrityValidator();
    this.initializeIncidentConfigs();
  }

  private initializeIncidentConfigs(): void {
    // Database connectivity issues
    this.incidentConfigs.set('database_connection_failed', {
      name: 'Database Connection Failed',
      description: 'Unable to connect to PostgreSQL database',
      severity: 'critical',
      autoRemediation: true,
      escalationThreshold: 5,
      cooldownPeriod: 10,
      remediationSteps: [
        {
          id: 'restart_db_pool',
          name: 'Restart Database Connection Pool',
          type: 'restart_service',
          config: { service: 'database_pool' },
          timeout: 30,
          retries: 3
        },
        {
          id: 'validate_db_health',
          name: 'Validate Database Health',
          type: 'custom_script',
          config: { script: 'health_check_db' },
          timeout: 60,
          retries: 2
        }
      ]
    });

    // High memory usage
    this.incidentConfigs.set('high_memory_usage', {
      name: 'High Memory Usage',
      description: 'Memory usage exceeded 85% threshold',
      severity: 'high',
      autoRemediation: true,
      escalationThreshold: 15,
      cooldownPeriod: 30,
      remediationSteps: [
        {
          id: 'clear_cache',
          name: 'Clear Application Cache',
          type: 'clear_cache',
          config: { cacheType: 'all' },
          timeout: 30,
          retries: 2
        },
        {
          id: 'force_gc',
          name: 'Force Garbage Collection',
          type: 'custom_script',
          config: { script: 'force_garbage_collection' },
          timeout: 15,
          retries: 1
        }
      ]
    });

    // Data integrity violations
    this.incidentConfigs.set('data_integrity_violation', {
      name: 'Data Integrity Violation',
      description: 'Critical data consistency issues detected',
      severity: 'critical',
      autoRemediation: true,
      escalationThreshold: 10,
      cooldownPeriod: 60,
      remediationSteps: [
        {
          id: 'run_data_validation',
          name: 'Run Data Integrity Validation',
          type: 'validate_data',
          config: { autoFix: true },
          timeout: 300,
          retries: 1
        },
        {
          id: 'backup_and_repair',
          name: 'Backup and Repair Critical Data',
          type: 'custom_script',
          config: { script: 'backup_repair_data' },
          timeout: 600,
          retries: 2
        }
      ]
    });

    // API response time degradation
    this.incidentConfigs.set('api_performance_degraded', {
      name: 'API Performance Degraded',
      description: 'API response times exceed acceptable thresholds',
      severity: 'medium',
      autoRemediation: true,
      escalationThreshold: 20,
      cooldownPeriod: 15,
      remediationSteps: [
        {
          id: 'restart_api_workers',
          name: 'Restart API Workers',
          type: 'restart_service',
          config: { service: 'api_workers' },
          timeout: 60,
          retries: 2
        },
        {
          id: 'optimize_db_queries',
          name: 'Optimize Database Query Performance',
          type: 'custom_script',
          config: { script: 'optimize_queries' },
          timeout: 120,
          retries: 1
        }
      ]
    });

    // External service failures
    this.incidentConfigs.set('external_service_failure', {
      name: 'External Service Failure',
      description: 'Critical external service is unavailable',
      severity: 'high',
      autoRemediation: false,
      escalationThreshold: 5,
      cooldownPeriod: 20,
      remediationSteps: [
        {
          id: 'enable_fallback',
          name: 'Enable Fallback Services',
          type: 'custom_script',
          config: { script: 'enable_fallback_services' },
          timeout: 30,
          retries: 2
        }
      ]
    });
  }

  async startMonitoring(): Promise<void> {
    console.log('🚨 Starting Incident Response System...');
    
    // Start health monitoring with incident detection
    await this.healthMonitor.startMonitoring((healthData) => {
      this.analyzeHealthData(healthData);
    });

    // Schedule periodic data integrity checks
    cron.schedule('*/15 * * * *', async () => {
      await this.performScheduledChecks();
    });

    // Cleanup old incidents every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupOldIncidents();
    });

    console.log('✅ Incident Response System started successfully');
  }

  private async analyzeHealthData(healthData: any): Promise<void> {
    // Check database connectivity
    if (!healthData.database.connected) {
      await this.detectIncident('database_connection_failed', {
        dbStatus: healthData.database.status,
        error: healthData.database.error
      });
    }

    // Check memory usage
    if (healthData.system.memoryUsage.percentage > 85) {
      await this.detectIncident('high_memory_usage', {
        memoryUsage: healthData.system.memoryUsage,
        threshold: 85
      });
    }

    // Check API performance
    if (healthData.api.averageResponseTime > 5000) {
      await this.detectIncident('api_performance_degraded', {
        responseTime: healthData.api.averageResponseTime,
        threshold: 5000
      });
    }

    // Check external services
    const failedServices = healthData.externalServices.filter(
      (service: any) => service.status !== 'healthy'
    );
    if (failedServices.length > 0) {
      await this.detectIncident('external_service_failure', {
        failedServices: failedServices.map((s: any) => s.name)
      });
    }
  }

  private async performScheduledChecks(): Promise<void> {
    try {
      // Run data integrity validation
      const validationResults = await this.dataValidator.validateAll();
      const criticalIssues = validationResults.filter(r => r.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        await this.detectIncident('data_integrity_violation', {
          criticalIssues: criticalIssues.length,
          issues: criticalIssues.map(i => i.type)
        });
      }
    } catch (error) {
      console.error('Error during scheduled checks:', error);
    }
  }

  private async detectIncident(incidentType: string, metadata: Record<string, any>): Promise<void> {
    const config = this.incidentConfigs.get(incidentType);
    if (!config) return;

    // Check cooldown period
    const lastIncident = this.lastIncidentTime.get(incidentType);
    if (lastIncident) {
      const timeSinceLastIncident = Date.now() - lastIncident.getTime();
      if (timeSinceLastIncident < config.cooldownPeriod * 60 * 1000) {
        return; // Still in cooldown period
      }
    }

    const incidentId = `${incidentType}_${Date.now()}`;
    const incident: IncidentLog = {
      id: incidentId,
      incidentType,
      severity: config.severity,
      timestamp: new Date(),
      status: 'detected',
      autoRemediation: config.autoRemediation,
      remediationSteps: [],
      escalated: false,
      metadata
    };

    this.activeIncidents.set(incidentId, incident);
    this.lastIncidentTime.set(incidentType, new Date());

    console.log(`🚨 Incident detected: ${config.name} (${incidentId})`);

    // Send immediate alert
    await this.alertSystem.sendAlert({
      type: 'incident_detected',
      severity: config.severity,
      title: `Incident: ${config.name}`,
      message: `${config.description}\n\nIncident ID: ${incidentId}`,
      metadata: {
        incidentId,
        incidentType,
        ...metadata
      }
    });

    // Start remediation if enabled
    if (config.autoRemediation) {
      await this.startRemediation(incidentId);
    }

    // Schedule escalation check
    setTimeout(() => {
      this.checkEscalation(incidentId);
    }, config.escalationThreshold * 60 * 1000);
  }

  private async startRemediation(incidentId: string): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident) return;

    const config = this.incidentConfigs.get(incident.incidentType);
    if (!config) return;

    incident.status = 'in_progress';
    console.log(`🔧 Starting remediation for incident: ${incidentId}`);

    const startTime = Date.now();
    
    for (const step of config.remediationSteps) {
      try {
        incident.remediationSteps.push(`Started: ${step.name}`);
        await this.executeRemediationStep(step);
        incident.remediationSteps.push(`Completed: ${step.name}`);
        console.log(`✅ Remediation step completed: ${step.name}`);
      } catch (error) {
        incident.remediationSteps.push(`Failed: ${step.name} - ${error}`);
        console.error(`❌ Remediation step failed: ${step.name}`, error);
      }
    }

    // Check if incident is resolved
    const isResolved = await this.verifyIncidentResolution(incident.incidentType);
    
    if (isResolved) {
      incident.status = 'resolved';
      incident.resolutionTime = Date.now() - startTime;
      this.activeIncidents.delete(incidentId);
      this.incidentHistory.push(incident);

      console.log(`✅ Incident resolved: ${incidentId} in ${incident.resolutionTime}ms`);
      
      await this.alertSystem.sendAlert({
        type: 'incident_resolved',
        severity: 'low',
        title: `Incident Resolved: ${config.name}`,
        message: `Incident ${incidentId} has been automatically resolved in ${incident.resolutionTime}ms`,
        metadata: { incidentId, resolutionTime: incident.resolutionTime }
      });
    } else {
      incident.status = 'failed';
      console.error(`❌ Failed to resolve incident: ${incidentId}`);
      
      await this.alertSystem.sendAlert({
        type: 'remediation_failed',
        severity: 'high',
        title: `Remediation Failed: ${config.name}`,
        message: `Automatic remediation failed for incident ${incidentId}`,
        metadata: { incidentId, remediationSteps: incident.remediationSteps }
      });
    }
  }

  private async executeRemediationStep(step: RemediationStep): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Remediation step timed out after ${step.timeout}s`));
      }, step.timeout * 1000);

      this.performRemediationAction(step)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private async performRemediationAction(step: RemediationStep): Promise<void> {
    switch (step.type) {
      case 'restart_service':
        await this.restartService(step.config.service);
        break;
      
      case 'clear_cache':
        await this.clearCache(step.config.cacheType);
        break;
      
      case 'validate_data':
        await this.dataValidator.validateAll();
        if (step.config.autoFix) {
          await this.dataValidator.fixIssues();
        }
        break;
      
      case 'custom_script':
        await this.runCustomScript(step.config.script);
        break;
      
      default:
        throw new Error(`Unknown remediation step type: ${step.type}`);
    }
  }

  private async restartService(serviceName: string): Promise<void> {
    console.log(`🔄 Restarting service: ${serviceName}`);
    // Implementation would depend on your service architecture
    // This is a placeholder for actual service restart logic
  }

  private async clearCache(cacheType: string): Promise<void> {
    console.log(`🧹 Clearing cache: ${cacheType}`);
    // Implementation for cache clearing
    if (global.gc) {
      global.gc();
    }
  }

  private async runCustomScript(scriptName: string): Promise<void> {
    console.log(`📜 Running custom script: ${scriptName}`);
    // Implementation for custom scripts
    switch (scriptName) {
      case 'force_garbage_collection':
        if (global.gc) {
          global.gc();
        }
        break;
      case 'health_check_db':
        await this.healthMonitor.checkDatabaseHealth();
        break;
      // Add more custom scripts as needed
    }
  }

  private async verifyIncidentResolution(incidentType: string): Promise<boolean> {
    // Re-run health checks to verify the incident is resolved
    const healthData = await this.healthMonitor.getHealthStatus();
    
    switch (incidentType) {
      case 'database_connection_failed':
        return healthData.database.connected;
      
      case 'high_memory_usage':
        return healthData.system.memoryUsage.percentage < 75;
      
      case 'api_performance_degraded':
        return healthData.api.averageResponseTime < 3000;
      
      case 'external_service_failure':
        return healthData.externalServices.every((s: any) => s.status === 'healthy');
      
      case 'data_integrity_violation':
        const validation = await this.dataValidator.validateAll();
        return !validation.some(r => r.severity === 'critical');
      
      default:
        return false;
    }
  }

  private async checkEscalation(incidentId: string): Promise<void> {
    const incident = this.activeIncidents.get(incidentId);
    if (!incident || incident.status === 'resolved') return;

    const config = this.incidentConfigs.get(incident.incidentType);
    if (!config) return;

    incident.escalated = true;
    console.log(`🚨 Escalating incident: ${incidentId}`);

    await this.alertSystem.sendAlert({
      type: 'incident_escalated',
      severity: 'critical',
      title: `ESCALATED: ${config.name}`,
      message: `Incident ${incidentId} has been escalated due to prolonged resolution time`,
      metadata: {
        incidentId,
        originalSeverity: incident.severity,
        timeSinceDetection: Date.now() - incident.timestamp.getTime(),
        remediationSteps: incident.remediationSteps
      }
    });
  }

  private cleanupOldIncidents(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.incidentHistory = this.incidentHistory.filter(
      incident => incident.timestamp.getTime() > cutoffTime
    );
  }

  // Public methods for monitoring and reporting
  getActiveIncidents(): IncidentLog[] {
    return Array.from(this.activeIncidents.values());
  }

  getIncidentHistory(hours: number = 24): IncidentLog[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.incidentHistory.filter(
      incident => incident.timestamp.getTime() > cutoffTime
    );
  }

  getIncidentStats(hours: number = 24): any {
    const incidents = this.getIncidentHistory(hours);
    const resolved = incidents.filter(i => i.status === 'resolved');
    const failed = incidents.filter(i => i.status === 'failed');
    
    return {
      total: incidents.length,
      resolved: resolved.length,
      failed: failed.length,
      averageResolutionTime: resolved.length > 0 
        ? resolved.reduce((sum, i) => sum + (i.resolutionTime || 0), 0) / resolved.length
        : 0,
      byType: incidents.reduce((acc, i) => {
        acc[i.incidentType] = (acc[i.incidentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export { IncidentResponseSystem };