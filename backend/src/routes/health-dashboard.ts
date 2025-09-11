import express from 'express';
import { HealthMonitor } from '../monitoring/health-monitor';
import { AlertSystem } from '../monitoring/alert-system';
import { IncidentResponseSystem } from '../monitoring/incident-response';
import { PredictiveMonitor } from '../monitoring/predictive-monitoring';
import { AutomatedRecoverySystem } from '../monitoring/recovery-system';
import { DataIntegrityValidator } from '../validation/data-integrity';
import { circuitBreakers } from '../resilience/circuit-breaker';
import { logger } from '../logging/advanced-logger';

const router = express.Router();

// Initialize monitoring systems (these would be initialized at startup)
const healthMonitor = new HealthMonitor();
const alertSystem = new AlertSystem();
const incidentResponse = new IncidentResponseSystem();
const predictiveMonitor = new PredictiveMonitor();
const recoverySystem = new AutomatedRecoverySystem();
const dataValidator = new DataIntegrityValidator();

/**
 * GET /api/health-dashboard/overview
 * Returns high-level system health overview
 */
router.get('/overview', async (req, res) => {
  try {
    const [
      healthStatus,
      circuitBreakerHealth,
      incidentStats,
      recoveryStats,
      logStats
    ] = await Promise.all([
      healthMonitor.getHealthStatus(),
      circuitBreakers.getManager().getHealthStatus(),
      incidentResponse.getIncidentStats(24),
      recoverySystem.getRecoveryStats(24),
      logger.getLogStats(24)
    ]);

    const overview = {
      timestamp: new Date(),
      overallHealth: determineOverallHealth([
        healthStatus,
        circuitBreakerHealth,
        { healthy: incidentStats.resolved > incidentStats.failed }
      ]),
      systemMetrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: healthStatus.system?.cpuUsage,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },
      services: {
        database: healthStatus.database,
        api: healthStatus.api,
        externalServices: healthStatus.externalServices,
        circuitBreakers: circuitBreakerHealth
      },
      incidents: {
        active: incidentResponse.getActiveIncidents().length,
        resolved24h: incidentStats.resolved,
        failed24h: incidentStats.failed,
        totalRecoveries: recoveryStats.successful
      },
      alerts: {
        errorRate: logStats.errorRate,
        totalLogs24h: logStats.total,
        topErrors: logStats.topErrors.slice(0, 3)
      }
    };

    res.json(overview);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get overview', error);
    res.status(500).json({ error: 'Failed to get system overview' });
  }
});

/**
 * GET /api/health-dashboard/detailed
 * Returns detailed system health information
 */
router.get('/detailed', async (req, res) => {
  try {
    const [
      healthStatus,
      predictions,
      anomalies,
      circuitBreakerStats,
      incidentHistory,
      recoveryHistory
    ] = await Promise.all([
      healthMonitor.getHealthStatus(),
      predictiveMonitor.getCurrentPredictions(),
      predictiveMonitor.getRecentAnomalies(24),
      circuitBreakers.getManager().getAllStats(),
      incidentResponse.getIncidentHistory(24),
      recoverySystem.getExecutionHistory(24)
    ]);

    const detailed = {
      timestamp: new Date(),
      health: healthStatus,
      predictions: predictions,
      anomalies: {
        total: anomalies.length,
        bySeverity: anomalies.reduce((acc: any, a) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        }, {}),
        recent: anomalies.slice(0, 10)
      },
      circuitBreakers: {
        summary: circuitBreakers.getManager().getGlobalStats(),
        details: circuitBreakerStats
      },
      incidents: {
        active: incidentResponse.getActiveIncidents(),
        history: incidentHistory.slice(0, 20)
      },
      recovery: {
        stats: recoverySystem.getRecoveryStats(24),
        recentExecutions: recoveryHistory.slice(0, 10)
      }
    };

    res.json(detailed);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get detailed health', error);
    res.status(500).json({ error: 'Failed to get detailed health information' });
  }
});

/**
 * GET /api/health-dashboard/metrics/realtime
 * Returns real-time metrics for dashboard
 */
router.get('/metrics/realtime', async (req, res) => {
  try {
    const healthStatus = await healthMonitor.getHealthStatus();
    const circuitBreakerStats = circuitBreakers.getManager().getGlobalStats();
    
    const realtimeMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: healthStatus.system?.cpuUsage?.percentage || 0,
        loadAverage: healthStatus.system?.cpuUsage?.loadAverage || []
      },
      memory: {
        usage: healthStatus.system?.memoryUsage?.percentage || 0,
        used: healthStatus.system?.memoryUsage?.used || 0,
        free: healthStatus.system?.memoryUsage?.free || 0
      },
      api: {
        responseTime: healthStatus.api?.averageResponseTime || 0,
        requestCount: healthStatus.api?.requestCount || 0,
        errorRate: healthStatus.api?.errorRate || 0
      },
      database: {
        connected: healthStatus.database?.connected || false,
        activeConnections: healthStatus.database?.activeConnections || 0,
        poolSize: healthStatus.database?.poolSize || 0
      },
      circuitBreakers: {
        open: circuitBreakerStats.openCircuitBreakers || 0,
        total: circuitBreakerStats.totalCircuitBreakers || 0,
        errorRate: circuitBreakerStats.averageErrorRate || 0
      }
    };

    res.json(realtimeMetrics);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get realtime metrics', error);
    res.status(500).json({ error: 'Failed to get realtime metrics' });
  }
});

