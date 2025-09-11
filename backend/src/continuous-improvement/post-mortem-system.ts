import { IncidentLog } from '../monitoring/incident-response';
import { RecoveryExecution } from '../monitoring/recovery-system';
import { logger } from '../logging/advanced-logger';
import * as fs from 'fs';
import * as path from 'path';

export interface PostMortemData {
  id: string;
  incident: IncidentLog;
  timeline: TimelineEvent[];
  rootCause: RootCauseAnalysis;
  impact: ImpactAssessment;
  actionItems: ActionItem[];
  lessonsLearned: string[];
  preventionMeasures: PreventionMeasure[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'review' | 'approved' | 'published';
  author: string;
  reviewers: string[];
  tags: string[];
}

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
  actor: 'system' | 'human' | 'external';
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  category: 'technical' | 'process' | 'human' | 'external';
  preventable: boolean;
  fiveWhys: string[];
  evidenceLinks: string[];
}

export interface ImpactAssessment {
  duration: number; // minutes
  usersAffected: number;
  servicesAffected: string[];
  dataLoss: boolean;
  financialImpact?: number;
  reputationImpact: 'none' | 'low' | 'medium' | 'high';
  slaViolation: boolean;
  customerComplaints: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: 'prevention' | 'detection' | 'response' | 'recovery';
  estimatedEffort?: string;
  completedAt?: Date;
}

export interface PreventionMeasure {
  id: string;
  type: 'monitoring' | 'testing' | 'process' | 'automation' | 'training';
  description: string;
  implementation: string;
  effectiveness: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  timeframe: string;
}

class PostMortemAutomation {
  private postMortems: Map<string, PostMortemData> = new Map();
  private templatePath: string;
  private storagePath: string;
  
  constructor() {
    this.templatePath = path.join(process.cwd(), 'templates', 'post-mortem');
    this.storagePath = path.join(process.cwd(), 'post-mortems');
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async generatePostMortem(
    incident: IncidentLog,
    recoveryData?: RecoveryExecution[],
    manualInputs?: Partial<PostMortemData>
  ): Promise<PostMortemData> {
    const postMortemId = `pm_${incident.id}_${Date.now()}`;
    
    // Generate timeline automatically
    const timeline = this.generateTimeline(incident, recoveryData);
    
    // Perform automated root cause analysis
    const rootCause = await this.analyzeRootCause(incident, timeline);
    
    // Assess impact
    const impact = this.assessImpact(incident, timeline);
    
    // Generate action items
    const actionItems = this.generateActionItems(rootCause, impact);
    
    // Extract lessons learned
    const lessonsLearned = this.extractLessonsLearned(incident, rootCause);
    
    // Suggest prevention measures
    const preventionMeasures = this.suggestPreventionMeasures(rootCause, incident);
    
    const postMortem: PostMortemData = {
      id: postMortemId,
      incident,
      timeline,
      rootCause,
      impact,
      actionItems,
      lessonsLearned,
      preventionMeasures,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      author: 'system',
      reviewers: [],
      tags: this.generateTags(incident, rootCause),
      ...manualInputs
    };

    this.postMortems.set(postMortemId, postMortem);
    await this.savePostMortem(postMortem);
    
    logger.info('post_mortem', `Post-mortem generated for incident ${incident.id}`, {
      postMortemId,
      incidentType: incident.incidentType,
      severity: incident.severity
    });

    return postMortem;
  }

  private generateTimeline(incident: IncidentLog, recoveryData?: RecoveryExecution[]): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];
    
    // Incident detection
    timeline.push({
      timestamp: incident.timestamp,
      event: 'Incident Detected',
      description: `${incident.incidentType} detected with severity ${incident.severity}`,
      actor: 'system',
      severity: incident.severity === 'critical' ? 'critical' : 
                incident.severity === 'high' ? 'warning' : 'info',
      metadata: incident.metadata
    });

    // Remediation steps
    if (incident.remediationSteps) {
      incident.remediationSteps.forEach((step, index) => {
        const timestamp = new Date(incident.timestamp.getTime() + (index + 1) * 60000); // Estimate 1 min per step
        timeline.push({
          timestamp,
          event: 'Remediation Step',
          description: step,
          actor: incident.autoRemediation ? 'system' : 'human',
          severity: 'info'
        });
      });
    }

