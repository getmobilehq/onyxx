import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import SecurityAuditService from '../services/security-audit.service';
import { logSecurityEvent } from '../config/security';

const router = Router();

// All security routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Run security audit
router.get('/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const audit = await SecurityAuditService.runFullAudit(user.id, req.ip);
    
    res.json({
      success: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Get security events
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 100, offset = 0, event_type } = req.query;
    
    // This would query security_events table
    // For now, return empty array
    const events: any[] = [];
    
    res.json({
      success: true,
      data: {
        events,
        total: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get failed login attempts
router.get('/failed-logins', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const failedAttempts = await SecurityAuditService.checkFailedLoginAttempts();
    
    res.json({
      success: true,
      data: failedAttempts,
    });
  } catch (error) {
    next(error);
  }
});

// Get suspicious activities
router.get('/suspicious-activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await SecurityAuditService.checkSuspiciousActivities();
    
    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

// Force password reset for a user
router.post('/force-password-reset', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.body;
    const adminUser = (req as any).user;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }
    
    // Log the action
    logSecurityEvent(
      'FORCE_PASSWORD_RESET',
      adminUser.id,
      req.ip,
      {
        target_user: user_id,
        admin_user: adminUser.id,
      }
    );
    
    // In a real implementation, this would:
    // 1. Invalidate current user sessions
    // 2. Set a flag requiring password change on next login
    // 3. Send email notification to user
    
    res.json({
      success: true,
      message: 'Password reset initiated for user',
    });
  } catch (error) {
    next(error);
  }
});

// Lock/unlock user account
router.post('/account-lock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, action, reason } = req.body;
    const adminUser = (req as any).user;
    
    if (!user_id || !action) {
      return res.status(400).json({
        success: false,
        message: 'User ID and action required',
      });
    }
    
    if (!['lock', 'unlock'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "lock" or "unlock"',
      });
    }
    
    // Log the action
    logSecurityEvent(
      action === 'lock' ? 'ACCOUNT_LOCKED' : 'ACCOUNT_UNLOCKED',
      adminUser.id,
      req.ip,
      {
        target_user: user_id,
        admin_user: adminUser.id,
        reason,
      }
    );
    
    // In a real implementation, this would update the user's account status
    
    res.json({
      success: true,
      message: `Account ${action}ed successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// IP whitelist management
router.get('/ip-whitelist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This would query an ip_whitelist table
    // For now, return empty array
    const whitelist: any[] = [];
    
    res.json({
      success: true,
      data: whitelist,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/ip-whitelist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ip_address, description } = req.body;
    const adminUser = (req as any).user;
    
    if (!ip_address) {
      return res.status(400).json({
        success: false,
        message: 'IP address required',
      });
    }
    
    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip_address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format',
      });
    }
    
    logSecurityEvent(
      'IP_WHITELIST_ADDED',
      adminUser.id,
      req.ip,
      {
        whitelisted_ip: ip_address,
        description,
      }
    );
    
    res.json({
      success: true,
      message: 'IP address added to whitelist',
    });
  } catch (error) {
    next(error);
  }
});

// Security configuration
router.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Return current security configuration (without sensitive data)
    const config = {
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true,
        max_age_days: 90,
      },
      session_config: {
        timeout_minutes: 30,
        max_concurrent_sessions: 3,
      },
      rate_limiting: {
        auth_attempts: 5,
        auth_window_minutes: 15,
        api_requests: 100,
        api_window_minutes: 15,
      },
      security_features: {
        two_factor_auth: false, // Not yet implemented
        ip_whitelisting: false, // Not yet implemented
        audit_logging: true,
        encryption_at_rest: false, // Not yet implemented
        waf_enabled: false, // Not yet implemented
      },
    };
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

export default router;