import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import database
import pool from './config/database';

// Import routes
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
import mailgunEmailService from './services/mailgun-email.service';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';
import { securityMiddleware } from './middleware/security.middleware';
import { corsOptions, authLimiter, apiLimiter, securityHeaders } from './config/security';

// Create Express app
const app: Application = express();

// Trust proxy in production (required for Render.com)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'onyx'}`);
    release();
  }
});

// Rate limiters are now imported from config/security.ts

// Middleware
app.use(helmet(securityHeaders)); // Enhanced security headers
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply security middleware to all API routes
app.use('/api', securityMiddleware);

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// API Routes with specific rate limiting for auth
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/elements', elementsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/pre-assessments', preAssessmentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Onyx Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});