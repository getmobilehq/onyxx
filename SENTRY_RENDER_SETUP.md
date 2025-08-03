# 🔍 Sentry Setup Instructions for Render.com

## Backend Environment Variables

Go to your Render.com backend service dashboard and add these environment variables:

### Required Sentry Variables:
```bash
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### Optional Sentry Variables:
```bash
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

## Frontend Build Environment Variables

For your frontend service on Render (or in your deployment settings):

```bash
VITE_SENTRY_DSN=https://3f906158648fa9f2d655c0e6f9628ce7@o4509779983269888.ingest.us.sentry.io/4509782570434560
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
```

## Steps:

1. **Create Backend Sentry Project**:
   - Go to Sentry.io
   - Create new project: "Node.js" 
   - Copy the DSN for backend

2. **Create Frontend Sentry Project**:
   - Create another project: "React"
   - The DSN provided above is already configured

3. **Add Variables to Render**:
   - Backend: Dashboard → Environment → Add variables above
   - Frontend: Dashboard → Environment → Add VITE_ variables above

4. **Deploy**:
   - Both services will restart and activate Sentry monitoring

Your Sentry integration is now ready to go live!