import { HealthMonitor } from './health-monitor';
import { AlertSystem } from './alert-system';

export interface MetricValue {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface AnomalyDetectionConfig {
  metricName: string;
  windowSize: number; // number of data points to analyze
  threshold: number; // standard deviations from mean
  minDataPoints: number; // minimum points needed for analysis
  cooldownPeriod: number; // minutes between anomaly alerts
}

export interface Anomaly {
  id: string;
  metricName: string;
  timestamp: Date;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1 scale
  description: string;
  metadata: Record<string, any>;
}

export interface PredictionResult {
  metricName: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  timeHorizon: number; // minutes ahead
  riskLevel: 'low' | 'medium' | 'high';
}

class PredictiveMonitor {
  private healthMonitor: HealthMonitor;
  private alertSystem: AlertSystem;
  private metricsHistory: Map<string, MetricValue[]> = new Map();
  private anomalyConfigs: Map<string, AnomalyDetectionConfig> = new Map();
  private lastAnomalyAlert: Map<string, Date> = new Map();
  private detectedAnomalies: Anomaly[] = [];
  
  constructor() {
    this.healthMonitor = new HealthMonitor();
    this.alertSystem = new AlertSystem();
    this.initializeAnomalyConfigs();
  }

  private initializeAnomalyConfigs(): void {
    // CPU Usage anomaly detection
    this.anomalyConfigs.set('cpu_usage', {
      metricName: 'cpu_usage',
      windowSize: 20,
      threshold: 2.5,
      minDataPoints: 10,
      cooldownPeriod: 15
    });

    // Memory Usage anomaly detection
    this.anomalyConfigs.set('memory_usage', {
      metricName: 'memory_usage',
      windowSize: 15,
      threshold: 2.0,
      minDataPoints: 8,
      cooldownPeriod: 10
    });

    // API Response Time anomaly detection
    this.anomalyConfigs.set('api_response_time', {
      metricName: 'api_response_time',
      windowSize: 30,
      threshold: 2.0,
      minDataPoints: 15,
      cooldownPeriod: 5
    });

    // Database Connection Pool anomaly detection
    this.anomalyConfigs.set('db_pool_usage', {
      metricName: 'db_pool_usage',
      windowSize: 25,
      threshold: 1.8,
      minDataPoints: 12,
      cooldownPeriod: 20
    });

    // Request Rate anomaly detection
    this.anomalyConfigs.set('request_rate', {
      metricName: 'request_rate',
      windowSize: 40,
      threshold: 2.2,
      minDataPoints: 20,
      cooldownPeriod: 8
    });

    // Error Rate anomaly detection
    this.anomalyConfigs.set('error_rate', {
      metricName: 'error_rate',
      windowSize: 20,
      threshold: 1.5,
      minDataPoints: 10,
      cooldownPeriod: 3
    });
  }

  async startPredictiveMonitoring(): Promise<void> {
    console.log('🔮 Starting Predictive Monitoring System...');

    // Start health monitoring with predictive analysis
    await this.healthMonitor.startMonitoring((healthData) => {
      this.collectMetrics(healthData);
      this.performAnomalyDetection();
      this.generatePredictions();
    });

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);

    console.log('✅ Predictive Monitoring System started successfully');
  }

  private collectMetrics(healthData: any): void {
    const timestamp = new Date();

    // Collect CPU metrics
    if (healthData.system?.cpuUsage) {
      this.addMetric('cpu_usage', {
        timestamp,
        value: healthData.system.cpuUsage.percentage,
        metadata: { loadAverage: healthData.system.cpuUsage.loadAverage }
      });
    }

    // Collect Memory metrics
    if (healthData.system?.memoryUsage) {
      this.addMetric('memory_usage', {
        timestamp,
        value: healthData.system.memoryUsage.percentage,
        metadata: { 
          used: healthData.system.memoryUsage.used,
          free: healthData.system.memoryUsage.free
        }
      });
    }

    // Collect API performance metrics
    if (healthData.api?.averageResponseTime) {
      this.addMetric('api_response_time', {
        timestamp,
        value: healthData.api.averageResponseTime,
        metadata: { requestCount: healthData.api.requestCount }
      });
    }

    // Collect Database metrics
    if (healthData.database?.poolSize !== undefined) {
      this.addMetric('db_pool_usage', {
        timestamp,
        value: (healthData.database.activeConnections / healthData.database.poolSize) * 100,
        metadata: {
          activeConnections: healthData.database.activeConnections,
          poolSize: healthData.database.poolSize
        }
      });
    }

    // Collect Request Rate (simulated - would come from actual metrics)
    if (healthData.api?.requestCount) {
      const previousMetrics = this.metricsHistory.get('request_rate') || [];
      const lastMinuteCount = previousMetrics
        .filter(m => timestamp.getTime() - m.timestamp.getTime() < 60000)
        .length;
      
      this.addMetric('request_rate', {
        timestamp,
        value: lastMinuteCount,
        metadata: { totalRequests: healthData.api.requestCount }
      });
    }

    // Collect Error Rate
    if (healthData.api?.errorRate !== undefined) {
      this.addMetric('error_rate', {
        timestamp,
        value: healthData.api.errorRate,
        metadata: { errorCount: healthData.api.errorCount }
      });
    }
  }

