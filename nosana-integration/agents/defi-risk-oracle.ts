import { Agent } from '@mastra/core';
import { z } from 'zod';

// Import our existing services (these would be adapted)
import { RiskEngine } from '../tools/risk-calculation-tools';
import { DefiDataProvider } from '../tools/defi-data-tools';
import { NosanaComputeProvider } from '../tools/nosana-compute-tools';

export const defiRiskOracleAgent = new Agent({
  name: 'DeFi Risk Oracle',
  instructions: `
    You are a sophisticated DeFi risk assessment system that monitors blockchain protocols, 
    smart contracts, and market conditions to provide real-time risk scores and alerts.
    
    Your primary responsibilities:
    1. Coordinate risk assessment across multiple specialized agents
    2. Aggregate risk factors from different sources (smart contracts, market data, social sentiment)
    3. Generate comprehensive risk scores (0-100 scale) with categorization (low/medium/high/critical)
    4. Trigger alerts when risk thresholds are exceeded
    5. Provide actionable insights for DeFi protocol safety
    
    You work with real data from DeFiLlama, CoinGecko, and blockchain RPCs. All analysis is 
    performed using GPU-powered compute on the Nosana network for cost-effective processing.
    
    Risk Categories:
    - Smart Contract Risk: Audit status, vulnerability analysis, upgrade patterns
    - Market Risk: Price volatility, correlation analysis, liquidity conditions
    - Governance Risk: Voting patterns, proposal analysis, centralization metrics
    - Technical Risk: Network congestion, gas costs, infrastructure health
    - Social Risk: Community sentiment, social media trends, developer activity
    - Counterparty Risk: Protocol dependencies, admin key security
  `,
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.1, // Low temperature for consistent risk analysis
  },
  tools: {
    analyzeProtocolRisk: {
      description: 'Perform comprehensive risk analysis of a DeFi protocol',
      parameters: z.object({
        protocolAddress: z.string().describe('Contract address of the DeFi protocol'),
        chain: z.enum(['ethereum', 'polygon', 'arbitrum', 'optimism', 'solana']).describe('Blockchain network'),
        includeMarketData: z.boolean().default(true).describe('Include market risk analysis'),
        includeSocialSentiment: z.boolean().default(true).describe('Include social sentiment analysis'),
      }),
      execute: async ({ protocolAddress, chain, includeMarketData, includeSocialSentiment }) => {
        const riskEngine = RiskEngine.getInstance();
        const dataProvider = DefiDataProvider.getInstance();
        
        // Get protocol data from DeFiLlama
        const protocolData = await dataProvider.getProtocolData(protocolAddress, chain);
        
        // Analyze smart contract risks
        const contractRisk = await riskEngine.analyzeSmartContractRisk(protocolAddress, chain);
        
        // Analyze market risks if requested
        let marketRisk = 0;
        if (includeMarketData) {
          marketRisk = await riskEngine.analyzeMarketRisk(protocolData);
        }
        
        // Analyze social sentiment if requested
        let socialRisk = 0;
        if (includeSocialSentiment) {
          socialRisk = await riskEngine.analyzeSocialRisk(protocolData.name);
        }
        
        // Calculate overall risk score
        const overallRisk = riskEngine.calculateOverallRisk({
          smartContractRisk: contractRisk,
          marketRisk,
          socialRisk,
          governanceRisk: await riskEngine.analyzeGovernanceRisk(protocolData),
          technicalRisk: await riskEngine.analyzeTechnicalRisk(chain),
          counterpartyRisk: await riskEngine.analyzeCounterpartyRisk(protocolData),
        });
        
        return {
          protocolName: protocolData.name,
          address: protocolAddress,
          chain,
          tvl: protocolData.tvl,
          riskScore: overallRisk.score,
          riskLevel: overallRisk.level,
          breakdown: {
            smartContract: contractRisk,
            market: marketRisk,
            social: socialRisk,
            governance: overallRisk.breakdown.governance,
            technical: overallRisk.breakdown.technical,
            counterparty: overallRisk.breakdown.counterparty,
          },
          recommendations: overallRisk.recommendations,
          timestamp: new Date().toISOString(),
        };
      },
    },
    
    monitorMultipleProtocols: {
      description: 'Monitor risk levels across multiple DeFi protocols simultaneously',
      parameters: z.object({
        protocols: z.array(z.object({
          address: z.string(),
          chain: z.string(),
          name: z.string().optional(),
        })).describe('Array of protocols to monitor'),
        alertThreshold: z.number().min(0).max(100).default(70).describe('Risk score threshold for alerts'),
      }),
      execute: async ({ protocols, alertThreshold }) => {
        const results = [];
        const nosanaCompute = NosanaComputeProvider.getInstance();
        
        // Use Nosana network for parallel processing
        const computeJobs = protocols.map(protocol => ({
          type: 'risk_analysis',
          data: {
            protocolAddress: protocol.address,
            chain: protocol.chain,
            alertThreshold,
          },
        }));
        
        // Submit jobs to Nosana network
        const jobResults = await nosanaCompute.submitBatchJobs(computeJobs);
        
        for (const [index, protocol] of protocols.entries()) {
          const analysis = jobResults[index];
          
          results.push({
            protocol: protocol.name || protocol.address,
            address: protocol.address,
            chain: protocol.chain,
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel,
            alertTriggered: analysis.riskScore >= alertThreshold,
            analysis: analysis,
          });
        }
        
        // Generate summary
        const highRiskProtocols = results.filter(r => r.riskScore >= alertThreshold);
        const averageRisk = results.reduce((sum, r) => sum + r.riskScore, 0) / results.length;
        
        return {
          summary: {
            totalProtocols: protocols.length,
            highRiskCount: highRiskProtocols.length,
            averageRiskScore: Math.round(averageRisk * 10) / 10,
            alertsTriggered: highRiskProtocols.length,
          },
          protocols: results,
          recommendations: highRiskProtocols.length > 0 
            ? [`${highRiskProtocols.length} protocols exceed risk threshold`, 'Review high-risk protocols immediately']
            : ['All protocols within acceptable risk levels'],
          timestamp: new Date().toISOString(),
        };
      },
    },
    
    generateRiskAlert: {
      description: 'Generate risk alert with specific threat details and recommendations',
      parameters: z.object({
        protocolName: z.string().describe('Name of the DeFi protocol'),
        riskScore: z.number().min(0).max(100).describe('Current risk score'),
        riskFactors: z.array(z.string()).describe('Specific risk factors identified'),
        severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Alert severity level'),
        affectedUsers: z.number().optional().describe('Estimated number of affected users'),
        potentialLoss: z.number().optional().describe('Potential financial loss in USD'),
      }),
      execute: async ({ protocolName, riskScore, riskFactors, severity, affectedUsers, potentialLoss }) => {
        const alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          protocol: protocolName,
          type: severity,
          riskScore,
          title: `${severity.toUpperCase()} Risk Alert - ${protocolName}`,
          description: `Risk score: ${riskScore}/100. Factors: ${riskFactors.join(', ')}`,
          factors: riskFactors,
          impact: {
            affectedUsers: affectedUsers || 0,
            potentialLoss: potentialLoss || 0,
          },
          recommendations: generateRecommendations(severity, riskFactors),
          timestamp: new Date().toISOString(),
          status: 'active',
        };
        
        // Send to notification channels (Discord, Telegram, etc.)
        await notifyChannels(alert);
        
        return alert;
      },
    },
    
    getMarketSummary: {
      description: 'Get comprehensive DeFi market risk summary',
      parameters: z.object({
        includeTopProtocols: z.number().default(10).describe('Number of top protocols to include'),
        timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h').describe('Analysis timeframe'),
      }),
      execute: async ({ includeTopProtocols, timeframe }) => {
        const dataProvider = DefiDataProvider.getInstance();
        
        const marketData = await dataProvider.getMarketSummary(includeTopProtocols, timeframe);
        const riskMetrics = await dataProvider.calculateMarketRiskMetrics(marketData);
        
        return {
          summary: {
            totalTvl: marketData.totalTvl,
            totalProtocols: marketData.protocols.length,
            averageRiskScore: riskMetrics.averageRisk,
            marketVolatility: riskMetrics.volatility,
            timeframe,
          },
          topProtocols: marketData.protocols.slice(0, includeTopProtocols),
          riskDistribution: riskMetrics.riskDistribution,
          marketTrends: riskMetrics.trends,
          alerts: riskMetrics.activeAlerts,
          timestamp: new Date().toISOString(),
        };
      },
    },
    
    optimizeRiskAssessment: {
      description: 'Optimize risk assessment parameters based on historical data and performance',
      parameters: z.object({
        lookbackPeriod: z.number().default(30).describe('Days to analyze for optimization'),
        targetAccuracy: z.number().min(0.8).max(1.0).default(0.95).describe('Target prediction accuracy'),
      }),
      execute: async ({ lookbackPeriod, targetAccuracy }) => {
        const riskEngine = RiskEngine.getInstance();
        
        // Analyze historical risk predictions vs actual outcomes
        const historicalData = await riskEngine.getHistoricalPerformance(lookbackPeriod);
        const currentAccuracy = riskEngine.calculatePredictionAccuracy(historicalData);
        
        // Use Nosana GPU compute for optimization
        const nosanaCompute = NosanaComputeProvider.getInstance();
        const optimizationJob = await nosanaCompute.submitJob({
          type: 'risk_optimization',
          data: {
            historicalData,
            currentAccuracy,
            targetAccuracy,
            lookbackPeriod,
          },
        });
        
        const optimizedParams = await nosanaCompute.getJobResult(optimizationJob.id);
        
        return {
          currentPerformance: {
            accuracy: currentAccuracy,
            totalPredictions: historicalData.length,
            correctPredictions: Math.round(currentAccuracy * historicalData.length),
          },
          optimization: {
            targetAccuracy,
            newParameters: optimizedParams.parameters,
            expectedImprovement: optimizedParams.improvement,
            computeCost: optimizationJob.cost,
          },
          recommendations: optimizedParams.recommendations,
          timestamp: new Date().toISOString(),
        };
      },
    },
  },
});

