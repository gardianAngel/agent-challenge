import { storage } from "../storage";
import { RiskEngine } from "./riskEngine";

export interface RiskReport {
  id: string;
  title: string;
  summary: RiskSummary;
  protocolAnalysis: ProtocolAnalysis[];
  marketOverview: MarketOverview;
  recommendations: Recommendation[];
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
}

export interface RiskSummary {
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalProtocolsMonitored: number;
  averageRiskScore: number;
  highRiskProtocols: number;
  totalTvlMonitored: number;
  alertsGenerated: number;
  keyRiskFactors: string[];
}

export interface ProtocolAnalysis {
  protocolId: number;
  name: string;
  currentRiskScore: number;
  previousRiskScore: number;
  riskTrend: 'improving' | 'stable' | 'deteriorating';
  keyRisks: string[];
  tvlChange: number;
  utilizationChange: number;
}

export interface MarketOverview {
  averageVolatility: number;
  correlationWarnings: number;
  liquidityIssues: number;
  marketSentiment: 'bullish' | 'neutral' | 'bearish';
  whaleActivityLevel: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'smart_contract' | 'market' | 'governance' | 'operational';
  title: string;
  description: string;
  actionItems: string[];
  affectedProtocols: number[];
}

export class RiskReporting {
  private static instance: RiskReporting;
  private riskEngine: RiskEngine;

  private constructor() {
    this.riskEngine = RiskEngine.getInstance();
  }

  static getInstance(): RiskReporting {
    if (!RiskReporting.instance) {
      RiskReporting.instance = new RiskReporting();
    }
    return RiskReporting.instance;
  }

