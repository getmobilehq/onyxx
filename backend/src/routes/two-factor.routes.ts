import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import { body, validationResult } from 'express-validator';

const router = Router();

// All 2FA routes require authentication
router.use(authenticate);

// Generate 2FA secret and QR code
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    // Check if 2FA is already enabled
    const isEnabled = await TwoFactorAuthService.isEnabled(user.id);
    if (isEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled for this account'
      });
    }
    
    // Generate secret and QR code
    const secret = await TwoFactorAuthService.generateSecret(user.id, user.email);
    
    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qr_code: secret.qr_code,
        manual_entry_key: secret.base32,
        manual_entry_setup: `Open your authenticator app and add a new account using this key: ${secret.base32}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Enable 2FA (verify initial setup)
router.post('/enable', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const user = (req as any).user;
    const { token } = req.body;
    
    // Verify token and enable 2FA
    const enabled = await TwoFactorAuthService.enableTwoFactor(user.id, token);
    
    if (!enabled) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }
    
    // Generate backup codes
    const backupCodes = await TwoFactorAuthService.generateBackupCodes(user.id);
    
    res.json({
      success: true,
      message: '2FA has been enabled successfully',
      data: {
        backup_codes: backupCodes,
        warning: 'Please save these backup codes in a secure place. Each code can only be used once.'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify 2FA token (for login)
router.post('/verify', [
  body('token').notEmpty().withMessage('Verification token is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const user = (req as any).user;
    const { token } = req.body;
    
    // Check if it's a backup code (8 characters)
    let verified = false;
    
    if (token.length === 8) {
      // Try as backup code
      verified = await TwoFactorAuthService.verifyBackupCode(user.id, token);
    } else {
      // Try as TOTP token
      verified = await TwoFactorAuthService.verifyToken(user.id, token);
    }
    
    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    res.json({
      success: true,
      message: '2FA verification successful'
    });
  } catch (error) {
    next(error);
  }
});

// Disable 2FA
router.post('/disable', [
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const user = (req as any).user;
    const { password } = req.body;
    
    // Disable 2FA
    const disabled = await TwoFactorAuthService.disableTwoFactor(user.id, password);
    
    if (!disabled) {
      return res.status(400).json({
        success: false,
        message: 'Failed to disable 2FA. Please check your password.'
      });
    }
    
    res.json({
      success: true,
      message: '2FA has been disabled'
    });
  } catch (error) {
    next(error);
  }
});

// Get 2FA status
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    const isEnabled = await TwoFactorAuthService.isEnabled(user.id);
    
    res.json({
      success: true,
      data: {
        enabled: isEnabled
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate new backup codes
router.post('/backup-codes/regenerate', [
  body('password').notEmpty().withMessage('Password is required')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const user = (req as any).user;
    const { password } = req.body;
    
    // Verify password
    const bcrypt = require('bcryptjs');
    const pool = require('../config/database').default;
    
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );
    
    if (!result.rows[0]) {
      throw new Error('User not found');
    }
    
    const isValidPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }
    
    // Generate new backup codes
    const backupCodes = await TwoFactorAuthService.generateBackupCodes(user.id);
    
    res.json({
      success: true,
      message: 'New backup codes generated',
      data: {
        backup_codes: backupCodes,
        warning: 'Your old backup codes have been invalidated. Please save these new codes in a secure place.'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;