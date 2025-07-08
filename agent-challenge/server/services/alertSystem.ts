import { storage } from "../storage";
import { Alert, InsertAlert } from "@shared/schema";

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  protocolIds?: number[];
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'telegram' | 'discord' | 'email' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertStats {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  alertsLast24h: number;
  alertsLast7d: number;
}

export class AlertSystem {
  private static instance: AlertSystem;
  private alertRules: Map<string, AlertRule> = new Map();
  private alertChannels: Map<string, AlertChannel> = new Map();
  private alertQueue: Alert[] = [];
  private isProcessing = false;

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-risk-score',
        name: 'High Risk Score',
        condition: 'riskScore > threshold',
        threshold: 80,
        severity: 'critical',
        enabled: true,
        channels: [{ type: 'telegram', config: {}, enabled: true }]
      },
      {
        id: 'high-utilization',
        name: 'High Utilization',
        condition: 'utilization > threshold',
        threshold: 0.9,
        severity: 'high',
        enabled: true,
        channels: [{ type: 'discord', config: {}, enabled: true }]
      },
      {
        id: 'tvl-drop',
        name: 'TVL Drop',
        condition: 'tvlChange < -threshold',
        threshold: 0.1,
        severity: 'high',
        enabled: true,
        channels: [{ type: 'telegram', config: {}, enabled: true }]
      },
      {
        id: 'whale-activity',
        name: 'Whale Activity',
        condition: 'whaleDistribution > threshold',
        threshold: 2,
        severity: 'medium',
        enabled: true,
        channels: [{ type: 'discord', config: {}, enabled: true }]
      },
      {
        id: 'contract-upgrade',
        name: 'Contract Upgrade',
        condition: 'contractUpgrade == true',
        threshold: 0,
        severity: 'medium',
        enabled: true,
        channels: [{ type: 'telegram', config: {}, enabled: true }]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Start alert system
   */
  async startAlertSystem(): Promise<void> {
    console.log('[AlertSystem] Starting alert system');
    
    // Start processing alerts
    this.startAlertProcessing();
    
    // Set up periodic rule checking
    setInterval(async () => {
      await this.checkAlertRules();
    }, 30000); // Every 30 seconds

    await storage.updateAgentStatus("Alert System", { status: "active" });
  }

  /**
   * Start alert processing queue
   */
  private startAlertProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    setInterval(async () => {
      await this.processAlertQueue();
    }, 5000); // Process every 5 seconds
  }

  /**
   * Check all alert rules
   */
  private async checkAlertRules(): Promise<void> {
    try {
      const protocols = await storage.getProtocols();
      
      for (const protocol of protocols) {
        if (protocol.isActive) {
          await this.checkProtocolAlerts(protocol.id);
        }
      }
    } catch (error) {
      console.error('[AlertSystem] Error checking alert rules:', error);
      await storage.updateAgentStatus("Alert System", { status: "error" });
    }
  }

  /**
   * Check alerts for a specific protocol
   */
  private async checkProtocolAlerts(protocolId: number): Promise<void> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      const riskAssessment = await storage.getRiskAssessment(protocolId);
      
      if (!protocol || !riskAssessment) return;

      for (const rule of this.alertRules.values()) {
        if (!rule.enabled) continue;
        
        if (rule.protocolIds && !rule.protocolIds.includes(protocolId)) continue;
        
        const shouldAlert = await this.evaluateRule(rule, protocol, riskAssessment);
        
        if (shouldAlert) {
          await this.createAlert(rule, protocol, riskAssessment);
        }
      }
    } catch (error) {
      console.error(`[AlertSystem] Error checking alerts for protocol ${protocolId}:`, error);
    }
  }

  /**
   * Evaluate if a rule should trigger an alert
   */
  private async evaluateRule(rule: AlertRule, protocol: any, riskAssessment: any): Promise<boolean> {
    try {
      switch (rule.id) {
        case 'high-risk-score':
          return riskAssessment.overallRisk > rule.threshold;
        
        case 'high-utilization':
          return protocol.utilization > rule.threshold;
        
        case 'tvl-drop':
          // This would need historical TVL data in production
          return false; // Mock: no TVL drops detected
        
        case 'whale-activity':
          // This would check social sentiment whale data
          return Math.random() > 0.95; // Mock: 5% chance of whale activity
        
        case 'contract-upgrade':
          return protocol.metadata?.upgradesPending === true;
        
        default:
          return false;
      }
    } catch (error) {
      console.error(`[AlertSystem] Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Create an alert
   */
  private async createAlert(rule: AlertRule, protocol: any, riskAssessment: any): Promise<void> {
    try {
      // Check if similar alert already exists and is active
      const existingAlerts = await storage.getAlertsByProtocol(protocol.id);
      const recentSimilarAlert = existingAlerts.find(alert => 
        alert.type === rule.severity &&
        alert.isActive &&
        alert.title.includes(rule.name) &&
        (Date.now() - alert.timestamp.getTime()) < 3600000 // Within last hour
      );

      if (recentSimilarAlert) {
        return; // Don't create duplicate alerts
      }

      const alertData: InsertAlert = {
        protocolId: protocol.id,
        type: rule.severity,
        title: this.generateAlertTitle(rule, protocol),
        message: this.generateAlertMessage(rule, protocol, riskAssessment),
        severity: this.getSeverityScore(rule.severity),
        isActive: true,
        isRead: false,
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          threshold: rule.threshold,
          actualValue: this.getActualValue(rule, protocol, riskAssessment),
          protocolName: protocol.name,
          riskScore: riskAssessment.overallRisk
        }
      };

      const alert = await storage.createAlert(alertData);
      this.alertQueue.push(alert);
      
      console.log(`[AlertSystem] Created alert: ${alert.title} for ${protocol.name}`);
    } catch (error) {
      console.error(`[AlertSystem] Error creating alert:`, error);
    }
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(rule: AlertRule, protocol: any): string {
    const severityEmoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '⚡',
      'low': 'ℹ️'
    };

    return `${severityEmoji[rule.severity]} ${rule.name} - ${protocol.name}`;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, protocol: any, riskAssessment: any): string {
    const actualValue = this.getActualValue(rule, protocol, riskAssessment);
    
    switch (rule.id) {
      case 'high-risk-score':
        return `${protocol.name} risk score is ${actualValue.toFixed(1)} (threshold: ${rule.threshold})`;
      
      case 'high-utilization':
        return `${protocol.name} utilization is ${(actualValue * 100).toFixed(1)}% (threshold: ${(rule.threshold * 100).toFixed(1)}%)`;
      
      case 'tvl-drop':
        return `${protocol.name} TVL dropped by ${(actualValue * 100).toFixed(1)}% (threshold: ${(rule.threshold * 100).toFixed(1)}%)`;
      
      case 'whale-activity':
        return `Unusual whale activity detected for ${protocol.name}`;
      
      case 'contract-upgrade':
        return `${protocol.name} has pending contract upgrades`;
      
      default:
        return `${rule.name} triggered for ${protocol.name}`;
    }
  }

  /**
   * Get actual value for a rule
   */
  private getActualValue(rule: AlertRule, protocol: any, riskAssessment: any): number {
    switch (rule.id) {
      case 'high-risk-score':
        return riskAssessment.overallRisk;
      
      case 'high-utilization':
        return protocol.utilization;
      
      case 'tvl-drop':
        return 0; // Mock value
      
      case 'whale-activity':
        return 3; // Mock value
      
      case 'contract-upgrade':
        return 1; // Mock value
      
      default:
        return 0;
    }
  }

  /**
   * Get severity score
   */
  private getSeverityScore(severity: string): number {
    const scores = {
      'critical': 90,
      'high': 70,
      'medium': 50,
      'low': 30
    };
    return scores[severity as keyof typeof scores] || 50;
  }

  /**
   * Process alert queue
   */
  private async processAlertQueue(): Promise<void> {
    if (this.alertQueue.length === 0) return;
    
    const alert = this.alertQueue.shift();
    if (!alert) return;
    
    try {
      await this.sendAlert(alert);
    } catch (error) {
      console.error(`[AlertSystem] Error sending alert:`, error);
    }
  }

  /**
   * Send alert to configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    const ruleId = alert.metadata?.ruleId as string;
    const rule = this.alertRules.get(ruleId);
    
    if (!rule) return;
    
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;
      
      try {
        await this.sendToChannel(alert, channel);
      } catch (error) {
        console.error(`[AlertSystem] Error sending to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'telegram':
        await this.sendTelegramAlert(alert, channel.config);
        break;
      
      case 'discord':
        await this.sendDiscordAlert(alert, channel.config);
        break;
      
      case 'email':
        await this.sendEmailAlert(alert, channel.config);
        break;
      
      case 'webhook':
        await this.sendWebhookAlert(alert, channel.config);
        break;
    }
  }

  /**
   * Send Telegram alert
   */
  private async sendTelegramAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // In production, this would use Telegram Bot API
    console.log(`[AlertSystem] Telegram Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Send Discord alert
   */
  private async sendDiscordAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // In production, this would use Discord webhooks
    console.log(`[AlertSystem] Discord Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // In production, this would use email service
    console.log(`[AlertSystem] Email Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, config: Record<string, any>): Promise<void> {
    // In production, this would make HTTP POST to webhook URL
    console.log(`[AlertSystem] Webhook Alert: ${alert.title} - ${alert.message}`);
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<AlertStats> {
    const allAlerts = await storage.getAlerts();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;

    const stats: AlertStats = {
      totalAlerts: allAlerts.length,
      criticalAlerts: allAlerts.filter(a => a.type === 'critical').length,
      highAlerts: allAlerts.filter(a => a.type === 'high').length,
      mediumAlerts: allAlerts.filter(a => a.type === 'medium').length,
      lowAlerts: allAlerts.filter(a => a.type === 'low').length,
      alertsLast24h: allAlerts.filter(a => now - a.timestamp.getTime() < day).length,
      alertsLast7d: allAlerts.filter(a => now - a.timestamp.getTime() < week).length
    };

    return stats;
  }

  /**
   * Configure alert rule
   */
  async configureRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`);
    }

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    
    console.log(`[AlertSystem] Updated rule ${ruleId}:`, updates);
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: number): Promise<void> {
    await storage.updateAlert(alertId, { isRead: true });
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: number): Promise<void> {
    await storage.updateAlert(alertId, { isActive: false });
  }

  /**
   * Test alert system
   */
  async testAlert(ruleId: string): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) {
      throw new Error(`Alert rule ${ruleId} not found`);
    }

    const testAlert: Alert = {
      id: 0,
      protocolId: null,
      type: rule.severity,
      title: `TEST: ${rule.name}`,
      message: `This is a test alert for rule: ${rule.name}`,
      severity: this.getSeverityScore(rule.severity),
      isActive: true,
      isRead: false,
      timestamp: new Date(),
      metadata: { test: true, ruleId }
    };

    await this.sendAlert(testAlert);
    console.log(`[AlertSystem] Test alert sent for rule ${ruleId}`);
  }
}
