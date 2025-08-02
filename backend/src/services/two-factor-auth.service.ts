import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../config/database';
import { logSecurityEvent } from '../config/security';

interface TwoFactorSecret {
  base32: string;
  otpauth_url: string;
  qr_code: string;
}

export class TwoFactorAuthService {
  private static readonly APP_NAME = 'ONYX Platform';
  
  /**
   * Generate a new 2FA secret for a user
   */
  static async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSecret> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.APP_NAME} (${userEmail})`,
        issuer: this.APP_NAME,
        length: 32
      });
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Store the secret temporarily (encrypted in production)
      // User must verify with a code before it's permanently enabled
      await pool.query(
        `UPDATE users 
         SET two_factor_secret = $1, 
             two_factor_enabled = false 
         WHERE id = $2`,
        [secret.base32, userId]
      );
      
      return {
        base32: secret.base32,
        otpauth_url: secret.otpauth_url!,
        qr_code: qrCodeDataUrl
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }
  
  /**
   * Verify and enable 2FA for a user
   */
  static async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's temporary secret
      const result = await pool.query(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [userId]
      );
      
      if (!result.rows[0]?.two_factor_secret) {
        throw new Error('No 2FA secret found. Please generate one first.');
      }
      
      const secret = result.rows[0].two_factor_secret;
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps tolerance
      });
      
      if (!verified) {
        return false;
      }
      
      // Enable 2FA for the user
      await pool.query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [userId]
      );
      
      // Generate backup codes
      const backupCodes = await this.generateBackupCodes(userId);
      
      logSecurityEvent(
        'TWO_FACTOR_ENABLED',
        userId,
        '',
        { backup_codes_generated: backupCodes.length }
      );
      
      return true;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Verify a 2FA token
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's secret and 2FA status
      const result = await pool.query(
        'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
        [userId]
      );
      
      const user = result.rows[0];
      
      if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
        return true; // 2FA not enabled, allow login
      }
      
      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token,
        window: 2
      });
      
      if (verified) {
        logSecurityEvent(
          'TWO_FACTOR_VERIFIED',
          userId,
          '',
          { success: true }
        );
      } else {
        logSecurityEvent(
          'TWO_FACTOR_FAILED',
          userId,
          '',
          { token: token.substring(0, 3) + '***' }
        );
      }
      
      return verified;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
  }
  
  /**
   * Disable 2FA for a user
   */
  static async disableTwoFactor(userId: string, password: string): Promise<boolean> {
    try {
      // Verify user's password before disabling 2FA
      const bcrypt = require('bcryptjs');
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (!result.rows[0]) {
        throw new Error('User not found');
      }
      
      const isValidPassword = await bcrypt.compare(password, result.rows[0].password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      
      // Disable 2FA
      await pool.query(
        `UPDATE users 
         SET two_factor_enabled = false, 
             two_factor_secret = NULL 
         WHERE id = $1`,
        [userId]
      );
      
      // Delete backup codes
      await pool.query(
        'DELETE FROM two_factor_backup_codes WHERE user_id = $1',
        [userId]
      );
      
      logSecurityEvent(
        'TWO_FACTOR_DISABLED',
        userId,
        '',
        {}
      );
      
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }
  
  /**
   * Generate backup codes for 2FA recovery
   */
  static async generateBackupCodes(userId: string): Promise<string[]> {
    try {
      // Generate 10 backup codes
      const codes: string[] = [];
      const hashedCodes: string[] = [];
      const bcrypt = require('bcryptjs');
      
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
        
        // Store hashed version
        const hashedCode = await bcrypt.hash(code, 10);
        hashedCodes.push(hashedCode);
      }
      
      // Create table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          code_hash VARCHAR(255) NOT NULL,
          used BOOLEAN DEFAULT false,
          used_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Delete old backup codes
      await pool.query(
        'DELETE FROM two_factor_backup_codes WHERE user_id = $1',
        [userId]
      );
      
      // Insert new backup codes
      for (const hashedCode of hashedCodes) {
        await pool.query(
          'INSERT INTO two_factor_backup_codes (user_id, code_hash) VALUES ($1, $2)',
          [userId, hashedCode]
        );
      }
      
      return codes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      throw error;
    }
  }
  
  /**
   * Verify a backup code
   */
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const bcrypt = require('bcryptjs');
      
      // Get unused backup codes for the user
      const result = await pool.query(
        'SELECT id, code_hash FROM two_factor_backup_codes WHERE user_id = $1 AND used = false',
        [userId]
      );
      
      // Check each code
      for (const row of result.rows) {
        const isValid = await bcrypt.compare(code.toUpperCase(), row.code_hash);
        
        if (isValid) {
          // Mark code as used
          await pool.query(
            'UPDATE two_factor_backup_codes SET used = true, used_at = NOW() WHERE id = $1',
            [row.id]
          );
          
          logSecurityEvent(
            'BACKUP_CODE_USED',
            userId,
            '',
            { code_id: row.id }
          );
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  }
  
  /**
   * Check if user has 2FA enabled
   */
  static async isEnabled(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT two_factor_enabled FROM users WHERE id = $1',
        [userId]
      );
      
      return result.rows[0]?.two_factor_enabled || false;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }
}