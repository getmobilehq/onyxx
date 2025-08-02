import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { logSecurityEvent } from '../config/security';

interface SecurityAudit {
  weakPasswords: any[];
  inactiveUsers: any[];
  failedLoginAttempts: any[];
  suspiciousActivities: any[];
  dataIntegrityIssues: any[];
  recommendations: string[];
}

export class SecurityAuditService {
  // Check for weak passwords (users who haven't changed default passwords)
  static async checkWeakPasswords(): Promise<any[]> {
    try {
      // Check for common weak passwords
      const commonPasswords = ['password123', 'admin123', 'test123', '12345678'];
      const weakUsers = [];
      
      const result = await pool.query(
        `SELECT id, email, name, last_password_change, created_at 
         FROM users 
         WHERE last_password_change IS NULL 
         OR last_password_change < NOW() - INTERVAL '90 days'`
      );
      
      for (const user of result.rows) {
        weakUsers.push({
          user_id: user.id,
          email: user.email,
          issue: user.last_password_change 
            ? 'Password not changed in over 90 days' 
            : 'Never changed password since account creation',
          last_change: user.last_password_change || user.created_at,
        });
      }
      
      return weakUsers;
    } catch (error) {
      console.error('Error checking weak passwords:', error);
      return [];
    }
  }
  
