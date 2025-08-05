import * as Sentry from "@sentry/react";

export function initSentry() {
  // Only initialize if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('⚠️ VITE_SENTRY_DSN not configured - Sentry monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_SENTRY_RELEASE || '1.0.0',
    
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from requests
      if (event.request) {
        // Remove cookies and sensitive headers
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
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
      // Filter out development/health check transactions
      if (event.transaction === 'GET /health') {
        return null;
      }
      
      return event;
    },

    // Tag all events with additional context
    initialScope: {
      tags: {
        component: 'frontend',
        service: 'onyx-web',
      },
    },
  });

  console.log('🔍 Sentry monitoring initialized for frontend');
  console.log(`📊 Environment: ${import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development'}`);
  console.log(`🏷️ Release: ${import.meta.env.VITE_SENTRY_RELEASE || '1.0.0'}`);
}

// Frontend-specific tracking functions
export function trackUserAction(action: string, category: string, metadata?: any) {
  Sentry.addBreadcrumb({
    message: `User Action: ${action}`,
    category,
    level: 'info',
    data: {
      action,
      metadata,
      timestamp: new Date().toISOString(),
    },
  });
}

export function trackPageView(pageName: string, route: string) {
  Sentry.addBreadcrumb({
    message: `Page View: ${pageName}`,
    category: 'navigation',
    level: 'info',
    data: {
      page_name: pageName,
      route,
    },
  });
}

export function trackAPICall(
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  error?: Error
) {
  const level = error ? 'error' : statusCode >= 400 ? 'warning' : 'info';
  
  Sentry.addBreadcrumb({
    message: `API Call: ${method} ${endpoint}`,
    category: 'http',
    level,
    data: {
      method,
      endpoint,
      status_code: statusCode,
      duration_ms: duration,
    },
  });

  if (error || statusCode >= 400) {
    Sentry.captureException(error || new Error(`API Error: ${statusCode}`), {
      tags: {
        api_error: 'frontend',
        method,
        endpoint,
        status_code: statusCode.toString(),
      },
      extra: {
        duration_ms: duration,
      },
    });
  }
}

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

export function clearUserContext() {
  Sentry.setUser(null);
}

export function captureFormError(formName: string, error: Error, formData?: any) {
  Sentry.captureException(error, {
    tags: {
      form_error: 'validation',
      form_name: formName,
    },
    extra: {
      form_data: formData ? Object.keys(formData) : undefined, // Only field names, not values
    },
  });
}

export default Sentry;