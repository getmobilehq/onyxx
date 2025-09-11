import { EventEmitter } from 'events';
import { logger } from '../logging/advanced-logger';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes needed to close from half-open
  timeout: number; // Time in ms to wait before trying half-open
  resetTimeout: number; // Time in ms to reset failure count
  monitor: boolean; // Whether to emit events for monitoring
  fallbackEnabled: boolean; // Whether to use fallback function
  volumeThreshold: number; // Minimum number of calls before circuit can open
  errorFilter?: (error: Error) => boolean; // Filter which errors should count as failures
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChangeTime: Date;
  errorRate: number;
  uptime: number;
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerEvent {
  name: string;
  state: CircuitBreakerState;
  previousState: CircuitBreakerState;
  error?: Error;
  timestamp: Date;
  stats: CircuitBreakerStats;
}

class CircuitBreaker extends EventEmitter {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = 'closed';
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalCalls: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangeTime: Date = new Date();
  private nextAttempt?: Date;
  private resetTimer?: NodeJS.Timeout;
  private fallbackFunction?: (...args: any[]) => Promise<any>;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();
    
    this.config = {
      name: 'circuit-breaker',
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
      monitor: true,
      fallbackEnabled: false,
      volumeThreshold: 10,
      ...config
    };

    if (this.config.monitor) {
      this.setupMonitoring();
    }
  }

  private setupMonitoring(): void {
    this.on('stateChange', (event: CircuitBreakerEvent) => {
      logger.warn('circuit_breaker', `Circuit breaker ${event.name} changed state: ${event.previousState} -> ${event.state}`, {
        circuitBreaker: event.name,
        previousState: event.previousState,
        newState: event.state,
        stats: event.stats,
        error: event.error?.message
      });
    });

    this.on('failure', (event: CircuitBreakerEvent) => {
      logger.error('circuit_breaker', `Circuit breaker ${event.name} recorded failure`, {
        circuitBreaker: event.name,
        error: event.error?.message,
        failureCount: event.stats.failureCount,
        state: event.stats.state
      });
    });

    this.on('success', (event: CircuitBreakerEvent) => {
      logger.debug('circuit_breaker', `Circuit breaker ${event.name} recorded success`, {
        circuitBreaker: event.name,
        successCount: event.stats.successCount,
        state: event.stats.state
      });
    });

    this.on('fallback', (event: CircuitBreakerEvent) => {
      logger.warn('circuit_breaker', `Circuit breaker ${event.name} using fallback`, {
        circuitBreaker: event.name,
        state: event.stats.state
      });
    });
  }

  setFallback(fallbackFunction: (...args: any[]) => Promise<any>): void {
    this.fallbackFunction = fallbackFunction;
    this.config.fallbackEnabled = true;
  }

  async execute<T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    this.totalCalls++;

    // Check if circuit is open
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.changeState('half-open');
      } else {
        return this.handleOpenCircuit(args);
      }
    }

    try {
      const result = await operation(...args);
      await this.onSuccess();
      return result;
    } catch (error) {
      await this.onFailure(error as Error);
      throw error;
    }
  }

  private async onSuccess(): Promise<void> {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.config.monitor) {
      this.emit('success', this.createEvent());
    }

    if (this.state === 'half-open') {
      if (this.successCount >= this.config.successThreshold) {
        this.changeState('closed');
        this.reset();
      }
    } else if (this.state === 'closed') {
      // Reset failure count after successful operation
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        this.failureCount = 0;
      }, this.config.resetTimeout);
    }
  }

  private async onFailure(error: Error): Promise<void> {
    // Check if this error should be counted
    if (this.config.errorFilter && !this.config.errorFilter(error)) {
      return;
    }

    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.config.monitor) {
      this.emit('failure', this.createEvent(error));
    }

    // Only open circuit if we have enough volume
    if (this.totalCalls >= this.config.volumeThreshold) {
      if (this.state === 'closed' && this.failureCount >= this.config.failureThreshold) {
        this.changeState('open');
        this.scheduleNextAttempt();
      } else if (this.state === 'half-open') {
        this.changeState('open');
        this.scheduleNextAttempt();
      }
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttempt) return false;
    return Date.now() >= this.nextAttempt.getTime();
  }

  private scheduleNextAttempt(): void {
    this.nextAttempt = new Date(Date.now() + this.config.timeout);
  }

  private async handleOpenCircuit<T>(args: any[]): Promise<T> {
    if (this.config.fallbackEnabled && this.fallbackFunction) {
      if (this.config.monitor) {
        this.emit('fallback', this.createEvent());
      }
      return this.fallbackFunction(...args);
    } else {
      const error = new Error(`Circuit breaker ${this.config.name} is open`);
      (error as any).circuitBreakerOpen = true;
      throw error;
    }
  }

  private changeState(newState: CircuitBreakerState): void {
    const previousState = this.state;
    this.state = newState;
    this.stateChangeTime = new Date();

    if (this.config.monitor) {
      this.emit('stateChange', this.createEvent(undefined, previousState));
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = undefined;
    
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  private createEvent(error?: Error, previousState?: CircuitBreakerState): CircuitBreakerEvent {
    return {
      name: this.config.name,
      state: this.state,
      previousState: previousState || this.state,
      error,
      timestamp: new Date(),
      stats: this.getStats()
    };
  }

  getStats(): CircuitBreakerStats {
    const uptime = Date.now() - this.stateChangeTime.getTime();
    const errorRate = this.totalCalls > 0 ? (this.failureCount / this.totalCalls) * 100 : 0;

    return {
      name: this.config.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangeTime: this.stateChangeTime,
      errorRate,
      uptime
    };
  }

  // Manual state management
  open(): void {
    this.changeState('open');
    this.scheduleNextAttempt();
  }

  close(): void {
    this.changeState('closed');
    this.reset();
  }

  halfOpen(): void {
    this.changeState('half-open');
    this.successCount = 0;
  }

  // Health check
  isHealthy(): boolean {
    return this.state === 'closed' || 
           (this.state === 'half-open' && this.successCount > 0);
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

// Circuit Breaker Manager for managing multiple circuit breakers
class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private globalStats: any = {};

  constructor() {
    // Update global stats every 30 seconds
    setInterval(() => {
      this.updateGlobalStats();
    }, 30000);
  }

  create(name: string, config: Partial<CircuitBreakerConfig> = {}): CircuitBreaker {
    const circuitBreaker = new CircuitBreaker({
      ...config,
      name
    });

    this.circuitBreakers.set(name, circuitBreaker);

    // Setup global monitoring
    circuitBreaker.on('stateChange', (event) => {
      this.updateGlobalStats();
      logger.info('circuit_breaker_manager', `Circuit breaker ${name} state changed`, {
        name,
        state: event.state,
        previousState: event.previousState
      });
    });

    return circuitBreaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  getAllStats(): Array<CircuitBreakerStats> {
    return Array.from(this.circuitBreakers.values()).map(cb => cb.getStats());
  }

  getGlobalStats(): any {
    return { ...this.globalStats };
  }

  private updateGlobalStats(): void {
    const allStats = this.getAllStats();
    
    this.globalStats = {
      totalCircuitBreakers: allStats.length,
      openCircuitBreakers: allStats.filter(s => s.state === 'open').length,
      halfOpenCircuitBreakers: allStats.filter(s => s.state === 'half-open').length,
      closedCircuitBreakers: allStats.filter(s => s.state === 'closed').length,
      totalCalls: allStats.reduce((sum, s) => sum + s.totalCalls, 0),
      totalFailures: allStats.reduce((sum, s) => sum + s.failureCount, 0),
      averageErrorRate: allStats.length > 0 
        ? allStats.reduce((sum, s) => sum + s.errorRate, 0) / allStats.length 
        : 0,
      unhealthyCircuitBreakers: allStats.filter(s => s.state === 'open').map(s => s.name),
      lastUpdated: new Date()
    };
  }

  // Bulk operations
  openAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.open();
    }
  }

  closeAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.close();
    }
  }

  resetAll(): void {
    for (const cb of this.circuitBreakers.values()) {
      cb.close(); // This also resets
    }
  }

  // Health check for all circuit breakers
  getHealthStatus(): any {
    const stats = this.getAllStats();
    const unhealthy = stats.filter(s => !this.isCircuitBreakerHealthy(s));
    
    return {
      healthy: unhealthy.length === 0,
      totalCircuitBreakers: stats.length,
      unhealthyCount: unhealthy.length,
      unhealthyCircuitBreakers: unhealthy.map(s => ({
        name: s.name,
        state: s.state,
        errorRate: s.errorRate,
        lastFailureTime: s.lastFailureTime
      })),
      summary: {
        open: stats.filter(s => s.state === 'open').length,
        halfOpen: stats.filter(s => s.state === 'half-open').length,
        closed: stats.filter(s => s.state === 'closed').length
      }
    };
  }

  private isCircuitBreakerHealthy(stats: CircuitBreakerStats): boolean {
    // Consider a circuit breaker unhealthy if:
    // 1. It's open
    // 2. It has a high error rate (>50%) with recent activity
    return stats.state !== 'open' && 
           (stats.errorRate < 50 || stats.totalCalls < 10);
  }
}

