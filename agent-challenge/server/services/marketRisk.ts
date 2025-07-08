import { storage } from "../storage";
import { RiskEngine } from "./riskEngine";

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  priceChange24h: number;
  volatility: number;
  liquidity: number;
}

export interface CorrelationMatrix {
  [symbol: string]: {
    [symbol: string]: number;
  };
}

export interface VaRCalculation {
  var95: number;
  var99: number;
  expectedShortfall: number;
  confidenceLevel: number;
}

export class MarketRisk {
  private static instance: MarketRisk;
  private riskEngine: RiskEngine;
  private marketData: Map<string, MarketData> = new Map();
  private priceHistory: Map<string, number[]> = new Map();

  private constructor() {
    this.riskEngine = RiskEngine.getInstance();
  }

  static getInstance(): MarketRisk {
    if (!MarketRisk.instance) {
      MarketRisk.instance = new MarketRisk();
    }
    return MarketRisk.instance;
  }

  /**
   * Start market risk monitoring
   */
  async startMonitoring(): Promise<void> {
    console.log('[MarketRisk] Starting market risk monitoring');
    
    // Initial data fetch
    await this.fetchMarketData();
    
    // Set up periodic updates
    setInterval(async () => {
      await this.fetchMarketData();
      await this.calculateRiskMetrics();
    }, 60000); // Every minute

    await storage.updateAgentStatus("Market Risk", { status: "active" });
  }

  /**
   * Fetch market data for all tracked assets
   */
  private async fetchMarketData(): Promise<void> {
    try {
      const protocols = await storage.getProtocols();
      
      for (const protocol of protocols) {
        if (protocol.isActive) {
          await this.fetchAssetData(protocol.symbol);
        }
      }

      console.log(`[MarketRisk] Updated market data for ${protocols.length} assets`);
    } catch (error) {
      console.error('[MarketRisk] Error fetching market data:', error);
      await storage.updateAgentStatus("Market Risk", { status: "error" });
    }
  }

  /**
   * Fetch data for a specific asset
   */
  private async fetchAssetData(symbol: string): Promise<void> {
    try {
      // In production, this would call CoinGecko API, 1inch API, etc.
      const mockData = await this.mockFetchAssetData(symbol);
      
      if (mockData) {
        this.marketData.set(symbol, mockData);
        this.updatePriceHistory(symbol, mockData.price);
      }
    } catch (error) {
      console.error(`[MarketRisk] Error fetching data for ${symbol}:`, error);
    }
  }

  /**
   * Mock market data fetching
   */
  private async mockFetchAssetData(symbol: string): Promise<MarketData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock price based on symbol
    const basePrices: Record<string, number> = {
      'AAVE': 95.0,
      'UNI': 6.2,
      'COMP': 45.5,
      'ETH': 2400.0,
      'BTC': 43500.0
    };

    const basePrice = basePrices[symbol] || 1.0;
    const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const currentPrice = basePrice * (1 + priceVariation);