/**
 * GET /api/health-dashboard/metrics/history
 * Returns historical metrics for trending
 */
router.get('/metrics/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const metrics = ['cpu_usage', 'memory_usage', 'api_response_time', 'error_rate'];
    
    const history: any = {};
    
    for (const metric of metrics) {
      history[metric] = predictiveMonitor.getMetricHistory(metric, hours);
    }

    res.json({
      timeframe: `${hours} hours`,
      metrics: history,
      summary: {
        dataPoints: Object.values(history).reduce((max: number, points: any) => 
          Math.max(max, points.length), 0),
        startTime: new Date(Date.now() - hours * 60 * 60 * 1000),
        endTime: new Date()
      }
    });
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get metrics history', error);
    res.status(500).json({ error: 'Failed to get metrics history' });
  }
});

/**
 * GET /api/health-dashboard/incidents
 * Returns incident information
 */
router.get('/incidents', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const includeActive = req.query.active !== 'false';
    
    const response: any = {
      timestamp: new Date(),
      timeframe: `${hours} hours`,
      stats: incidentResponse.getIncidentStats(hours)
    };

    if (includeActive) {
      response.active = incidentResponse.getActiveIncidents();
    }

    response.history = incidentResponse.getIncidentHistory(hours);

    res.json(response);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get incidents', error);
    res.status(500).json({ error: 'Failed to get incident information' });
  }
});

/**
 * GET /api/health-dashboard/recovery
 * Returns recovery system information
 */
router.get('/recovery', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    
    const response = {
      timestamp: new Date(),
      timeframe: `${hours} hours`,
      stats: recoverySystem.getRecoveryStats(hours),
      actions: recoverySystem.getRecoveryActions(),
      recentExecutions: recoverySystem.getExecutionHistory(hours)
    };

    res.json(response);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get recovery information', error);
    res.status(500).json({ error: 'Failed to get recovery information' });
  }
});

/**
 * GET /api/health-dashboard/predictions
 * Returns predictive analysis information
 */