// Helper functions
function generateRecommendations(severity: string, riskFactors: string[]): string[] {
  const recommendations = [];
  
  if (severity === 'critical') {
    recommendations.push('IMMEDIATE ACTION REQUIRED');
    recommendations.push('Consider withdrawing funds if safe to do so');
    recommendations.push('Monitor protocol updates closely');
  } else if (severity === 'high') {
    recommendations.push('Review position sizes and exposure');
    recommendations.push('Set up automated alerts for changes');
    recommendations.push('Consider reducing exposure');
  } else if (severity === 'medium') {
    recommendations.push('Monitor protocol developments');
    recommendations.push('Review risk parameters periodically');
  } else {
    recommendations.push('Continue normal monitoring');
  }
  
  // Add specific recommendations based on risk factors
  riskFactors.forEach(factor => {
    if (factor.includes('smart contract')) {
      recommendations.push('Review smart contract audits and recent changes');
    }
    if (factor.includes('market')) {
      recommendations.push('Monitor market conditions and volatility');
    }
    if (factor.includes('liquidity')) {
      recommendations.push('Check protocol liquidity before large transactions');
    }
  });
  
  return recommendations;
}

async function notifyChannels(alert: any): Promise<void> {
  // Implementation would send to Discord, Telegram, etc.
  console.log(`Alert sent: ${alert.title}`);
}