# 🔍 Sentry Monitoring Setup Guide for ONYX Platform

**Domain**: onyxreport.com  
**Monitoring Level**: Enterprise Grade  
**Last Updated**: December 2024  

---

## 🚀 Quick Setup Steps

### Step 1: Create Sentry Organization
1. **Login to Sentry**: https://sentry.io
2. **Create Organization**: Choose "ONYX Platform"
3. **Create Project**: Select "Node.js" for backend
4. **Create Project**: Select "React" for frontend
5. **Get DSN Keys**: Copy both backend and frontend DSN URLs

### Step 2: Configure Environment Variables
Add these to your Render.com backend service:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0

# Optional: Advanced Sentry Settings
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

### Step 3: Install Sentry Dependencies
Backend dependencies are already configured. For frontend:

```bash
npm install @sentry/react @sentry/tracing
```

---

## 🔧 Backend Integration (Already Complete)

The backend Sentry configuration is already implemented in `/backend/src/config/sentry.ts`. 

### Initialize Sentry in Server
Update `/backend/src/server.ts` to include Sentry:

```typescript
import { initSentry } from './config/sentry';

// Initialize Sentry (add this before other middleware)
initSentry(app);
```

### Security Event Tracking
The backend already includes comprehensive security tracking:

```typescript
import { trackSecurityEvent, trackPerformance, setUserContext } from './config/sentry';

// Track security events
trackSecurityEvent('FAILED_LOGIN', userId, req.ip, { 
  attempts: 3,
  endpoint: '/api/auth/login' 
});

// Track performance
trackPerformance('database_query', duration, { query: 'SELECT * FROM users' });

// Set user context
setUserContext({
  id: user.id,
  email: user.email,
  role: user.role,
  organization_id: user.organization_id
});
```

---

## 🎯 Frontend Integration

### Step 4: Create Frontend Sentry Configuration

Create `/src/config/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

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
      new BrowserTracing({
        // Set up automatic route change tracking
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          // You'll need to pass your router here if using React Router
        ),
      }),
      new Sentry.Replay({
        // Capture 10% of all sessions
        sessionSampleRate: 0.1,
        // Capture 100% of sessions with an error
        errorSampleRate: 1.0,
      }),
    ],

    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    
    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

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
```

### Step 5: Initialize Sentry in React App

Update `/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './config/sentry'

// Initialize Sentry before rendering
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 6: Add Environment Variables for Frontend

Create/update `.env.local`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
```

---

## 🛡️ Security Integration

### Step 7: Integrate with Authentication System

Update your auth context (`/src/context/auth-context.tsx`):

```typescript
import { setUserContext, clearUserContext, trackUserAction } from '@/config/sentry';

// In login success handler
const handleLoginSuccess = (user: User) => {
  setUserContext({
    id: user.id,
    email: user.email,
    role: user.role,
    organization_id: user.organization_id,
  });
  
  trackUserAction('login', 'authentication', {
    user_role: user.role,
    organization_id: user.organization_id,
  });
};

// In logout handler
const handleLogout = () => {
  trackUserAction('logout', 'authentication');
  clearUserContext();
};
```

### Step 8: Integrate with API Service

Update your API service (`/src/services/api.ts`):

```typescript
import { trackAPICall } from '@/config/sentry';

// Add to your API interceptor
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata?.startTime;
    trackAPICall(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      duration
    );
    return response;
  },
  (error) => {
    const duration = Date.now() - error.config?.metadata?.startTime;
    trackAPICall(
      error.config?.method?.toUpperCase() || 'GET',
      error.config?.url || '',
      error.response?.status || 0,
      duration,
      error
    );
    return Promise.reject(error);
  }
);
```

---

## 📊 Advanced Monitoring Configuration

### Step 9: Performance Monitoring

Add performance tracking to key components:

```typescript
import * as Sentry from "@sentry/react";

// Wrap components for performance monitoring
const PerformantComponent = Sentry.withProfiler(YourComponent);

// Manual performance tracking
function expensiveOperation() {
  const transaction = Sentry.startTransaction({
    name: "expensive-operation",
    op: "task",
  });
  
  // Set transaction on scope
  Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
  
  try {
    // Your expensive operation here
    
    transaction.setStatus("ok");
  } catch (error) {
    transaction.setStatus("internal_error");
    throw error;
  } finally {
    transaction.finish();
  }
}
```

### Step 10: Error Boundaries

Create a Sentry-enabled error boundary:

```typescript
import * as Sentry from "@sentry/react";

const SentryErrorBoundary = Sentry.withErrorBoundary(YourApp, {
  fallback: ({ error, resetError }) => (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <details>
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={resetError}>Try Again</button>
    </div>
  ),
  beforeCapture: (scope, error, info) => {
    scope.setTag("error_boundary", "main_app");
    scope.setContext("error_info", info);
  },
});
```

---

## 🔔 Alerts and Notifications Configuration

### Step 11: Configure Sentry Alerts

#### **Alert 1: High Error Rate**
```javascript
Condition: Number of events > 50 in 5 minutes
Actions:
- Email: security@onyxreport.com
- Slack: #security-alerts (if configured)
- Webhook: https://onyxreport.com/api/security/sentry-webhook
```