// Predefined circuit breakers for common services
export class ServiceCircuitBreakers {
  private manager: CircuitBreakerManager;

  constructor() {
    this.manager = new CircuitBreakerManager();
    this.setupDefaultCircuitBreakers();
  }

  private setupDefaultCircuitBreakers(): void {
    // Database circuit breaker
    this.manager.create('database', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000, // 30 seconds
      resetTimeout: 120000, // 2 minutes
      volumeThreshold: 5,
      errorFilter: (error) => {
        // Don't count validation errors as circuit breaker failures
        return !error.message.includes('validation') && 
               !error.message.includes('unique constraint');
      }
    });

    // External API circuit breaker
    this.manager.create('external_api', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
      volumeThreshold: 10,
      errorFilter: (error) => {
        // Count 5xx errors but not 4xx errors
        const statusCode = (error as any).statusCode || (error as any).status;
        return !statusCode || statusCode >= 500;
      }
    });

    // Email service circuit breaker
    this.manager.create('email_service', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 120000, // 2 minutes
      resetTimeout: 600000, // 10 minutes
      volumeThreshold: 5
    });

    // File upload circuit breaker
    this.manager.create('file_upload', {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 45000, // 45 seconds
      resetTimeout: 180000, // 3 minutes
      volumeThreshold: 8
    });

    // PDF generation circuit breaker
    this.manager.create('pdf_generation', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
      volumeThreshold: 5
    });
  }

  getManager(): CircuitBreakerManager {
    return this.manager;
  }

  // Convenience methods for common operations
  async executeWithDatabase<T>(operation: () => Promise<T>): Promise<T> {
    const cb = this.manager.get('database')!;
    return cb.execute(operation);
  }

  async executeWithExternalAPI<T>(operation: () => Promise<T>): Promise<T> {
    const cb = this.manager.get('external_api')!;
    return cb.execute(operation);
  }

  async executeWithEmailService<T>(operation: () => Promise<T>): Promise<T> {
    const cb = this.manager.get('email_service')!;
    return cb.execute(operation);
  }

  async executeWithFileUpload<T>(operation: () => Promise<T>): Promise<T> {
    const cb = this.manager.get('file_upload')!;
    return cb.execute(operation);
  }

  async executeWithPDFGeneration<T>(operation: () => Promise<T>): Promise<T> {
    const cb = this.manager.get('pdf_generation')!;
    return cb.execute(operation);
  }
}

// Global circuit breaker manager instance
export const circuitBreakers = new ServiceCircuitBreakers();

// Express middleware for circuit breaker monitoring
export function circuitBreakerMiddleware() {
  return (req: any, res: any, next: any) => {
    // Add circuit breaker status to response headers for monitoring
    const globalStats = circuitBreakers.getManager().getGlobalStats();
    res.setHeader('X-Circuit-Breaker-Status', globalStats.openCircuitBreakers > 0 ? 'degraded' : 'healthy');
    res.setHeader('X-Circuit-Breaker-Open', globalStats.openCircuitBreakers.toString());
    
    next();
  };
}

export { CircuitBreaker, CircuitBreakerManager };