  private addMetric(metricName: string, metric: MetricValue): void {
    if (!this.metricsHistory.has(metricName)) {
      this.metricsHistory.set(metricName, []);
    }

    const metrics = this.metricsHistory.get(metricName)!;
    metrics.push(metric);

    // Keep only the last 1000 data points per metric
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  private performAnomalyDetection(): void {
    for (const [metricName, config] of this.anomalyConfigs.entries()) {
      const metrics = this.metricsHistory.get(metricName);
      if (!metrics || metrics.length < config.minDataPoints) {
        continue;
      }

      // Check cooldown period
      const lastAlert = this.lastAnomalyAlert.get(metricName);
      if (lastAlert) {
        const timeSinceLastAlert = Date.now() - lastAlert.getTime();
        if (timeSinceLastAlert < config.cooldownPeriod * 60 * 1000) {
          continue;
        }
      }

      // Get recent data points for analysis
      const recentMetrics = metrics.slice(-config.windowSize);
      const anomaly = this.detectAnomalyInWindow(metricName, recentMetrics, config);

      if (anomaly) {
        this.handleDetectedAnomaly(anomaly);
      }
    }
  }

  private detectAnomalyInWindow(
    metricName: string, 
    metrics: MetricValue[], 
    config: AnomalyDetectionConfig
  ): Anomaly | null {
    if (metrics.length < config.minDataPoints) {
      return null;
    }

    const currentValue = metrics[metrics.length - 1].value;
    const values = metrics.map(m => m.value);
    
    // Calculate statistical measures
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect anomaly using z-score
    const zScore = Math.abs(currentValue - mean) / stdDev;
    
    if (zScore > config.threshold) {
      const severity = this.calculateSeverity(zScore, config.threshold);
      const confidence = Math.min(zScore / (config.threshold * 2), 1);

      return {
        id: `${metricName}_${Date.now()}`,
        metricName,
        timestamp: metrics[metrics.length - 1].timestamp,
        value: currentValue,
        expectedRange: {
          min: mean - (config.threshold * stdDev),
          max: mean + (config.threshold * stdDev)
        },
        severity,
        confidence,
        description: this.generateAnomalyDescription(metricName, currentValue, mean, zScore),
        metadata: {
          zScore,
          mean,
          stdDev,
          threshold: config.threshold,
          windowSize: config.windowSize
        }
      };
    }

    return null;
  }

  private calculateSeverity(zScore: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > threshold * 3) return 'critical';
    if (zScore > threshold * 2) return 'high';
    if (zScore > threshold * 1.5) return 'medium';
    return 'low';
  }

  private generateAnomalyDescription(metricName: string, currentValue: number, mean: number, zScore: number): string {
    const direction = currentValue > mean ? 'above' : 'below';
    const magnitude = zScore > 3 ? 'significantly' : zScore > 2 ? 'considerably' : 'notably';
    
    const metricDisplayNames: Record<string, string> = {
      cpu_usage: 'CPU usage',
      memory_usage: 'Memory usage',
      api_response_time: 'API response time',
      db_pool_usage: 'Database pool usage',
      request_rate: 'Request rate',
      error_rate: 'Error rate'
    };

    const displayName = metricDisplayNames[metricName] || metricName;
    
    return `${displayName} (${currentValue.toFixed(2)}) is ${magnitude} ${direction} normal levels (avg: ${mean.toFixed(2)})`;
  }

  private async handleDetectedAnomaly(anomaly: Anomaly): Promise<void> {
    console.log(`🚨 Anomaly detected: ${anomaly.description}`);
    
    this.detectedAnomalies.push(anomaly);
    this.lastAnomalyAlert.set(anomaly.metricName, new Date());

    // Send alert
    await this.alertSystem.sendAlert({
      type: 'anomaly_detected',
      severity: anomaly.severity,
      title: `Anomaly Detected: ${anomaly.metricName}`,
      message: anomaly.description,
      metadata: {
        anomalyId: anomaly.id,
        confidence: anomaly.confidence,
        zScore: anomaly.metadata.zScore,
        expectedRange: anomaly.expectedRange
      }
    });

    // Generate prediction for this anomaly
    const prediction = await this.generatePredictionForMetric(anomaly.metricName);
    if (prediction && prediction.riskLevel === 'high') {
      await this.alertSystem.sendAlert({
        type: 'risk_prediction',
        severity: 'high',
        title: `High Risk Prediction: ${anomaly.metricName}`,
        message: `Based on current anomaly and trends, ${anomaly.metricName} may continue to deteriorate. Predicted value: ${prediction.predictedValue.toFixed(2)}`,
        metadata: {
          prediction,
          triggeringAnomalyId: anomaly.id
        }
      });
    }
  }

