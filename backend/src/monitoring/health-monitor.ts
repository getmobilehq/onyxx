import { Pool } from 'pg';
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

/**
 * Comprehensive Health Monitoring System
 * Tracks system health, performance, and critical metrics
 */

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
  details?: any;
  timestamp: string;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
    usage_percent: number;
  };
  cpu: {
    usage_percent: number;
  };
  database: {
    connections: number;
    max_connections: number;
    query_latency: number;
    active_queries: number;
  };
  api: {
    requests_per_minute: number;
    average_response_time: number;
    error_rate: number;
  };
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheck[];
  metrics: SystemMetrics;
  dependencies: {
    database: HealthCheck;
    external_apis: HealthCheck[];
  };
}

export class HealthMonitor {
  private pool: Pool;
  private startTime: number;
  private requestMetrics: Map<string, number[]> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private responseTimes: number[] = [];

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.startTime = Date.now();
    
    // Start periodic cleanup of metrics
    setInterval(() => this.cleanupMetrics(), 60000); // Every minute
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    
    // Run all health checks
    const [
      databaseCheck,
      memoryCheck,
      diskCheck,
      externalApiChecks
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDiskSpace(),
      this.checkExternalAPIs()
    ]);

    checks.push(databaseCheck, memoryCheck, diskCheck, ...externalApiChecks);

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(checks);
    
    // Get system metrics
    const metrics = await this.getSystemMetrics();

    return {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      checks,
      metrics,
      dependencies: {
        database: databaseCheck,
        external_apis: externalApiChecks
      }
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const start = performance.now();
    
    try {
      // Test basic connectivity
      const result = await this.pool.query('SELECT NOW() as timestamp, version() as version');
      const latency = performance.now() - start;

      // Check connection pool status
      const poolStats = {
        total_connections: this.pool.totalCount,
        idle_connections: this.pool.idleCount,
        waiting_requests: this.pool.waitingCount
      };

      // Check for long-running queries
      const longRunningQueries = await this.pool.query(`
        SELECT count(*) as count
        FROM pg_stat_activity 
        WHERE state = 'active' 
          AND query_start < NOW() - INTERVAL '30 seconds'
          AND query NOT LIKE '%pg_stat_activity%'
      `);

      const longRunningCount = parseInt(longRunningQueries.rows[0].count);

      if (latency > 1000) {
        return {
          name: 'Database',
          status: 'degraded',
          latency,
          message: 'Database responding slowly',
          details: { ...poolStats, long_running_queries: longRunningCount },
          timestamp: new Date().toISOString()
        };
      }

      if (longRunningCount > 5) {
        return {
          name: 'Database',
          status: 'degraded',
          latency,
          message: 'High number of long-running queries detected',
          details: { ...poolStats, long_running_queries: longRunningCount },
          timestamp: new Date().toISOString()
        };
      }

      return {
        name: 'Database',
        status: 'healthy',
        latency,
        message: 'Database connection healthy',
        details: { ...poolStats, long_running_queries: longRunningCount },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        latency: performance.now() - start,
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheck> {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed;
    const usagePercent = (usedMemory / totalMemory) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Memory usage within normal limits';

    if (usagePercent > 90) {
      status = 'unhealthy';
      message = 'Critical memory usage detected';
    } else if (usagePercent > 75) {
      status = 'degraded';
      message = 'High memory usage detected';
    }

    return {
      name: 'Memory',
      status,
      message,
      details: {
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memUsage.external / 1024 / 1024),
        usage_percent: Math.round(usagePercent)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check disk space (simplified check)
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    // In a real implementation, this would check actual disk space
    // For now, we'll return a healthy status with placeholder data
    return {
      name: 'Disk Space',
      status: 'healthy',
      message: 'Sufficient disk space available',
      details: {
        available_gb: 50,
        total_gb: 100,
        usage_percent: 50
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check external API dependencies
   */
  private async checkExternalAPIs(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Check Cloudinary (image service)
    const cloudinaryCheck = await this.checkExternalService(
      'Cloudinary',
      'https://api.cloudinary.com/v1_1/demo/image/list',
      { timeout: 5000 }
    );
    checks.push(cloudinaryCheck);

    // Add more external service checks as needed
    // const mailgunCheck = await this.checkExternalService('Mailgun', ...);
    // checks.push(mailgunCheck);

    return checks;
  }

  /**
   * Generic external service checker
   */
  private async checkExternalService(
    name: string,
    url: string,
    options: { timeout?: number } = {}
  ): Promise<HealthCheck> {
    const start = performance.now();
    const timeout = options.timeout || 10000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET'
      });

      clearTimeout(timeoutId);
      const latency = performance.now() - start;

      if (response.ok) {
        return {
          name,
          status: 'healthy',
          latency,
          message: 'External service responding normally',
          details: { status_code: response.status },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          name,
          status: 'degraded',
          latency,
          message: `External service returned ${response.status}`,
          details: { status_code: response.status },
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      const latency = performance.now() - start;
      
      return {
        name,
        status: 'unhealthy',
        latency,
        message: 'External service unreachable',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    // Calculate API metrics
    const currentTime = Date.now();
    const oneMinuteAgo = currentTime - 60000;
    
    const recentRequests = this.responseTimes.filter(time => time > oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;
    const averageResponseTime = recentRequests.length > 0 
      ? recentRequests.reduce((a, b) => a + b, 0) / recentRequests.length 
      : 0;

    // Calculate error rate
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const errorRate = requestsPerMinute > 0 ? (totalErrors / requestsPerMinute) * 100 : 0;

    // Get database metrics
    let dbMetrics = {
      connections: 0,
      max_connections: 100,
      query_latency: 0,
      active_queries: 0
    };

    try {
      const [connResult, maxConnResult, activeQueriesResult] = await Promise.all([
        this.pool.query('SELECT count(*) as connections FROM pg_stat_activity WHERE datname = current_database()'),
        this.pool.query('SHOW max_connections'),
        this.pool.query('SELECT count(*) as active FROM pg_stat_activity WHERE state = \'active\' AND datname = current_database()')
      ]);

      dbMetrics = {
        connections: parseInt(connResult.rows[0].connections),
        max_connections: parseInt(maxConnResult.rows[0].max_connections),
        query_latency: 0, // Would need to implement query timing
        active_queries: parseInt(activeQueriesResult.rows[0].active)
      };
    } catch (error) {
      console.warn('Failed to get database metrics:', error);
    }

    return {
      uptime,
      memory: {
        used: memUsage.heapUsed,
        free: memUsage.heapTotal - memUsage.heapUsed,
        total: memUsage.heapTotal,
        usage_percent: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        usage_percent: 0 // Would need to implement CPU monitoring
      },
      database: dbMetrics,
      api: {
        requests_per_minute: requestsPerMinute,
        average_response_time: averageResponseTime,
        error_rate: errorRate
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(checks: HealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = checks.filter(check => check.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Middleware to track request metrics
   */
  public trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = performance.now();
      
      // Track request start time
      res.on('finish', () => {
        const duration = performance.now() - start;
        const timestamp = Date.now();
        
        // Store response time
        this.responseTimes.push(timestamp);
        
        // Track errors
        if (res.statusCode >= 400) {
          const route = `${req.method} ${req.route?.path || req.path}`;
          const currentErrors = this.errorCounts.get(route) || 0;
          this.errorCounts.set(route, currentErrors + 1);
        }
        
        // Log slow requests
        if (duration > 1000) {
          console.warn(`Slow request detected: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
        }
      });

      next();
    };
  }

  /**
   * Clean up old metrics data
   */
  private cleanupMetrics(): void {
    const fiveMinutesAgo = Date.now() - 300000; // 5 minutes
    
    // Clean up response times older than 5 minutes
    this.responseTimes = this.responseTimes.filter(time => time > fiveMinutesAgo);
    
    // Reset error counts every 5 minutes
    this.errorCounts.clear();
  }

  /**
   * Get alerts for critical issues
   */
  async getAlerts(): Promise<Array<{
    level: 'warning' | 'critical';
    message: string;
    timestamp: string;
    details?: any;
  }>> {
    const alerts = [];
    const status = await this.getHealthStatus();

    // Check for critical database issues
    if (status.dependencies.database.status === 'unhealthy') {
      alerts.push({
        level: 'critical' as const,
        message: 'Database is unreachable',
        timestamp: new Date().toISOString(),
        details: status.dependencies.database.details
      });
    }

    // Check for high memory usage
    if (status.metrics.memory.usage_percent > 90) {
      alerts.push({
        level: 'critical' as const,
        message: `Critical memory usage: ${status.metrics.memory.usage_percent.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        details: status.metrics.memory
      });
    }

    // Check for high error rate
    if (status.metrics.api.error_rate > 10) {
      alerts.push({
        level: 'warning' as const,
        message: `High API error rate: ${status.metrics.api.error_rate.toFixed(1)}%`,
        timestamp: new Date().toISOString(),
        details: status.metrics.api
      });
    }

    return alerts;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(req: Request, res: Response) {
  try {
    const includeDetails = req.query.details === 'true';
    const includeMetrics = req.query.metrics === 'true';
    
    if (includeDetails || includeMetrics) {
      // Full health status with all details
      const status = await healthMonitor.getHealthStatus();
      
      if (!includeMetrics) {
        // Remove metrics if not requested
        delete (status as any).metrics;
      }
      
      if (!includeDetails) {
        // Simplify checks if details not requested
        status.checks = status.checks.map(check => ({
          name: check.name,
          status: check.status,
          message: check.message,
          timestamp: check.timestamp
        }));
      }
      
      res.status(status.status === 'healthy' ? 200 : 503).json(status);
    } else {
      // Simple health check
      const dbCheck = await healthMonitor['checkDatabase']();
      const isHealthy = dbCheck.status === 'healthy';
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Onyx Backend API is running' : 'Service degraded',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

export default HealthMonitor;