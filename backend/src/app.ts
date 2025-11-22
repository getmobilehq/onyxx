import express, { Application } from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { initSentry } from './config/sentry';
import pool from './config/database';
import { securityMiddleware } from './middleware/security.middleware';
import { authLimiter, apiLimiter, securityHeaders } from './config/security';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import buildingsRoutes from './routes/buildings.routes';
import elementsRoutes from './routes/elements.routes';
import assessmentsRoutes from './routes/assessments.routes';
import preAssessmentsRoutes from './routes/pre-assessments.routes';
import reportsRoutes from './routes/reports';
import analyticsRoutes from './routes/analytics.routes';
import organizationsRoutes from './routes/organizations.routes';
import securityRoutes from './routes/security.routes';
import twoFactorRoutes from './routes/two-factor.routes';
import emailRoutes from './routes/email.routes';
import createTokensRouter from './routes/tokens.routes';
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';

const app: Application = express();

initSentry(app);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet(securityHeaders));

// CORS middleware - must be before other middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://onyxreport.com',
    'https://www.onyxreport.com',
    'https://manage.onyxreport.com',
    'https://onyx-backend-f7vh.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174'
  ];

  console.log(`🔍 Incoming request from origin: ${origin}, Method: ${req.method}, Path: ${req.path}`);

  // Always set CORS headers for allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Access-Control-Request-Method,Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');
    console.log(`✅ CORS headers set for allowed origin: ${origin}`);
  } else if (origin) {
    console.log(`❌ Origin not in allowed list: ${origin}`);
  } else {
    // No origin header (e.g., same-origin requests or Postman)
    console.log(`ℹ️ No origin header present`);
  }

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log(`✈️ Handling OPTIONS preflight request from: ${origin}`);
    return res.status(200).end();
  }

  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', securityMiddleware);
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/tokens', createTokensRouter(pool));
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/elements', elementsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/pre-assessments', preAssessmentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/email', emailRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Onyx Backend API is running',
    version: '1.0.2', // Updated to force deployment with auth fix
    timestamp: new Date().toISOString(),
    cors_enabled: true
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