  /**
   * Start risk reporting service
   */
  async startReporting(): Promise<void> {
    console.log('[RiskReporting] Starting risk reporting service');
    
    // Generate daily reports
    setInterval(async () => {
      await this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // Daily

    // Generate real-time summary updates
    setInterval(async () => {
      await this.generateRealTimeSummary();
    }, 60000); // Every minute

    await storage.updateAgentStatus("Risk Reporting", { status: "active" });
  }

  /**
   * Generate comprehensive risk report
   */
  async generateRiskReport(
    startDate: Date = new Date(Date.now() - 24 * 60 * 60 * 1000),
    endDate: Date = new Date()
  ): Promise<RiskReport> {
    try {
      const reportId = `risk-report-${Date.now()}`;
      
      const summary = await this.generateRiskSummary(startDate, endDate);
      const protocolAnalysis = await this.generateProtocolAnalysis(startDate, endDate);
      const marketOverview = await this.generateMarketOverview();
      const recommendations = await this.generateRecommendations();

      const report: RiskReport = {
        id: reportId,
        title: `DeFi Risk Assessment Report - ${endDate.toLocaleDateString()}`,
        summary,
        protocolAnalysis,
        marketOverview,
        recommendations,
        generatedAt: new Date(),
        period: {
          start: startDate,
          end: endDate
        }
      };

      console.log(`[RiskReporting] Generated report: ${reportId}`);
      return report;
    } catch (error) {
      console.error('[RiskReporting] Error generating risk report:', error);
      throw error;
    }
  }

  /**
   * Generate risk summary
   */
  private async generateRiskSummary(startDate: Date, endDate: Date): Promise<RiskSummary> {
    const protocols = await storage.getProtocols();
    const activeProtocols = protocols.filter(p => p.isActive);
    const assessments = await storage.getRiskAssessments();
    const alerts = await storage.getAlerts();

    const alertsInPeriod = alerts.filter(a => 
      a.timestamp >= startDate && a.timestamp <= endDate
    );

    const totalTvl = activeProtocols.reduce((sum, p) => sum + p.tvl, 0);
    const avgRiskScore = assessments.length > 0 
      ? assessments.reduce((sum, a) => sum + a.overallRisk, 0) / assessments.length 
      : 0;
    
    const highRiskProtocols = assessments.filter(a => a.overallRisk >= 60).length;

    const overallRiskLevel = avgRiskScore >= 80 ? 'critical' :
                            avgRiskScore >= 60 ? 'high' :
                            avgRiskScore >= 40 ? 'medium' : 'low';

    const keyRiskFactors = this.identifyKeyRiskFactors(assessments);

    return {
      overallRiskLevel,
      totalProtocolsMonitored: activeProtocols.length,
      averageRiskScore: Math.round(avgRiskScore),
      highRiskProtocols,
      totalTvlMonitored: totalTvl,
      alertsGenerated: alertsInPeriod.length,
      keyRiskFactors
    };
  }

  /**
   * Generate protocol analysis
   */
  private async generateProtocolAnalysis(startDate: Date, endDate: Date): Promise<ProtocolAnalysis[]> {
    const protocols = await storage.getProtocols();
    const activeProtocols = protocols.filter(p => p.isActive);
    const analysis: ProtocolAnalysis[] = [];

    for (const protocol of activeProtocols) {
      const assessment = await storage.getRiskAssessment(protocol.id);
      if (!assessment) continue;

      // Mock previous risk score (in production, get from historical data)
      const previousRiskScore = assessment.overallRisk + (Math.random() - 0.5) * 20;
      const riskTrend = assessment.overallRisk > previousRiskScore + 5 ? 'deteriorating' :
                       assessment.overallRisk < previousRiskScore - 5 ? 'improving' : 'stable';

      const keyRisks = this.identifyProtocolKeyRisks(assessment);

      analysis.push({
        protocolId: protocol.id,
        name: protocol.name,
        currentRiskScore: Math.round(assessment.overallRisk),
        previousRiskScore: Math.round(previousRiskScore),
        riskTrend,
        keyRisks,
        tvlChange: (Math.random() - 0.5) * 0.2, // Mock TVL change
        utilizationChange: (Math.random() - 0.5) * 0.1 // Mock utilization change
      });
    }

    return analysis.sort((a, b) => b.currentRiskScore - a.currentRiskScore);
  }

  /**
   * Generate market overview
   */
  private async generateMarketOverview(): Promise<MarketOverview> {
    // In production, this would aggregate data from MarketRisk service
    return {
      averageVolatility: Math.random() * 0.3 + 0.1, // 10-40%
      correlationWarnings: Math.floor(Math.random() * 5),
      liquidityIssues: Math.floor(Math.random() * 3),
      marketSentiment: ['bullish', 'neutral', 'bearish'][Math.floor(Math.random() * 3)] as any,
      whaleActivityLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(): Promise<Recommendation[]> {
    const protocols = await storage.getProtocols();
    const assessments = await storage.getRiskAssessments();
    const recommendations: Recommendation[] = [];

    // Smart contract recommendations
    const highContractRisk = assessments.filter(a => a.smartContractRisk > 70);
    if (highContractRisk.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'smart_contract',
        title: 'Review High-Risk Smart Contracts',
        description: 'Several protocols show elevated smart contract risk scores requiring immediate attention.',
        actionItems: [
          'Conduct thorough code review',
          'Verify audit status and recommendations',
          'Monitor for recent contract upgrades',
          'Implement additional monitoring alerts'
        ],
        affectedProtocols: highContractRisk.map(a => a.protocolId)
      });
    }

    // Market risk recommendations
    const highMarketRisk = assessments.filter(a => a.marketRisk > 70);
    if (highMarketRisk.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'market',
        title: 'Address Market Risk Exposure',
        description: 'High market risk detected due to volatility and correlation factors.',
        actionItems: [
          'Review asset correlation matrices',
          'Implement position size limits',
          'Monitor liquidity depth',
          'Consider hedging strategies'
        ],
        affectedProtocols: highMarketRisk.map(a => a.protocolId)
      });
    }

    // Governance recommendations
    const highGovernanceRisk = assessments.filter(a => a.governanceRisk > 60);
    if (highGovernanceRisk.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'governance',
        title: 'Improve Governance Security',
        description: 'Governance risks identified in protocol management and upgrade mechanisms.',
        actionItems: [
          'Verify timelock mechanisms',
          'Review multisig configurations',
          'Monitor governance proposals',
          'Assess admin key security'
        ],
        affectedProtocols: highGovernanceRisk.map(a => a.protocolId)
      });
    }

    // Operational recommendations
    const avgRiskScore = assessments.reduce((sum, a) => sum + a.overallRisk, 0) / assessments.length;
    if (avgRiskScore > 60) {
      recommendations.push({
        priority: 'high',
        category: 'operational',
        title: 'Enhance Risk Monitoring',
        description: 'Overall risk levels are elevated across multiple protocols.',
        actionItems: [
          'Increase monitoring frequency',
          'Lower alert thresholds',
          'Prepare incident response procedures',
          'Review portfolio allocation'
        ],
        affectedProtocols: protocols.map(p => p.id)
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Identify key risk factors across all protocols
   */
  private identifyKeyRiskFactors(assessments: any[]): string[] {
    const factors = [];
    
    const avgSmartContractRisk = assessments.reduce((sum, a) => sum + a.smartContractRisk, 0) / assessments.length;
    const avgMarketRisk = assessments.reduce((sum, a) => sum + a.marketRisk, 0) / assessments.length;
    const avgGovernanceRisk = assessments.reduce((sum, a) => sum + a.governanceRisk, 0) / assessments.length;
    const avgTechnicalRisk = assessments.reduce((sum, a) => sum + a.technicalRisk, 0) / assessments.length;
    const avgSocialRisk = assessments.reduce((sum, a) => sum + a.socialRisk, 0) / assessments.length;

    if (avgSmartContractRisk > 60) factors.push('Smart Contract Vulnerabilities');
    if (avgMarketRisk > 60) factors.push('High Market Volatility');
    if (avgGovernanceRisk > 60) factors.push('Governance Centralization');
    if (avgTechnicalRisk > 60) factors.push('Technical Implementation Issues');
    if (avgSocialRisk > 60) factors.push('Negative Community Sentiment');

    return factors.length > 0 ? factors : ['Low Risk Environment'];
  }

  /**
   * Identify key risks for a specific protocol
   */
  private identifyProtocolKeyRisks(assessment: any): string[] {
    const risks = [];
    
    if (assessment.smartContractRisk > 70) risks.push('High smart contract risk');
    if (assessment.marketRisk > 70) risks.push('High market volatility');
    if (assessment.governanceRisk > 70) risks.push('Governance centralization');
    if (assessment.technicalRisk > 70) risks.push('Technical vulnerabilities');
    if (assessment.socialRisk > 70) risks.push('Negative sentiment');

    return risks.length > 0 ? risks : ['Low risk profile'];
  }

  /**
   * Generate daily report
   */
  private async generateDailyReport(): Promise<void> {
    try {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const report = await this.generateRiskReport(startDate, endDate);
      
      // In production, this would save to database and/or send to stakeholders
      console.log(`[RiskReporting] Daily report generated: ${report.id}`);
      console.log(`[RiskReporting] Overall risk level: ${report.summary.overallRiskLevel}`);
      console.log(`[RiskReporting] High-risk protocols: ${report.summary.highRiskProtocols}`);
      console.log(`[RiskReporting] Recommendations: ${report.recommendations.length}`);
    } catch (error) {
      console.error('[RiskReporting] Error generating daily report:', error);
    }
  }

  /**
   * Generate real-time summary
   */
  private async generateRealTimeSummary(): Promise<void> {
    try {
      const summary = await this.generateRiskSummary(
        new Date(Date.now() - 60 * 60 * 1000), // Last hour
        new Date()
      );
      
      // This would be broadcast via WebSocket in production
      console.log(`[RiskReporting] Real-time summary - Risk Level: ${summary.overallRiskLevel}, Avg Score: ${summary.averageRiskScore}`);
    } catch (error) {
      console.error('[RiskReporting] Error generating real-time summary:', error);
    }
  }

  /**
   * Export report to various formats
   */
  async exportReport(report: RiskReport, format: 'json' | 'pdf' | 'csv'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'pdf':
        // In production, this would generate PDF using libraries like puppeteer
        return `PDF export not implemented - Report ID: ${report.id}`;
      
      case 'csv':
        // In production, this would convert to CSV format
        return this.convertReportToCSV(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert report to CSV format
   */
  private convertReportToCSV(report: RiskReport): string {
    let csv = 'Protocol,Risk Score,Risk Trend,TVL Change,Key Risks\n';
    
    report.protocolAnalysis.forEach(analysis => {
      const keyRisks = analysis.keyRisks.join('; ');
      csv += `"${analysis.name}",${analysis.currentRiskScore},${analysis.riskTrend},${(analysis.tvlChange * 100).toFixed(2)}%,"${keyRisks}"\n`;
    });
    
    return csv;
  }

  /**
   * Get report summary statistics
   */
  async getReportingStats(): Promise<any> {
    const protocols = await storage.getProtocols();
    const assessments = await storage.getRiskAssessments();
    const alerts = await storage.getAlerts();

    return {
      protocolsMonitored: protocols.filter(p => p.isActive).length,
      avgRiskScore: assessments.length > 0 
        ? assessments.reduce((sum, a) => sum + a.overallRisk, 0) / assessments.length 
        : 0,
      recentAlerts: alerts.filter(a => 
        Date.now() - a.timestamp.getTime() < 24 * 60 * 60 * 1000
      ).length,
      lastReportGenerated: new Date(),
      systemHealth: 'operational'
    };
  }
}
