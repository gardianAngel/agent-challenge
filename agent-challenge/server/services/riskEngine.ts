import { storage } from "../storage";
import { RiskAssessment, InsertRiskAssessment } from "@shared/schema";

export interface RiskFactors {
  smartContractRisk: number;
  marketRisk: number;
  governanceRisk: number;
  technicalRisk: number;
  socialRisk: number;
  counterpartyRisk: number;
}

export interface RiskWeights {
  smartContractRisk: number;
  marketRisk: number;
  governanceRisk: number;
  technicalRisk: number;
  socialRisk: number;
  counterpartyRisk: number;
}

export class RiskEngine {
  private static instance: RiskEngine;
  private readonly riskWeights: RiskWeights = {
    smartContractRisk: 0.25,
    marketRisk: 0.20,
    governanceRisk: 0.15,
    technicalRisk: 0.15,
    socialRisk: 0.15,
    counterpartyRisk: 0.10
  };

  private constructor() {}

  static getInstance(): RiskEngine {
    if (!RiskEngine.instance) {
      RiskEngine.instance = new RiskEngine();
    }
    return RiskEngine.instance;
  }

  /**
   * Calculate overall risk score from individual risk factors
   */
  calculateOverallRisk(factors: RiskFactors): number {
    const weightedScore = 
      factors.smartContractRisk * this.riskWeights.smartContractRisk +
      factors.marketRisk * this.riskWeights.marketRisk +
      factors.governanceRisk * this.riskWeights.governanceRisk +
      factors.technicalRisk * this.riskWeights.technicalRisk +
      factors.socialRisk * this.riskWeights.socialRisk +
      factors.counterpartyRisk * this.riskWeights.counterpartyRisk;

    return Math.min(100, Math.max(0, Math.round(weightedScore)));
  }

  /**
   * Assess risk category based on risk score
   */
  getRiskCategory(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Update risk assessment for a protocol
   */
  async updateRiskAssessment(
    protocolId: number,
    factors: Partial<RiskFactors>
  ): Promise<RiskAssessment | undefined> {
    const existingAssessment = await storage.getRiskAssessment(protocolId);
    
    const currentFactors: RiskFactors = {
      smartContractRisk: existingAssessment?.smartContractRisk || 0,
      marketRisk: existingAssessment?.marketRisk || 0,
      governanceRisk: existingAssessment?.governanceRisk || 0,
      technicalRisk: existingAssessment?.technicalRisk || 0,
      socialRisk: existingAssessment?.socialRisk || 0,
      counterpartyRisk: existingAssessment?.counterpartyRisk || 0,
      ...factors
    };

    const overallRisk = this.calculateOverallRisk(currentFactors);

    const updateData: Partial<InsertRiskAssessment> = {
      ...currentFactors,
      overallRisk,
      metadata: {
        ...existingAssessment?.metadata,
        lastCalculated: new Date().toISOString(),
        riskCategory: this.getRiskCategory(overallRisk)
      }
    };

    if (existingAssessment) {
      return await storage.updateRiskAssessment(protocolId, updateData);
    } else {
      return await storage.createRiskAssessment({
        protocolId,
        ...currentFactors,
        overallRisk,
        metadata: updateData.metadata || {}
      });
    }
  }

  /**
   * Get risk trend analysis
   */
  async getRiskTrend(protocolId: number, hours: number = 24): Promise<any> {
    // This would typically fetch historical data from database
    // For now, return mock trend data
    const currentAssessment = await storage.getRiskAssessment(protocolId);
    if (!currentAssessment) return null;

    const trendData = [];
    const currentTime = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(currentTime.getTime() - i * 60 * 60 * 1000);
      const variation = (Math.random() - 0.5) * 10; // ±5 points variation
      const riskScore = Math.max(0, Math.min(100, currentAssessment.overallRisk + variation));
      
      trendData.push({
        timestamp,
        riskScore,
        category: this.getRiskCategory(riskScore)
      });
    }

    return trendData;
  }

  /**
   * Analyze risk correlation between protocols
   */
  async analyzeRiskCorrelation(protocolIds: number[]): Promise<any> {
    const assessments = await storage.getRiskAssessments(protocolIds);
    const correlations: Record<string, any> = {};

    for (let i = 0; i < assessments.length; i++) {
      for (let j = i + 1; j < assessments.length; j++) {
        const protocol1 = assessments[i];
        const protocol2 = assessments[j];
        
        // Simple correlation calculation based on risk factors
        const correlation = this.calculateCorrelation(
          [protocol1.smartContractRisk, protocol1.marketRisk, protocol1.governanceRisk],
          [protocol2.smartContractRisk, protocol2.marketRisk, protocol2.governanceRisk]
        );

        correlations[`${protocol1.protocolId}-${protocol2.protocolId}`] = correlation;
      }
    }

    return correlations;
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Generate risk insights and recommendations
   */
  async generateRiskInsights(protocolId: number): Promise<any> {
    const assessment = await storage.getRiskAssessment(protocolId);
    const protocol = await storage.getProtocol(protocolId);
    
    if (!assessment || !protocol) return null;

    const insights = [];
    const recommendations = [];

    // High utilization risk
    if (protocol.utilization > 0.9) {
      insights.push({
        type: 'warning',
        message: `High utilization rate (${(protocol.utilization * 100).toFixed(1)}%) indicates potential liquidity stress`
      });
      recommendations.push('Monitor for potential bank run scenarios');
    }

    // Smart contract risk analysis
    if (assessment.smartContractRisk > 60) {
      insights.push({
        type: 'critical',
        message: 'High smart contract risk detected'
      });
      recommendations.push('Review recent code changes and audit status');
    }

    // Market risk analysis
    if (assessment.marketRisk > 70) {
      insights.push({
        type: 'warning',
        message: 'High market risk due to volatile assets or high correlation'
      });
      recommendations.push('Consider diversification or hedging strategies');
    }

    return {
      protocolId,
      protocolName: protocol.name,
      overallRisk: assessment.overallRisk,
      riskCategory: this.getRiskCategory(assessment.overallRisk),
      insights,
      recommendations,
      lastUpdated: assessment.timestamp
    };
  }
}
