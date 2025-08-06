import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import { sanitizationRules, logSecurityEvent } from '../config/security';

// Extended Request type with security properties
interface SecureRequest extends Request {
  securityContext?: {
    requestId: string;
    timestamp: Date;
    fingerprint: string;
  };
}

// Generate request fingerprint for tracking
export const generateFingerprint = (req: Request): string => {
  const components = [
    req.ip || 'unknown',
    req.get('user-agent'),
    req.get('accept-language'),
    req.get('accept-encoding'),
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};

// Add security context to request
export const addSecurityContext = (
  req: SecureRequest,
  res: Response,
  next: NextFunction
) => {
  req.securityContext = {
    requestId: crypto.randomUUID(),
    timestamp: new Date(),
    fingerprint: generateFingerprint(req),
  };
  
  // Add request ID to response headers for tracking
  res.setHeader('X-Request-ID', req.securityContext.requestId);
  
  next();
};

// Input validation middleware
export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logSecurityEvent(
      'INVALID_INPUT',
      (req as any).user?.id || null,
      req.ip || 'unknown',
      { errors: errors.array(), path: req.path }
    );
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  
  next();
};

// SQL injection prevention
export const preventSQLInjection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/gi,
    /(--|\||;|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          if (checkObject(value)) return true;
        } else if (checkValue(value)) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Check all input sources
  const hasSQLInjection = 
    checkObject(req.body) || 
    checkObject(req.query) || 
    checkObject(req.params);
  
  if (hasSQLInjection) {
    logSecurityEvent(
      'SQL_INJECTION_ATTEMPT',
      (req as any).user?.id || null,
      req.ip || 'unknown',
      {
        body: req.body,
        query: req.query,
        params: req.params,
        path: req.path,
      }
    );
    
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
    });
  }
  
  next();
};

// XSS prevention
export const preventXSS = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi,
  ];
  
  const sanitizeValue = (value: any): any => {
    if (typeof value !== 'string') return value;
    
    let sanitized = value;
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // HTML entity encoding for special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  };
  
  const sanitizeObject = (obj: any): void => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        } else {
          obj[key] = sanitizeValue(value);
        }
      }
    }
  };
  
  // Sanitize all input sources
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  next();
};

// Check for suspicious user behavior
export const detectSuspiciousBehavior = (
  req: SecureRequest,
  res: Response,
  next: NextFunction
) => {
  const suspiciousIndicators = [];
  
  // Check for missing or suspicious headers
  if (!req.get('user-agent')) {
    suspiciousIndicators.push('Missing User-Agent');
  }
  
  if (!req.get('accept-language')) {
    suspiciousIndicators.push('Missing Accept-Language');
  }
  
  // Check for automated tools
  const userAgent = req.get('user-agent')?.toLowerCase() || '';
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python'];
  
  if (botPatterns.some(pattern => userAgent.includes(pattern))) {
    suspiciousIndicators.push('Potential bot detected');
  }
  
  // Check for rapid requests (requires session or redis)
  // This is a placeholder - implement with Redis for production
  
  if (suspiciousIndicators.length > 0) {
    logSecurityEvent(
      'SUSPICIOUS_BEHAVIOR',
      (req as any).user?.id || null,
      req.ip || 'unknown',
      {
        indicators: suspiciousIndicators,
        fingerprint: req.securityContext?.fingerprint,
        path: req.path,
      }
    );
  }
  
  next();
};

// Verify request origin
export const verifyOrigin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  // Skip for non-browser requests
  if (!origin && !referer) {
    return next();
  }
  
  const allowedOrigins = [
    'https://onyxreport.com',
    'https://www.onyxreport.com',
    'https://onyx-frontend.onrender.com',
  ];
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:5174');
  }
  
  const isAllowed = allowedOrigins.some(allowed => 
    origin?.startsWith(allowed) || referer?.startsWith(allowed)
  );
  
  if (!isAllowed) {
    logSecurityEvent(
      'INVALID_ORIGIN',
      (req as any).user?.id || null,
      req.ip || 'unknown',
      {
        origin,
        referer,
        path: req.path,
      }
    );
    
    return res.status(403).json({
      success: false,
      message: 'Invalid request origin',
    });
  }
  
  next();
};

// Prevent parameter pollution
export const preventParameterPollution = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check for duplicate parameters
  const params = { ...req.query, ...req.body };
  
  for (const key in params) {
    if (Array.isArray(params[key]) && key !== 'tags' && key !== 'categories') {
      // Allow specific fields to be arrays
      logSecurityEvent(
        'PARAMETER_POLLUTION',
        (req as any).user?.id || null,
        req.ip || 'unknown',
        {
          parameter: key,
          value: params[key],
          path: req.path,
        }
      );
      
      // Take the first value
      params[key] = params[key][0];
    }
  }
  
  next();
};

// API key validation for external integrations
export const validateAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.get('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
    });
  }
  
  // Validate API key format
  const apiKeyRegex = /^[A-Za-z0-9]{32,64}$/;
  
  if (!apiKeyRegex.test(apiKey)) {
    logSecurityEvent(
      'INVALID_API_KEY',
      null,
      req.ip || 'unknown',
      {
        apiKey: apiKey.substring(0, 8) + '...',
        path: req.path,
      }
    );
    
    return res.status(401).json({
      success: false,
      message: 'Invalid API key format',
    });
  }
  
  // TODO: Validate against database
  // For now, accept any valid format
  
  next();
};

// Combine all security middleware
export const securityMiddleware = [
  addSecurityContext,
  preventSQLInjection,
  preventXSS,
  preventParameterPollution,
  detectSuspiciousBehavior,
];