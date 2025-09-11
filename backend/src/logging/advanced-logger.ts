import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream, WriteStream } from 'fs';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  stackTrace?: string;
  correlationId?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableStructured: boolean;
  enableCorrelation: boolean;
  rotateFiles: boolean;
  maxFileSize: number; // bytes
  maxFiles: number;
  logDirectory: string;
  sensitiveFields: string[];
  enableSampling: boolean;
  samplingRate: number; // 0-1
}

export interface LogQuery {
  level?: LogLevel;
  category?: string;
  userId?: string;
  requestId?: string;
  startTime?: Date;
  endTime?: Date;
  contains?: string;
  limit?: number;
  offset?: number;
}

class AdvancedLogger {
  private config: LogConfig;
  private logStreams: Map<string, WriteStream> = new Map();
  private logBuffer: LogEntry[] = [];
  private correlationMap: Map<string, string> = new Map();
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: true,
      enableStructured: true,
      enableCorrelation: true,
      rotateFiles: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      logDirectory: path.join(process.cwd(), 'logs'),
      sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
      enableSampling: false,
      samplingRate: 0.1,
      ...config
    };

    this.initializeLogging();
  }

  private initializeLogging(): void {
    // Create log directory
    if (this.config.enableFile && !fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
    }

    // Initialize log streams
    if (this.config.enableFile) {
      this.createLogStreams();
    }

    // Setup log rotation
    if (this.config.rotateFiles) {
      setInterval(() => {
        this.rotateLogsIfNeeded();
      }, 60000); // Check every minute
    }

    // Setup buffer flush
    setInterval(() => {
      this.flushLogBuffer();
    }, 5000); // Flush every 5 seconds
  }

  private createLogStreams(): void {
    const levels: LogLevel[] = ['info', 'warn', 'error', 'fatal'];
    
    for (const level of levels) {
      const fileName = `${level}.log`;
      const filePath = path.join(this.config.logDirectory, fileName);
      const stream = createWriteStream(filePath, { flags: 'a' });
      this.logStreams.set(level, stream);
    }

    // Create combined log stream
    const combinedPath = path.join(this.config.logDirectory, 'combined.log');
    const combinedStream = createWriteStream(combinedPath, { flags: 'a' });
    this.logStreams.set('combined', combinedStream);
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.config.sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeData(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(): boolean {
    if (!this.config.enableSampling) return true;
    return Math.random() < this.config.samplingRate;
  }

  log(level: LogLevel, category: string, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level) || !this.shouldSample()) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      metadata: metadata ? this.sanitizeData(metadata) : undefined,
      correlationId: this.getCurrentCorrelationId()
    };

    this.addToBuffer(entry);
    
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
  }

  debug(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('debug', category, message, metadata);
  }

  info(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('info', category, message, metadata);
  }

  warn(category: string, message: string, metadata?: Record<string, any>): void {
    this.log('warn', category, message, metadata);
  }

  error(category: string, message: string, error?: Error, metadata?: Record<string, any>): void {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack
      })
    };

    this.log('error', category, message, errorMetadata);
  }

  fatal(category: string, message: string, error?: Error, metadata?: Record<string, any>): void {
    const errorMetadata = {
      ...metadata,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack
      })
    };

    this.log('fatal', category, message, errorMetadata);
  }

  // Specialized logging methods
  logRequest(req: any, res: any, duration?: number): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      category: 'http_request',
      message: `${req.method} ${req.url}`,
      userId: req.user?.id,
      requestId: req.id || req.headers['x-request-id'],
      sessionId: req.sessionID,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.url,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      metadata: {
        headers: this.sanitizeData(req.headers),
        query: req.query,
        body: this.sanitizeData(req.body)
      },
      correlationId: this.getCurrentCorrelationId()
    };

    this.addToBuffer(entry);
  }

  logDatabaseQuery(query: string, duration?: number, error?: Error, metadata?: Record<string, any>): void {
    this.log(
      error ? 'error' : 'debug',
      'database',
      `Query executed: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
      {
        query,
        duration,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined,
        ...metadata
      }
    );
  }

  logSecurity(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.log('warn', 'security', event, {
      userId,
      ...metadata
    });
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const level: LogLevel = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    
    this.log(level, 'performance', `${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...metadata
    });
  }

  logBusinessEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.log('info', 'business', event, {
      userId,
      ...metadata
    });
  }

  // Correlation management
  setCorrelation(correlationId: string, context: string): void {
    if (this.config.enableCorrelation) {
      this.correlationMap.set(context, correlationId);
    }
  }

  getCorrelation(context: string): string | undefined {
    return this.correlationMap.get(context);
  }

  private getCurrentCorrelationId(): string | undefined {
    if (!this.config.enableCorrelation) return undefined;
    
    // Try to get from async context or generate new one
    const asyncContext = process.env.ASYNC_CONTEXT || 'default';
    return this.correlationMap.get(asyncContext) || this.generateCorrelationId();
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Immediate flush for high-priority logs
    if (entry.level === 'fatal' || entry.level === 'error') {
      this.flushLogBuffer();
    }
  }

  private flushLogBuffer(): void {
    if (this.logBuffer.length === 0) return;

    const entries = [...this.logBuffer];
    this.logBuffer = [];

    if (this.config.enableFile) {
      this.writeToFiles(entries);
    }
  }

  private writeToFiles(entries: LogEntry[]): void {
    for (const entry of entries) {
      const logLine = this.formatLogEntry(entry);
      
      // Write to level-specific file
      const levelStream = this.logStreams.get(entry.level);
      if (levelStream) {
        levelStream.write(logLine + '\n');
      }

      // Write to combined log
      const combinedStream = this.logStreams.get('combined');
      if (combinedStream) {
        combinedStream.write(logLine + '\n');
      }
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.enableStructured) {
      return JSON.stringify(entry);
    } else {
      const timestamp = entry.timestamp.toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const category = entry.category.padEnd(15);
      const correlation = entry.correlationId ? `[${entry.correlationId}] ` : '';
      
      let line = `${timestamp} ${level} ${category} ${correlation}${entry.message}`;
      
      if (entry.metadata) {
        line += ` | ${JSON.stringify(entry.metadata)}`;
      }
      
      return line;
    }
  }

  private logToConsole(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted);
        break;
    }
  }

  private rotateLogsIfNeeded(): void {
    for (const [streamName, stream] of this.logStreams.entries()) {
      if (streamName === 'combined') continue;
      
      const filePath = path.join(this.config.logDirectory, `${streamName}.log`);
      
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > this.config.maxFileSize) {
          this.rotateLog(streamName, filePath);
        }
      } catch (error) {
        // File doesn't exist or other error, continue
      }
    }
  }

  private rotateLog(streamName: string, filePath: string): void {
    const stream = this.logStreams.get(streamName);
    if (stream) {
      stream.end();
    }

    // Rotate existing files
    for (let i = this.config.maxFiles - 1; i > 0; i--) {
      const oldFile = `${filePath}.${i}`;
      const newFile = `${filePath}.${i + 1}`;
      
      if (fs.existsSync(oldFile)) {
        if (i === this.config.maxFiles - 1) {
          fs.unlinkSync(oldFile); // Delete oldest file
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Move current file to .1
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, `${filePath}.1`);
    }

    // Create new stream
    const newStream = createWriteStream(filePath, { flags: 'a' });
    this.logStreams.set(streamName, newStream);
  }

  // Query and analysis methods
  async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    // This is a simplified implementation
    // In production, you'd use a proper log storage solution like ELK stack
    
    const combinedLogPath = path.join(this.config.logDirectory, 'combined.log');
    if (!fs.existsSync(combinedLogPath)) {
      return [];
    }

    const logContent = fs.readFileSync(combinedLogPath, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    let entries: LogEntry[] = [];
    
    for (const line of lines) {
      try {
        const entry: LogEntry = JSON.parse(line);
        
        // Apply filters
        if (query.level && entry.level !== query.level) continue;
        if (query.category && entry.category !== query.category) continue;
        if (query.userId && entry.userId !== query.userId) continue;
        if (query.requestId && entry.requestId !== query.requestId) continue;
        if (query.startTime && entry.timestamp < query.startTime) continue;
        if (query.endTime && entry.timestamp > query.endTime) continue;
        if (query.contains && !entry.message.includes(query.contains)) continue;
        
        entries.push(entry);
      } catch (error) {
        // Skip invalid JSON lines
      }
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return entries.slice(offset, offset + limit);
  }

  async getLogStats(hours: number = 24): Promise<any> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
    
    const logs = await this.queryLogs({ startTime, endTime, limit: 10000 });
    
    const stats = {
      total: logs.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      errorRate: 0,
      topErrors: [] as Array<{ message: string; count: number }>,
      timeline: [] as Array<{ time: string; count: number }>
    };

    const errorMessages: Record<string, number> = {};
    const hourlyBuckets: Record<string, number> = {};

    for (const log of logs) {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count by category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      // Track error messages
      if (log.level === 'error' || log.level === 'fatal') {
        errorMessages[log.message] = (errorMessages[log.message] || 0) + 1;
      }
      
      // Timeline buckets (hourly)
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00:00Z';
      hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
    }

    // Calculate error rate
    const errorCount = (stats.byLevel.error || 0) + (stats.byLevel.fatal || 0);
    stats.errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0;

    // Top errors
    stats.topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    // Timeline
    stats.timeline = Object.entries(hourlyBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, count]) => ({ time, count }));

    return stats;
  }

  // Cleanup and shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down logger...');
    
    // Flush remaining logs
    this.flushLogBuffer();
    
    // Close all streams
    for (const stream of this.logStreams.values()) {
      stream.end();
    }
    
    // Clear maps
    this.correlationMap.clear();
    this.logStreams.clear();
    
    console.log('Logger shutdown complete');
  }
}

// Create global logger instance
export const logger = new AdvancedLogger({
  level: process.env.LOG_LEVEL as LogLevel || 'info',
  enableStructured: process.env.NODE_ENV === 'production',
  logDirectory: process.env.LOG_DIRECTORY || path.join(process.cwd(), 'logs')
});

// Express middleware for request logging
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Generate request ID if not present
    if (!req.id && !req.headers['x-request-id']) {
      req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set correlation context
    const correlationId = req.headers['x-correlation-id'] || logger.generateCorrelationId();
    logger.setCorrelation('request', correlationId);

    // Log request start
    logger.debug('http', `Request started: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      logger.logRequest(req, res, duration);
      
      originalEnd.apply(res, args);
    };

    next();
  };
}

export { AdvancedLogger };