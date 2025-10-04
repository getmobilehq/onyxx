import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { initSentry } from './config/sentry';
import pool from './config/database';
import { securityMiddleware } from './middleware/security.middleware';
import { corsOptions, authLimiter, apiLimiter, securityHeaders } from './config/security';
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
app.use(cors(corsOptions));

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

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    res.header('Access-Control-Max-Age', '86400');
    console.log(`🔧 Manual CORS headers set for origin: ${origin}`);
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
    timestamp: new Date().toISOString()
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
