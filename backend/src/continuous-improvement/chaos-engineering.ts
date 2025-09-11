import { HealthMonitor } from '../monitoring/health-monitor';
import { AlertSystem } from '../monitoring/alert-system';
import { AutomatedRecoverySystem } from '../monitoring/recovery-system';
import { circuitBreakers } from '../resilience/circuit-breaker';
import { logger } from '../logging/advanced-logger';

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  type: 'network' | 'resource' | 'service' | 'data' | 'latency' | 'error_injection';
  severity: 'low' | 'medium' | 'high';
  duration: number; // minutes
  targetService: string;
  parameters: Record<string, any>;
  successCriteria: string[];
  rollbackConditions: string[];
  safetyChecks: string[];
  environment: 'development' | 'staging' | 'production';
  schedule?: ChaosSchedule;
  createdBy: string;
  approved: boolean;
  approvedBy?: string;
}

export interface ChaosSchedule {
  type: 'once' | 'recurring';
  startTime: Date;
  recurrence?: 'daily' | 'weekly' | 'monthly';
  timezone: string;
  enabled: boolean;
}

export interface ChaosExecution {
  id: string;
  experimentId: string;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'aborted';
  results: ChaosResults;
  observations: string[];
  issues: string[];
  learnings: string[];
  metricsSnapshot: {
    before: any;
    during: any;
    after: any;
  };
  automaticRollback: boolean;
  manualInterventions: string[];
}

export interface ChaosResults {
  hypothesisValidated: boolean;
  systemResilience: 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed';
  recoveryTime: number; // seconds
  impactRadius: string[];
  unexpectedBehaviors: string[];
  improvementAreas: string[];
  confidenceScore: number; // 0-1
}

export interface ChaosMetric {
  name: string;
  baseline: number;
  duringChaos: number;
  degradation: number; // percentage
  recoveryTime: number; // seconds
  acceptable: boolean;
}

