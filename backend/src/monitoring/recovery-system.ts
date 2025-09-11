import { HealthMonitor } from './health-monitor';
import { AlertSystem } from './alert-system';
import { PredictiveMonitor } from './predictive-monitoring';
import { Pool } from 'pg';
import cluster from 'cluster';

export interface RecoveryAction {
  id: string;
  name: string;
  type: 'restart_worker' | 'clear_cache' | 'reset_connections' | 'scale_resources' | 'failover' | 'custom';
  triggers: RecoveryTrigger[];
  config: RecoveryConfig;
  priority: number; // 1-10, higher = more priority
  autoExecute: boolean;
  cooldownPeriod: number; // minutes
  maxRetries: number;
}

export interface RecoveryTrigger {
  condition: 'cpu_high' | 'memory_high' | 'db_connection_failed' | 'api_slow' | 'error_rate_high' | 'custom';
  threshold: number;
  duration: number; // seconds the condition must persist
}

export interface RecoveryConfig {
  timeout: number; // seconds
  params: Record<string, any>;
  rollbackOnFailure: boolean;
  healthCheckAfter: boolean;
}

export interface RecoveryExecution {
  id: string;
  actionId: string;
  timestamp: Date;
  triggeredBy: string;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'rolledback';
  duration?: number;
  error?: string;
  healthBefore: any;
  healthAfter?: any;
  metadata: Record<string, any>;
}

