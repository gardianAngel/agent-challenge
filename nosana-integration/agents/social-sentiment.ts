import { Agent } from '@mastra/core';
import { z } from 'zod';

export const socialSentimentAgent = new Agent({
  name: 'Social Sentiment Agent',
  instructions: `
    You analyze social media sentiment and community activity for DeFi protocols.
    
    Your responsibilities:
    1. Monitor Twitter, Reddit, Discord for protocol mentions
    2. Analyze sentiment trends and community engagement
    3. Detect unusual social activity patterns
    4. Track developer activity and project updates
    5. Identify potential social engineering attacks or FUD campaigns
  `,
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.1,
  },
  tools: {
    analyzeSocialSentiment: {
      description: 'Analyze social sentiment for a DeFi protocol',
      parameters: z.object({
        protocolName: z.string(),
        timeframe: z.enum(['1h', '24h', '7d']).default('24h'),
        sources: z.array(z.enum(['twitter', 'reddit', 'discord'])).default(['twitter', 'reddit']),
      }),
      execute: async ({ protocolName, timeframe, sources }) => {
        const sentimentData = {};
        
        for (const source of sources) {
          sentimentData[source] = {
            sentiment: Math.random() * 2 - 1, // -1 to 1
            mentions: Math.floor(Math.random() * 1000) + 100,
            engagement: Math.random(),
            trending: Math.random() > 0.8,
          };
        }
        
        return {
          protocol: protocolName,
          timeframe,
          overallSentiment: calculateOverallSentiment(sentimentData),
          sources: sentimentData,
          riskIndicators: identifyRiskIndicators(sentimentData),
          timestamp: new Date().toISOString(),
        };
      },
    },
  },
});

function calculateOverallSentiment(data: any): number {
  const sentiments = Object.values(data).map((d: any) => d.sentiment);
  return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
}

function identifyRiskIndicators(data: any): string[] {
  const indicators = [];
  
  Object.entries(data).forEach(([source, sourceData]: any) => {
    if (sourceData.sentiment < -0.5) {
      indicators.push(`Negative sentiment on ${source}`);
    }
    if (sourceData.mentions > 800) {
      indicators.push(`High mention volume on ${source}`);
    }
  });
  
  return indicators;
}