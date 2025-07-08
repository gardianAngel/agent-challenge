import { storage } from "../storage";
import { Protocol, InsertProtocol } from "@shared/schema";

export interface ProtocolData {
  name: string;
  symbol: string;
  address: string;
  chain: string;
  category: string;
  tvl: number;
  utilization: number;
  metadata: Record<string, any>;
}

export class ProtocolMonitor {
  private static instance: ProtocolMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): ProtocolMonitor {
    if (!ProtocolMonitor.instance) {
      ProtocolMonitor.instance = new ProtocolMonitor();
    }
    return ProtocolMonitor.instance;
  }

  /**
   * Start monitoring protocols
   */
  async startMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`[ProtocolMonitor] Starting monitoring with ${intervalMs}ms interval`);

    // Initial data fetch
    await this.fetchAllProtocolData();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.fetchAllProtocolData();
      } catch (error) {
        console.error('[ProtocolMonitor] Error during monitoring:', error);
      }
    }, intervalMs);

    // Update agent status
    await storage.updateAgentStatus("Protocol Monitor", { status: "active" });
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    await storage.updateAgentStatus("Protocol Monitor", { status: "offline" });
    console.log('[ProtocolMonitor] Monitoring stopped');
  }

  /**
   * Fetch data for all protocols
   */
  private async fetchAllProtocolData(): Promise<void> {
    try {
      const protocols = await storage.getProtocols();
      
      for (const protocol of protocols) {
        await this.fetchProtocolData(protocol);
      }

      console.log(`[ProtocolMonitor] Updated ${protocols.length} protocols`);
    } catch (error) {
      console.error('[ProtocolMonitor] Error fetching protocol data:', error);
      await storage.updateAgentStatus("Protocol Monitor", { status: "error" });
    }
  }

  /**
   * Fetch data for a specific protocol
   */
  private async fetchProtocolData(protocol: Protocol): Promise<void> {
    try {
      // In a real implementation, this would fetch data from:
      // - DefiLlama API for TVL
      // - Protocol-specific APIs (Aave, Compound, etc.)
      // - Blockchain data via ethers.js
      
      const updatedData = await this.mockFetchProtocolData(protocol);
      
      if (updatedData) {
        await storage.updateProtocol(protocol.id, updatedData);
        
        // Check for significant changes
        await this.checkForSignificantChanges(protocol, updatedData);
      }
    } catch (error) {
      console.error(`[ProtocolMonitor] Error fetching data for ${protocol.name}:`, error);
    }
  }

  /**
   * Mock data fetching (in production, this would call real APIs)
   */
  private async mockFetchProtocolData(protocol: Protocol): Promise<Partial<InsertProtocol> | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate data variations
    const tvlVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const utilizationVariation = (Math.random() - 0.5) * 0.05; // ±2.5% variation

    const newTvl = protocol.tvl * (1 + tvlVariation);
    const newUtilization = Math.max(0, Math.min(1, protocol.utilization + utilizationVariation));

    return {
      tvl: newTvl,
      utilization: newUtilization,
      metadata: {
        ...protocol.metadata,
        lastFetch: new Date().toISOString(),
        dataSource: 'mock'
      }
    };
  }

  /**
   * Check for significant changes and trigger alerts
   */
  private async checkForSignificantChanges(
    oldProtocol: Protocol,
    newData: Partial<InsertProtocol>
  ): Promise<void> {
    if (!newData.tvl || !newData.utilization) return;

    const tvlChange = Math.abs(newData.tvl - oldProtocol.tvl) / oldProtocol.tvl;
    const utilizationChange = Math.abs(newData.utilization - oldProtocol.utilization);

    // TVL drop > 10%
    if (tvlChange > 0.1 && newData.tvl < oldProtocol.tvl) {
      await storage.createAlert({
        protocolId: oldProtocol.id,
        type: "high",
        title: "Significant TVL Drop",
        message: `${oldProtocol.name} TVL dropped by ${(tvlChange * 100).toFixed(1)}%`,
        severity: 70,
        isActive: true,
        isRead: false,
        metadata: {
          oldTvl: oldProtocol.tvl,
          newTvl: newData.tvl,
          change: tvlChange
        }
      });
    }

    // Utilization > 90%
    if (newData.utilization > 0.9) {
      await storage.createAlert({
        protocolId: oldProtocol.id,
        type: "critical",
        title: "High Utilization Warning",
        message: `${oldProtocol.name} utilization reached ${(newData.utilization * 100).toFixed(1)}%`,
        severity: 85,
        isActive: true,
        isRead: false,
        metadata: {
          utilization: newData.utilization,
          threshold: 0.9
        }
      });
    }
  }

  /**
   * Get protocol health metrics
   */
  async getProtocolHealth(protocolId: number): Promise<any> {
    const protocol = await storage.getProtocol(protocolId);
    if (!protocol) return null;

    const healthMetrics = {
      protocolId,
      name: protocol.name,
      tvl: protocol.tvl,
      utilization: protocol.utilization,
      healthScore: this.calculateHealthScore(protocol),
      indicators: this.getHealthIndicators(protocol),
      lastUpdated: protocol.lastUpdated
    };

    return healthMetrics;
  }

  /**
   * Calculate health score based on various factors
   */
  private calculateHealthScore(protocol: Protocol): number {
    let score = 100;

    // Penalize high utilization
    if (protocol.utilization > 0.9) score -= 30;
    else if (protocol.utilization > 0.8) score -= 15;
    else if (protocol.utilization > 0.7) score -= 5;

    // Penalize low TVL (relative to category)
    if (protocol.tvl < 100000000) score -= 10; // < $100M
    else if (protocol.tvl < 500000000) score -= 5; // < $500M

    // Bonus for recent activity
    const daysSinceUpdate = (Date.now() - protocol.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 1) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get health indicators for a protocol
   */
  private getHealthIndicators(protocol: Protocol): any[] {
    const indicators = [];

    if (protocol.utilization > 0.9) {
      indicators.push({
        type: 'warning',
        message: 'High utilization rate',
        severity: 'high'
      });
    }

    if (protocol.tvl < 100000000) {
      indicators.push({
        type: 'info',
        message: 'Low TVL for category',
        severity: 'medium'
      });
    }

    const metadata = protocol.metadata || {};
    if (metadata.audited) {
      indicators.push({
        type: 'positive',
        message: 'Audited by reputable firm',
        severity: 'low'
      });
    }

    if (metadata.timelock) {
      indicators.push({
        type: 'positive',
        message: 'Timelock mechanism active',
        severity: 'low'
      });
    }

    return indicators;
  }

  /**
   * Add new protocol to monitoring
   */
  async addProtocol(protocolData: ProtocolData): Promise<Protocol> {
    const protocol = await storage.createProtocol(protocolData);
    console.log(`[ProtocolMonitor] Added new protocol: ${protocol.name}`);
    return protocol;
  }

  /**
   * Remove protocol from monitoring
   */
  async removeProtocol(protocolId: number): Promise<void> {
    await storage.updateProtocol(protocolId, { isActive: false });
    console.log(`[ProtocolMonitor] Removed protocol: ${protocolId}`);
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<any> {
    const protocols = await storage.getProtocols();
    const activeProtocols = protocols.filter(p => p.isActive);

    const totalTvl = activeProtocols.reduce((sum, p) => sum + p.tvl, 0);
    const avgUtilization = activeProtocols.reduce((sum, p) => sum + p.utilization, 0) / activeProtocols.length;

    const chainDistribution = activeProtocols.reduce((acc, p) => {
      acc[p.chain] = (acc[p.chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProtocols: activeProtocols.length,
      totalTvl,
      avgUtilization,
      chainDistribution,
      isMonitoring: this.isRunning,
      lastUpdate: new Date()
    };
  }
}