class AutomatedRecoverySystem {
  private healthMonitor: HealthMonitor;
  private alertSystem: AlertSystem;
  private predictiveMonitor: PredictiveMonitor;
  private recoveryActions: Map<string, RecoveryAction> = new Map();
  private executionHistory: RecoveryExecution[] = [];
  private lastExecution: Map<string, Date> = new Map();
  private triggerStates: Map<string, { startTime: Date; value: number }> = new Map();
  private dbPool?: Pool;
  
  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.alertSystem = new AlertSystem();
    this.predictiveMonitor = new PredictiveMonitor();
    this.initializeRecoveryActions();
  }

  private initializeRecoveryActions(): void {
    // High CPU Recovery
    this.recoveryActions.set('cpu_recovery', {
      id: 'cpu_recovery',
      name: 'CPU Usage Recovery',
      type: 'restart_worker',
      triggers: [
        {
          condition: 'cpu_high',
          threshold: 90,
          duration: 120 // 2 minutes
        }
      ],
      config: {
        timeout: 60,
        params: { graceful: true },
        rollbackOnFailure: false,
        healthCheckAfter: true
      },
      priority: 8,
      autoExecute: true,
      cooldownPeriod: 15,
      maxRetries: 3
    });

    // Memory Recovery
    this.recoveryActions.set('memory_recovery', {
      id: 'memory_recovery',
      name: 'Memory Usage Recovery',
      type: 'clear_cache',
      triggers: [
        {
          condition: 'memory_high',
          threshold: 85,
          duration: 180 // 3 minutes
        }
      ],
      config: {
        timeout: 30,
        params: { 
          clearNodeModules: false,
          forceGC: true,
          clearUserSessions: false
        },
        rollbackOnFailure: false,
        healthCheckAfter: true
      },
      priority: 7,
      autoExecute: true,
      cooldownPeriod: 10,
      maxRetries: 2
    });

    // Database Connection Recovery
    this.recoveryActions.set('db_recovery', {
      id: 'db_recovery',
      name: 'Database Connection Recovery',
      type: 'reset_connections',
      triggers: [
        {
          condition: 'db_connection_failed',
          threshold: 1,
          duration: 30 // 30 seconds
        }
      ],
      config: {
        timeout: 45,
        params: { 
          resetPool: true,
          maxRetries: 3,
          backoffMs: 1000
        },
        rollbackOnFailure: true,
        healthCheckAfter: true
      },
      priority: 10,
      autoExecute: true,
      cooldownPeriod: 5,
      maxRetries: 5
    });

    // API Performance Recovery
    this.recoveryActions.set('api_recovery', {
      id: 'api_recovery',
      name: 'API Performance Recovery',
      type: 'restart_worker',
      triggers: [
        {
          condition: 'api_slow',
          threshold: 5000, // 5 seconds
          duration: 300 // 5 minutes
        }
      ],
      config: {
        timeout: 90,
        params: { 
          graceful: true,
          waitForConnections: true
        },
        rollbackOnFailure: false,
        healthCheckAfter: true
      },
      priority: 6,
      autoExecute: true,
      cooldownPeriod: 20,
      maxRetries: 2
    });

    // High Error Rate Recovery
    this.recoveryActions.set('error_recovery', {
      id: 'error_recovery',
      name: 'High Error Rate Recovery',
      type: 'custom',
      triggers: [
        {
          condition: 'error_rate_high',
          threshold: 10, // 10% error rate
          duration: 120 // 2 minutes
        }
      ],
      config: {
        timeout: 60,
        params: { 
          action: 'investigate_and_mitigate',
          enableMaintenanceMode: false
        },
        rollbackOnFailure: true,
        healthCheckAfter: true
      },
      priority: 9,
      autoExecute: false, // Manual approval needed for this
      cooldownPeriod: 30,
      maxRetries: 1
    });
  }

  async startRecoverySystem(): Promise<void> {
    console.log('🔄 Starting Automated Recovery System...');

    // Start health monitoring with recovery triggers
    await this.healthMonitor.startMonitoring((healthData) => {
      this.evaluateRecoveryTriggers(healthData);
    });

    // Monitor predictions for proactive recovery
    setInterval(async () => {
      const predictions = await this.predictiveMonitor.getCurrentPredictions();
      this.evaluateProactiveRecovery(predictions);
    }, 60000); // Check every minute

    console.log('✅ Automated Recovery System started successfully');
  }

  private async evaluateRecoveryTriggers(healthData: any): Promise<void> {
    for (const [actionId, action] of this.recoveryActions.entries()) {
      for (const trigger of action.triggers) {
        const isTriggered = this.evaluateTriggerCondition(trigger, healthData);
        
        if (isTriggered) {
          await this.handleTriggerActivation(actionId, trigger, healthData);
        } else {
          // Reset trigger state if condition is no longer met
          this.triggerStates.delete(`${actionId}_${trigger.condition}`);
        }
      }
    }
  }

  private evaluateTriggerCondition(trigger: RecoveryTrigger, healthData: any): boolean {
    let currentValue: number;

    switch (trigger.condition) {
      case 'cpu_high':
        currentValue = healthData.system?.cpuUsage?.percentage || 0;
        break;
      case 'memory_high':
        currentValue = healthData.system?.memoryUsage?.percentage || 0;
        break;
      case 'db_connection_failed':
        currentValue = healthData.database?.connected ? 0 : 1;
        break;
      case 'api_slow':
        currentValue = healthData.api?.averageResponseTime || 0;
        break;
      case 'error_rate_high':
        currentValue = healthData.api?.errorRate || 0;
        break;
      default:
        return false;
    }

    return currentValue >= trigger.threshold;
  }

  private async handleTriggerActivation(
    actionId: string, 
    trigger: RecoveryTrigger, 
    healthData: any
  ): Promise<void> {
    const triggerKey = `${actionId}_${trigger.condition}`;
    const now = new Date();

    // Check if trigger just started
    if (!this.triggerStates.has(triggerKey)) {
      this.triggerStates.set(triggerKey, { startTime: now, value: 0 });
      return; // Wait for duration to pass
    }

    const triggerState = this.triggerStates.get(triggerKey)!;
    const duration = (now.getTime() - triggerState.startTime.getTime()) / 1000;

    // Check if trigger duration has been met
    if (duration >= trigger.duration) {
      const action = this.recoveryActions.get(actionId)!;
      
      // Check cooldown
      const lastExec = this.lastExecution.get(actionId);
      if (lastExec) {
        const timeSinceLastExec = (now.getTime() - lastExec.getTime()) / (1000 * 60);
        if (timeSinceLastExec < action.cooldownPeriod) {
          return; // Still in cooldown
        }
      }

      // Check retry count
      const recentExecutions = this.executionHistory.filter(
        exec => exec.actionId === actionId && 
                now.getTime() - exec.timestamp.getTime() < (60 * 60 * 1000) // Last hour
      );

      if (recentExecutions.length >= action.maxRetries) {
        console.log(`⚠️ Max retries exceeded for recovery action: ${actionId}`);
        return;
      }

      // Execute recovery action
      await this.executeRecoveryAction(actionId, triggerKey, healthData);
    }
  }

  private async evaluateProactiveRecovery(predictions: any[]): Promise<void> {
    for (const prediction of predictions) {
      if (prediction.riskLevel === 'high' && prediction.confidence > 0.7) {
        console.log(`🔮 Proactive recovery triggered for ${prediction.metricName}`);
        
        // Map prediction to recovery action
        const actionId = this.mapPredictionToAction(prediction.metricName);
        if (actionId) {
          await this.executeRecoveryAction(
            actionId, 
            `proactive_${prediction.metricName}`, 
            { prediction }
          );
        }
      }
    }
  }

  private mapPredictionToAction(metricName: string): string | null {
    const mappings: Record<string, string> = {
      cpu_usage: 'cpu_recovery',
      memory_usage: 'memory_recovery',
      api_response_time: 'api_recovery',
      error_rate: 'error_recovery'
    };

    return mappings[metricName] || null;
  }

  private async executeRecoveryAction(
    actionId: string, 
    triggeredBy: string, 
    context: any
  ): Promise<void> {
    const action = this.recoveryActions.get(actionId);
    if (!action) return;

    // Check if manual approval needed
    if (!action.autoExecute) {
      await this.requestManualApproval(actionId, triggeredBy, context);
      return;
    }

    const executionId = `${actionId}_${Date.now()}`;
    const execution: RecoveryExecution = {
      id: executionId,
      actionId,
      timestamp: new Date(),
      triggeredBy,
      status: 'pending',
      healthBefore: await this.healthMonitor.getHealthStatus(),
      metadata: { context, actionConfig: action.config }
    };

    this.executionHistory.push(execution);
    this.lastExecution.set(actionId, new Date());

    console.log(`🔄 Executing recovery action: ${action.name} (${executionId})`);

    try {
      execution.status = 'executing';
      const startTime = Date.now();

      // Execute the actual recovery action
      await this.performRecoveryAction(action);

      execution.duration = Date.now() - startTime;
      execution.status = 'success';

      // Health check after recovery
      if (action.config.healthCheckAfter) {
        execution.healthAfter = await this.healthMonitor.getHealthStatus();
      }

      console.log(`✅ Recovery action completed: ${action.name} in ${execution.duration}ms`);

      // Send success alert
      await this.alertSystem.sendAlert({
        type: 'recovery_success',
        severity: 'low',
        title: `Recovery Successful: ${action.name}`,
        message: `Recovery action ${action.name} completed successfully in ${execution.duration}ms`,
        metadata: {
          executionId,
          actionId,
          triggeredBy,
          duration: execution.duration
        }
      });

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.duration = Date.now() - (execution.timestamp.getTime());

      console.error(`❌ Recovery action failed: ${action.name}`, error);

      // Attempt rollback if configured
      if (action.config.rollbackOnFailure) {
        try {
          await this.performRollback(action, execution);
          execution.status = 'rolledback';
          console.log(`🔄 Recovery action rolled back: ${action.name}`);
        } catch (rollbackError) {
          console.error(`❌ Rollback failed for: ${action.name}`, rollbackError);
        }
      }

      // Send failure alert
      await this.alertSystem.sendAlert({
        type: 'recovery_failed',
        severity: 'high',
        title: `Recovery Failed: ${action.name}`,
        message: `Recovery action ${action.name} failed: ${execution.error}`,
        metadata: {
          executionId,
          actionId,
          error: execution.error,
          rollbackAttempted: action.config.rollbackOnFailure
        }
      });
    }
  }

  private async performRecoveryAction(action: RecoveryAction): Promise<void> {
    switch (action.type) {
      case 'restart_worker':
        await this.restartWorker(action.config);
        break;
      
      case 'clear_cache':
        await this.clearCache(action.config);
        break;
      
      case 'reset_connections':
        await this.resetConnections(action.config);
        break;
      
      case 'scale_resources':
        await this.scaleResources(action.config);
        break;
      
      case 'failover':
        await this.performFailover(action.config);
        break;
      
      case 'custom':
        await this.performCustomAction(action.config);
        break;
      
      default:
        throw new Error(`Unknown recovery action type: ${action.type}`);
    }
  }

  private async restartWorker(config: RecoveryConfig): Promise<void> {
    console.log('🔄 Restarting worker process...');
    
    if (cluster.isWorker) {
      // Graceful shutdown in worker
      if (config.params.graceful) {
        process.disconnect();
        setTimeout(() => process.exit(0), 5000);
      } else {
        process.exit(0);
      }
    } else if (cluster.isMaster || cluster.isPrimary) {
      // Fork new worker from master
      cluster.fork();
    }
  }

  private async clearCache(config: RecoveryConfig): Promise<void> {
    console.log('🧹 Clearing application cache...');
    
    // Force garbage collection
    if (config.params.forceGC && global.gc) {
      global.gc();
    }

    // Clear require cache for non-critical modules
    if (config.params.clearNodeModules) {
      Object.keys(require.cache).forEach(key => {
        if (!key.includes('node_modules/core') && 
            !key.includes('node_modules/fs') &&
            !key.includes('node_modules/path')) {
          delete require.cache[key];
        }
      });
    }

    // Clear application-specific caches
    // This would clear your app's specific caches
    console.log('Cache clearing completed');
  }

  private async resetConnections(config: RecoveryConfig): Promise<void> {
    console.log('🔌 Resetting database connections...');
    
    if (this.dbPool) {
      await this.dbPool.end();
    }

    // Reinitialize connection pool
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: config.params.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await this.dbPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connections reset successfully');
  }

  private async scaleResources(config: RecoveryConfig): Promise<void> {
    console.log('📈 Scaling resources...');
    
    // This would integrate with your container orchestration or cloud provider
    // For now, we'll simulate resource scaling
    console.log(`Scaling to ${config.params.targetInstances} instances`);
  }

  private async performFailover(config: RecoveryConfig): Promise<void> {
    console.log('🔄 Performing failover...');
    
    // This would switch to backup systems
    console.log(`Failing over to ${config.params.backupRegion} region`);
  }

  private async performCustomAction(config: RecoveryConfig): Promise<void> {
    console.log(`🔧 Performing custom action: ${config.params.action}`);
    
    switch (config.params.action) {
      case 'investigate_and_mitigate':
        await this.investigateHighErrorRate();
        break;
      
      default:
        console.log(`Unknown custom action: ${config.params.action}`);
    }
  }

  private async investigateHighErrorRate(): Promise<void> {
    console.log('🔍 Investigating high error rate...');
    
    // This would analyze recent errors and take appropriate action
    // For now, we'll simulate investigation
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Error rate investigation completed');
  }

  private async performRollback(action: RecoveryAction, execution: RecoveryExecution): Promise<void> {
    console.log(`🔄 Rolling back recovery action: ${action.name}`);
    
    // Implementation would depend on the specific action
    // This is a simplified rollback
    switch (action.type) {
      case 'reset_connections':
        // Restore previous connection settings
        break;
      
      case 'scale_resources':
        // Scale back to original size
        break;
      
      default:
        console.log(`No rollback available for action type: ${action.type}`);
    }
  }

  private async requestManualApproval(actionId: string, triggeredBy: string, context: any): Promise<void> {
    const action = this.recoveryActions.get(actionId)!;
    
    console.log(`⚠️ Manual approval required for: ${action.name}`);
    
    await this.alertSystem.sendAlert({
      type: 'manual_approval_required',
      severity: 'high',
      title: `Manual Approval Required: ${action.name}`,
      message: `Recovery action ${action.name} requires manual approval before execution. Trigger: ${triggeredBy}`,
      metadata: {
        actionId,
        actionName: action.name,
        triggeredBy,
        context,
        approvalDeadline: new Date(Date.now() + (30 * 60 * 1000)) // 30 minutes
      }
    });
  }

  // Public methods for monitoring and control
  getRecoveryActions(): RecoveryAction[] {
    return Array.from(this.recoveryActions.values());
  }

  getExecutionHistory(hours: number = 24): RecoveryExecution[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.executionHistory.filter(
      exec => exec.timestamp.getTime() > cutoffTime
    );
  }

  getRecoveryStats(hours: number = 24): any {
    const executions = this.getExecutionHistory(hours);
    const successful = executions.filter(e => e.status === 'success');
    const failed = executions.filter(e => e.status === 'failed');
    
    return {
      total: executions.length,
      successful: successful.length,
      failed: failed.length,
      successRate: executions.length > 0 ? (successful.length / executions.length) * 100 : 0,
      averageRecoveryTime: successful.length > 0 
        ? successful.reduce((sum, e) => sum + (e.duration || 0), 0) / successful.length
        : 0,
      byAction: executions.reduce((acc, e) => {
        acc[e.actionId] = (acc[e.actionId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  async manualRecovery(actionId: string, approved: boolean = true): Promise<void> {
    if (!approved) {
      console.log(`❌ Manual recovery declined for: ${actionId}`);
      return;
    }

    console.log(`✅ Manual recovery approved for: ${actionId}`);
    const healthData = await this.healthMonitor.getHealthStatus();
    await this.executeRecoveryAction(actionId, 'manual_approval', healthData);
  }
}

export { AutomatedRecoverySystem };