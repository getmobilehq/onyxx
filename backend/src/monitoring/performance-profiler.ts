import { performance, PerformanceObserver } from 'perf_hooks';
import * as v8 from 'v8';
import { logger } from '../logging/advanced-logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'cpu' | 'memory' | 'network' | 'database' | 'filesystem' | 'custom';
  metadata?: Record<string, any>;
}

export interface ProfileResult {
  operation: string;
  duration: number;
  cpuTime?: number;
  memoryUsage?: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: NodeJS.MemoryUsage;
  };
  gcEvents?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  timeframe: string;
  summary: {
    totalOperations: number;
    averageDuration: number;
    slowestOperations: ProfileResult[];
    memoryLeaks: boolean;
    gcPressure: boolean;
    cpuIntensive: string[];
  };
  metrics: PerformanceMetric[];
  recommendations: string[];
}

class PerformanceProfiler {
  private metrics: PerformanceMetric[] = new Map().values();
  private profiles: ProfileResult[] = [];
  private observers: PerformanceObserver[] = [];
  private gcEvents: number = 0;
  private isProfileing: boolean = false;
  private performanceThresholds = {
    slowQuery: 1000, // ms
    slowAPI: 2000, // ms
    highMemory: 100 * 1024 * 1024, // 100MB
    gcPressure: 10 // events per minute
  };

  constructor() {
    this.setupPerformanceObservers();
  }

