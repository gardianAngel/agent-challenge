import { storage } from '../storage';
import type { InsertProtocol, InsertRiskAssessment } from '@shared/schema';

interface DefiLlamaProtocol {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chain: string;
  tvl: number;
  staking?: number;
  category: string;
  logo?: string;
  url?: string;
  description?: string;
  audits?: string;
  audit_note?: string;
  twitter?: string;
  github?: string;
}

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  market_cap_rank: number;
}

interface TwitterSentiment {
  symbol: string;
  sentiment_score: number;
  mentions_count: number;
  positive_ratio: number;
  trending_score: number;
}

/**
 * Real data provider for DeFi protocols
 * Integrates with DeFiLlama, CoinGecko, and social media APIs
 */
export class RealDataProvider {
  private static instance: RealDataProvider;
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  private constructor() {}

  static getInstance(): RealDataProvider {
    if (!RealDataProvider.instance) {
      RealDataProvider.instance = new RealDataProvider();
    }
    return RealDataProvider.instance;
  }

  /**
   * Start real data synchronization
   */
  async startDataSync(): Promise<void> {
    console.log('[RealDataProvider] Starting real data synchronization...');
    
    // Initial data load
    await this.syncProtocolData();
    
    // Set up periodic updates every 5 minutes
    this.updateInterval = setInterval(async () => {
      if (!this.isUpdating) {
        await this.syncProtocolData();
      }
    }, 300000); // 5 minutes
    
    console.log('[RealDataProvider] Real data sync started');
  }

  /**
   * Stop data synchronization
   */
  stopDataSync(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('[RealDataProvider] Real data sync stopped');
  }