    // Recovery actions
    if (recoveryData) {
      recoveryData.forEach(recovery => {
        timeline.push({
          timestamp: recovery.timestamp,
          event: 'Recovery Action',
          description: `Recovery action ${recovery.actionId} ${recovery.status}`,
          actor: 'system',
          severity: recovery.status === 'failed' ? 'warning' : 'info',
          metadata: recovery.metadata
        });
      });
    }

    // Resolution or escalation
    if (incident.status === 'resolved') {
      const resolutionTime = incident.resolutionTime 
        ? new Date(incident.timestamp.getTime() + incident.resolutionTime)
        : new Date();
      
      timeline.push({
        timestamp: resolutionTime,
        event: 'Incident Resolved',
        description: `Incident resolved after ${incident.resolutionTime}ms`,
        actor: 'system',
        severity: 'info'
      });
    } else if (incident.escalated) {
      timeline.push({
        timestamp: new Date(),
        event: 'Incident Escalated',
        description: 'Incident escalated due to prolonged resolution time',
        actor: 'system',
        severity: 'warning'
      });
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private async analyzeRootCause(incident: IncidentLog, timeline: TimelineEvent[]): Promise<RootCauseAnalysis> {
    // Automated root cause analysis based on incident type
    const causePatterns: Record<string, Partial<RootCauseAnalysis>> = {
      'database_connection_failed': {
        primaryCause: 'Database connection pool exhaustion or network failure',
        contributingFactors: [
          'High connection demand',
          'Insufficient pool size',
          'Network latency',
          'Database server overload'
        ],
        category: 'technical',
        preventable: true
      },
      'high_memory_usage': {
        primaryCause: 'Memory leak or inefficient memory management',
        contributingFactors: [
          'Unbounded cache growth',
          'Large object retention',
          'Insufficient garbage collection',
          'Memory-intensive operations'
        ],
        category: 'technical',
        preventable: true
      },
      'api_performance_degraded': {
        primaryCause: 'API performance degradation due to high load or inefficient queries',
        contributingFactors: [
          'Unoptimized database queries',
          'Missing indexes',
          'High request volume',
          'Insufficient caching'
        ],
        category: 'technical',
        preventable: true
      },
      'data_integrity_violation': {
        primaryCause: 'Data consistency issues due to concurrent modifications or bugs',
        contributingFactors: [
          'Race conditions',
          'Missing transaction boundaries',
          'Validation gaps',
          'Schema drift'
        ],
        category: 'technical',
        preventable: true
      }
    };

    const pattern = causePatterns[incident.incidentType] || {
      primaryCause: 'Unknown root cause - requires manual investigation',
      contributingFactors: ['Insufficient monitoring data'],
      category: 'technical',
      preventable: false
    };

    // Generate Five Whys analysis
    const fiveWhys = this.generateFiveWhys(incident, pattern.primaryCause);

    return {
      ...pattern,
      fiveWhys,
      evidenceLinks: timeline.map(t => `Timeline: ${t.event} at ${t.timestamp.toISOString()}`)
    } as RootCauseAnalysis;
  }

  private generateFiveWhys(incident: IncidentLog, primaryCause: string): string[] {
    const whys: string[] = [];
    
    // Automated Five Whys based on incident type
    switch (incident.incidentType) {
      case 'database_connection_failed':
        whys.push('Why did the database connection fail? - Connection pool was exhausted');
        whys.push('Why was the connection pool exhausted? - Too many concurrent requests');
        whys.push('Why were there too many concurrent requests? - Spike in user traffic');
        whys.push('Why did traffic spike cause issues? - Pool size not scaled for peak load');
        whys.push('Why was pool size insufficient? - Capacity planning did not account for growth');
        break;
      
      case 'high_memory_usage':
        whys.push('Why was memory usage high? - Objects not being garbage collected');
        whys.push('Why were objects retained? - References held in global scope');
        whys.push('Why were references not cleared? - Missing cleanup in event handlers');
        whys.push('Why were handlers not cleaned? - No lifecycle management implemented');
        whys.push('Why no lifecycle management? - Technical debt from rapid development');
        break;
      
      default:
        whys.push(`Why did ${incident.incidentType} occur? - ${primaryCause}`);
        whys.push('Why did the primary cause happen? - Insufficient preventive measures');
        whys.push('Why were preventive measures insufficient? - Gap in monitoring coverage');
        whys.push('Why was there a monitoring gap? - Risk not identified in planning');
        whys.push('Why was risk not identified? - Incomplete threat modeling');
    }

    return whys;
  }

  private assessImpact(incident: IncidentLog, timeline: TimelineEvent[]): ImpactAssessment {
    const startTime = incident.timestamp;
    const endTime = incident.status === 'resolved' && incident.resolutionTime
      ? new Date(startTime.getTime() + incident.resolutionTime)
      : new Date();
    
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000); // Convert to minutes

    // Estimate impact based on incident severity and type
    const severityMultiplier = {
      'critical': 1000,
      'high': 500,
      'medium': 100,
      'low': 10
    }[incident.severity] || 10;

    return {
      duration,
      usersAffected: severityMultiplier * (duration / 60), // Rough estimate
      servicesAffected: this.getAffectedServices(incident.incidentType),
      dataLoss: incident.incidentType === 'data_integrity_violation',
      financialImpact: duration * severityMultiplier * 10, // Rough cost estimate
      reputationImpact: incident.severity === 'critical' ? 'high' : 
                       incident.severity === 'high' ? 'medium' : 'low',
      slaViolation: duration > 60 && incident.severity !== 'low',
      customerComplaints: Math.floor(severityMultiplier * duration / 100)
    };
  }

