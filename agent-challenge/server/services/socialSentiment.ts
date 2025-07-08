import { storage } from "../storage";
import { RiskEngine } from "./riskEngine";

export interface SentimentData {
  platform: string;
  symbol: string;
  sentiment: number; // -1 to 1
  volume: number;
  mentions: number;
  influencerMentions: number;
  timestamp: Date;
}

export interface SocialMetrics {
  twitterSentiment: number;
  redditSentiment: number;
  discordActivity: number;
  githubActivity: number;
  developerActivity: number;
  communityHealth: number;
  overallSentiment: number;
}

export interface WhaleActivity {
  address: string;
  txCount: number;
  volumeUSD: number;
  behavior: 'accumulating' | 'distributing' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
}

export class SocialSentiment {
  private static instance: SocialSentiment;
  private riskEngine: RiskEngine;
  private sentimentData: Map<string, SentimentData[]> = new Map();
  private whaleActivity: Map<string, WhaleActivity[]> = new Map();

  private constructor() {
    this.riskEngine = RiskEngine.getInstance();
  }

  static getInstance(): SocialSentiment {
    if (!SocialSentiment.instance) {
      SocialSentiment.instance = new SocialSentiment();
    }
    return SocialSentiment.instance;
  }

  /**
   * Start social sentiment monitoring
   */
  async startMonitoring(): Promise<void> {
    console.log('[SocialSentiment] Starting social sentiment monitoring');
    
    // Update status to syncing initially
    await storage.updateAgentStatus("Social Sentiment", { status: "syncing" });
    
    // Initial data fetch
    await this.fetchSocialData();
    
    // Set up periodic monitoring
    setInterval(async () => {
      await this.fetchSocialData();
      await this.analyzeSentiment();
    }, 300000); // Every 5 minutes

    await storage.updateAgentStatus("Social Sentiment", { status: "active" });
  }

  /**
   * Fetch social data for all protocols
   */
  private async fetchSocialData(): Promise<void> {
    try {
      const protocols = await storage.getProtocols();
      
      for (const protocol of protocols) {
        if (protocol.isActive) {
          await this.fetchProtocolSocialData(protocol.symbol);
          await this.fetchWhaleActivity(protocol.symbol);
        }
      }

      console.log(`[SocialSentiment] Updated social data for ${protocols.length} protocols`);
    } catch (error) {
      console.error('[SocialSentiment] Error fetching social data:', error);
      await storage.updateAgentStatus("Social Sentiment", { status: "error" });
    }
  }

  /**
   * Fetch social data for a specific protocol
   */
  private async fetchProtocolSocialData(symbol: string): Promise<void> {
    try {
      // In production, this would call:
      // - Twitter API v2 for tweets and sentiment
      // - Reddit API for discussion analysis
      // - Discord webhooks for community activity
      // - GitHub API for developer activity
      
      const twitterData = await this.mockFetchTwitterData(symbol);
      const redditData = await this.mockFetchRedditData(symbol);
      const githubData = await this.mockFetchGitHubData(symbol);
      
      if (!this.sentimentData.has(symbol)) {
        this.sentimentData.set(symbol, []);
      }
      
      const sentimentHistory = this.sentimentData.get(symbol)!;
      sentimentHistory.push(twitterData, redditData, githubData);
      
      // Keep only last 100 data points per platform
      if (sentimentHistory.length > 100) {
        sentimentHistory.splice(0, sentimentHistory.length - 100);
      }
      
    } catch (error) {
      console.error(`[SocialSentiment] Error fetching social data for ${symbol}:`, error);
    }
  }

