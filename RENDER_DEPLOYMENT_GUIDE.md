# ONYX Render.com Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables to Set in Render Dashboard

#### Backend Service Environment Variables:
```bash
# Database (from Render PostgreSQL)
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?ssl=true

# JWT Secrets (use the secure values generated)
JWT_SECRET=LQcIb5ut1ehZ9RCSy4SzRRglMVpF/ge2ilbgOsWJV2efLZCTT8/R886Myq94XwjkfjEmOMwiZBn4UDKwsp2fpQ==
JWT_REFRESH_SECRET=hAffhkKws0s1R1L7cmXI2lBTN+5+lDND6i+DfNOaeo97xWo0ZJ87rwpDhz4GW2Kf14kadd8SZqzd8zU75jCH8g==

# Frontend URL (your Render static site URL)
CLIENT_URL=https://onyx-frontend.onrender.com

# Cloudinary (from your Cloudinary dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (optional - from Mailgun)
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_domain.com
```

#### Frontend Environment Variables:
```bash
# Backend API URL
VITE_API_URL=https://onyx-backend.onrender.com/api
```

### 2. Database Setup

1. **Create PostgreSQL Database in Render**:
   - Go to Dashboard → New → PostgreSQL
   - Choose "Starter" plan for testing or "Standard" for production
   - Name: `onyx-db`
   - Wait for provisioning

2. **Run Database Migrations**:
   ```sql
   -- Connect to database using Render's PSQL command
   -- Run the SQL files in order:
   -- 1. backend/add-organizations.sql
   -- 2. backend/add-assessment-columns.sql
   -- 3. backend/add-assessment-deficiencies-table.sql
   -- 4. backend/add-reports-table.sql
   -- 5. backend/add-pre-assessments-table.sql
   ```

### 3. Deployment Steps

#### Option A: Using render.yaml (Recommended)

1. **Commit render.yaml**:
   ```bash
   git add render.yaml
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Create New Blueprint in Render**:
   - Go to Dashboard → Blueprints → New Blueprint Instance
   - Connect your GitHub repo
   - Select the branch (main)
   - Render will detect render.yaml automatically

#### Option B: Manual Setup

1. **Backend Service**:
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add all environment variables

2. **Frontend Static Site**:
   - New → Static Site
   - Connect GitHub repo
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add VITE_API_URL environment variable

### 4. Post-Deployment Verification

#### Security Checks:
- [ ] Verify HTTPS is enforced (automatic on Render)
- [ ] Test rate limiting on login endpoint (10 attempts should trigger limit)
- [ ] Check security headers using: https://securityheaders.com
- [ ] Verify JWT secrets are not exposed in logs

#### Functionality Tests:
- [ ] Health check endpoint: https://onyx-backend.onrender.com/api/health
- [ ] Login with test credentials: admin@onyx.com / password123
- [ ] Create a test building
- [ ] Start and complete a test assessment
- [ ] Generate a test report

### 5. Production Optimizations

#### Backend:
```javascript
// Add to backend/src/server.ts for production
if (process.env.NODE_ENV === 'production') {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // Additional production security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
}
```

#### Database Connection Pool:
```javascript
// Update backend/src/config/database.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 6. Monitoring & Alerts

1. **Enable Render Notifications**:
   - Settings → Notifications
   - Enable deployment and health check alerts

2. **Set Up Health Checks**:
   - Already configured in render.yaml
   - Monitors `/api/health` endpoint

3. **View Logs**:
   - Dashboard → Service → Logs
   - Monitor for errors and security warnings

### 7. Scaling Considerations

#### When to Scale:
- Response times > 1 second consistently
- Memory usage > 80%
- CPU usage > 70%
- Database connections maxed out

#### Scaling Options:
1. **Vertical Scaling**: Upgrade to higher Render plan
2. **Database Scaling**: Move to Standard PostgreSQL plan
3. **Caching**: Implement Redis for session management
4. **CDN**: Use Cloudflare for static assets

### 8. Backup & Recovery

1. **Database Backups**:
   - Render performs daily backups automatically
   - Test restore procedure monthly

2. **Application Backups**:
   - Code in GitHub (already done)
   - Environment variables documented
   - Keep local .env backup secure

### 9. Security Maintenance

#### Weekly:
- Check Render dashboard for security alerts
- Review application logs for suspicious activity
- Monitor rate limiting effectiveness

#### Monthly:
- Update dependencies: `npm update && npm audit fix`
- Review and rotate API keys if needed
- Check for new security best practices

### 10. Troubleshooting

#### Common Issues:

1. **"Database connection failed"**:
   - Check DATABASE_URL format
   - Ensure SSL is enabled for production
   - Verify database is running

2. **"CORS error"**:
   - Verify CLIENT_URL is set correctly
   - Check frontend VITE_API_URL

3. **"Build failed"**:
   - Check build logs for missing dependencies
   - Ensure TypeScript builds locally first
   - Verify Node version compatibility

4. **"Rate limit not working"**:
   - Ensure `trust proxy` is set in production
   - Check that rate limiter is before routes

## 🎉 Launch Checklist

- [ ] All environment variables set
- [ ] Database migrated and seeded
- [ ] Health check passing
- [ ] Login working
- [ ] Rate limiting verified
- [ ] Security headers confirmed
- [ ] Monitoring enabled
- [ ] Backup plan documented
- [ ] Team notified

## 🚨 Emergency Contacts

- Render Support: https://render.com/support
- GitHub Issues: https://github.com/getmobilehq/onyxx/issues
- Security Issues: [Create private security advisory in GitHub]

---

**Remember**: Never commit sensitive environment variables to the repository. Always use Render's environment variable management for secrets.