  private getAffectedServices(incidentType: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'database_connection_failed': ['Database', 'API', 'Authentication', 'Reports'],
      'high_memory_usage': ['Application Server', 'Background Jobs'],
      'api_performance_degraded': ['API', 'Frontend', 'Mobile Apps'],
      'data_integrity_violation': ['Database', 'Reports', 'Analytics'],
      'external_service_failure': ['Email', 'File Storage', 'Third-party APIs']
    };

    return serviceMap[incidentType] || ['Unknown Service'];
  }

  private generateActionItems(rootCause: RootCauseAnalysis, impact: ImpactAssessment): ActionItem[] {
    const actionItems: ActionItem[] = [];
    const baseDate = new Date();

    // High priority items for preventable incidents
    if (rootCause.preventable) {
      actionItems.push({
        id: `action_${Date.now()}_1`,
        title: `Implement monitoring for ${rootCause.primaryCause}`,
        description: `Add comprehensive monitoring and alerting to detect early signs of ${rootCause.primaryCause}`,
        priority: 'high',
        dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
        status: 'pending',
        category: 'detection',
        estimatedEffort: '2-3 days'
      });

      actionItems.push({
        id: `action_${Date.now()}_2`,
        title: 'Add automated prevention measures',
        description: `Implement automated safeguards to prevent ${rootCause.primaryCause}`,
        priority: impact.slaViolation ? 'critical' : 'high',
        dueDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        status: 'pending',
        category: 'prevention',
        estimatedEffort: '3-5 days'
      });
    }

    // Response improvements
    actionItems.push({
      id: `action_${Date.now()}_3`,
      title: 'Improve incident response playbook',
      description: `Update runbooks with specific steps for handling ${rootCause.category} incidents`,
      priority: 'medium',
      dueDate: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
      status: 'pending',
      category: 'response',
      estimatedEffort: '1 day'
    });

    // Recovery improvements if impact was significant
    if (impact.duration > 30 || impact.reputationImpact === 'high') {
      actionItems.push({
        id: `action_${Date.now()}_4`,
        title: 'Enhance recovery mechanisms',
        description: 'Implement faster recovery strategies and rollback procedures',
        priority: 'high',
        dueDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 1 month
        status: 'pending',
        category: 'recovery',
        estimatedEffort: '1 week'
      });
    }

    return actionItems;
  }

  private extractLessonsLearned(incident: IncidentLog, rootCause: RootCauseAnalysis): string[] {
    const lessons: string[] = [];

    // Technical lessons
    if (rootCause.category === 'technical') {
      lessons.push(`Technical debt in ${incident.incidentType} area needs immediate attention`);
      lessons.push('Monitoring gaps allowed issue to escalate before detection');
    }

    // Process lessons
    if (incident.escalated) {
      lessons.push('Escalation procedures need optimization for faster resolution');
    }

    // Response lessons
    if (incident.autoRemediation && incident.status === 'failed') {
      lessons.push('Automated remediation scripts need improvement and testing');
    } else if (incident.autoRemediation && incident.status === 'resolved') {
      lessons.push('Automated remediation successfully reduced resolution time');
    }

    // Prevention lessons
    rootCause.contributingFactors.forEach(factor => {
      lessons.push(`Contributing factor identified: ${factor} - needs preventive measures`);
    });

    return lessons;
  }

  private suggestPreventionMeasures(rootCause: RootCauseAnalysis, incident: IncidentLog): PreventionMeasure[] {
    const measures: PreventionMeasure[] = [];

    // Monitoring improvements
    measures.push({
      id: `prevent_${Date.now()}_1`,
      type: 'monitoring',
      description: `Implement predictive monitoring for ${incident.incidentType}`,
      implementation: 'Deploy anomaly detection algorithms with early warning thresholds',
      effectiveness: 'high',
      cost: 'medium',
      timeframe: '2 weeks'
    });

    // Testing improvements
    if (rootCause.preventable) {
      measures.push({
        id: `prevent_${Date.now()}_2`,
        type: 'testing',
        description: 'Add chaos engineering tests for failure scenarios',
        implementation: 'Implement regular chaos testing to simulate and prevent failures',
        effectiveness: 'high',
        cost: 'low',
        timeframe: '1 month'
      });
    }

    // Process improvements
    measures.push({
      id: `prevent_${Date.now()}_3`,
      type: 'process',
      description: 'Enhance deployment safety checks',
      implementation: 'Add pre-deployment validation and gradual rollout procedures',
      effectiveness: 'medium',
      cost: 'low',
      timeframe: '1 week'
    });

    // Automation improvements
    if (incident.autoRemediation === false) {
      measures.push({
        id: `prevent_${Date.now()}_4`,
        type: 'automation',
        description: `Automate recovery for ${incident.incidentType}`,
        implementation: 'Develop and test automated recovery scripts',
        effectiveness: 'high',
        cost: 'medium',
        timeframe: '3 weeks'
      });
    }

    return measures;
  }

  private generateTags(incident: IncidentLog, rootCause: RootCauseAnalysis): string[] {
    const tags: string[] = [];
    
    tags.push(incident.incidentType);
    tags.push(incident.severity);
    tags.push(rootCause.category);
    
    if (rootCause.preventable) tags.push('preventable');
    if (incident.autoRemediation) tags.push('auto-remediated');
    if (incident.escalated) tags.push('escalated');
    
    return tags;
  }

  private async savePostMortem(postMortem: PostMortemData): Promise<void> {
    const fileName = `${postMortem.id}.json`;
    const filePath = path.join(this.storagePath, fileName);
    
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(postMortem, null, 2));
      
      // Also generate markdown report
      const markdownReport = this.generateMarkdownReport(postMortem);
      const mdPath = path.join(this.storagePath, `${postMortem.id}.md`);
      await fs.promises.writeFile(mdPath, markdownReport);
      
    } catch (error) {
      logger.error('post_mortem', 'Failed to save post-mortem', error as Error);
    }
  }

  private generateMarkdownReport(postMortem: PostMortemData): string {
    const report = `# Post-Mortem Report: ${postMortem.incident.incidentType}

## Executive Summary
- **Incident ID:** ${postMortem.incident.id}
- **Severity:** ${postMortem.incident.severity}
- **Date:** ${postMortem.incident.timestamp.toISOString()}
- **Duration:** ${postMortem.impact.duration} minutes
- **Status:** ${postMortem.incident.status}

## Impact Assessment
- **Users Affected:** ${postMortem.impact.usersAffected}
- **Services Affected:** ${postMortem.impact.servicesAffected.join(', ')}
- **Data Loss:** ${postMortem.impact.dataLoss ? 'Yes' : 'No'}
- **SLA Violation:** ${postMortem.impact.slaViolation ? 'Yes' : 'No'}
- **Financial Impact:** $${postMortem.impact.financialImpact || 0}
- **Reputation Impact:** ${postMortem.impact.reputationImpact}

## Timeline
${postMortem.timeline.map(t => 
  `- **${t.timestamp.toISOString()}** [${t.severity}] ${t.event}: ${t.description}`
).join('\n')}

## Root Cause Analysis
### Primary Cause
${postMortem.rootCause.primaryCause}

### Contributing Factors
${postMortem.rootCause.contributingFactors.map(f => `- ${f}`).join('\n')}

### Five Whys
${postMortem.rootCause.fiveWhys.map((w, i) => `${i + 1}. ${w}`).join('\n')}

## Lessons Learned
${postMortem.lessonsLearned.map(l => `- ${l}`).join('\n')}

## Action Items
${postMortem.actionItems.map(a => 
  `### ${a.title}
- **Priority:** ${a.priority}
- **Category:** ${a.category}
- **Due Date:** ${a.dueDate?.toISOString() || 'TBD'}
- **Status:** ${a.status}
- **Description:** ${a.description}
- **Estimated Effort:** ${a.estimatedEffort || 'TBD'}`
).join('\n\n')}

## Prevention Measures
${postMortem.preventionMeasures.map(p => 
  `### ${p.description}
- **Type:** ${p.type}
- **Implementation:** ${p.implementation}
- **Effectiveness:** ${p.effectiveness}
- **Cost:** ${p.cost}
- **Timeframe:** ${p.timeframe}`
).join('\n\n')}

## Tags
${postMortem.tags.map(t => `\`${t}\``).join(' ')}