router.get('/predictions', async (req, res) => {
  try {
    const [currentPredictions, anomalyStats] = await Promise.all([
      predictiveMonitor.getCurrentPredictions(),
      predictiveMonitor.getAnomalyStats(24)
    ]);

    const response = {
      timestamp: new Date(),
      predictions: currentPredictions,
      anomalies: {
        stats: anomalyStats,
        recent: predictiveMonitor.getRecentAnomalies(24).slice(0, 10)
      },
      riskAssessment: {
        highRisk: currentPredictions.filter(p => p.riskLevel === 'high'),
        mediumRisk: currentPredictions.filter(p => p.riskLevel === 'medium'),
        lowRisk: currentPredictions.filter(p => p.riskLevel === 'low')
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get predictions', error);
    res.status(500).json({ error: 'Failed to get prediction information' });
  }
});

/**
 * GET /api/health-dashboard/logs
 * Returns log analysis information
 */
router.get('/logs', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const level = req.query.level as string;
    const category = req.query.category as string;
    
    const logStats = await logger.getLogStats(hours);
    
    // Query recent logs with filters
    const query: any = {
      limit: 100,
      startTime: new Date(Date.now() - hours * 60 * 60 * 1000)
    };
    
    if (level) query.level = level;
    if (category) query.category = category;
    
    const recentLogs = await logger.queryLogs(query);

    const response = {
      timestamp: new Date(),
      timeframe: `${hours} hours`,
      stats: logStats,
      recentLogs: recentLogs.slice(0, 50), // Limit for dashboard
      filters: {
        level,
        category
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get log information', error);
    res.status(500).json({ error: 'Failed to get log information' });
  }
});

/**
 * GET /api/health-dashboard/circuit-breakers
 * Returns circuit breaker information
 */
router.get('/circuit-breakers', async (req, res) => {
  try {
    const manager = circuitBreakers.getManager();
    
    const response = {
      timestamp: new Date(),
      globalStats: manager.getGlobalStats(),
      healthStatus: manager.getHealthStatus(),
      allStats: manager.getAllStats(),
      circuitBreakers: Array.from(manager.getAll().keys()).map(name => ({
        name,
        stats: manager.get(name)?.getStats(),
        healthy: manager.get(name)?.isHealthy()
      }))
    };

    res.json(response);
  } catch (error) {
    logger.error('health_dashboard', 'Failed to get circuit breaker information', error);
    res.status(500).json({ error: 'Failed to get circuit breaker information' });
  }
});

/**
 * POST /api/health-dashboard/actions/manual-recovery
 * Trigger manual recovery action
 */
router.post('/actions/manual-recovery', async (req, res) => {
  try {
    const { actionId, approved = true } = req.body;
    
    if (!actionId) {
      return res.status(400).json({ error: 'Action ID is required' });
    }

    await recoverySystem.manualRecovery(actionId, approved);
    
    logger.info('health_dashboard', `Manual recovery ${approved ? 'approved' : 'declined'}`, {
      actionId,
      approved,
      userId: req.user?.id
    });

    res.json({ 
      success: true, 
      message: `Recovery action ${actionId} ${approved ? 'executed' : 'declined'}` 
    });
  } catch (error) {
    logger.error('health_dashboard', 'Failed to execute manual recovery', error);
    res.status(500).json({ error: 'Failed to execute manual recovery' });
  }
});

/**
 * POST /api/health-dashboard/actions/circuit-breaker
 * Manual circuit breaker control
 */
router.post('/actions/circuit-breaker', async (req, res) => {
  try {
    const { name, action } = req.body;
    
    if (!name || !action) {
      return res.status(400).json({ error: 'Circuit breaker name and action are required' });
    }

    const circuitBreaker = circuitBreakers.getManager().get(name);
    if (!circuitBreaker) {
      return res.status(404).json({ error: 'Circuit breaker not found' });
    }

    switch (action) {
      case 'open':
        circuitBreaker.open();
        break;
      case 'close':
        circuitBreaker.close();
        break;
      case 'half-open':
        circuitBreaker.halfOpen();
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    logger.info('health_dashboard', `Manual circuit breaker action`, {
      circuitBreaker: name,
      action,
      userId: req.user?.id
    });

    res.json({ 
      success: true, 
      message: `Circuit breaker ${name} ${action}`,
      newState: circuitBreaker.getState()
    });
  } catch (error) {
    logger.error('health_dashboard', 'Failed to control circuit breaker', error);
    res.status(500).json({ error: 'Failed to control circuit breaker' });
  }
});

/**
 * GET /api/health-dashboard/export
 * Export health data for external monitoring
 */
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const hours = parseInt(req.query.hours as string) || 24;
    
    const exportData = {
      timestamp: new Date(),
      timeframe: `${hours} hours`,
      health: await healthMonitor.getHealthStatus(),
      incidents: incidentResponse.getIncidentStats(hours),
      recovery: recoverySystem.getRecoveryStats(hours),
      predictions: await predictiveMonitor.getCurrentPredictions(),
      circuitBreakers: circuitBreakers.getManager().getGlobalStats(),
      logs: await logger.getLogStats(hours)
    };

    if (format === 'prometheus') {
      // Convert to Prometheus format
      const prometheusMetrics = convertToPrometheus(exportData);
      res.setHeader('Content-Type', 'text/plain');
      res.send(prometheusMetrics);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    logger.error('health_dashboard', 'Failed to export health data', error);
    res.status(500).json({ error: 'Failed to export health data' });
  }
});

// Helper functions
function determineOverallHealth(healthChecks: any[]): 'healthy' | 'degraded' | 'unhealthy' {
  const unhealthyCount = healthChecks.filter(check => !check.healthy).length;
  
  if (unhealthyCount === 0) return 'healthy';
  if (unhealthyCount <= healthChecks.length / 2) return 'degraded';
  return 'unhealthy';
}

function convertToPrometheus(data: any): string {
  const metrics: string[] = [];
  
  // System metrics
  if (data.health.system) {
    metrics.push(`onyx_cpu_usage_percent ${data.health.system.cpuUsage?.percentage || 0}`);
    metrics.push(`onyx_memory_usage_percent ${data.health.system.memoryUsage?.percentage || 0}`);
  }
  
  // API metrics
  if (data.health.api) {
    metrics.push(`onyx_api_response_time_ms ${data.health.api.averageResponseTime || 0}`);
    metrics.push(`onyx_api_error_rate_percent ${data.health.api.errorRate || 0}`);
  }
  
  // Incident metrics
  metrics.push(`onyx_incidents_active ${data.incidents.resolved || 0}`);
  metrics.push(`onyx_incidents_resolved_24h ${data.incidents.resolved || 0}`);
  metrics.push(`onyx_incidents_failed_24h ${data.incidents.failed || 0}`);
  
  // Circuit breaker metrics
  metrics.push(`onyx_circuit_breakers_open ${data.circuitBreakers.openCircuitBreakers || 0}`);
  metrics.push(`onyx_circuit_breakers_total ${data.circuitBreakers.totalCircuitBreakers || 0}`);
  
  return metrics.join('\n');
}

export default router;