  private generatePredictions(): void {
    // Generate predictions for key metrics every few iterations
    if (Math.random() < 0.3) { // 30% chance each monitoring cycle
      const keyMetrics = ['cpu_usage', 'memory_usage', 'api_response_time', 'error_rate'];
      const randomMetric = keyMetrics[Math.floor(Math.random() * keyMetrics.length)];
      this.generatePredictionForMetric(randomMetric);
    }
  }

  private async generatePredictionForMetric(metricName: string, timeHorizon: number = 30): Promise<PredictionResult | null> {
    const metrics = this.metricsHistory.get(metricName);
    if (!metrics || metrics.length < 10) {
      return null;
    }

    const recentMetrics = metrics.slice(-20); // Last 20 data points
    const values = recentMetrics.map(m => m.value);
    const currentValue = values[values.length - 1];

    // Simple linear trend analysis
    const trend = this.calculateTrend(values);
    const trendSlope = this.calculateTrendSlope(values);
    
    // Predict future value based on trend
    const predictedValue = currentValue + (trendSlope * (timeHorizon / 60)); // Convert minutes to data points
    
    // Calculate confidence based on trend consistency
    const confidence = this.calculatePredictionConfidence(values);
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(metricName, currentValue, predictedValue, trend);

    const prediction: PredictionResult = {
      metricName,
      currentValue,
      predictedValue,
      confidence,
      trend,
      timeHorizon,
      riskLevel
    };

    console.log(`🔮 Prediction for ${metricName}: ${currentValue.toFixed(2)} → ${predictedValue.toFixed(2)} (${trend}, risk: ${riskLevel})`);

    return prediction;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 5) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    const threshold = Math.abs(firstAvg) * 0.05; // 5% threshold
    
    if (Math.abs(difference) < threshold) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculatePredictionConfidence(values: number[]): number {
    if (values.length < 5) return 0.3;
    
    // Calculate how consistent the trend is
    const slopes: number[] = [];
    for (let i = 0; i < values.length - 1; i++) {
      slopes.push(values[i + 1] - values[i]);
    }
    
    const slopeVariance = slopes.reduce((sum, slope) => {
      const mean = slopes.reduce((s, v) => s + v, 0) / slopes.length;
      return sum + Math.pow(slope - mean, 2);
    }, 0) / slopes.length;
    
    // Lower variance = higher confidence
    const maxVariance = 100; // Adjust based on your metrics scale
    return Math.max(0.1, Math.min(1.0, 1 - (slopeVariance / maxVariance)));
  }

  private assessRiskLevel(metricName: string, currentValue: number, predictedValue: number, trend: string): 'low' | 'medium' | 'high' {
    // Define risk thresholds for different metrics
    const riskThresholds: Record<string, { medium: number; high: number }> = {
      cpu_usage: { medium: 70, high: 85 },
      memory_usage: { medium: 75, high: 90 },
      api_response_time: { medium: 3000, high: 5000 },
      db_pool_usage: { medium: 70, high: 85 },
      request_rate: { medium: 1000, high: 2000 },
      error_rate: { medium: 5, high: 10 }
    };

    const thresholds = riskThresholds[metricName];
    if (!thresholds) return 'low';

    const valueToCheck = Math.max(currentValue, predictedValue);
    
    if (valueToCheck > thresholds.high) return 'high';
    if (valueToCheck > thresholds.medium) return 'medium';
    
    // Consider trend direction
    if (trend === 'increasing' && predictedValue > currentValue * 1.2) {
      return 'medium';
    }
    
    return 'low';
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [metricName, metrics] of this.metricsHistory.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp.getTime() > cutoffTime);
      this.metricsHistory.set(metricName, filteredMetrics);
    }

    // Cleanup old anomalies
    this.detectedAnomalies = this.detectedAnomalies.filter(
      anomaly => anomaly.timestamp.getTime() > cutoffTime
    );
  }

  // Public methods for querying
  getMetricHistory(metricName: string, hours: number = 1): MetricValue[] {
    const metrics = this.metricsHistory.get(metricName) || [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return metrics.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  getRecentAnomalies(hours: number = 24): Anomaly[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.detectedAnomalies.filter(a => a.timestamp.getTime() > cutoffTime);
  }

  async getCurrentPredictions(): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];
    const keyMetrics = ['cpu_usage', 'memory_usage', 'api_response_time', 'error_rate'];
    
    for (const metricName of keyMetrics) {
      const prediction = await this.generatePredictionForMetric(metricName);
      if (prediction) {
        predictions.push(prediction);
      }
    }
    
    return predictions;
  }

  getAnomalyStats(hours: number = 24): any {
    const anomalies = this.getRecentAnomalies(hours);
    
    return {
      total: anomalies.length,
      byMetric: anomalies.reduce((acc, a) => {
        acc[a.metricName] = (acc[a.metricName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: anomalies.reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageConfidence: anomalies.length > 0 
        ? anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length
        : 0
    };
  }
}

export { PredictiveMonitor };