---
*Generated: ${postMortem.createdAt.toISOString()}*
*Status: ${postMortem.status}*
`;

    return report;
  }

  // Query and management methods
  async getPostMortem(id: string): Promise<PostMortemData | null> {
    if (this.postMortems.has(id)) {
      return this.postMortems.get(id)!;
    }

    // Try to load from file
    const filePath = path.join(this.storagePath, `${id}.json`);
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8');
      const postMortem = JSON.parse(data);
      this.postMortems.set(id, postMortem);
      return postMortem;
    } catch (error) {
      return null;
    }
  }

  async updatePostMortem(id: string, updates: Partial<PostMortemData>): Promise<PostMortemData | null> {
    const postMortem = await this.getPostMortem(id);
    if (!postMortem) return null;

    const updated = {
      ...postMortem,
      ...updates,
      updatedAt: new Date()
    };

    this.postMortems.set(id, updated);
    await this.savePostMortem(updated);

    return updated;
  }

  async searchPostMortems(criteria: {
    incidentType?: string;
    severity?: string;
    tag?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<PostMortemData[]> {
    const allPostMortems: PostMortemData[] = [];
    
    // Load all post-mortems from storage
    const files = await fs.promises.readdir(this.storagePath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        const pm = await this.getPostMortem(id);
        if (pm) allPostMortems.push(pm);
      }
    }

    // Apply filters
    return allPostMortems.filter(pm => {
      if (criteria.incidentType && pm.incident.incidentType !== criteria.incidentType) return false;
      if (criteria.severity && pm.incident.severity !== criteria.severity) return false;
      if (criteria.tag && !pm.tags.includes(criteria.tag)) return false;
      if (criteria.dateFrom && pm.createdAt < criteria.dateFrom) return false;
      if (criteria.dateTo && pm.createdAt > criteria.dateTo) return false;
      return true;
    });
  }

  async getActionItemsSummary(): Promise<any> {
    const allPostMortems = await this.searchPostMortems({});
    const allActionItems: ActionItem[] = [];
    
    allPostMortems.forEach(pm => {
      allActionItems.push(...pm.actionItems);
    });

    return {
      total: allActionItems.length,
      byStatus: {
        pending: allActionItems.filter(a => a.status === 'pending').length,
        inProgress: allActionItems.filter(a => a.status === 'in_progress').length,
        completed: allActionItems.filter(a => a.status === 'completed').length,
        cancelled: allActionItems.filter(a => a.status === 'cancelled').length
      },
      byPriority: {
        critical: allActionItems.filter(a => a.priority === 'critical').length,
        high: allActionItems.filter(a => a.priority === 'high').length,
        medium: allActionItems.filter(a => a.priority === 'medium').length,
        low: allActionItems.filter(a => a.priority === 'low').length
      },
      overdue: allActionItems.filter(a => 
        a.dueDate && a.dueDate < new Date() && a.status !== 'completed'
      ).length
    };
  }
}

export { PostMortemAutomation };