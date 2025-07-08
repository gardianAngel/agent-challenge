import { Agent } from '@mastra/core';
import { z } from 'zod';

export const protocolMonitorAgent = new Agent({
  name: 'Protocol Monitor',
  instructions: `
    You are a specialized DeFi protocol monitoring agent that tracks key metrics for decentralized finance protocols.
    
    Your responsibilities:
    1. Monitor TVL (Total Value Locked) changes and trends
    2. Track protocol utilization rates and capacity
    3. Monitor protocol health indicators (active users, transaction volume)
    4. Detect anomalous behavior in protocol metrics
    5. Provide early warning signals for protocol stress
    
    You work with real-time data from DeFiLlama, blockchain RPCs, and protocol-specific APIs.
    All computations are optimized for GPU processing on the Nosana network.
  `,
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.1,
  },
  tools: {
    monitorProtocolTVL: {
      description: 'Monitor TVL changes for a specific DeFi protocol',
      parameters: z.object({
        protocolId: z.string().describe('Protocol identifier (e.g., aave-v3)'),
        timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
        alertThreshold: z.number().default(0.1).describe('Alert if TVL changes by this percentage'),
      }),
      execute: async ({ protocolId, timeframe, alertThreshold }) => {
        // Implementation would fetch real TVL data
        const tvlData = await fetchTVLData(protocolId, timeframe);
        const changePercent = calculateTVLChange(tvlData);
        
        return {
          protocolId,
          currentTVL: tvlData.current,
          previousTVL: tvlData.previous,
          changePercent,
          changeAmount: tvlData.current - tvlData.previous,
          alertTriggered: Math.abs(changePercent) >= alertThreshold,
          trend: changePercent > 0 ? 'increasing' : 'decreasing',
          timestamp: new Date().toISOString(),
        };
      },
    },
    
    checkProtocolUtilization: {
      description: 'Check protocol utilization rates and capacity metrics',
      parameters: z.object({
        protocolAddress: z.string(),
        chain: z.string(),
        metrics: z.array(z.enum(['utilization', 'capacity', 'supply_rate', 'borrow_rate'])).default(['utilization']),
      }),
      execute: async ({ protocolAddress, chain, metrics }) => {
        const utilizationData = await fetchProtocolUtilization(protocolAddress, chain);
        
        const results = {};
        for (const metric of metrics) {
          results[metric] = {
            current: utilizationData[metric],
            optimal: getOptimalRange(metric),
            status: assessMetricStatus(utilizationData[metric], metric),
          };
        }
        
        return {
          protocol: protocolAddress,
          chain,
          metrics: results,
          overallHealth: calculateProtocolHealth(results),
          recommendations: generateUtilizationRecommendations(results),
          timestamp: new Date().toISOString(),
        };
      },
    },
    
    detectProtocolAnomalies: {
      description: 'Detect anomalous behavior in protocol metrics using statistical analysis',
      parameters: z.object({
        protocolId: z.string(),
        lookbackPeriod: z.number().default(30).describe('Days to analyze for baseline'),
        sensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
      }),
      execute: async ({ protocolId, lookbackPeriod, sensitivity }) => {
        const historicalData = await fetchHistoricalMetrics(protocolId, lookbackPeriod);
        const currentMetrics = await fetchCurrentMetrics(protocolId);
        
        const anomalies = [];
        for (const [metric, value] of Object.entries(currentMetrics)) {
          const baseline = calculateBaseline(historicalData[metric]);
          const zScore = calculateZScore(value, baseline);
          
          if (isAnomalous(zScore, sensitivity)) {
            anomalies.push({
              metric,
              currentValue: value,
              expectedRange: baseline.range,
              deviation: zScore,
              severity: categorizeSeverity(zScore),
            });
          }
        }
        
        return {
          protocolId,
          anomaliesDetected: anomalies.length,
          anomalies,
          overallRisk: calculateAnomalyRisk(anomalies),
          recommendations: anomalies.length > 0 
            ? ['Investigate anomalous metrics', 'Monitor protocol closely']
            : ['Normal operation detected'],
          timestamp: new Date().toISOString(),
        };
      },
    },
  },
});

