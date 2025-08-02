import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import enhancedEmailService from '../services/enhanced-email.service';
import mailgunService from '../services/mailgun-email.service';
import { body, validationResult } from 'express-validator';

const router = Router();

// All email routes require authentication
router.use(authenticate);

// Verify email service health (admin only)
router.get('/health', authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await enhancedEmailService.verifyEmailService();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
});

// Get email statistics (admin only)
router.get('/stats', authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const stats = await enhancedEmailService.getEmailStats(Number(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Send test email (admin only)
router.post('/test', [
  authorize('admin'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('type').isIn(['welcome', 'security', 'report']).withMessage('Invalid test type')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, type } = req.body;
    const result = await enhancedEmailService.sendTestEmail(email, type);
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// Send welcome email to new user (admin/manager only)
router.post('/welcome', [
  authorize('admin', 'manager'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('organizationName').optional().isString(),
  body('temporaryPassword').optional().isString()
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, organizationName, temporaryPassword } = req.body;
    
    await enhancedEmailService.sendWelcomeEmail(
      email,
      name,
      organizationName,
      temporaryPassword
    );
    
    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Send security notification (admin only)
router.post('/security-notification', [
  authorize('admin'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('action').notEmpty().withMessage('Action is required'),
  body('details').isObject().withMessage('Details must be an object'),
  body('ipAddress').isIP().withMessage('Valid IP address is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, action, details, ipAddress } = req.body;
    
    await enhancedEmailService.sendSecurityNotification(
      email,
      name,
      action,
      details,
      ipAddress
    );
    
    res.json({
      success: true,
      message: 'Security notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Send security alert to admins (admin only)
router.post('/security-alert', [
  authorize('admin'),
  body('alertType').notEmpty().withMessage('Alert type is required'),
  body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid severity level'),
  body('details').isObject().withMessage('Details must be an object'),
  body('ipAddress').isIP().withMessage('Valid IP address is required'),
  body('userInfo').optional().isObject()
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { alertType, severity, details, ipAddress, userInfo } = req.body;
    
    await enhancedEmailService.sendSecurityAlert(
      alertType,
      severity,
      details,
      userInfo,
      ipAddress
    );
    
    res.json({
      success: true,
      message: 'Security alert sent to administrators'
    });
  } catch (error) {
    next(error);
  }
});

// Send bulk notification (admin only)
router.post('/bulk-notification', [
  authorize('admin'),
  body('emails').isArray().withMessage('Emails must be an array'),
  body('emails.*').isEmail().withMessage('All emails must be valid'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('senderName').optional().isString()
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { emails, subject, message, senderName } = req.body;
    
    if (emails.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send to more than 100 recipients at once'
      });
    }
    
    const results = await enhancedEmailService.sendBulkNotification(
      emails,
      subject,
      message,
      senderName
    );
    
    res.json({
      success: true,
      message: 'Bulk notification sent',
      data: {
        total: results.length,
        successful: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length,
        results
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send assessment report via email
router.post('/assessment-report', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('reportType').notEmpty().withMessage('Report type is required'),
  body('buildingName').optional().isString()
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, reportType, buildingName } = req.body;
    
    // Generate a sample report buffer (in real implementation, this would come from the report service)
    const sampleReportBuffer = Buffer.from('Sample assessment report content');
    
    await enhancedEmailService.sendAssessmentReport(
      email,
      name,
      sampleReportBuffer,
      reportType,
      buildingName
    );
    
    res.json({
      success: true,
      message: 'Assessment report sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Send password reset email
router.post('/password-reset', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('resetToken').notEmpty().withMessage('Reset token is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, resetToken } = req.body;
    
    await enhancedEmailService.sendPasswordResetEmail(email, name, resetToken);
    
    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Send 2FA confirmation email
router.post('/2fa-confirmation', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('backupCodes').isArray().withMessage('Backup codes must be an array'),
  body('backupCodes.*').isString().withMessage('All backup codes must be strings')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, backupCodes } = req.body;
    
    await enhancedEmailService.send2FAConfirmationEmail(email, name, backupCodes);
    
    res.json({
      success: true,
      message: '2FA confirmation email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get Mailgun statistics (admin only)
router.get('/mailgun-stats', authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query;
    const stats = await mailgunService.getEmailStats(Number(days));
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Send manual test report (admin only)
router.post('/test-report', [
  authorize('admin'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('reportType').optional().isIn(['summary', 'detailed', 'critical_only'])
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, reportType = 'summary' } = req.body;
    
    const result = await mailgunService.sendTestReport(email, reportType);
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

export default router;