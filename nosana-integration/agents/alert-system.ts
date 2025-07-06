import { Agent } from '@mastra/core';
import { z } from 'zod';

export const alertSystemAgent = new Agent({
  name: 'Alert System Agent',
  instructions: `
    You manage the alert generation and notification system for DeFi risk monitoring.
    
    Your responsibilities:
    1. Monitor risk scores and trigger alerts when thresholds are exceeded
    2. Categorize alerts by severity and urgency
    3. Send notifications through multiple channels (Discord, Telegram, Email)
    4. Manage alert escalation and de-duplication
    5. Track alert resolution and effectiveness
  `,
  model: {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.1,
  },
  tools: {
    generateRiskAlert: {
      description: 'Generate and send risk alert based on protocol analysis',
      parameters: z.object({
        protocolName: z.string(),
        riskScore: z.number().min(0).max(100),
        riskFactors: z.array(z.string()),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        channels: z.array(z.enum(['discord', 'telegram', 'email'])).default(['discord']),
      }),
      execute: async ({ protocolName, riskScore, riskFactors, severity, channels }) => {
        const alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          protocol: protocolName,
          type: severity,
          riskScore,
          title: `${severity.toUpperCase()} Risk Alert - ${protocolName}`,
          description: `Risk score: ${riskScore}/100. Factors: ${riskFactors.join(', ')}`,
          factors: riskFactors,
          recommendations: generateAlertRecommendations(severity, riskFactors),
          timestamp: new Date().toISOString(),
          status: 'active',
          channels,
        };

        // Simulate sending to notification channels
        for (const channel of channels) {
          await sendNotification(channel, alert);
        }

        return alert;
      },
    },
  },
});

function generateAlertRecommendations(severity: string, factors: string[]): string[] {
  const recommendations = [];
  
  if (severity === 'critical') {
    recommendations.push('IMMEDIATE ACTION REQUIRED');
    recommendations.push('Consider withdrawing funds if safe to do so');
  } else if (severity === 'high') {
    recommendations.push('Review position sizes and exposure');
    recommendations.push('Set up automated alerts for changes');
  }
  
  return recommendations;
}

async function sendNotification(channel: string, alert: any): Promise<void> {
  console.log(`📢 Alert sent to ${channel}: ${alert.title}`);
  // Implementation would send to actual notification channels
}