  /**
   * Mock Twitter data fetching
   */
  private async mockFetchTwitterData(symbol: string): Promise<SentimentData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      platform: 'twitter',
      symbol,
      sentiment: (Math.random() - 0.5) * 2, // -1 to 1
      volume: Math.floor(Math.random() * 10000) + 1000,
      mentions: Math.floor(Math.random() * 1000) + 100,
      influencerMentions: Math.floor(Math.random() * 50),
      timestamp: new Date()
    };
  }

  /**
   * Mock Reddit data fetching
   */
  private async mockFetchRedditData(symbol: string): Promise<SentimentData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      platform: 'reddit',
      symbol,
      sentiment: (Math.random() - 0.5) * 2,
      volume: Math.floor(Math.random() * 5000) + 500,
      mentions: Math.floor(Math.random() * 500) + 50,
      influencerMentions: Math.floor(Math.random() * 20),
      timestamp: new Date()
    };
  }

  /**
   * Mock GitHub data fetching
   */
  private async mockFetchGitHubData(symbol: string): Promise<SentimentData> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      platform: 'github',
      symbol,
      sentiment: Math.random() * 0.5 + 0.25, // GitHub is usually neutral to positive
      volume: Math.floor(Math.random() * 100) + 10,
      mentions: Math.floor(Math.random() * 50) + 5,
      influencerMentions: Math.floor(Math.random() * 10),
      timestamp: new Date()
    };
  }

  /**
   * Fetch whale activity data
   */
  private async fetchWhaleActivity(symbol: string): Promise<void> {
    try {
      // In production, this would analyze on-chain data
      // for large wallet movements and patterns
      
      const whaleData = await this.mockFetchWhaleData(symbol);
      this.whaleActivity.set(symbol, whaleData);
      
    } catch (error) {
      console.error(`[SocialSentiment] Error fetching whale activity for ${symbol}:`, error);
    }
  }

  /**
   * Mock whale activity data
   */
  private async mockFetchWhaleData(symbol: string): Promise<WhaleActivity[]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const whaleCount = Math.floor(Math.random() * 5) + 3;
    const whales: WhaleActivity[] = [];
    
    for (let i = 0; i < whaleCount; i++) {
      const behavior = ['accumulating', 'distributing', 'neutral'][Math.floor(Math.random() * 3)] as 'accumulating' | 'distributing' | 'neutral';
      const riskLevel = behavior === 'distributing' ? 'high' : 
                       behavior === 'accumulating' ? 'medium' : 'low';
      
      whales.push({
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        txCount: Math.floor(Math.random() * 50) + 10,
        volumeUSD: Math.floor(Math.random() * 10000000) + 1000000,
        behavior,
        riskLevel
      });
    }
    
    return whales;
  }

  /**
   * Analyze sentiment and update risk scores
   */
  private async analyzeSentiment(): Promise<void> {
    const protocols = await storage.getProtocols();
    
    for (const protocol of protocols) {
      if (protocol.isActive) {
        const socialRisk = await this.calculateSocialRisk(protocol.symbol);
        
        if (socialRisk !== null) {
          await this.riskEngine.updateRiskAssessment(protocol.id, {
            socialRisk: socialRisk
          });
        }
      }
    }
  }

  /**
   * Calculate social risk score for a protocol
   */
  async calculateSocialRisk(symbol: string): Promise<number | null> {
    try {
      const sentimentHistory = this.sentimentData.get(symbol) || [];
      const whaleActivity = this.whaleActivity.get(symbol) || [];
      
      if (sentimentHistory.length === 0) return null;

      let riskScore = 50; // Start with neutral risk

      // Analyze sentiment trends
      const recentSentiment = sentimentHistory.slice(-10); // Last 10 data points
      const avgSentiment = recentSentiment.reduce((sum, data) => sum + data.sentiment, 0) / recentSentiment.length;
      
      // Negative sentiment increases risk
      if (avgSentiment < -0.5) {
        riskScore += 30;
      } else if (avgSentiment < -0.2) {
        riskScore += 15;
      } else if (avgSentiment > 0.5) {
        riskScore -= 15;
      }

      // Analyze mention volume (very high or very low can be risky)
      const avgMentions = recentSentiment.reduce((sum, data) => sum + data.mentions, 0) / recentSentiment.length;
      if (avgMentions < 50) {
        riskScore += 10; // Low activity can be concerning
      } else if (avgMentions > 5000) {
        riskScore += 5; // Very high activity might indicate volatility
      }

      // Analyze whale activity
      const distributingWhales = whaleActivity.filter(w => w.behavior === 'distributing').length;
      const highRiskWhales = whaleActivity.filter(w => w.riskLevel === 'high').length;
      
      riskScore += distributingWhales * 10;
      riskScore += highRiskWhales * 5;

      // Analyze sentiment volatility
      const sentimentVariance = this.calculateSentimentVariance(recentSentiment);
      if (sentimentVariance > 0.5) {
        riskScore += 10;
      }

      // Check for sudden sentiment changes
      if (recentSentiment.length >= 2) {
        const latestSentiment = recentSentiment[recentSentiment.length - 1].sentiment;
        const previousSentiment = recentSentiment[recentSentiment.length - 2].sentiment;
        const sentimentChange = Math.abs(latestSentiment - previousSentiment);
        
        if (sentimentChange > 0.8) {
          riskScore += 15;
        }
      }

      return Math.min(100, Math.max(0, riskScore));
    } catch (error) {
      console.error(`[SocialSentiment] Error calculating social risk for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate sentiment variance
   */
  private calculateSentimentVariance(sentimentData: SentimentData[]): number {
    if (sentimentData.length < 2) return 0;
    
    const sentiments = sentimentData.map(d => d.sentiment);
    const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
    
    return variance;
  }

  /**
   * Detect unusual social activity
   */
  async detectUnusualActivity(symbol: string): Promise<any> {
    const sentimentHistory = this.sentimentData.get(symbol) || [];
    const whaleActivity = this.whaleActivity.get(symbol) || [];
    
    const alerts = [];
    
    // Check for sentiment spikes
    if (sentimentHistory.length >= 2) {
      const latest = sentimentHistory[sentimentHistory.length - 1];
      const previous = sentimentHistory[sentimentHistory.length - 2];
      
      const sentimentChange = Math.abs(latest.sentiment - previous.sentiment);
      const mentionChange = (latest.mentions - previous.mentions) / previous.mentions;
      
      if (sentimentChange > 0.8) {
        alerts.push({
          type: 'sentiment_spike',
          message: `Unusual sentiment change detected for ${symbol}`,
          severity: sentimentChange > 1.2 ? 'high' : 'medium',
          data: { sentimentChange, from: previous.sentiment, to: latest.sentiment }
        });
      }
      
      if (mentionChange > 2) {
        alerts.push({
          type: 'mention_spike',
          message: `Unusual mention volume spike for ${symbol}`,
          severity: mentionChange > 5 ? 'high' : 'medium',
          data: { mentionChange, from: previous.mentions, to: latest.mentions }
        });
      }
    }
    
    // Check for whale activity
    const distributingWhales = whaleActivity.filter(w => w.behavior === 'distributing').length;
    if (distributingWhales > 2) {
      alerts.push({
        type: 'whale_distribution',
        message: `Multiple whales distributing ${symbol}`,
        severity: 'high',
        data: { distributingWhales }
      });
    }
    
    return alerts;
  }

  /**
   * Get social metrics summary
   */
  async getSocialMetrics(symbol: string): Promise<SocialMetrics | null> {
    const sentimentHistory = this.sentimentData.get(symbol) || [];
    
    if (sentimentHistory.length === 0) return null;
    
    const recent = sentimentHistory.slice(-5); // Last 5 data points
    const twitterData = recent.filter(d => d.platform === 'twitter');
    const redditData = recent.filter(d => d.platform === 'reddit');
    const githubData = recent.filter(d => d.platform === 'github');
    
    const twitterSentiment = twitterData.length > 0 ? 
      twitterData.reduce((sum, d) => sum + d.sentiment, 0) / twitterData.length : 0;
    
    const redditSentiment = redditData.length > 0 ? 
      redditData.reduce((sum, d) => sum + d.sentiment, 0) / redditData.length : 0;
    
    const githubActivity = githubData.length > 0 ? 
      githubData.reduce((sum, d) => sum + d.volume, 0) / githubData.length : 0;
    
    const overallSentiment = (twitterSentiment + redditSentiment) / 2;
    
    return {
      twitterSentiment: (twitterSentiment + 1) * 50, // Convert to 0-100 scale
      redditSentiment: (redditSentiment + 1) * 50,
      discordActivity: Math.random() * 100, // Mock data
      githubActivity: Math.min(100, githubActivity * 2),
      developerActivity: Math.min(100, githubActivity * 1.5),
      communityHealth: Math.min(100, (Math.abs(overallSentiment) + 0.5) * 50),
      overallSentiment: (overallSentiment + 1) * 50
    };
  }

  /**
   * Get whale activity summary
   */
  async getWhaleActivity(symbol: string): Promise<WhaleActivity[]> {
    return this.whaleActivity.get(symbol) || [];
  }

  /**
   * Get social sentiment dashboard data
   */
  async getSocialDashboard(): Promise<any> {
    const protocols = await storage.getProtocols();
    const dashboard = {
      totalProtocols: protocols.length,
      averageSentiment: 0,
      alertCount: 0,
      whaleAlerts: 0,
      platformActivity: {
        twitter: 0,
        reddit: 0,
        github: 0
      }
    };

    let totalSentiment = 0;
    let sentimentCount = 0;

    for (const protocol of protocols) {
      const metrics = await this.getSocialMetrics(protocol.symbol);
      if (metrics) {
        totalSentiment += metrics.overallSentiment;
        sentimentCount++;
      }

      const alerts = await this.detectUnusualActivity(protocol.symbol);
      dashboard.alertCount += alerts.length;
      dashboard.whaleAlerts += alerts.filter(a => a.type === 'whale_distribution').length;

      const sentimentHistory = this.sentimentData.get(protocol.symbol) || [];
      const recent = sentimentHistory.slice(-1)[0];
      if (recent) {
        if (recent.platform === 'twitter') dashboard.platformActivity.twitter += recent.volume;
        if (recent.platform === 'reddit') dashboard.platformActivity.reddit += recent.volume;
        if (recent.platform === 'github') dashboard.platformActivity.github += recent.volume;
      }
    }

    if (sentimentCount > 0) {
      dashboard.averageSentiment = totalSentiment / sentimentCount;
    }

    return dashboard;
  }
}
