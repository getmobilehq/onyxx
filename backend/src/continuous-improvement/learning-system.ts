import { IncidentLog } from '../monitoring/incident-response';
import { PostMortemData } from './post-mortem-system';
import { DeploymentSafetyReport } from './deployment-safety';
import { logger } from '../logging/advanced-logger';

export interface LearningPattern {
  id: string;
  type: 'incident_pattern' | 'performance_trend' | 'deployment_risk' | 'user_behavior';
  pattern: string;
  confidence: number; // 0-1
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  examples: string[]; // IDs of incidents/events that match this pattern
  metadata: Record<string, any>;
  actionable: boolean;
  recommendations: string[];
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'troubleshooting' | 'prevention' | 'best_practice' | 'lesson_learned';
  content: string;
  tags: string[];
  source: 'incident' | 'deployment' | 'manual' | 'external';
  sourceId?: string;
  confidence: number;
  usefulness: number; // Rating from team
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface LearningInsight {
  id: string;
  insight: string;
  category: 'risk_reduction' | 'efficiency_improvement' | 'process_optimization' | 'technical_debt';
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  evidence: string[];
  actionItems: string[];
  createdAt: Date;
}

export interface TeamCapability {
  area: string;
  currentLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  desiredLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  gapAnalysis: string[];
  trainingRecommendations: string[];
  lastAssessed: Date;
}

class ContinuousLearningSystem {
  private patterns: Map<string, LearningPattern> = new Map();
  private knowledgeBase: Map<string, KnowledgeItem> = new Map();
  private insights: Map<string, LearningInsight> = new Map();
  private teamCapabilities: Map<string, TeamCapability> = new Map();
  private learningMetrics: any = {
    patternsIdentified: 0,
    knowledgeItemsCreated: 0,
    insightsGenerated: 0,
    preventedIncidents: 0,
    efficiencyGains: []
  };

  constructor() {
    this.initializeCapabilityAreas();
    this.startPeriodicAnalysis();
  }

  private initializeCapabilityAreas(): void {
    const capabilityAreas = [
      'Incident Response',
      'Database Management',
      'API Design',
      'Security Practices',
      'Deployment Procedures',
      'Monitoring & Alerting',
      'Performance Optimization',
      'Data Integrity',
      'Error Handling',
      'Testing Strategies'
    ];

    capabilityAreas.forEach(area => {
      this.teamCapabilities.set(area, {
        area,
        currentLevel: 'intermediate', // Default assessment
        desiredLevel: 'advanced',
        gapAnalysis: [],
        trainingRecommendations: [],
        lastAssessed: new Date()
      });
    });
  }

