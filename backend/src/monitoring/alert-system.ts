import nodemailer from 'nodemailer';
import { Pool } from 'pg';
import * as Sentry from '@sentry/node';
import { healthMonitor, HealthStatus } from './health-monitor';
import { dataIntegrityValidator } from '../validation/data-integrity';

/**
 * Advanced Alert System
 * Proactive monitoring with intelligent alerting to prevent "7 Barriers" incidents
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // Minutes between alerts
  channels: AlertChannel[];
  enabled: boolean;
  metadata?: any;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sentry' | 'console';
  config: any;
  enabled: boolean;
}

export interface Alert {
  id: string;
  rule_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: any;
  timestamp: string;
  resolved: boolean;
  resolved_at?: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface AlertMetrics {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  alerts_last_24h: number;
  resolution_rate: number;
  average_resolution_time: number;
}

export class AlertSystem {
  private pool: Pool;
  private emailTransporter: nodemailer.Transporter;
  private alertHistory: Map<string, number> = new Map(); // For cooldown tracking
  private activeRules: AlertRule[] = [];
  private isInitialized = false;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.ALERT_EMAIL_USER,
        pass: process.env.ALERT_EMAIL_PASS
      }
    });

    this.initializeAlertRules();
    this.startMonitoring();
  }

  /**
   * Initialize default alert rules
   */
  private initializeAlertRules(): void {
    this.activeRules = [
      // Critical System Alerts
      {
        id: 'database-down',
        name: 'Database Connection Lost',
        description: 'Database is unreachable or connection failed',
        condition: (health: HealthStatus) => 
          health.dependencies.database.status === 'unhealthy',
        severity: 'critical',
        cooldown: 5, // 5 minutes
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'sentry', enabled: true, config: { level: 'error' } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },
      
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 85% threshold',
        condition: (health: HealthStatus) => 
          health.metrics.memory.usage_percent > 85,
        severity: 'high',
        cooldown: 15,
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },

      {
        id: 'critical-memory-usage',
        name: 'Critical Memory Usage',
        description: 'Memory usage exceeds 95% - system may crash',
        condition: (health: HealthStatus) => 
          health.metrics.memory.usage_percent > 95,
        severity: 'critical',
        cooldown: 5,
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'sentry', enabled: true, config: { level: 'fatal' } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },

      // API Performance Alerts
      {
        id: 'high-error-rate',
        name: 'High API Error Rate',
        description: 'API error rate exceeds 10%',
        condition: (health: HealthStatus) => 
          health.metrics.api.error_rate > 10,
        severity: 'high',
        cooldown: 10,
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },

      {
        id: 'slow-response-time',
        name: 'Slow API Response Time',
        description: 'Average response time exceeds 2 seconds',
        condition: (health: HealthStatus) => 
          health.metrics.api.average_response_time > 2000,
        severity: 'medium',
        cooldown: 20,
        channels: [
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },

      // Database Performance Alerts  
      {
        id: 'too-many-connections',
        name: 'High Database Connection Count',
        description: 'Database connections approaching limit',
        condition: (health: HealthStatus) => {
          const dbMetrics = health.metrics.database;
          return (dbMetrics.connections / dbMetrics.max_connections) > 0.8;
        },
        severity: 'medium',
        cooldown: 15,
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },

      // External Service Alerts
      {
        id: 'external-service-down',
        name: 'External Service Unavailable',
        description: 'Critical external service is unreachable',
        condition: (health: HealthStatus) => 
          health.dependencies.external_apis.some(api => api.status === 'unhealthy'),
        severity: 'high',
        cooldown: 10,
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      },

      // Data Integrity Alerts
      {
        id: 'data-integrity-critical',
        name: 'Critical Data Integrity Issues',
        description: 'Critical data integrity violations detected',
        condition: async () => {
          try {
            const report = await dataIntegrityValidator.runIntegrityChecks();
            return report.overall_status === 'critical_errors';
          } catch {
            return false;
          }
        },
        severity: 'critical',
        cooldown: 60, // 1 hour
        channels: [
          { type: 'email', enabled: true, config: { to: process.env.ADMIN_EMAIL } },
          { type: 'sentry', enabled: true, config: { level: 'error' } },
          { type: 'console', enabled: true, config: {} }
        ],
        enabled: true
      }
    ];

    this.isInitialized = true;
    console.log(`✅ Alert system initialized with ${this.activeRules.length} rules`);
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (!this.isInitialized) return;

    // Check alerts every 30 seconds
    setInterval(async () => {
      try {
        await this.checkAlertConditions();
      } catch (error) {
        console.error('Error checking alert conditions:', error);
      }
    }, 30000);

    // Cleanup old alert history every hour
    setInterval(() => {
      this.cleanupAlertHistory();
    }, 3600000); // 1 hour

    console.log('🔍 Alert monitoring started');
  }

  /**
   * Check all alert conditions and trigger alerts
   */
  private async checkAlertConditions(): Promise<void> {
    const health = await healthMonitor.getHealthStatus();
    
    for (const rule of this.activeRules) {
      if (!rule.enabled) continue;

      try {
        // Check cooldown
        const lastAlertTime = this.alertHistory.get(rule.id) || 0;
        const cooldownMs = rule.cooldown * 60 * 1000;
        const now = Date.now();

        if (now - lastAlertTime < cooldownMs) {
          continue; // Still in cooldown period
        }

        // Evaluate condition
        let conditionMet = false;
        if (typeof rule.condition === 'function') {
          conditionMet = await rule.condition(health);
        }

        if (conditionMet) {
          await this.triggerAlert(rule, health);
          this.alertHistory.set(rule.id, now);
        }

      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, context: any): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rule_id: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: rule.description,
      details: {
        rule: rule,
        context: context,
        system_info: {
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
          server: process.env.SERVER_NAME || 'unknown'
        }
      },
      timestamp: new Date().toISOString(),
      resolved: false,
      acknowledged: false
    };

    console.log(`🚨 ALERT TRIGGERED: [${rule.severity.toUpperCase()}] ${rule.name}`);

    // Send alerts through all configured channels
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendAlert(alert, channel);
      } catch (error) {
        console.error(`Error sending alert via ${channel.type}:`, error);
      }
    }

    // Store alert in database
    await this.storeAlert(alert);

    // Track in Sentry if enabled
    if (rule.channels.some(c => c.type === 'sentry' && c.enabled)) {
      Sentry.captureMessage(alert.title, rule.severity as any);
    }
  }

  /**
   * Send alert through specific channel
   */
  private async sendAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailAlert(alert, channel.config);
        break;
        
      case 'console':
        this.sendConsoleAlert(alert);
        break;
        
      case 'webhook':
        await this.sendWebhookAlert(alert, channel.config);
        break;
        
      case 'sentry':
        this.sendSentryAlert(alert, channel.config);
        break;
        
      default:
        console.warn(`Unknown alert channel type: ${channel.type}`);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, config: any): Promise<void> {
    if (!config.to || !this.emailTransporter) return;

    const emailContent = this.generateEmailContent(alert);
    
    await this.emailTransporter.sendMail({
      from: process.env.ALERT_EMAIL_FROM || 'alerts@onyxreport.com',
      to: config.to,
      subject: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.title}`,
      html: emailContent
    });

    console.log(`📧 Email alert sent to ${config.to}`);
  }

  /**
   * Send console alert
   */
  private sendConsoleAlert(alert: Alert): void {
    const icon = {
      'low': '🔵',
      'medium': '🟡', 
      'high': '🟠',
      'critical': '🔴'
    }[alert.severity] || '⚪';

    console.log(`${icon} [${alert.severity.toUpperCase()}] ${alert.title}`);
    console.log(`   Message: ${alert.message}`);
    console.log(`   Time: ${alert.timestamp}`);
    console.log(`   Details: ${JSON.stringify(alert.details, null, 2)}`);
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, config: any): Promise<void> {
    if (!config.url) return;

    await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify({
        alert_id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        details: alert.details
      })
    });

    console.log(`🔗 Webhook alert sent to ${config.url}`);
  }

  /**
   * Send Sentry alert
   */
  private sendSentryAlert(alert: Alert, config: any): void {
    Sentry.withScope(scope => {
      scope.setLevel(config.level || 'error');
      scope.setTag('alert_type', 'system_alert');
      scope.setTag('severity', alert.severity);
      scope.setTag('rule_id', alert.rule_id);
      scope.setContext('alert_details', alert.details);
      
      Sentry.captureMessage(alert.title);
    });

    console.log(`📊 Sentry alert sent: ${alert.title}`);
  }

  /**
   * Generate HTML email content
   */
  private generateEmailContent(alert: Alert): string {
    const severityColor = {
      'low': '#3B82F6',
      'medium': '#F59E0B',
      'high': '#F97316', 
      'critical': '#EF4444'
    }[alert.severity] || '#6B7280';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 System Alert</h1>
        <p style="margin: 5px 0 0; font-size: 16px;">${alert.severity.toUpperCase()} Severity</p>
      </div>
      
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1f2937; margin-top: 0;">${alert.title}</h2>
        <p style="color: #4b5563; line-height: 1.6;">${alert.message}</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px; color: #374151;">Alert Details</h3>
          <p style="margin: 5px 0; color: #6b7280;"><strong>Time:</strong> ${alert.timestamp}</p>
          <p style="margin: 5px 0; color: #6b7280;"><strong>Alert ID:</strong> ${alert.id}</p>
          <p style="margin: 5px 0; color: #6b7280;"><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        </div>
        
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This alert was automatically generated by the Onyx Report monitoring system.
            <br>
            Time to investigate and resolve this issue to maintain system stability.
          </p>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      // Ensure alerts table exists
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS system_alerts (
          id VARCHAR(255) PRIMARY KEY,
          rule_id VARCHAR(255) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          details JSONB,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved BOOLEAN DEFAULT FALSE,
          resolved_at TIMESTAMP,
          acknowledged BOOLEAN DEFAULT FALSE,
          acknowledged_by VARCHAR(255),
          acknowledged_at TIMESTAMP
        )
      `);

      await this.pool.query(`
        INSERT INTO system_alerts 
        (id, rule_id, severity, title, message, details, timestamp, resolved, acknowledged)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        alert.id,
        alert.rule_id,
        alert.severity,
        alert.title,
        alert.message,
        JSON.stringify(alert.details),
        alert.timestamp,
        alert.resolved,
        alert.acknowledged
      ]);

    } catch (error) {
      console.error('Error storing alert in database:', error);
    }
  }

  /**
   * Get alert metrics and statistics
   */
  async getAlertMetrics(): Promise<AlertMetrics> {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(*) FILTER (WHERE NOT resolved) as active_alerts,
          COUNT(*) FILTER (WHERE severity = 'critical' AND NOT resolved) as critical_alerts,
          COUNT(*) FILTER (WHERE severity = 'high' AND NOT resolved) as high_alerts,
          COUNT(*) FILTER (WHERE severity = 'medium' AND NOT resolved) as medium_alerts,
          COUNT(*) FILTER (WHERE severity = 'low' AND NOT resolved) as low_alerts,
          COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as alerts_last_24h,
          COUNT(*) FILTER (WHERE resolved) * 100.0 / COUNT(*) as resolution_rate
        FROM system_alerts
      `);

      const row = result.rows[0] || {};
      
      return {
        total_alerts: parseInt(row.total_alerts || '0'),
        active_alerts: parseInt(row.active_alerts || '0'),
        critical_alerts: parseInt(row.critical_alerts || '0'),
        high_alerts: parseInt(row.high_alerts || '0'),
        medium_alerts: parseInt(row.medium_alerts || '0'),
        low_alerts: parseInt(row.low_alerts || '0'),
        alerts_last_24h: parseInt(row.alerts_last_24h || '0'),
        resolution_rate: parseFloat(row.resolution_rate || '0'),
        average_resolution_time: 0 // Would need more complex query
      };

    } catch (error) {
      console.error('Error getting alert metrics:', error);
      return {
        total_alerts: 0,
        active_alerts: 0,
        critical_alerts: 0,
        high_alerts: 0,
        medium_alerts: 0,
        low_alerts: 0,
        alerts_last_24h: 0,
        resolution_rate: 0,
        average_resolution_time: 0
      };
    }
  }

  /**
   * Cleanup old alert history
   */
  private cleanupAlertHistory(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [ruleId, timestamp] of this.alertHistory.entries()) {
      if (timestamp < oneHourAgo) {
        this.alertHistory.delete(ruleId);
      }
    }
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.activeRules.push(rule);
    console.log(`➕ Added custom alert rule: ${rule.name}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.activeRules = this.activeRules.filter(rule => rule.id !== ruleId);
    console.log(`➖ Removed alert rule: ${ruleId}`);
  }

  /**
   * Get active alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.activeRules];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.pool.end();
    if (this.emailTransporter) {
      this.emailTransporter.close();
    }
  }
}

// Export singleton instance
export const alertSystem = new AlertSystem();

export default AlertSystem;