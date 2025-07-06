import { Config } from '@mastra/core';
import { defiRiskOracleAgent } from './agents/defi-risk-oracle';
import { protocolMonitorAgent } from './agents/protocol-monitor';
import { smartContractAnalyzerAgent } from './agents/smart-contract-analyzer';
import { marketRiskAgent } from './agents/market-risk';
import { socialSentimentAgent } from './agents/social-sentiment';
import { alertSystemAgent } from './agents/alert-system';
import { riskReportingAgent } from './agents/risk-reporting';

export default {
  name: 'DeFi Risk Oracle System',
  description: 'AI-powered DeFi risk assessment system with multi-agent architecture and GPU-accelerated analysis on Nosana network',
  version: '1.0.0',
  
  agents: [
    // Main coordinating agent
    defiRiskOracleAgent,
    
    // Specialized sub-agents
    protocolMonitorAgent,
    smartContractAnalyzerAgent,
    marketRiskAgent,
    socialSentimentAgent,
    alertSystemAgent,
    riskReportingAgent,
  ],
  
  // Global settings
  settings: {
    // OpenAI configuration for all agents
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      temperature: 0.1, // Low temperature for consistent risk analysis
    },
    
    // Nosana network configuration
    nosana: {
      apiEndpoint: process.env.NOSANA_API_ENDPOINT || 'https://api.nosana.io/v1',
      apiKey: process.env.NOSANA_API_KEY,
      defaultRegion: process.env.NOSANA_REGION || 'US-West',
      maxCostPerJob: parseFloat(process.env.NOSANA_MAX_COST || '1.0'),
    },
    
    // Data provider configurations
    dataProviders: {
      defiLlama: {
        baseUrl: 'https://api.llama.fi',
        rateLimit: 100, // requests per minute
      },
      coinGecko: {
        baseUrl: 'https://api.coingecko.com/api/v3',
        apiKey: process.env.COINGECKO_API_KEY,
        rateLimit: 50,
      },
      etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
        networks: {
          ethereum: 'https://api.etherscan.io/api',
          polygon: 'https://api.polygonscan.com/api',
          arbitrum: 'https://api.arbiscan.io/api',
        },
      },
    },
    
    // Risk assessment parameters
    riskParameters: {
      // Weight factors for overall risk calculation
      weights: {
        smartContract: 0.25,
        market: 0.20,
        governance: 0.15,
        technical: 0.15,
        social: 0.10,
        counterparty: 0.15,
      },
      
      // Alert thresholds
      thresholds: {
        low: 30,
        medium: 50,
        high: 70,
        critical: 85,
      },
      
      // Update intervals (in milliseconds)
      updateIntervals: {
        protocolMonitor: 30000,    // 30 seconds
        smartContract: 300000,    // 5 minutes
        marketRisk: 60000,        // 1 minute
        socialSentiment: 300000,  // 5 minutes
        alertSystem: 30000,       // 30 seconds
        riskReporting: 3600000,   // 1 hour
      },
    },
    
    // WebSocket configuration for real-time updates
    websocket: {
      port: parseInt(process.env.WS_PORT || '8080'),
      path: '/ws',
      heartbeatInterval: 30000,
    },
    
    // Database configuration
    database: {
      type: 'postgresql',
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production',
    },
    
    // Notification channels
    notifications: {
      discord: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        enabled: Boolean(process.env.DISCORD_WEBHOOK_URL),
      },
      telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      },
      email: {
        smtpServer: process.env.SMTP_SERVER,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD,
        enabled: Boolean(process.env.SMTP_SERVER),
      },
    },
  },
  
  // Environment-specific configurations
  environments: {
    development: {
      logLevel: 'debug',
      enableMockData: false, // Always use real data
      nosanaNetwork: 'testnet',
    },
    production: {
      logLevel: 'info',
      enableMockData: false,
      nosanaNetwork: 'mainnet',
      enableMetrics: true,
      enableHealthChecks: true,
    },
  },
  
  // Health check configuration
  healthChecks: {
    interval: 60000, // 1 minute
    endpoints: [
      '/health',
      '/health/agents',
      '/health/database',
      '/health/nosana',
    ],
  },
  
  // Metrics and monitoring
  metrics: {
    enabled: process.env.NODE_ENV === 'production',
    endpoint: '/metrics',
    collectDefaultMetrics: true,
    customMetrics: [
      'risk_assessments_total',
      'alerts_generated_total',
      'nosana_jobs_submitted_total',
      'nosana_compute_cost_total',
      'agent_response_time_seconds',
    ],
  },
  
  // API configuration
  api: {
    port: parseInt(process.env.PORT || '3000'),
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET,
    apiKeyRequired: process.env.NODE_ENV === 'production',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },
  
  // Integration hooks
  hooks: {
    beforeStart: async () => {
      console.log('🚀 Initializing DeFi Risk Oracle System...');
      console.log('📊 Loading risk assessment models...');
      console.log('🔗 Connecting to Nosana network...');
    },
    
    afterStart: async () => {
      console.log('✅ DeFi Risk Oracle System started successfully');
      console.log('🌐 WebSocket server listening for real-time updates');
      console.log('🤖 All agents initialized and ready');
      console.log('💻 Nosana GPU compute integration active');
    },
    
    onError: async (error: Error) => {
      console.error('❌ System error:', error.message);
      // Could send alerts to monitoring systems
    },
    
    onShutdown: async () => {
      console.log('🛑 Shutting down DeFi Risk Oracle System...');
      console.log('💾 Saving final risk assessments...');
      console.log('🔌 Closing connections...');
    },
  },
} satisfies Config;