  private setupPerformanceObservers(): void {
    // HTTP requests observer
    const httpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        this.addMetric({
          name: 'http_request_duration',
          value: entry.duration,
          unit: 'ms',
          timestamp: new Date(),
          category: 'network',
          metadata: {
            name: entry.name,
            entryType: entry.entryType
          }
        });
      }
    });
    httpObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(httpObserver);

    // GC observer
    if ((performance as any).eventLoopUtilization) {
      const gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          this.gcEvents++;
          this.addMetric({
            name: 'gc_duration',
            value: entry.duration,
            unit: 'ms',
            timestamp: new Date(),
            category: 'memory',
            metadata: {
              kind: (entry as any).detail?.kind,
              flags: (entry as any).detail?.flags
            }
          });
        }
      });
      gcObserver.observe({ entryTypes: ['gc'] });
      this.observers.push(gcObserver);
    }

    // Function observer for custom marks
    const functionObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'mark' && entry.name.startsWith('onyx_')) {
          this.addMetric({
            name: entry.name,
            value: entry.startTime,
            unit: 'ms',
            timestamp: new Date(),
            category: 'custom',
            metadata: {
              entryType: entry.entryType
            }
          });
        }
      }
    });
    functionObserver.observe({ entryTypes: ['mark', 'measure'] });
    this.observers.push(functionObserver);
  }

  startProfiling(): void {
    this.isProfileing = true;
    this.gcEvents = 0;
    
    // Enable v8 profiling if available
    if (v8.setFlagsFromString) {
      v8.setFlagsFromString('--allow-natives-syntax');
    }

    logger.info('performance_profiler', 'Performance profiling started');
  }

  stopProfiling(): void {
    this.isProfileing = false;
    logger.info('performance_profiler', 'Performance profiling stopped');
  }

  profile<T>(operation: string, func: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    return this.profileAsync(operation, func, metadata);
  }

  async profileAsync<T>(
    operation: string, 
    func: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.isProfileing) {
      return func();
    }

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents;

    performance.mark(`${operation}_start`);

    try {
      const result = await func();
      
      performance.mark(`${operation}_end`);
      performance.measure(operation, `${operation}_start`, `${operation}_end`);
      
      const endTime = performance.now();
      const memoryAfter = process.memoryUsage();
      const duration = endTime - startTime;

      const profileResult: ProfileResult = {
        operation,
        duration,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external,
            arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
          }
        },
        gcEvents: this.gcEvents - gcEventsBefore,
        timestamp: new Date(),
        metadata
      };

      this.profiles.push(profileResult);

      // Log slow operations
      if (duration > this.performanceThresholds.slowAPI) {
        logger.warn('performance_profiler', `Slow operation detected: ${operation}`, {
          duration,
          threshold: this.performanceThresholds.slowAPI,
          memoryDelta: profileResult.memoryUsage.delta
        });
      }

      return result;
    } catch (error) {
      performance.mark(`${operation}_error`);
      throw error;
    } finally {
      performance.clearMarks(`${operation}_start`);
      performance.clearMarks(`${operation}_end`);
      performance.clearMarks(`${operation}_error`);
      performance.clearMeasures(operation);
    }
  }

  profileSync<T>(operation: string, func: () => T, metadata?: Record<string, any>): T {
    if (!this.isProfileing) {
      return func();
    }

    const startTime = performance.now();
    const memoryBefore = process.memoryUsage();
    const gcEventsBefore = this.gcEvents;

    try {
      const result = func();
      
      const endTime = performance.now();
      const memoryAfter = process.memoryUsage();
      const duration = endTime - startTime;

      const profileResult: ProfileResult = {
        operation,
        duration,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: {
            rss: memoryAfter.rss - memoryBefore.rss,
            heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
            heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            external: memoryAfter.external - memoryBefore.external,
            arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers
          }
        },
        gcEvents: this.gcEvents - gcEventsBefore,
        timestamp: new Date(),
        metadata
      };

      this.profiles.push(profileResult);

      // Log slow operations
      if (duration > this.performanceThresholds.slowAPI) {
        logger.warn('performance_profiler', `Slow sync operation detected: ${operation}`, {
          duration,
          threshold: this.performanceThresholds.slowAPI
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  markCustomEvent(name: string, metadata?: Record<string, any>): void {
    performance.mark(`onyx_${name}`);
    
    this.addMetric({
      name: `custom_${name}`,
      value: performance.now(),
      unit: 'ms',
      timestamp: new Date(),
      category: 'custom',
      metadata
    });
  }

  measureDatabaseQuery(query: string, duration: number, metadata?: Record<string, any>): void {
    this.addMetric({
      name: 'database_query_duration',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category: 'database',
      metadata: {
        query: query.substring(0, 100), // Truncate for storage
        fullQuery: query.length > 100 ? `${query.substring(0, 100)}...` : query,
        ...metadata
      }
    });

    if (duration > this.performanceThresholds.slowQuery) {
      logger.warn('performance_profiler', `Slow database query detected`, {
        query: query.substring(0, 200),
        duration,
        threshold: this.performanceThresholds.slowQuery
      });
    }
  }

  measureFileOperation(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.addMetric({
      name: 'file_operation_duration',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      category: 'filesystem',
      metadata: {
        operation,
        ...metadata
      }
    });
  }

  addMetric(metric: PerformanceMetric): void {
    this.metrics = [...this.metrics, metric];
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  getMetrics(category?: string, hours: number = 1): PerformanceMetric[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    let filtered = this.metrics.filter(m => m.timestamp.getTime() > cutoffTime);
    
    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }
    
    return filtered;
  }

  getProfiles(hours: number = 1): ProfileResult[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.profiles.filter(p => p.timestamp.getTime() > cutoffTime);
  }

  generateReport(hours: number = 24): PerformanceReport {
    const profiles = this.getProfiles(hours);
    const metrics = this.getMetrics(undefined, hours);
    
    const slowOperations = profiles
      .filter(p => p.duration > this.performanceThresholds.slowAPI)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const cpuIntensive = profiles
      .filter(p => p.duration > 1000) // Operations taking more than 1 second
      .map(p => p.operation)
      .filter((op, index, arr) => arr.indexOf(op) === index) // Unique operations
      .slice(0, 5);

    const averageDuration = profiles.length > 0 
      ? profiles.reduce((sum, p) => sum + p.duration, 0) / profiles.length 
      : 0;

    // Check for memory leaks
    const memoryLeaks = this.detectMemoryLeaks(profiles);
    
    // Check GC pressure
    const gcPressure = this.gcEvents > (this.performanceThresholds.gcPressure * (hours / 24));

    const recommendations = this.generateRecommendations({
      slowOperations: slowOperations.length,
      memoryLeaks,
      gcPressure,
      averageDuration,
      profiles: profiles.length
    });

    return {
      timeframe: `${hours} hours`,
      summary: {
        totalOperations: profiles.length,
        averageDuration,
        slowestOperations: slowOperations,
        memoryLeaks,
        gcPressure,
        cpuIntensive
      },
      metrics: metrics.slice(-1000), // Last 1000 metrics
      recommendations
    };
  }

  private detectMemoryLeaks(profiles: ProfileResult[]): boolean {
    if (profiles.length < 10) return false;

    // Check if memory usage is consistently increasing
    let increasingCount = 0;
    
    for (let i = 1; i < profiles.length; i++) {
      const current = profiles[i].memoryUsage?.delta.heapUsed || 0;
      const previous = profiles[i - 1].memoryUsage?.delta.heapUsed || 0;
      
      if (current > previous && current > this.performanceThresholds.highMemory) {
        increasingCount++;
      }
    }

    return increasingCount > profiles.length * 0.7; // 70% of operations increasing memory
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.slowOperations > 5) {
      recommendations.push('Consider optimizing slow operations - multiple operations exceed performance thresholds');
    }

    if (analysis.memoryLeaks) {
      recommendations.push('Potential memory leak detected - review object lifecycle and cleanup');
    }

    if (analysis.gcPressure) {
      recommendations.push('High garbage collection pressure - consider memory optimization strategies');
    }

    if (analysis.averageDuration > 1000) {
      recommendations.push('Average operation duration is high - consider caching or async optimization');
    }

    if (analysis.profiles < 10) {
      recommendations.push('Low profiling data - consider increasing monitoring coverage');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good - continue monitoring for trends');
    }

    return recommendations;
  }

  // Get current system performance snapshot
  getCurrentPerformanceSnapshot(): any {
    const memUsage = process.memoryUsage();
    const eventLoopDelay = (performance as any).eventLoopUtilization?.() || {};
    
    return {
      timestamp: new Date(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        usage: {
          heap: (memUsage.heapUsed / memUsage.heapTotal) * 100,
          rss: memUsage.rss
        }
      },
      eventLoop: {
        utilization: eventLoopDelay.utilization || 0,
        active: eventLoopDelay.active || 0,
        idle: eventLoopDelay.idle || 0
      },
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      loadAverage: require('os').loadavg(),
      gcEvents: this.gcEvents,
      activeProfiles: this.profiles.filter(p => 
        Date.now() - p.timestamp.getTime() < 60000 // Last minute
      ).length
    };
  }

  // Performance-optimized middleware for Express
  createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
      if (!this.isProfileing) return next();

      const startTime = performance.now();
      const memoryBefore = process.memoryUsage();
      
      // Override res.end to capture timing
      const originalEnd = res.end;
      res.end = (...args: any[]) => {
        const duration = performance.now() - startTime;
        const memoryAfter = process.memoryUsage();
        
        this.addMetric({
          name: 'http_request_duration',
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          category: 'network',
          metadata: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            contentLength: res.get('Content-Length'),
            memoryDelta: memoryAfter.heapUsed - memoryBefore.heapUsed
          }
        });

        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      
      this.addMetric({
        name: 'memory_usage',
        value: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        unit: 'percent',
        timestamp: new Date(),
        category: 'memory',
        metadata: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external
        }
      });
    }, 30000); // Every 30 seconds
  }

  // Cleanup
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.profiles = [];
    this.gcEvents = 0;
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Global profiler instance
export const profiler = new PerformanceProfiler();

// Auto-start profiling in development
if (process.env.NODE_ENV === 'development' || process.env.ENABLE_PROFILING === 'true') {
  profiler.startProfiling();
  profiler.trackMemoryUsage();
}

export { PerformanceProfiler };