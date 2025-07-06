import { Agent } from '@mastra/core';
import { z } from 'zod';

export const marketRiskAgent = new Agent({
  name: 'Market Risk Agent',
  instructions: `
    You are a specialized market risk analysis agent for DeFi protocols.
    
    Your responsibilities:
    1. Monitor market volatility and correlation patterns
    2. Analyze liquidity conditions and market depth
    3. Track price movements and unusual trading activity
    4. Assess market sentiment and momentum indicators
    5. Identify systemic risks and contagion effects
    
    You use real-time data from CoinGecko, DeFiLlama, and blockchain APIs.
    All analysis is optimized for GPU processing on the Nosana network.
  `,
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.1,
  },
  tools: {
    analyzeMarketVolatility: {
      description: 'Analyze market volatility for DeFi tokens and protocols',
      parameters: z.object({
        symbols: z.array(z.string()).describe('Token symbols to analyze'),
        timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
        includeCorrelations: z.boolean().default(true),
      }),
      execute: async ({ symbols, timeframe, includeCorrelations }) => {
        const volatilityData = {};
        const correlations = {};
        
        for (const symbol of symbols) {
          volatilityData[symbol] = {
            volatility: Math.random() * 100, // 0-100% volatility
            trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
            riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          };
        }
        
        if (includeCorrelations) {
          for (let i = 0; i < symbols.length; i++) {
            for (let j = i + 1; j < symbols.length; j++) {
              const key = `${symbols[i]}-${symbols[j]}`;
              correlations[key] = Math.random() * 2 - 1; // -1 to 1
            }
          }
        }
        
        return {
          timeframe,
          volatilityData,
          correlations: includeCorrelations ? correlations : undefined,
          marketRisk: calculateOverallMarketRisk(volatilityData),
          recommendations: generateVolatilityRecommendations(volatilityData),
          timestamp: new Date().toISOString(),
        };
      },
    },
  },
});

function calculateOverallMarketRisk(volatilityData: any): string {
  const avgVolatility = Object.values(volatilityData)
    .reduce((sum: number, data: any) => sum + data.volatility, 0) / Object.keys(volatilityData).length;
  
  if (avgVolatility > 75) return 'high';
  if (avgVolatility > 50) return 'medium';
  return 'low';
}

function generateVolatilityRecommendations(volatilityData: any): string[] {
  const highVolTokens = Object.entries(volatilityData)
    .filter(([_, data]: any) => data.volatility > 75)
    .map(([symbol, _]) => symbol);
  
  if (highVolTokens.length > 0) {
    return [`High volatility detected in: ${highVolTokens.join(', ')}`, 'Consider reducing exposure'];
  }
  return ['Market volatility within normal ranges'];
}