  // Check for inactive users
  static async checkInactiveUsers(): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT id, email, name, last_login, created_at 
         FROM users 
         WHERE last_login IS NULL 
         OR last_login < NOW() - INTERVAL '30 days'`
      );
      
      return result.rows.map(user => ({
        user_id: user.id,
        email: user.email,
        last_login: user.last_login,
        days_inactive: user.last_login 
          ? Math.floor((Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24))
          : 'Never logged in',
      }));
    } catch (error) {
      console.error('Error checking inactive users:', error);
      return [];
    }
  }
  
  // Check failed login attempts
  static async checkFailedLoginAttempts(): Promise<any[]> {
    try {
      // This would normally query a login_attempts table
      // For now, return empty array as we haven't implemented this table yet
      return [];
      
      /* Future implementation:
      const result = await pool.query(
        `SELECT email, ip_address, COUNT(*) as attempts, MAX(attempted_at) as last_attempt
         FROM login_attempts
         WHERE success = false
         AND attempted_at > NOW() - INTERVAL '24 hours'
         GROUP BY email, ip_address
         HAVING COUNT(*) > 3
         ORDER BY attempts DESC`
      );
      
      return result.rows;
      */
    } catch (error) {
      console.error('Error checking failed login attempts:', error);
      return [];
    }
  }
  
  // Check for suspicious activities
  static async checkSuspiciousActivities(): Promise<any[]> {
    try {
      const suspiciousActivities = [];
      
      // Check for rapid data modifications
      const rapidChanges = await pool.query(
        `SELECT user_id, COUNT(*) as change_count, 
                DATE_TRUNC('hour', updated_at) as hour_block
         FROM (
           SELECT updated_by as user_id, updated_at FROM buildings 
           WHERE updated_at > NOW() - INTERVAL '24 hours'
           UNION ALL
           SELECT updated_by as user_id, updated_at FROM assessments 
           WHERE updated_at > NOW() - INTERVAL '24 hours'
         ) as changes
         WHERE user_id IS NOT NULL
         GROUP BY user_id, hour_block
         HAVING COUNT(*) > 20`
      );
      
      for (const activity of rapidChanges.rows) {
        suspiciousActivities.push({
          type: 'Rapid data modifications',
          user_id: activity.user_id,
          count: activity.change_count,
          time_period: activity.hour_block,
        });
      }
      
      // Check for data access patterns
      const unusualAccess = await pool.query(
        `SELECT u.id, u.email, COUNT(DISTINCT b.organization_id) as org_count
         FROM users u
         JOIN buildings b ON b.created_by = u.id OR b.updated_by = u.id
         WHERE u.role != 'admin'
         GROUP BY u.id, u.email
         HAVING COUNT(DISTINCT b.organization_id) > 1`
      );
      
      for (const access of unusualAccess.rows) {
        suspiciousActivities.push({
          type: 'Cross-organization data access',
          user_id: access.id,
          email: access.email,
          organizations_accessed: access.org_count,
        });
      }
      
      return suspiciousActivities;
    } catch (error) {
      console.error('Error checking suspicious activities:', error);
      return [];
    }
  }
  
  // Check data integrity
  static async checkDataIntegrity(): Promise<any[]> {
    try {
      const issues = [];
      
      // Check for orphaned records
      const orphanedAssessments = await pool.query(
        `SELECT a.id, a.building_id 
         FROM assessments a
         LEFT JOIN buildings b ON a.building_id = b.id
         WHERE b.id IS NULL`
      );
      
      if (orphanedAssessments.rows.length > 0) {
        issues.push({
          type: 'Orphaned assessments',
          count: orphanedAssessments.rows.length,
          details: 'Assessments exist for non-existent buildings',
        });
      }
      
      // Check for invalid FCI scores
      const invalidFCI = await pool.query(
        `SELECT id, fci_score 
         FROM assessments 
         WHERE fci_score IS NOT NULL 
         AND (fci_score < 0 OR fci_score > 1)`
      );
      
      if (invalidFCI.rows.length > 0) {
        issues.push({
          type: 'Invalid FCI scores',
          count: invalidFCI.rows.length,
          details: 'FCI scores outside valid range (0-1)',
        });
      }
      
      // Check for duplicate buildings
      const duplicateBuildings = await pool.query(
        `SELECT name, address, COUNT(*) as count
         FROM buildings
         WHERE deleted_at IS NULL
         GROUP BY name, address
         HAVING COUNT(*) > 1`
      );
      
      if (duplicateBuildings.rows.length > 0) {
        issues.push({
          type: 'Potential duplicate buildings',
          count: duplicateBuildings.rows.length,
          details: 'Multiple buildings with same name and address',
        });
      }
      
      return issues;
    } catch (error) {
      console.error('Error checking data integrity:', error);
      return [];
    }
  }
  
  // Generate security recommendations
  static generateRecommendations(audit: Partial<SecurityAudit>): string[] {
    const recommendations = [];
    
    if (audit.weakPasswords && audit.weakPasswords.length > 0) {
      recommendations.push(
        `Force password reset for ${audit.weakPasswords.length} users with weak or old passwords`,
        'Implement password complexity requirements',
        'Enable two-factor authentication (2FA)'
      );
    }
    
    if (audit.inactiveUsers && audit.inactiveUsers.length > 0) {
      recommendations.push(
        `Review and potentially deactivate ${audit.inactiveUsers.length} inactive user accounts`,
        'Implement automatic account suspension after 60 days of inactivity'
      );
    }
    
    if (audit.failedLoginAttempts && audit.failedLoginAttempts.length > 0) {
      recommendations.push(
        'Implement account lockout after multiple failed login attempts',
        'Add CAPTCHA verification after 3 failed attempts',
        'Send email alerts for suspicious login activities'
      );
    }
    
    if (audit.suspiciousActivities && audit.suspiciousActivities.length > 0) {
      recommendations.push(
        'Review unusual data access patterns',
        'Implement activity monitoring and alerting',
        'Add audit logging for all data modifications'
      );
    }
    
    if (audit.dataIntegrityIssues && audit.dataIntegrityIssues.length > 0) {
      recommendations.push(
        'Run data cleanup to fix integrity issues',
        'Add database constraints to prevent future issues',
        'Implement regular data quality checks'
      );
    }
    
    // General recommendations
    recommendations.push(
      'Regular security training for all users',
      'Implement IP whitelisting for admin accounts',
      'Enable SSL/TLS certificate pinning',
      'Regular penetration testing',
      'Implement Web Application Firewall (WAF)'
    );
    
    return recommendations;
  }
  
  // Run complete security audit
  static async runFullAudit(userId: string, userIp: string): Promise<SecurityAudit> {
    try {
      logSecurityEvent('SECURITY_AUDIT_STARTED', userId, userIp, {
        timestamp: new Date().toISOString(),
      });
      
      const [
        weakPasswords,
        inactiveUsers,
        failedLoginAttempts,
        suspiciousActivities,
        dataIntegrityIssues,
      ] = await Promise.all([
        this.checkWeakPasswords(),
        this.checkInactiveUsers(),
        this.checkFailedLoginAttempts(),
        this.checkSuspiciousActivities(),
        this.checkDataIntegrity(),
      ]);
      
      const audit: SecurityAudit = {
        weakPasswords,
        inactiveUsers,
        failedLoginAttempts,
        suspiciousActivities,
        dataIntegrityIssues,
        recommendations: [],
      };
      
      audit.recommendations = this.generateRecommendations(audit);
      
      logSecurityEvent('SECURITY_AUDIT_COMPLETED', userId, userIp, {
        timestamp: new Date().toISOString(),
        issues_found: {
          weak_passwords: weakPasswords.length,
          inactive_users: inactiveUsers.length,
          failed_logins: failedLoginAttempts.length,
          suspicious_activities: suspiciousActivities.length,
          data_integrity_issues: dataIntegrityIssues.length,
        },
      });
      
      return audit;
    } catch (error) {
      console.error('Error running security audit:', error);
      throw error;
    }
  }
  
  // Log security event to database
  static async logEvent(
    eventType: string,
    userId: string | null,
    ipAddress: string,
    details: any
  ): Promise<void> {
    try {
      // This would normally insert into a security_events table
      // For now, just log to console
      console.log('[SECURITY_EVENT]', {
        event_type: eventType,
        user_id: userId,
        ip_address: ipAddress,
        details,
        timestamp: new Date().toISOString(),
      });
      
      /* Future implementation:
      await pool.query(
        `INSERT INTO security_events (event_type, user_id, ip_address, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [eventType, userId, ipAddress, JSON.stringify(details)]
      );
      */
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}

export default SecurityAuditService;