#### **Alert 2: Performance Degradation**
```javascript
Condition: p95 transaction duration > 5 seconds
Actions:
- Email: devops@onyxreport.com
- Dashboard notification
```

#### **Alert 3: Security Events**
```javascript
Condition: Tagged with severity:critical
Actions:
- Immediate email notification
- SMS alert (if configured)
- Slack #security-critical
```

### Step 12: Custom Dashboard Setup

Create custom Sentry dashboards:

1. **Security Dashboard**:
   - Failed login attempts
   - SQL injection attempts
   - XSS attempts
   - Unauthorized access attempts

2. **Performance Dashboard**:
   - API response times
   - Database query performance
   - Frontend page load times
   - Error rates by endpoint

3. **User Experience Dashboard**:
   - Session replays for errors
   - User flow analysis
   - Form submission errors
   - JavaScript errors

---

## 🧪 Testing Sentry Integration

### Step 13: Test Error Capture

Add test endpoints to verify Sentry is working:

#### Backend Test (Add to server.ts):
```typescript
app.get('/api/test-sentry', (req, res) => {
  throw new Error('Test Sentry error capture');
});

app.get('/api/test-sentry-performance', async (req, res) => {
  const startTime = Date.now();
  
  // Simulate slow operation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  trackPerformance('test_operation', Date.now() - startTime, {
    test: true,
    endpoint: '/api/test-sentry-performance'
  });
  
  res.json({ message: 'Performance test completed' });
});
```

#### Frontend Test:
```typescript
// Add test buttons in development mode
const testSentryError = () => {
  throw new Error('Test frontend Sentry error');
};

const testSentryPerformance = async () => {
  const startTime = Date.now();
  await fetch('/api/test-sentry-performance');
  trackAPICall('GET', '/api/test-sentry-performance', 200, Date.now() - startTime);
};
```

### Step 14: Verify Integration

1. **Check Sentry Dashboard**: Visit https://sentry.io/organizations/your-org/
2. **Test Error Capture**: Trigger test errors and verify they appear
3. **Test Performance**: Monitor API calls and page loads
4. **Test Alerts**: Verify notifications are sent
5. **Test Security Events**: Trigger security events and verify tracking

---

## 📈 Monitoring Best Practices

### Key Metrics to Monitor:

1. **Error Rates**:
   - Frontend JavaScript errors: < 0.1%
   - Backend API errors: < 1%
   - Database errors: < 0.01%

2. **Performance Metrics**:
   - API response time p95: < 500ms
   - Page load time p95: < 2 seconds
   - Database query time p95: < 100ms

3. **Security Metrics**:
   - Failed login attempts per hour
   - Blocked requests by WAF
   - Suspicious user agent patterns
   - Geographic access patterns

4. **User Experience**:
   - Session duration
   - Error-free sessions: > 99%
   - Form completion rates
   - Feature adoption rates

### Alert Thresholds:

- **Critical**: > 100 errors in 5 minutes
- **Warning**: > 50 errors in 10 minutes
- **Performance**: p95 response time > 2 seconds
- **Security**: > 10 security events in 1 minute

---

## 🔧 Maintenance Tasks

### Daily:
- [ ] Review error dashboard
- [ ] Check alert notifications
- [ ] Monitor performance trends

### Weekly:
- [ ] Analyze error patterns
- [ ] Review security events
- [ ] Update error handling

### Monthly:
- [ ] Performance optimization review
- [ ] Alert threshold adjustment
- [ ] Security incident analysis
- [ ] User experience metrics review

---

## 🚨 Integration with Cloudflare WAF

### Step 15: Combine WAF and Sentry Data

Create unified security monitoring by correlating:

1. **WAF Blocks** → **Sentry Security Events**
2. **Rate Limits** → **Performance Alerts**
3. **Geographic Blocks** → **Access Pattern Analysis**

### Webhook Integration:
```typescript
// In /backend/src/routes/security.routes.ts
app.post('/api/security/cloudflare-webhook', async (req, res) => {
  const { event_type, ip, rule_name, severity } = req.body;
  
  // Track in Sentry
  trackSecurityEvent(event_type, null, ip, {
    source: 'cloudflare_waf',
    rule_name,
    severity,
    raw_data: req.body
  });
  
  res.json({ status: 'received' });
});
```

---

## 📞 Support and Resources

### Sentry Resources:
- **Documentation**: https://docs.sentry.io
- **Community**: https://discord.gg/sentry
- **Status**: https://status.sentry.io
- **Best Practices**: https://docs.sentry.io/product/best-practices/

### ONYX Monitoring:
- **Dashboard**: https://sentry.io/organizations/onyx-platform/
- **Frontend Project**: onyx-web
- **Backend Project**: onyx-api
- **Alert Email**: security@onyxreport.com

---

**Sentry Setup Status**: Ready for activation  
**Monitoring Level**: Enterprise Grade  
**Expected Setup Time**: 45-60 minutes  

*Complete these configurations to activate comprehensive error tracking and performance monitoring for ONYX Platform!*