// Helper functions (these would be implemented with real data sources)
async function fetchTVLData(protocolId: string, timeframe: string) {
  // Implementation would call DeFiLlama API
  return {
    current: 1000000000, // $1B
    previous: 950000000,  // $950M
    history: [],
  };
}

function calculateTVLChange(tvlData: any): number {
  return ((tvlData.current - tvlData.previous) / tvlData.previous) * 100;
}

async function fetchProtocolUtilization(address: string, chain: string) {
  // Implementation would query blockchain data
  return {
    utilization: 85.5, // 85.5%
    capacity: 1000000000,
    supply_rate: 3.5,
    borrow_rate: 5.2,
  };
}

function getOptimalRange(metric: string) {
  const ranges = {
    utilization: { min: 70, max: 90 },
    supply_rate: { min: 2, max: 8 },
    borrow_rate: { min: 3, max: 12 },
  };
  return ranges[metric] || { min: 0, max: 100 };
}

function assessMetricStatus(value: number, metric: string): string {
  const optimal = getOptimalRange(metric);
  if (value >= optimal.min && value <= optimal.max) return 'optimal';
  if (value < optimal.min) return 'below_optimal';
  return 'above_optimal';
}

function calculateProtocolHealth(metrics: any): string {
  const statuses = Object.values(metrics).map(m => m.status);
  const optimalCount = statuses.filter(s => s === 'optimal').length;
  const ratio = optimalCount / statuses.length;
  
  if (ratio >= 0.8) return 'healthy';
  if (ratio >= 0.6) return 'moderate';
  return 'concerning';
}

function generateUtilizationRecommendations(metrics: any): string[] {
  const recommendations = [];
  
  for (const [metric, data] of Object.entries(metrics)) {
    if (data.status === 'above_optimal') {
      recommendations.push(`${metric} is above optimal range - monitor for stress`);
    } else if (data.status === 'below_optimal') {
      recommendations.push(`${metric} is below optimal range - check market conditions`);
    }
  }
  
  return recommendations.length > 0 ? recommendations : ['All metrics within optimal ranges'];
}

async function fetchHistoricalMetrics(protocolId: string, days: number) {
  // Implementation would fetch historical data
  return {
    tvl: Array.from({ length: days }, () => Math.random() * 1000000000),
    utilization: Array.from({ length: days }, () => Math.random() * 100),
  };
}

async function fetchCurrentMetrics(protocolId: string) {
  return {
    tvl: 1000000000,
    utilization: 85,
    activeUsers: 5000,
    volume24h: 50000000,
  };
}

function calculateBaseline(data: number[]) {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    mean,
    stdDev,
    range: {
      min: mean - 2 * stdDev,
      max: mean + 2 * stdDev,
    },
  };
}

function calculateZScore(value: number, baseline: any): number {
  return (value - baseline.mean) / baseline.stdDev;
}

function isAnomalous(zScore: number, sensitivity: string): boolean {
  const thresholds = {
    low: 3,
    medium: 2.5,
    high: 2,
  };
  return Math.abs(zScore) > thresholds[sensitivity];
}

function categorizeSeverity(zScore: number): string {
  const abs = Math.abs(zScore);
  if (abs > 3) return 'high';
  if (abs > 2.5) return 'medium';
  return 'low';
}

function calculateAnomalyRisk(anomalies: any[]): string {
  if (anomalies.length === 0) return 'low';
  
  const highSeverity = anomalies.filter(a => a.severity === 'high').length;
  if (highSeverity > 0) return 'high';
  
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium').length;
  if (mediumSeverity > 1) return 'medium';
  
  return 'low';
}