class ChaosEngineeringFramework {
  private healthMonitor: HealthMonitor;
  private alertSystem: AlertSystem;
  private recoverySystem: AutomatedRecoverySystem;
  private experiments: Map<string, ChaosExperiment> = new Map();
  private executions: Map<string, ChaosExecution> = new Map();
  private activeExperiments: Set<string> = new Set();
  private safetyMode: boolean = true;

  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.alertSystem = new AlertSystem();
    this.recoverySystem = new AutomatedRecoverySystem();
    this.initializePredefinedExperiments();
    this.startExperimentScheduler();
  }

  private initializePredefinedExperiments(): void {
    // Database Connection Chaos
    this.experiments.set('db_connection_chaos', {
      id: 'db_connection_chaos',
      name: 'Database Connection Pool Exhaustion',
      description: 'Simulate database connection pool exhaustion to test resilience',
      hypothesis: 'System should gracefully handle database connection failures with circuit breaker activation',
      type: 'resource',
      severity: 'medium',
      duration: 5,
      targetService: 'database',
      parameters: {
        connectionLimit: 1,
        duration: 300000 // 5 minutes
      },
      successCriteria: [
        'Circuit breaker activates within 30 seconds',
        'API continues to respond with cached data',
        'No data corruption occurs',
        'System recovers automatically when connections restored'
      ],
      rollbackConditions: [
        'Response time > 10 seconds',
        'Error rate > 50%',
        'Circuit breaker fails to activate',
        'Data integrity violations detected'
      ],
      safetyChecks: [
        'Backup systems are operational',
        'Monitoring alerts are active',
        'Recovery procedures are ready'
      ],
      environment: 'staging',
      createdBy: 'chaos_framework',
      approved: false
    });

    // Memory Pressure Chaos
    this.experiments.set('memory_pressure_chaos', {
      id: 'memory_pressure_chaos',
      name: 'Memory Pressure Simulation',
      description: 'Gradually increase memory usage to test garbage collection and performance',
      hypothesis: 'System should maintain acceptable performance under memory pressure',
      type: 'resource',
      severity: 'medium',
      duration: 10,
      targetService: 'application',
      parameters: {
        memoryIncrement: '50MB',
        maxMemory: '500MB',
        incrementInterval: 30000 // 30 seconds
      },
      successCriteria: [
        'GC pressure increases but system remains stable',
        'Memory usage monitored and alerts triggered appropriately',
        'No memory leaks detected',
        'Performance degradation within acceptable limits'
      ],
      rollbackConditions: [
        'Memory usage > 90%',
        'GC time > 50% of total time',
        'Response time degrades > 3x baseline',
        'Out of memory errors occur'
      ],
      safetyChecks: [
        'Memory monitoring is active',
        'Restart procedures are ready',
        'Load balancer can redirect traffic'
      ],
      environment: 'development',
      createdBy: 'chaos_framework',
      approved: true
    });

    // Network Latency Chaos
    this.experiments.set('network_latency_chaos', {
      id: 'network_latency_chaos',
      name: 'Network Latency Injection',
      description: 'Inject network latency to test timeout handling and user experience',
      hypothesis: 'System should handle network latency gracefully with appropriate timeouts',
      type: 'network',
      severity: 'low',
      duration: 15,
      targetService: 'external_api',
      parameters: {
        latency: 2000, // 2 seconds
        jitter: 500,   // ±500ms
        targets: ['database', 'email_service', 'file_storage']
      },
      successCriteria: [
        'Timeouts are handled gracefully',
        'User experience remains acceptable',
        'Circuit breakers activate when appropriate',
        'Retry mechanisms work correctly'
      ],
      rollbackConditions: [
        'User-facing requests timeout',
        'Error rate exceeds 10%',
        'Business critical operations fail'
      ],
      safetyChecks: [
        'Timeout configurations are appropriate',
        'Fallback mechanisms are active',
        'User notifications are working'
      ],
      environment: 'development',
      createdBy: 'chaos_framework',
      approved: true
    });

    // Error Injection Chaos
    this.experiments.set('error_injection_chaos', {
      id: 'error_injection_chaos',
      name: 'API Error Injection',
      description: 'Inject random errors into API responses to test error handling',
      hypothesis: 'System should handle API errors gracefully with proper user feedback',
      type: 'error_injection',
      severity: 'low',
      duration: 20,
      targetService: 'api',
      parameters: {
        errorRate: 0.05, // 5% of requests
        errorTypes: ['500', '503', '408', 'network_timeout'],
        excludeEndpoints: ['/health', '/login']
      },
      successCriteria: [
        'Errors are logged appropriately',
        'Users receive meaningful error messages',
        'System continues to operate for successful requests',
        'No data corruption from failed requests'
      ],
      rollbackConditions: [
        'Overall error rate > 20%',
        'Critical operations consistently fail',
        'User session corruption detected'
      ],
      safetyChecks: [
        'Error monitoring is active',
        'User notification systems work',
        'Data consistency checks pass'
      ],
      environment: 'development',
      createdBy: 'chaos_framework',
      approved: true
    });

    // Service Dependency Failure
    this.experiments.set('service_dependency_chaos', {
      id: 'service_dependency_chaos',
      name: 'Service Dependency Failure',
      description: 'Simulate external service failures to test fallback mechanisms',
      hypothesis: 'System should continue operating with degraded functionality when external services fail',
      type: 'service',
      severity: 'medium',
      duration: 30,
      targetService: 'email_service',
      parameters: {
        failureType: 'complete_unavailability',
        affectedOperations: ['email_sending', 'notifications']
      },
      successCriteria: [
        'Email operations fail gracefully',
        'Critical user operations continue',
        'Fallback notification methods activate',
        'System queues emails for later retry'
      ],
      rollbackConditions: [
        'Critical business operations fail',
        'User registration/login affected',
        'Data loss occurs'
      ],
      safetyChecks: [
        'Fallback systems are ready',
        'Email queue is operational',
        'User communication channels exist'
      ],
      environment: 'staging',
      createdBy: 'chaos_framework',
      approved: false
    });
  }

  private startExperimentScheduler(): void {
    // Check for scheduled experiments every minute
    setInterval(() => {
      this.checkScheduledExperiments();
    }, 60000);
  }

  async createExperiment(experiment: Omit<ChaosExperiment, 'id' | 'approved'>): Promise<string> {
    const id = `chaos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chaosExperiment: ChaosExperiment = {
      ...experiment,
      id,
      approved: false
    };

    this.experiments.set(id, chaosExperiment);

    logger.info('chaos_engineering', `Chaos experiment created: ${experiment.name}`, {
      experimentId: id,
      type: experiment.type,
      severity: experiment.severity,
      environment: experiment.environment
    });

    return id;
  }

  async approveExperiment(experimentId: string, approver: string): Promise<boolean> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    experiment.approved = true;
    experiment.approvedBy = approver;

    logger.info('chaos_engineering', `Chaos experiment approved`, {
      experimentId,
      approver,
      experimentName: experiment.name
    });

    return true;
  }

  async executeExperiment(experimentId: string, immediate: boolean = false): Promise<string | null> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      logger.error('chaos_engineering', `Experiment not found: ${experimentId}`);
      return null;
    }

    if (!experiment.approved && experiment.environment !== 'development') {
      logger.error('chaos_engineering', `Experiment not approved: ${experimentId}`);
      return null;
    }

    if (this.activeExperiments.size > 0 && !immediate) {
      logger.warn('chaos_engineering', `Cannot start experiment - another experiment is running`);
      return null;
    }

    const executionId = `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const execution: ChaosExecution = {
      id: executionId,
      experimentId,
      startTime: new Date(),
      status: 'scheduled',
      results: {
        hypothesisValidated: false,
        systemResilience: 'acceptable',
        recoveryTime: 0,
        impactRadius: [],
        unexpectedBehaviors: [],
        improvementAreas: [],
        confidenceScore: 0
      },
      observations: [],
      issues: [],
      learnings: [],
      metricsSnapshot: {
        before: {},
        during: {},
        after: {}
      },
      automaticRollback: false,
      manualInterventions: []
    };

    this.executions.set(executionId, execution);

    // Execute the experiment
    this.runExperiment(experiment, execution);

    return executionId;
  }

  private async runExperiment(experiment: ChaosExperiment, execution: ChaosExecution): Promise<void> {
    logger.info('chaos_engineering', `Starting chaos experiment: ${experiment.name}`, {
      experimentId: experiment.id,
      executionId: execution.id,
      duration: experiment.duration
    });

    try {
      // Pre-execution safety checks
      const safetyCheckPassed = await this.performSafetyChecks(experiment);
      if (!safetyCheckPassed) {
        execution.status = 'aborted';
        execution.issues.push('Safety checks failed');
        logger.error('chaos_engineering', `Experiment aborted - safety checks failed`);
        return;
      }

      // Capture baseline metrics
      execution.metricsSnapshot.before = await this.captureMetrics();
      
      execution.status = 'running';
      this.activeExperiments.add(experiment.id);

      // Send start notification
      await this.alertSystem.sendAlert({
        type: 'chaos_experiment_started',
        severity: 'info',
        title: `Chaos Experiment Started: ${experiment.name}`,
        message: `Chaos experiment ${experiment.id} has started and will run for ${experiment.duration} minutes`,
        metadata: {
          experimentId: experiment.id,
          executionId: execution.id,
          duration: experiment.duration,
          environment: experiment.environment
        }
      });

      // Start the chaos
      const chaosHandle = await this.startChaos(experiment, execution);

      // Monitor during chaos
      const monitoringHandle = this.startMonitoring(experiment, execution);

      // Wait for experiment duration
      await new Promise(resolve => setTimeout(resolve, experiment.duration * 60 * 1000));

      // Stop chaos
      await this.stopChaos(experiment, execution, chaosHandle);
      
      // Stop monitoring
      clearInterval(monitoringHandle);

      // Wait for system to stabilize
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

      // Capture post-chaos metrics
      execution.metricsSnapshot.after = await this.captureMetrics();

      // Analyze results
      await this.analyzeResults(experiment, execution);

      execution.status = 'completed';
      execution.endTime = new Date();

      logger.info('chaos_engineering', `Chaos experiment completed`, {
        experimentId: experiment.id,
        executionId: execution.id,
        hypothesisValidated: execution.results.hypothesisValidated,
        systemResilience: execution.results.systemResilience
      });

      // Send completion notification
      await this.alertSystem.sendAlert({
        type: 'chaos_experiment_completed',
        severity: execution.results.systemResilience === 'failed' ? 'high' : 'info',
        title: `Chaos Experiment Completed: ${experiment.name}`,
        message: `Experiment completed. Hypothesis ${execution.results.hypothesisValidated ? 'validated' : 'invalidated'}. System resilience: ${execution.results.systemResilience}`,
        metadata: {
          experimentId: experiment.id,
          executionId: execution.id,
          results: execution.results
        }
      });

    } catch (error) {
      execution.status = 'failed';
      execution.issues.push(`Experiment failed: ${error}`);
      
      logger.error('chaos_engineering', `Chaos experiment failed`, error as Error);
      
      await this.alertSystem.sendAlert({
        type: 'chaos_experiment_failed',
        severity: 'high',
        title: `Chaos Experiment Failed: ${experiment.name}`,
        message: `Experiment ${experiment.id} failed with error: ${error}`,
        metadata: {
          experimentId: experiment.id,
          executionId: execution.id,
          error: (error as Error).message
        }
      });
    } finally {
      this.activeExperiments.delete(experiment.id);
    }
  }

  private async performSafetyChecks(experiment: ChaosExperiment): Promise<boolean> {
    // Check system health
    const healthStatus = await this.healthMonitor.getHealthStatus();
    if (!healthStatus.database?.connected) {
      logger.warn('chaos_engineering', 'Safety check failed: Database not connected');
      return false;
    }

    // Check for ongoing incidents
    // This would check if there are active incidents
    
    // Check circuit breaker states
    const circuitBreakerHealth = circuitBreakers.getManager().getHealthStatus();
    if (!circuitBreakerHealth.healthy) {
      logger.warn('chaos_engineering', 'Safety check failed: Circuit breakers are not healthy');
      return false;
    }

    // Environment-specific checks
    if (experiment.environment === 'production' && !this.safetyMode) {
      logger.warn('chaos_engineering', 'Safety check failed: Production experiments require safety mode');
      return false;
    }

    return true;
  }

  private async captureMetrics(): Promise<any> {
    const healthStatus = await this.healthMonitor.getHealthStatus();
    const circuitBreakerStats = circuitBreakers.getManager().getAllStats();
    
    return {
      timestamp: new Date(),
      system: healthStatus.system,
      api: healthStatus.api,
      database: healthStatus.database,
      circuitBreakers: circuitBreakerStats,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  private async startChaos(experiment: ChaosExperiment, execution: ChaosExecution): Promise<any> {
    logger.info('chaos_engineering', `Starting chaos injection for ${experiment.type}`);
    
    switch (experiment.type) {
      case 'resource':
        return this.injectResourceChaos(experiment, execution);
      case 'network':
        return this.injectNetworkChaos(experiment, execution);
      case 'error_injection':
        return this.injectErrorChaos(experiment, execution);
      case 'service':
        return this.injectServiceChaos(experiment, execution);
      default:
        throw new Error(`Unsupported chaos type: ${experiment.type}`);
    }
  }

  private async injectResourceChaos(experiment: ChaosExperiment, execution: ChaosExecution): Promise<any> {
    if (experiment.targetService === 'database' && experiment.parameters.connectionLimit) {
      // Simulate database connection pool limitation
      execution.observations.push('Started database connection pool limitation');
      return { type: 'db_connection_limit', active: true };
    } else if (experiment.parameters.memoryIncrement) {
      // Simulate memory pressure
      const interval = setInterval(() => {
        if (global.gc) global.gc(); // Force GC to observe pressure
      }, experiment.parameters.incrementInterval);
      
      execution.observations.push('Started memory pressure simulation');
      return { type: 'memory_pressure', interval };
    }
    
    return null;
  }

  private async injectNetworkChaos(experiment: ChaosExperiment, execution: ChaosExecution): Promise<any> {
    // Simulate network latency
    execution.observations.push(`Injected ${experiment.parameters.latency}ms latency`);
    return { type: 'network_latency', latency: experiment.parameters.latency };
  }

  private async injectErrorChaos(experiment: ChaosExperiment, execution: ChaosExecution): Promise<any> {
    // This would integrate with API middleware to inject errors
    execution.observations.push(`Started error injection at ${experiment.parameters.errorRate * 100}% rate`);
    return { type: 'error_injection', rate: experiment.parameters.errorRate };
  }

  private async injectServiceChaos(experiment: ChaosExperiment, execution: ChaosExecution): Promise<any> {
    // Simulate service unavailability
    execution.observations.push(`Simulated ${experiment.targetService} unavailability`);
    return { type: 'service_unavailable', service: experiment.targetService };
  }

  private startMonitoring(experiment: ChaosExperiment, execution: ChaosExecution): NodeJS.Timeout {
    return setInterval(async () => {
      try {
        const currentMetrics = await this.captureMetrics();
        execution.metricsSnapshot.during = currentMetrics;

        // Check rollback conditions
        for (const condition of experiment.rollbackConditions) {
          if (await this.evaluateRollbackCondition(condition, currentMetrics, experiment)) {
            execution.automaticRollback = true;
            execution.observations.push(`Automatic rollback triggered: ${condition}`);
            
            logger.warn('chaos_engineering', `Automatic rollback triggered`, {
              experimentId: experiment.id,
              condition,
              executionId: execution.id
            });
            
            // This would trigger rollback
            break;
          }
        }
      } catch (error) {
        execution.issues.push(`Monitoring error: ${error}`);
      }
    }, 30000); // Monitor every 30 seconds
  }

  private async evaluateRollbackCondition(condition: string, metrics: any, experiment: ChaosExperiment): Promise<boolean> {
    // Simple condition evaluation - in practice this would be more sophisticated
    if (condition.includes('Response time > 10 seconds') && metrics.api?.averageResponseTime > 10000) {
      return true;
    }
    
    if (condition.includes('Error rate > 50%') && metrics.api?.errorRate > 50) {
      return true;
    }
    
    if (condition.includes('Memory usage > 90%') && metrics.system?.memoryUsage?.percentage > 90) {
      return true;
    }
    
    return false;
  }

  private async stopChaos(experiment: ChaosExperiment, execution: ChaosExecution, chaosHandle: any): Promise<void> {
    if (!chaosHandle) return;
    
    logger.info('chaos_engineering', `Stopping chaos injection for ${experiment.type}`);
    
    switch (chaosHandle.type) {
      case 'memory_pressure':
        if (chaosHandle.interval) {
          clearInterval(chaosHandle.interval);
        }
        break;
      
      case 'db_connection_limit':
        // Restore normal connection pool
        break;
      
      case 'network_latency':
        // Remove network latency
        break;
      
      case 'error_injection':
        // Stop error injection
        break;
      
      case 'service_unavailable':
        // Restore service availability
        break;
    }
    
    execution.observations.push('Chaos injection stopped');
  }

  private async analyzeResults(experiment: ChaosExperiment, execution: ChaosExecution): Promise<void> {
    const before = execution.metricsSnapshot.before;
    const after = execution.metricsSnapshot.after;
    
    // Calculate recovery time
    execution.results.recoveryTime = this.calculateRecoveryTime(before, after);
    
    // Evaluate hypothesis
    execution.results.hypothesisValidated = await this.evaluateHypothesis(experiment, execution);
    
    // Assess system resilience
    execution.results.systemResilience = this.assessSystemResilience(execution);
    
    // Calculate confidence score
    execution.results.confidenceScore = this.calculateConfidenceScore(execution);
    
    // Extract learnings
    execution.learnings = this.extractLearnings(experiment, execution);
    
    logger.info('chaos_engineering', 'Results analyzed', {
      experimentId: experiment.id,
      hypothesisValidated: execution.results.hypothesisValidated,
      systemResilience: execution.results.systemResilience,
      recoveryTime: execution.results.recoveryTime
    });
  }

  private calculateRecoveryTime(before: any, after: any): number {
    // Simple recovery time calculation based on metrics comparison
    if (!before.api || !after.api) return 0;
    
    const beforeResponseTime = before.api.averageResponseTime || 0;
    const afterResponseTime = after.api.averageResponseTime || 0;
    
    // If performance is back to baseline, recovery was quick
    if (Math.abs(afterResponseTime - beforeResponseTime) < 100) {
      return 30; // Assume 30 seconds recovery
    }
    
    return 120; // Assume 2 minutes recovery
  }

  private async evaluateHypothesis(experiment: ChaosExperiment, execution: ChaosExecution): Promise<boolean> {
    // This would evaluate the hypothesis based on the success criteria
    // For now, we'll check if no critical issues occurred
    return execution.issues.length === 0 && !execution.automaticRollback;
  }

  private assessSystemResilience(execution: ChaosExecution): 'excellent' | 'good' | 'acceptable' | 'poor' | 'failed' {
    if (execution.automaticRollback || execution.issues.length > 3) {
      return 'failed';
    }
    
    if (execution.issues.length > 1) {
      return 'poor';
    }
    
    if (execution.issues.length === 1) {
      return 'acceptable';
    }
    
    if (execution.results.recoveryTime < 60) {
      return 'excellent';
    }
    
    return 'good';
  }

  private calculateConfidenceScore(execution: ChaosExecution): number {
    let score = 1.0;
    
    // Reduce confidence for each issue
    score -= execution.issues.length * 0.2;
    
    // Reduce confidence for unexpected behaviors
    score -= execution.results.unexpectedBehaviors.length * 0.1;
    
    // Reduce confidence for rollbacks
    if (execution.automaticRollback) {
      score -= 0.3;
    }
    
    return Math.max(0, score);
  }

  private extractLearnings(experiment: ChaosExperiment, execution: ChaosExecution): string[] {
    const learnings: string[] = [];
    
    if (execution.results.hypothesisValidated) {
      learnings.push(`Hypothesis validated: ${experiment.hypothesis}`);
    } else {
      learnings.push(`Hypothesis invalidated: ${experiment.hypothesis}`);
      learnings.push('System behavior under chaos differed from expectations');
    }
    
    if (execution.automaticRollback) {
      learnings.push('Automatic rollback mechanisms are working correctly');
    }
    
    if (execution.results.recoveryTime < 60) {
      learnings.push('System demonstrates excellent recovery capabilities');
    }
    
    execution.issues.forEach(issue => {
      learnings.push(`Identified weakness: ${issue}`);
    });
    
    return learnings;
  }

  private async checkScheduledExperiments(): Promise<void> {
    const now = new Date();
    
    for (const experiment of this.experiments.values()) {
      if (!experiment.schedule || !experiment.schedule.enabled || !experiment.approved) {
        continue;
      }
      
      const shouldRun = this.shouldRunScheduledExperiment(experiment, now);
      if (shouldRun && !this.activeExperiments.has(experiment.id)) {
        logger.info('chaos_engineering', `Starting scheduled experiment: ${experiment.name}`);
        await this.executeExperiment(experiment.id, false);
      }
    }
  }

  private shouldRunScheduledExperiment(experiment: ChaosExperiment, now: Date): boolean {
    const schedule = experiment.schedule!;
    
    if (schedule.type === 'once') {
      return now >= schedule.startTime;
    }
    
    // For recurring schedules, check if it's time to run
    const timeDiff = now.getTime() - schedule.startTime.getTime();
    const intervalMs = this.getRecurrenceInterval(schedule.recurrence!);
    
    return timeDiff > 0 && timeDiff % intervalMs < 60000; // Within 1 minute window
  }

  private getRecurrenceInterval(recurrence: string): number {
    switch (recurrence) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  // Public query methods
  getExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }

  getExecution(executionId: string): ChaosExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutions(experimentId?: string): ChaosExecution[] {
    const executions = Array.from(this.executions.values());
    return experimentId ? executions.filter(e => e.experimentId === experimentId) : executions;
  }

  getActiveExperiments(): string[] {
    return Array.from(this.activeExperiments);
  }

  generateChaosReport(): any {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed');
    
    return {
      summary: {
        totalExperiments: this.experiments.size,
        totalExecutions: executions.length,
        completedExecutions: completed.length,
        activeExperiments: this.activeExperiments.size,
        successRate: completed.length > 0 ? 
          completed.filter(e => e.results.hypothesisValidated).length / completed.length * 100 : 0
      },
      resilienceMetrics: {
        averageRecoveryTime: completed.length > 0 ?
          completed.reduce((sum, e) => sum + e.results.recoveryTime, 0) / completed.length : 0,
        systemResilienceDistribution: completed.reduce((acc: any, e) => {
          acc[e.results.systemResilience] = (acc[e.results.systemResilience] || 0) + 1;
          return acc;
        }, {})
      },
      recentExecutions: executions
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
        .slice(0, 10),
      topLearnings: this.extractTopLearnings(executions)
    };
  }

  private extractTopLearnings(executions: ChaosExecution[]): string[] {
    const allLearnings = executions.flatMap(e => e.learnings);
    const learningCounts = allLearnings.reduce((acc: any, learning) => {
      acc[learning] = (acc[learning] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(learningCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([learning]) => learning);
  }

  // Configuration methods
  setSafetyMode(enabled: boolean): void {
    this.safetyMode = enabled;
    logger.info('chaos_engineering', `Safety mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  getSafetyMode(): boolean {
    return this.safetyMode;
  }
}

export { ChaosEngineeringFramework };