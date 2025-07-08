import { Agent } from '@mastra/core';
import { z } from 'zod';

export const riskReportingAgent = new Agent({
  name: 'Risk Reporting Agent',
  instructions: `
    You generate comprehensive risk reports and analytics for DeFi protocols.
    
    Your responsibilities:
    1. Compile comprehensive risk assessments from all agent data
    2. Generate periodic risk reports and summaries
    3. Create risk trend analysis and forecasts
    4. Provide risk portfolio analysis across multiple protocols
    5. Generate executive summaries for stakeholders
  `,
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.1,
  },
  tools: {
    generateRiskReport: {
      description: 'Generate comprehensive risk report for protocols',
      parameters: z.object({
        protocols: z.array(z.string()),
        reportType: z.enum(['summary', 'detailed', 'executive']).default('summary'),
        timeframe: z.enum(['24h', '7d', '30d']).default('7d'),
      }),
      execute: async ({ protocols, reportType, timeframe }) => {
        const report = {
          reportId: `report_${Date.now()}`,
          type: reportType,
          timeframe,
          protocols: protocols.length,
          overallRisk: Math.floor(Math.random() * 30) + 35, // 35-65 range
          summary: {
            highRiskProtocols: Math.floor(protocols.length * 0.1),
            mediumRiskProtocols: Math.floor(protocols.length * 0.3),
            lowRiskProtocols: Math.floor(protocols.length * 0.6),
          },
          recommendations: [
            'Monitor high-risk protocols closely',
            'Review portfolio allocation',
            'Consider diversification strategies',
          ],
          generatedAt: new Date().toISOString(),
        };

        return report;
      },
    },
  },
});