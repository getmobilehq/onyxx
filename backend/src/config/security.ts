import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Enhanced rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Reduced from 10 to 5 attempts
  message: { 
    success: false, 
    message: 'Too many login attempts, please try again later' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req: Request) => {
    // Use IP + user agent for better fingerprinting
    return req.ip + ':' + req.get('user-agent');
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Reduced from 1000 to 100 requests per window
  message: { 
    success: false, 
    message: 'Too many API requests, please try again later' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for sensitive operations
  message: { 
    success: false, 
    message: 'Rate limit exceeded for this operation' 
  },
});

// Security headers configuration
export const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Will tighten this later
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://onyx-backend-f7vh.onrender.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny' as const,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin' as const,
  },
  permittedCrossDomainPolicies: false,
};

// Allowed origins for CORS
export const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'https://onyx-frontend.onrender.com',
  'https://onyxreport.com',
  'https://www.onyxreport.com',
];

// Log CORS configuration on startup
console.log(`🔧 CORS Configuration:`);
console.log(`📝 CLIENT_URL from env: ${process.env.CLIENT_URL}`);
console.log(`📝 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📝 All allowed origins:`, allowedOrigins);

// Remove HTTP versions in production
if (process.env.NODE_ENV === 'production') {
  // Only allow HTTPS in production
  const httpsOnlyOrigins = allowedOrigins.filter(origin => 
    origin.startsWith('https://') || origin.startsWith('http://localhost')
  );
  allowedOrigins.length = 0;
  allowedOrigins.push(...httpsOnlyOrigins);
}

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    console.log(`🔍 CORS check for origin: ${origin}`);
    console.log(`📝 Allowed origins:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.error(`❌ CORS blocked origin: ${origin}`);
      console.error(`📋 Available origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
};

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const,
  },
};

// Password requirements
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Validate password against policy
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (passwordPolicy.requireSpecialChars && 
      !new RegExp(`[${passwordPolicy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Input sanitization rules
export const sanitizationRules = {
  // Remove any HTML tags
  stripHtml: (input: string): string => {
    return input.replace(/<[^>]*>/g, '');
  },
  
  // Escape special characters for SQL
  escapeSql: (input: string): string => {
    return input.replace(/['";\\]/g, '\\$&');
  },
  
  // Validate and sanitize email
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },
  
  // Validate UUID format
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },
};

// Security event logging
export const logSecurityEvent = (
  eventType: string,
  userId: string | null,
  ip: string,
  details: any
) => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${eventType}`, {
    userId,
    ip,
    details,
  });
  
  // In production, this would send to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with security monitoring service (e.g., Datadog, Sentry)
  }
};