  private startPeriodicAnalysis(): void {
    // Run pattern analysis every hour
    setInterval(() => {
      this.identifyPatterns();
    }, 60 * 60 * 1000);

    // Generate insights daily
    setInterval(() => {
      this.generateInsights();
    }, 24 * 60 * 60 * 1000);

    // Update capabilities weekly
    setInterval(() => {
      this.updateCapabilityAssessments();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  async learnFromIncident(incident: IncidentLog, postMortem?: PostMortemData): Promise<void> {
    logger.info('learning_system', `Learning from incident ${incident.id}`, {
      incidentType: incident.incidentType,
      severity: incident.severity
    });

    // Extract patterns
    await this.extractIncidentPatterns(incident);

    // Create knowledge items
    if (postMortem) {
      await this.createKnowledgeFromPostMortem(postMortem);
    }

    // Update team capabilities based on incident handling
    await this.updateCapabilitiesFromIncident(incident);

    // Generate specific insights
    await this.generateIncidentInsights(incident, postMortem);

    this.learningMetrics.patternsIdentified++;
    
    logger.info('learning_system', `Learning completed for incident ${incident.id}`);
  }

  private async extractIncidentPatterns(incident: IncidentLog): Promise<void> {
    // Time-based patterns
    const timePattern = this.analyzeTimePattern(incident.timestamp);
    if (timePattern) {
      this.updatePattern(`time_${timePattern}`, 'incident_pattern', 
        `Incidents tend to occur during ${timePattern}`, [incident.id]);
    }

    // Type-based patterns
    const typePattern = `${incident.incidentType}_${incident.severity}`;
    this.updatePattern(typePattern, 'incident_pattern',
      `${incident.incidentType} incidents with ${incident.severity} severity`, [incident.id]);

    // Resolution patterns
    if (incident.autoRemediation && incident.status === 'resolved') {
      this.updatePattern('auto_remediation_success', 'incident_pattern',
        'Successful automatic remediation for similar incidents', [incident.id]);
    }

    // Escalation patterns
    if (incident.escalated) {
      this.updatePattern('escalation_required', 'incident_pattern',
        'Incidents that required escalation', [incident.id]);
    }
  }

  private analyzeTimePattern(timestamp: Date): string | null {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Define time periods
    if (hour >= 22 || hour < 6) return 'night_hours';
    if (hour >= 9 && hour < 17) return 'business_hours';
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    if (hour >= 17 && hour < 22) return 'evening_hours';
    
    return 'standard_hours';
  }

  private updatePattern(
    patternId: string, 
    type: LearningPattern['type'], 
    description: string, 
    examples: string[]
  ): void {
    const existing = this.patterns.get(patternId);
    
    if (existing) {
      existing.frequency++;
      existing.lastSeen = new Date();
      existing.examples.push(...examples);
      existing.confidence = Math.min(1.0, existing.confidence + 0.1);
    } else {
      this.patterns.set(patternId, {
        id: patternId,
        type,
        pattern: description,
        confidence: 0.3,
        frequency: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        examples: [...examples],
        metadata: {},
        actionable: true,
        recommendations: this.generatePatternRecommendations(type, description)
      });
    }
  }

  private generatePatternRecommendations(type: string, description: string): string[] {
    const recommendations: string[] = [];
    
    if (description.includes('night_hours')) {
      recommendations.push('Consider implementing automated monitoring alerts for night hours');
      recommendations.push('Establish on-call rotation procedures');
    }
    
    if (description.includes('auto_remediation_success')) {
      recommendations.push('Expand automated remediation to similar incident types');
      recommendations.push('Document successful remediation patterns');
    }
    
    if (description.includes('escalation_required')) {
      recommendations.push('Review and improve first-line response procedures');
      recommendations.push('Enhance escalation criteria and timing');
    }
    
    return recommendations;
  }

  private async createKnowledgeFromPostMortem(postMortem: PostMortemData): Promise<void> {
    // Create troubleshooting knowledge
    const troubleshootingId = `troubleshoot_${postMortem.id}`;
    this.knowledgeBase.set(troubleshootingId, {
      id: troubleshootingId,
      title: `Troubleshooting ${postMortem.incident.incidentType}`,
      category: 'troubleshooting',
      content: this.formatTroubleshootingGuide(postMortem),
      tags: [postMortem.incident.incidentType, postMortem.incident.severity, ...postMortem.tags],
      source: 'incident',
      sourceId: postMortem.incident.id,
      confidence: 0.8,
      usefulness: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    });

    // Create prevention knowledge
    const preventionId = `prevent_${postMortem.id}`;
    this.knowledgeBase.set(preventionId, {
      id: preventionId,
      title: `Preventing ${postMortem.incident.incidentType}`,
      category: 'prevention',
      content: this.formatPreventionGuide(postMortem),
      tags: ['prevention', postMortem.incident.incidentType, ...postMortem.tags],
      source: 'incident',
      sourceId: postMortem.incident.id,
      confidence: 0.9,
      usefulness: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    });

    // Create lessons learned
    postMortem.lessonsLearned.forEach((lesson, index) => {
      const lessonId = `lesson_${postMortem.id}_${index}`;
      this.knowledgeBase.set(lessonId, {
        id: lessonId,
        title: `Lesson: ${lesson.substring(0, 50)}...`,
        category: 'lesson_learned',
        content: lesson,
        tags: ['lesson_learned', postMortem.incident.incidentType],
        source: 'incident',
        sourceId: postMortem.incident.id,
        confidence: 0.7,
        usefulness: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    });

    this.learningMetrics.knowledgeItemsCreated += 2 + postMortem.lessonsLearned.length;
  }

  private formatTroubleshootingGuide(postMortem: PostMortemData): string {
    return `# Troubleshooting ${postMortem.incident.incidentType}

## Symptoms
- Incident Type: ${postMortem.incident.incidentType}
- Severity: ${postMortem.incident.severity}
- Common Signs: ${postMortem.rootCause.primaryCause}

## Root Causes
**Primary Cause:** ${postMortem.rootCause.primaryCause}

**Contributing Factors:**
${postMortem.rootCause.contributingFactors.map(f => `- ${f}`).join('\n')}

## Five Whys Analysis
${postMortem.rootCause.fiveWhys.map((w, i) => `${i + 1}. ${w}`).join('\n')}

## Resolution Steps
${postMortem.incident.remediationSteps?.map(s => `- ${s}`).join('\n') || 'No remediation steps recorded'}

## Timeline
${postMortem.timeline.map(t => `- ${t.timestamp.toISOString()}: ${t.event} - ${t.description}`).join('\n')}

## Prevention
See prevention guide for detailed prevention measures.
`;
  }

  private formatPreventionGuide(postMortem: PostMortemData): string {
    return `# Preventing ${postMortem.incident.incidentType}

## Overview
${postMortem.rootCause.primaryCause}

## Prevention Measures
${postMortem.preventionMeasures.map(p => `
### ${p.description}
- **Type:** ${p.type}
- **Implementation:** ${p.implementation}
- **Effectiveness:** ${p.effectiveness}
- **Cost:** ${p.cost}
- **Timeframe:** ${p.timeframe}
`).join('\n')}

## Monitoring Recommendations
- Implement early warning systems for ${postMortem.incident.incidentType}
- Set up automated alerts for contributing factors
- Regular health checks for related systems

## Action Items
${postMortem.actionItems.map(a => `- ${a.title} (Priority: ${a.priority})`).join('\n')}
`;
  }

  private async updateCapabilitiesFromIncident(incident: IncidentLog): Promise<void> {
    // Map incident types to capability areas
    const incidentToCapability: Record<string, string[]> = {
      'database_connection_failed': ['Database Management', 'Monitoring & Alerting'],
      'high_memory_usage': ['Performance Optimization', 'Monitoring & Alerting'],
      'api_performance_degraded': ['API Design', 'Performance Optimization'],
      'data_integrity_violation': ['Data Integrity', 'Database Management'],
      'external_service_failure': ['API Design', 'Error Handling']
    };

    const relevantCapabilities = incidentToCapability[incident.incidentType] || ['Incident Response'];
    
    relevantCapabilities.forEach(area => {
      const capability = this.teamCapabilities.get(area);
      if (capability) {
        // Assess based on incident handling success
        if (incident.autoRemediation && incident.status === 'resolved') {
          // Good automated response indicates higher capability
          if (capability.currentLevel === 'novice') capability.currentLevel = 'intermediate';
        } else if (incident.escalated) {
          // Escalation might indicate capability gap
          capability.gapAnalysis.push(`Incident ${incident.id} required escalation`);
        }
        
        capability.lastAssessed = new Date();
      }
    });
  }

  private async generateIncidentInsights(incident: IncidentLog, postMortem?: PostMortemData): Promise<void> {
    const insights: LearningInsight[] = [];
    
    // Risk reduction insights
    if (postMortem && postMortem.rootCause.preventable) {
      insights.push({
        id: `insight_risk_${incident.id}`,
        insight: `${incident.incidentType} incidents can be prevented through ${postMortem.preventionMeasures.map(p => p.type).join(', ')}`,
        category: 'risk_reduction',
        impact: incident.severity === 'critical' ? 'critical' : 'high',
        effort: 'medium',
        evidence: [`Incident ${incident.id}`, `Post-mortem ${postMortem.id}`],
        actionItems: postMortem.actionItems.filter(a => a.category === 'prevention').map(a => a.title),
        createdAt: new Date()
      });
    }

    // Efficiency insights
    if (incident.autoRemediation && incident.resolutionTime && incident.resolutionTime < 300000) { // < 5 minutes
      insights.push({
        id: `insight_efficiency_${incident.id}`,
        insight: 'Automated remediation significantly reduces resolution time for this incident type',
        category: 'efficiency_improvement',
        impact: 'medium',
        effort: 'low',
        evidence: [`Incident ${incident.id} resolved in ${incident.resolutionTime}ms`],
        actionItems: [`Expand automated remediation to similar incident types`],
        createdAt: new Date()
      });
    }

    insights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });

    this.learningMetrics.insightsGenerated += insights.length;
  }

  async learnFromDeployment(deploymentReport: DeploymentSafetyReport): Promise<void> {
    logger.info('learning_system', `Learning from deployment ${deploymentReport.deploymentId}`, {
      environment: deploymentReport.environment,
      overallStatus: deploymentReport.overallStatus
    });

    // Extract deployment patterns
    await this.extractDeploymentPatterns(deploymentReport);

    // Create knowledge from deployment issues
    if (deploymentReport.criticalIssues.length > 0 || deploymentReport.warnings.length > 0) {
      await this.createDeploymentKnowledge(deploymentReport);
    }

    // Update deployment-related capabilities
    await this.updateCapabilitiesFromDeployment(deploymentReport);

    logger.info('learning_system', `Deployment learning completed for ${deploymentReport.deploymentId}`);
  }

  private async extractDeploymentPatterns(report: DeploymentSafetyReport): Promise<void> {
    // Environment-based patterns
    const envPattern = `deployment_${report.environment}_${report.overallStatus}`;
    this.updatePattern(envPattern, 'deployment_risk',
      `${report.environment} deployments with ${report.overallStatus} status`, [report.deploymentId]);

    // Check failure patterns
    const failedChecks = report.checks.filter(c => c.status === 'failed');
    if (failedChecks.length > 0) {
      const checkPattern = `check_failures_${failedChecks.map(c => c.checkId).join('_')}`;
      this.updatePattern(checkPattern, 'deployment_risk',
        `Common deployment check failures: ${failedChecks.map(c => c.checkId).join(', ')}`, [report.deploymentId]);
    }
  }

  private async createDeploymentKnowledge(report: DeploymentSafetyReport): Promise<void> {
    const knowledgeId = `deploy_knowledge_${report.deploymentId}`;
    
    let content = `# Deployment Issues: ${report.deploymentId}\n\n`;
    
    if (report.criticalIssues.length > 0) {
      content += `## Critical Issues\n${report.criticalIssues.map(i => `- ${i}`).join('\n')}\n\n`;
    }
    
    if (report.warnings.length > 0) {
      content += `## Warnings\n${report.warnings.map(w => `- ${w}`).join('\n')}\n\n`;
    }
    
    const failedChecks = report.checks.filter(c => c.status === 'failed');
    if (failedChecks.length > 0) {
      content += `## Failed Checks\n${failedChecks.map(c => `- ${c.checkId}: ${c.error || 'Unknown error'}`).join('\n')}\n\n`;
    }

    this.knowledgeBase.set(knowledgeId, {
      id: knowledgeId,
      title: `Deployment Issues: ${report.environment} - ${report.version}`,
      category: 'troubleshooting',
      content,
      tags: ['deployment', report.environment, report.overallStatus],
      source: 'deployment',
      sourceId: report.deploymentId,
      confidence: 0.8,
      usefulness: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    });
  }

  private async updateCapabilitiesFromDeployment(report: DeploymentSafetyReport): Promise<void> {
    const capability = this.teamCapabilities.get('Deployment Procedures');
    if (capability) {
      if (report.overallStatus === 'safe' && report.criticalIssues.length === 0) {
        // Successful deployment indicates good capability
        if (capability.currentLevel === 'novice') capability.currentLevel = 'intermediate';
      } else if (report.criticalIssues.length > 0) {
        capability.gapAnalysis.push(`Deployment ${report.deploymentId} had critical issues`);
      }
      
      capability.lastAssessed = new Date();
    }
  }

  private async identifyPatterns(): Promise<void> {
    // This would analyze historical data to identify new patterns
    // For now, we'll just log the current pattern count
    logger.debug('learning_system', `Pattern identification completed`, {
      totalPatterns: this.patterns.size,
      highConfidencePatterns: Array.from(this.patterns.values()).filter(p => p.confidence > 0.7).length
    });
  }

  private async generateInsights(): Promise<void> {
    // Analyze patterns to generate actionable insights
    const highFrequencyPatterns = Array.from(this.patterns.values())
      .filter(p => p.frequency > 5 && p.confidence > 0.6);

    for (const pattern of highFrequencyPatterns) {
      const insightId = `pattern_insight_${pattern.id}`;
      
      if (!this.insights.has(insightId)) {
        this.insights.set(insightId, {
          id: insightId,
          insight: `Pattern identified: ${pattern.pattern} (occurs frequently with high confidence)`,
          category: 'process_optimization',
          impact: pattern.frequency > 10 ? 'high' : 'medium',
          effort: 'medium',
          evidence: pattern.examples.slice(0, 5),
          actionItems: pattern.recommendations,
          createdAt: new Date()
        });
        
        this.learningMetrics.insightsGenerated++;
      }
    }
  }

  private async updateCapabilityAssessments(): Promise<void> {
    // Periodic assessment of team capabilities
    this.teamCapabilities.forEach((capability, area) => {
      // Generate training recommendations based on gaps
      if (capability.gapAnalysis.length > 3) {
        capability.trainingRecommendations = [
          `Focus on ${area} best practices`,
          `Implement additional monitoring for ${area}`,
          `Create runbooks for common ${area} scenarios`
        ];
      }
    });
  }

  // Public query methods
  getPatterns(type?: LearningPattern['type']): LearningPattern[] {
    const patterns = Array.from(this.patterns.values());
    return type ? patterns.filter(p => p.type === type) : patterns;
  }

  searchKnowledge(query: string, category?: string): KnowledgeItem[] {
    const items = Array.from(this.knowledgeBase.values());
    let filtered = items;
    
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }
    
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    return filtered.sort((a, b) => b.confidence - a.confidence);
  }

  getInsights(category?: string, impact?: string): LearningInsight[] {
    const insights = Array.from(this.insights.values());
    let filtered = insights;
    
    if (category) {
      filtered = filtered.filter(insight => insight.category === category);
    }
    
    if (impact) {
      filtered = filtered.filter(insight => insight.impact === impact);
    }
    
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getCapabilityAssessment(): TeamCapability[] {
    return Array.from(this.teamCapabilities.values());
  }

  getLearningMetrics(): any {
    return {
      ...this.learningMetrics,
      totalPatterns: this.patterns.size,
      totalKnowledgeItems: this.knowledgeBase.size,
      totalInsights: this.insights.size,
      lastUpdated: new Date()
    };
  }

  // Knowledge management methods
  addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): string {
    const id = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.knowledgeBase.set(id, {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    });
    
    this.learningMetrics.knowledgeItemsCreated++;
    return id;
  }

  updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): boolean {
    const item = this.knowledgeBase.get(id);
    if (!item) return false;
    
    const updated = {
      ...item,
      ...updates,
      updatedAt: new Date(),
      version: item.version + 1
    };
    
    this.knowledgeBase.set(id, updated);
    return true;
  }

  rateKnowledge(id: string, usefulness: number): boolean {
    const item = this.knowledgeBase.get(id);
    if (!item) return false;
    
    item.usefulness = Math.max(0, Math.min(5, usefulness));
    item.updatedAt = new Date();
    
    return true;
  }

  generateLearningReport(): any {
    return {
      summary: {
        totalPatterns: this.patterns.size,
        totalKnowledge: this.knowledgeBase.size,
        totalInsights: this.insights.size,
        learningVelocity: this.learningMetrics.knowledgeItemsCreated
      },
      topPatterns: Array.from(this.patterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
      recentInsights: Array.from(this.insights.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10),
      capabilityGaps: Array.from(this.teamCapabilities.values())
        .filter(c => c.gapAnalysis.length > 0)
        .sort((a, b) => b.gapAnalysis.length - a.gapAnalysis.length),
      recommendations: this.generateSystemRecommendations(),
      metrics: this.getLearningMetrics()
    };
  }

  private generateSystemRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Pattern-based recommendations
    const criticalPatterns = Array.from(this.patterns.values())
      .filter(p => p.confidence > 0.8 && p.frequency > 5);
    
    if (criticalPatterns.length > 0) {
      recommendations.push(`Address ${criticalPatterns.length} high-confidence patterns to prevent future incidents`);
    }
    
    // Capability-based recommendations
    const capabilityGaps = Array.from(this.teamCapabilities.values())
      .filter(c => c.gapAnalysis.length > 2);
    
    if (capabilityGaps.length > 0) {
      recommendations.push(`Focus training on ${capabilityGaps.map(c => c.area).join(', ')} to address capability gaps`);
    }
    
    // Knowledge-based recommendations
    const lowRatedKnowledge = Array.from(this.knowledgeBase.values())
      .filter(k => k.usefulness < 2 && k.version > 1);
    
    if (lowRatedKnowledge.length > 0) {
      recommendations.push(`Review and update ${lowRatedKnowledge.length} low-rated knowledge items`);
    }
    
    return recommendations;
  }
}

export { ContinuousLearningSystem };