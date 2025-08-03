import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { Application } from "express";

export function initSentry(app: Application) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️ SENTRY_DSN not configured - Sentry monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || '1.0.0',
    
    integrations: [
      // Express integration for request tracking
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      
      // Performance profiling
      nodeProfilingIntegration(),
      
      // Additional integrations
      Sentry.onUncaughtExceptionIntegration({
        exitEvenIfOtherHandlersAreRegistered: false,
      }),
      Sentry.onUnhandledRejectionIntegration({
        mode: 'warn',
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from requests
      if (event.request) {
        // Remove cookies
        delete event.request.cookies;
        
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers['x-api-key'];
          delete event.request.headers.cookie;
        }
        
        // Remove sensitive data from request body
        if (event.request?.data && typeof event.request.data === 'object') {
          const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
          sensitiveFields.forEach(field => {
            if (event.request?.data && typeof event.request.data === 'object' && field in event.request.data) {
              (event.request.data as any)[field] = '[Filtered]';
            }
          });
        }
      }
      
      // Remove sensitive data from extra context
      if (event.extra) {
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'jwt'];
        sensitiveKeys.forEach(key => {
          if (event.extra && key in event.extra) {
            event.extra[key] = '[Filtered]';
          }
        });
      }
      
      return event;
    },
    
    // Custom error filtering
    beforeSendTransaction(event) {
      // Filter out health check requests
      if (event.transaction === 'GET /api/health') {
        return null;
      }
      
      // Filter out static asset requests
      if (event.transaction && event.transaction.includes('/static/')) {
        return null;
      }
      
      return event;
    },
    
    // Tag all events with additional context
    initialScope: {
      tags: {
        component: 'backend',
        service: 'onyx-api',
      },
    },
  });

  console.log('🔍 Sentry monitoring initialized for backend');
  console.log(`📊 Environment: ${process.env.SENTRY_ENVIRONMENT || 'development'}`);
  console.log(`🏷️ Release: ${process.env.SENTRY_RELEASE || '1.0.0'}`);
}

// Security event tracking
export function trackSecurityEvent(
  eventType: string,
  userId: string | null,
  ipAddress: string,
  details: any
) {
  Sentry.addBreadcrumb({
    message: `Security Event: ${eventType}`,
    category: 'security',
    level: 'warning',
    data: {
      eventType,
      userId: userId || 'anonymous',
      ipAddress,
      timestamp: new Date().toISOString(),
    },
  });

  // For critical security events, capture as exceptions
  const criticalEvents = [
    'SECURITY_BREACH',
    'MULTIPLE_FAILED_LOGINS',
    'SQL_INJECTION_ATTEMPT',
    'XSS_ATTEMPT',
    'UNAUTHORIZED_ACCESS'
  ];

  if (criticalEvents.includes(eventType)) {
    Sentry.captureException(new Error(`Critical Security Event: ${eventType}`), {
      tags: {
        event_type: eventType,
        severity: 'critical',
        user_id: userId || 'anonymous',
        ip_address: ipAddress,
      },
      extra: details,
      level: 'error',
    });
  }
}

// Performance tracking
export function trackPerformance(operation: string, duration: number, metadata?: any) {
  Sentry.addBreadcrumb({
    message: `Performance: ${operation}`,
    category: 'performance', 
    level: 'info',
    data: {
      operation,
      duration_ms: duration,
      metadata,
    },
  });

  // Capture slow operations as performance issues
  if (duration > 5000) { // 5+ seconds
    Sentry.captureMessage(`Slow Operation: ${operation}`, {
      level: 'warning',
      tags: {
        operation,
        performance_issue: 'slow_operation',
      },
      extra: {
        duration_ms: duration,
        metadata,
      },
    });
  }
}

// Database query tracking
export function trackDatabaseQuery(query: string, duration: number, error?: Error) {
  const breadcrumb = {
    message: 'Database Query',
    category: 'query',
    level: error ? 'error' : 'info',
    data: {
      query: query.substring(0, 200), // Truncate long queries
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    },
  };

  Sentry.addBreadcrumb(breadcrumb as any);

  if (error) {
    Sentry.captureException(error, {
      tags: {
        query_error: 'database',
        query_type: query.toLowerCase().split(' ')[0], // SELECT, INSERT, etc.
      },
      extra: {
        query: query.substring(0, 500),
        duration_ms: duration,
      },
    });
  }
}

// User context tracking
export function setUserContext(user: {
  id: string;
  email: string;
  role: string;
  organization_id?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
    organization_id: user.organization_id,
  });
}

// Clear user context (on logout)
export function clearUserContext() {
  Sentry.setUser(null);
}

// Custom error capture with context
export function captureErrorWithContext(
  error: Error,
  context: {
    operation?: string;
    userId?: string;
    additionalData?: any;
  }
) {
  Sentry.captureException(error, {
    tags: {
      operation: context.operation || 'unknown',
      user_id: context.userId || 'anonymous',
    },
    extra: context.additionalData || {},
  });
}

// Email tracking
export function trackEmailEvent(
  eventType: 'sent' | 'failed' | 'bounced' | 'opened',
  recipient: string,
  templateId: string,
  error?: Error
) {
  Sentry.addBreadcrumb({
    message: `Email ${eventType}`,
    category: 'email',
    level: error ? 'error' : 'info',
    data: {
      event_type: eventType,
      recipient: recipient.includes('@') ? recipient.split('@')[1] : 'unknown', // Only domain for privacy
      template_id: templateId,
      timestamp: new Date().toISOString(),
    },
  });

  if (error) {
    Sentry.captureException(error, {
      tags: {
        email_error: eventType,
        template_id: templateId,
      },
    });
  }
}

// API endpoint monitoring
export function trackAPIEndpoint(
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  userId?: string
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info';
  
  Sentry.addBreadcrumb({
    message: `API: ${method} ${endpoint}`,
    category: 'http',
    level,
    data: {
      method,
      endpoint,
      status_code: statusCode,
      duration_ms: duration,
      user_id: userId || 'anonymous',
    },
  });

  // Capture 5xx errors
  if (statusCode >= 500) {
    Sentry.captureMessage(`Server Error: ${method} ${endpoint}`, {
      level: 'error',
      tags: {
        http_status: statusCode.toString(),
        method,
        endpoint,
      },
      extra: {
        duration_ms: duration,
        user_id: userId,
      },
    });
  }
}

export default Sentry;