    return {
      symbol,
      price: currentPrice,
      volume24h: Math.random() * 1000000000, // Random volume
      marketCap: currentPrice * Math.random() * 1000000000,
      priceChange24h: (Math.random() - 0.5) * 0.2, // ±10% change
      volatility: Math.random() * 0.3 + 0.1, // 10-40% volatility
      liquidity: Math.random() * 100000000 + 10000000 // $10M-$110M liquidity
    };
  }

  /**
   * Update price history for volatility calculations
   */
  private updatePriceHistory(symbol: string, price: number): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(price);
    
    // Keep only last 100 prices
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Calculate risk metrics for all protocols
   */
  private async calculateRiskMetrics(): Promise<void> {
    const protocols = await storage.getProtocols();
    
    for (const protocol of protocols) {
      if (protocol.isActive) {
        const marketRisk = await this.calculateProtocolMarketRisk(protocol.id);
        
        if (marketRisk !== null) {
          await this.riskEngine.updateRiskAssessment(protocol.id, {
            marketRisk: marketRisk
          });
        }
      }
    }
  }

  /**
   * Calculate market risk for a specific protocol
   */
  async calculateProtocolMarketRisk(protocolId: number): Promise<number | null> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      if (!protocol) return null;

      const marketData = this.marketData.get(protocol.symbol);
      if (!marketData) return null;

      let riskScore = 0;

      // Volatility risk (0-40 points)
      const volatilityRisk = Math.min(40, marketData.volatility * 100);
      riskScore += volatilityRisk;

      // Liquidity risk (0-30 points)
      const liquidityRisk = marketData.liquidity < 50000000 ? 30 : 
                           marketData.liquidity < 100000000 ? 15 : 0;
      riskScore += liquidityRisk;

      // Price change risk (0-20 points)
      const priceChangeRisk = Math.min(20, Math.abs(marketData.priceChange24h) * 100);
      riskScore += priceChangeRisk;

      // Correlation risk (0-10 points)
      const correlationRisk = await this.calculateCorrelationRisk(protocol.symbol);
      riskScore += correlationRisk;

      return Math.min(100, Math.max(0, riskScore));
    } catch (error) {
      console.error(`[MarketRisk] Error calculating risk for protocol ${protocolId}:`, error);
      return null;
    }
  }

  /**
   * Calculate correlation risk
   */
  private async calculateCorrelationRisk(symbol: string): Promise<number> {
    const correlations = await this.calculateCorrelations();
    const symbolCorrelations = correlations[symbol] || {};
    
    // High correlation with other assets increases risk
    const avgCorrelation = Object.values(symbolCorrelations).reduce((sum, corr) => sum + Math.abs(corr), 0) / Object.keys(symbolCorrelations).length;
    
    return avgCorrelation > 0.7 ? 10 : avgCorrelation > 0.5 ? 5 : 0;
  }

  /**
   * Calculate correlations between assets
   */
  async calculateCorrelations(): Promise<CorrelationMatrix> {
    const correlations: CorrelationMatrix = {};
    const symbols = Array.from(this.marketData.keys());

    for (const symbol1 of symbols) {
      correlations[symbol1] = {};
      
      for (const symbol2 of symbols) {
        if (symbol1 === symbol2) {
          correlations[symbol1][symbol2] = 1.0;
        } else {
          const correlation = this.calculatePearsonCorrelation(symbol1, symbol2);
          correlations[symbol1][symbol2] = correlation;
        }
      }
    }

    return correlations;
  }

  /**
   * Calculate Pearson correlation between two assets
   */
  private calculatePearsonCorrelation(symbol1: string, symbol2: string): number {
    const history1 = this.priceHistory.get(symbol1) || [];
    const history2 = this.priceHistory.get(symbol2) || [];
    
    if (history1.length < 2 || history2.length < 2) return 0;

    const minLength = Math.min(history1.length, history2.length);
    const x = history1.slice(-minLength);
    const y = history2.slice(-minLength);

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
   * Calculate Value at Risk (VaR)
   */
  async calculateVaR(protocolId: number, confidence: number = 0.95): Promise<VaRCalculation | null> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      if (!protocol) return null;

      const history = this.priceHistory.get(protocol.symbol) || [];
      if (history.length < 30) return null;

      // Calculate returns
      const returns = [];
      for (let i = 1; i < history.length; i++) {
        returns.push((history[i] - history[i-1]) / history[i-1]);
      }

      // Sort returns
      returns.sort((a, b) => a - b);

      // Calculate VaR at different confidence levels
      const var95Index = Math.floor(returns.length * 0.05);
      const var99Index = Math.floor(returns.length * 0.01);

      const var95 = returns[var95Index] || 0;
      const var99 = returns[var99Index] || 0;

      // Calculate Expected Shortfall (average of returns below VaR)
      const expectedShortfall = returns.slice(0, var95Index).reduce((sum, ret) => sum + ret, 0) / var95Index;

      return {
        var95: Math.abs(var95) * 100,
        var99: Math.abs(var99) * 100,
        expectedShortfall: Math.abs(expectedShortfall) * 100,
        confidenceLevel: confidence
      };
    } catch (error) {
      console.error(`[MarketRisk] Error calculating VaR for protocol ${protocolId}:`, error);
      return null;
    }
  }

  /**
   * Calculate impermanent loss for LP positions
   */
  async calculateImpermanentLoss(token1: string, token2: string, initialRatio: number): Promise<number> {
    const data1 = this.marketData.get(token1);
    const data2 = this.marketData.get(token2);
    
    if (!data1 || !data2) return 0;

    const currentRatio = data1.price / data2.price;
    const priceRatio = currentRatio / initialRatio;
    
    // Impermanent loss formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const impermanentLoss = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
    
    return Math.abs(impermanentLoss) * 100;
  }

  /**
   * Perform Monte Carlo simulation
   */
  async performMonteCarloSimulation(
    protocolId: number,
    scenarios: number = 1000,
    timeHorizon: number = 30
  ): Promise<any> {
    const protocol = await storage.getProtocol(protocolId);
    if (!protocol) return null;

    const marketData = this.marketData.get(protocol.symbol);
    if (!marketData) return null;

    const results = [];
    
    for (let i = 0; i < scenarios; i++) {
      let currentPrice = marketData.price;
      let maxDrawdown = 0;
      const scenarioPath = [];
      
      for (let day = 0; day < timeHorizon; day++) {
        // Generate random price movement
        const randomShock = (Math.random() - 0.5) * 2; // -1 to 1
        const priceChange = randomShock * marketData.volatility;
        currentPrice *= (1 + priceChange);
        
        const drawdown = (marketData.price - currentPrice) / marketData.price;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
        
        scenarioPath.push(currentPrice);
      }
      
      results.push({
        finalPrice: currentPrice,
        totalReturn: (currentPrice - marketData.price) / marketData.price,
        maxDrawdown,
        scenarioPath
      });
    }

    // Calculate statistics
    const returns = results.map(r => r.totalReturn);
    const drawdowns = results.map(r => r.maxDrawdown);
    
    returns.sort((a, b) => a - b);
    drawdowns.sort((a, b) => b - a);

    return {
      protocolId,
      scenarios,
      timeHorizon,
      statistics: {
        meanReturn: returns.reduce((sum, r) => sum + r, 0) / returns.length,
        worstCase: returns[0],
        bestCase: returns[returns.length - 1],
        var95: returns[Math.floor(returns.length * 0.05)],
        var99: returns[Math.floor(returns.length * 0.01)],
        maxDrawdown: drawdowns[0],
        avgDrawdown: drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length
      }
    };
  }

  /**
   * Get market risk dashboard data
   */
  async getMarketRiskDashboard(): Promise<any> {
    const protocols = await storage.getProtocols();
    const marketSummary = {
      totalAssets: this.marketData.size,
      averageVolatility: 0,
      highRiskAssets: 0,
      correlationWarnings: 0,
      portfolioVaR: 0
    };

    const volatilities = Array.from(this.marketData.values()).map(d => d.volatility);
    if (volatilities.length > 0) {
      marketSummary.averageVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
      marketSummary.highRiskAssets = volatilities.filter(v => v > 0.3).length;
    }

    const correlations = await this.calculateCorrelations();
    const symbols = Object.keys(correlations);
    
    for (const symbol of symbols) {
      const highCorrelations = Object.values(correlations[symbol]).filter(c => Math.abs(c) > 0.7).length;
      if (highCorrelations > 2) {
        marketSummary.correlationWarnings++;
      }
    }

    return {
      summary: marketSummary,
      assetData: Array.from(this.marketData.values()),
      correlationMatrix: correlations,
      lastUpdated: new Date()
    };
  }
}