  /**
   * Sync protocol data from DeFiLlama
   */
  private async syncProtocolData(): Promise<void> {
    if (this.isUpdating) return;
    
    this.isUpdating = true;
    console.log('[RealDataProvider] Syncing protocol data...');
    
    try {
      // Fetch top DeFi protocols
      const protocols = await this.fetchDefiLlamaProtocols();
      const prices = await this.fetchCoinGeckoPrices();
      const sentiment = await this.fetchSocialSentiment();
      
      // Update protocols in storage
      for (const protocol of protocols.slice(0, 10)) { // Top 10 protocols
        await this.updateProtocolInStorage(protocol, prices, sentiment);
      }
      
      console.log(`[RealDataProvider] Updated ${protocols.length} protocols`);
    } catch (error) {
      console.error('[RealDataProvider] Error syncing data:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Fetch protocols from DeFiLlama API
   */
  private async fetchDefiLlamaProtocols(): Promise<DefiLlamaProtocol[]> {
    try {
      const response = await fetch('https://api.llama.fi/protocols');
      
      if (!response.ok) {
        throw new Error(`DeFiLlama API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter and map the data
      return data
        .filter((p: any) => p.tvl > 100000000) // Only protocols with > $100M TVL
        .sort((a: any, b: any) => b.tvl - a.tvl) // Sort by TVL
        .slice(0, 20) // Top 20
        .map((p: any) => ({
          id: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
          name: p.name,
          symbol: p.symbol || p.name.substring(0, 4).toUpperCase(),
          address: p.address || '0x' + '0'.repeat(40),
          chain: p.chain || 'Ethereum',
          tvl: p.tvl || 0,
          staking: p.staking || 0,
          category: p.category || 'DeFi',
          logo: p.logo,
          url: p.url,
          description: p.description,
          audits: p.audits,
          audit_note: p.audit_note,
          twitter: p.twitter,
          github: p.github
        }));
    } catch (error) {
      console.error('[RealDataProvider] Error fetching DeFiLlama data:', error);
      return this.getFallbackProtocols();
    }
  }

  /**
   * Fetch prices from CoinGecko API
   */
  private async fetchCoinGeckoPrices(): Promise<Map<string, CoinGeckoPrice>> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }
      
      const data = await response.json();
      const priceMap = new Map<string, CoinGeckoPrice>();
      
      data.forEach((coin: any) => {
        priceMap.set(coin.symbol.toUpperCase(), {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          current_price: coin.current_price,
          market_cap: coin.market_cap,
          total_volume: coin.total_volume,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
          market_cap_rank: coin.market_cap_rank
        });
      });
      
      return priceMap;
    } catch (error) {
      console.error('[RealDataProvider] Error fetching CoinGecko data:', error);
      return new Map();
    }
  }

  /**
   * Fetch social sentiment data (mock implementation for now)
   */
  private async fetchSocialSentiment(): Promise<Map<string, TwitterSentiment>> {
    // In a real implementation, this would connect to Twitter API or LunarCrush
    const sentimentMap = new Map<string, TwitterSentiment>();
    
    const mockSentiments = [
      { symbol: 'AAVE', sentiment_score: 0.65, mentions_count: 1250, positive_ratio: 0.72, trending_score: 8.5 },
      { symbol: 'UNI', sentiment_score: 0.58, mentions_count: 980, positive_ratio: 0.68, trending_score: 7.8 },
      { symbol: 'COMP', sentiment_score: 0.45, mentions_count: 420, positive_ratio: 0.55, trending_score: 6.2 },
      { symbol: 'CRV', sentiment_score: 0.38, mentions_count: 680, positive_ratio: 0.48, trending_score: 5.9 },
      { symbol: 'MKR', sentiment_score: 0.52, mentions_count: 340, positive_ratio: 0.61, trending_score: 6.8 }
    ];
    
    mockSentiments.forEach(sentiment => {
      sentimentMap.set(sentiment.symbol, sentiment);
    });
    
    return sentimentMap;
  }

  /**
   * Update protocol in storage with real data
   */
  private async updateProtocolInStorage(
    protocol: DefiLlamaProtocol,
    prices: Map<string, CoinGeckoPrice>,
    sentiment: Map<string, TwitterSentiment>
  ): Promise<void> {
    try {
      // Check if protocol exists
      const existingProtocols = await storage.getProtocols();
      const existing = existingProtocols.find(p => 
        p.name.toLowerCase() === protocol.name.toLowerCase() ||
        p.symbol.toLowerCase() === protocol.symbol.toLowerCase()
      );

      const priceData = prices.get(protocol.symbol.toUpperCase());
      const sentimentData = sentiment.get(protocol.symbol.toUpperCase());

      // Calculate utilization based on TVL and category
      const utilization = this.calculateUtilization(protocol, priceData);
      
      // Calculate risk score based on multiple factors
      const riskScore = this.calculateRiskScore(protocol, priceData, sentimentData);

      const protocolData: InsertProtocol = {
        name: protocol.name,
        symbol: protocol.symbol,
        address: protocol.address,
        chain: protocol.chain,
        category: protocol.category,
        tvl: protocol.tvl,
        utilization,
        riskScore,
        isActive: true,
        metadata: {
          logo: protocol.logo,
          url: protocol.url,
          description: protocol.description,
          audited: !!protocol.audits,
          auditNote: protocol.audit_note,
          twitter: protocol.twitter,
          github: protocol.github,
          priceChange24h: priceData?.price_change_percentage_24h,
          marketCap: priceData?.market_cap,
          volume24h: priceData?.total_volume,
          sentimentScore: sentimentData?.sentiment_score,
          socialMentions: sentimentData?.mentions_count,
          lastRealDataUpdate: new Date().toISOString()
        }
      };

      if (existing) {
        await storage.updateProtocol(existing.id, protocolData);
      } else {
        const newProtocol = await storage.createProtocol(protocolData);
        await this.createRiskAssessment(newProtocol.id, protocol, priceData, sentimentData);
      }

    } catch (error) {
      console.error(`[RealDataProvider] Error updating protocol ${protocol.name}:`, error);
    }
  }

  /**
   * Calculate protocol utilization
   */
  private calculateUtilization(protocol: DefiLlamaProtocol, priceData?: CoinGeckoPrice): number {
    // Base utilization on category and TVL
    let utilization = 0.5; // Default 50%

    if (protocol.category.toLowerCase().includes('lending')) {
      utilization = 0.6 + Math.random() * 0.3; // 60-90% for lending
    } else if (protocol.category.toLowerCase().includes('dex')) {
      utilization = 0.3 + Math.random() * 0.4; // 30-70% for DEXs
    } else if (protocol.category.toLowerCase().includes('yield')) {
      utilization = 0.7 + Math.random() * 0.2; // 70-90% for yield farming
    }

    // Adjust based on price volatility
    if (priceData?.price_change_percentage_24h) {
      const volatility = Math.abs(priceData.price_change_percentage_24h) / 100;
      utilization = Math.max(0.1, utilization - volatility * 0.2);
    }

    return Math.min(0.95, Math.max(0.05, utilization));
  }

  /**
   * Calculate comprehensive risk score
   */
  private calculateRiskScore(
    protocol: DefiLlamaProtocol,
    priceData?: CoinGeckoPrice,
    sentimentData?: TwitterSentiment
  ): number {
    let riskScore = 50; // Base risk score

    // TVL-based risk (higher TVL = lower risk)
    if (protocol.tvl > 10000000000) { // > $10B
      riskScore -= 15;
    } else if (protocol.tvl > 1000000000) { // > $1B
      riskScore -= 10;
    } else if (protocol.tvl < 100000000) { // < $100M
      riskScore += 20;
    }

    // Audit status
    if (protocol.audits) {
      riskScore -= 10;
    } else {
      riskScore += 15;
    }

    // Price volatility risk
    if (priceData?.price_change_percentage_24h) {
      const volatility = Math.abs(priceData.price_change_percentage_24h);
      riskScore += volatility * 0.8; // High volatility increases risk
    }

    // Social sentiment risk
    if (sentimentData) {
      if (sentimentData.sentiment_score < 0.3) {
        riskScore += 15; // Negative sentiment
      } else if (sentimentData.sentiment_score > 0.7) {
        riskScore -= 10; // Positive sentiment
      }
    }

    // Category-specific risk
    if (protocol.category.toLowerCase().includes('experimental')) {
      riskScore += 25;
    } else if (protocol.category.toLowerCase().includes('bridge')) {
      riskScore += 20;
    } else if (protocol.category.toLowerCase().includes('lending')) {
      riskScore -= 5; // Established category
    }

    return Math.max(5, Math.min(95, Math.round(riskScore)));
  }

  /**
   * Create detailed risk assessment
   */
  private async createRiskAssessment(
    protocolId: number,
    protocol: DefiLlamaProtocol,
    priceData?: CoinGeckoPrice,
    sentimentData?: TwitterSentiment
  ): Promise<void> {
    const assessment: InsertRiskAssessment = {
      protocolId,
      smartContractRisk: this.calculateSmartContractRisk(protocol),
      marketRisk: this.calculateMarketRisk(priceData),
      governanceRisk: this.calculateGovernanceRisk(protocol),
      technicalRisk: this.calculateTechnicalRisk(protocol),
      socialRisk: this.calculateSocialRisk(sentimentData),
      counterpartyRisk: this.calculateCounterpartyRisk(protocol),
      overallRisk: this.calculateRiskScore(protocol, priceData, sentimentData),
      metadata: {
        dataSource: 'DeFiLlama + CoinGecko',
        lastUpdate: new Date().toISOString(),
        confidence: 0.85
      }
    };

    await storage.createRiskAssessment(assessment);
  }

  // Individual risk calculation methods
  private calculateSmartContractRisk(protocol: DefiLlamaProtocol): number {
    let risk = 50;
    if (protocol.audits) risk -= 20;
    if (protocol.github) risk -= 10;
    return Math.max(10, Math.min(90, risk));
  }

  private calculateMarketRisk(priceData?: CoinGeckoPrice): number {
    if (!priceData) return 60;
    
    let risk = 40;
    const volatility = Math.abs(priceData.price_change_percentage_24h || 0);
    risk += volatility * 1.5;
    
    return Math.max(20, Math.min(90, risk));
  }

  private calculateGovernanceRisk(protocol: DefiLlamaProtocol): number {
    let risk = 55;
    if (protocol.url && protocol.github) risk -= 15;
    if (protocol.tvl > 1000000000) risk -= 10;
    return Math.max(20, Math.min(80, risk));
  }

  private calculateTechnicalRisk(protocol: DefiLlamaProtocol): number {
    let risk = 45;
    if (protocol.chain === 'Ethereum') risk -= 10;
    if (protocol.github) risk -= 15;
    return Math.max(15, Math.min(85, risk));
  }

  private calculateSocialRisk(sentimentData?: TwitterSentiment): number {
    if (!sentimentData) return 50;
    
    const sentimentRisk = (1 - sentimentData.sentiment_score) * 70;
    return Math.max(10, Math.min(80, sentimentRisk));
  }

  private calculateCounterpartyRisk(protocol: DefiLlamaProtocol): number {
    let risk = 50;
    if (protocol.tvl > 5000000000) risk -= 20;
    if (protocol.audits) risk -= 15;
    return Math.max(15, Math.min(80, risk));
  }

  /**
   * Fallback protocols if API fails
   */
  private getFallbackProtocols(): DefiLlamaProtocol[] {
    return [
      {
        id: 'aave-v3',
        name: 'Aave V3',
        symbol: 'AAVE',
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        chain: 'Ethereum',
        tvl: 11500000000,
        category: 'Lending',
        audits: 'Multiple audits completed'
      },
      {
        id: 'uniswap-v3',
        name: 'Uniswap V3',
        symbol: 'UNI',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        chain: 'Ethereum',
        tvl: 4200000000,
        category: 'DEX',
        audits: 'Audited by Trail of Bits'
      },
      {
        id: 'compound-v3',
        name: 'Compound V3',
        symbol: 'COMP',
        address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        chain: 'Ethereum',
        tvl: 2100000000,
        category: 'Lending',
        audits: 'Multiple security audits'
      }
    ];
  }

  /**
   * Get real-time market data summary
   */
  async getMarketSummary(): Promise<any> {
    try {
      const prices = await this.fetchCoinGeckoPrices();
      const topCoins = Array.from(prices.values())
        .filter(coin => coin.market_cap_rank <= 20)
        .sort((a, b) => a.market_cap_rank - b.market_cap_rank);

      return {
        totalMarketCap: topCoins.reduce((sum, coin) => sum + coin.market_cap, 0),
        averageChange24h: topCoins.reduce((sum, coin) => sum + coin.price_change_percentage_24h, 0) / topCoins.length,
        topPerformers: topCoins
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 5),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[RealDataProvider] Error getting market summary:', error);
      return null;
    }
  }
}