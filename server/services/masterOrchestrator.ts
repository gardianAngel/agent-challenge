import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import { ProtocolMonitor } from "./protocolMonitor";
import { SmartContractAnalyzer } from "./smartContractAnalyzer";
import { MarketRisk } from "./marketRisk";
import { SocialSentiment } from "./socialSentiment";
import { AlertSystem } from "./alertSystem";
import { RiskReporting } from "./riskReporting";
import { RiskEngine } from "./riskEngine";
import { RealDataProvider } from "./realDataProvider";
import { NosanaIntegration } from "./nosanaIntegration";
import { WebSocketMessage, RiskUpdateMessage, ProtocolUpdateMessage, AlertMessage } from "@shared/schema";

export interface AgentConfig {
  name: string;
  enabled: boolean;
  updateInterval: number;
  priority: number;
}

export interface OrchestrationMetrics {
  totalAgents: number;
  activeAgents: number;
  failedAgents: number;
  lastOrchestrationCycle: Date;
  averageResponseTime: number;
  totalDataPoints: number;
}

export class MasterOrchestrator {
  private static instance: MasterOrchestrator;
  private agents: Map<string, any> = new Map();
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private webSocketServer: WebSocketServer | null = null;
  private connectedClients: Set<WebSocket> = new Set();
  private orchestrationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private riskEngine: RiskEngine;
  private realDataProvider: RealDataProvider;
  private nosanaIntegration: NosanaIntegration;

  private constructor() {
    this.riskEngine = RiskEngine.getInstance();
    this.realDataProvider = RealDataProvider.getInstance();
    this.nosanaIntegration = NosanaIntegration.getInstance();
    this.initializeAgentConfigs();
  }

  static getInstance(): MasterOrchestrator {
    if (!MasterOrchestrator.instance) {
      MasterOrchestrator.instance = new MasterOrchestrator();
    }
    return MasterOrchestrator.instance;
  }

  /**
   * Initialize agent configurations
   */
  private initializeAgentConfigs(): void {
    const configs: AgentConfig[] = [
      {
        name: "Protocol Monitor",
        enabled: true,
        updateInterval: 30000, // 30 seconds
        priority: 1
      },
      {
        name: "Smart Contract Analyzer",
        enabled: true,
        updateInterval: 60000, // 1 minute
        priority: 2
      },
      {
        name: "Market Risk",
        enabled: true,
        updateInterval: 60000, // 1 minute
        priority: 3
      },
      {
        name: "Social Sentiment",
        enabled: true,
        updateInterval: 300000, // 5 minutes
        priority: 4
      },
      {
        name: "Alert System",
        enabled: true,
        updateInterval: 30000, // 30 seconds
        priority: 5
      },
      {
        name: "Risk Reporting",
        enabled: true,
        updateInterval: 3600000, // 1 hour
        priority: 6
      }
    ];

    configs.forEach(config => {
      this.agentConfigs.set(config.name, config);
    });
  }

  /**
   * Initialize the orchestrator and all agents
   */
  async initialize(webSocketServer: WebSocketServer): Promise<void> {
    try {
      console.log('[MasterOrchestrator] Initializing orchestrator and agents...');
      
      this.webSocketServer = webSocketServer;
      this.setupWebSocketHandlers();

      // Initialize all agents
      await this.initializeAgents();
      
      // Initialize real data provider
      await this.realDataProvider.startDataSync();
      
      // Initialize Nosana integration
      await this.nosanaIntegration.initialize(webSocketServer);
      
      // Start orchestration
      await this.startOrchestration();
      
      console.log('[MasterOrchestrator] Orchestrator initialized successfully');
    } catch (error) {
      console.error('[MasterOrchestrator] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Initialize all agents
   */
  private async initializeAgents(): Promise<void> {
    try {
      // Initialize Protocol Monitor
      const protocolMonitor = ProtocolMonitor.getInstance();
      this.agents.set("Protocol Monitor", protocolMonitor);
      if (this.agentConfigs.get("Protocol Monitor")?.enabled) {
        await protocolMonitor.startMonitoring(30000);
      }

      // Initialize Smart Contract Analyzer
      const contractAnalyzer = SmartContractAnalyzer.getInstance();
      this.agents.set("Smart Contract Analyzer", contractAnalyzer);
      if (this.agentConfigs.get("Smart Contract Analyzer")?.enabled) {
        await contractAnalyzer.startAnalysis();
      }

      // Initialize Market Risk
      const marketRisk = MarketRisk.getInstance();
      this.agents.set("Market Risk", marketRisk);
      if (this.agentConfigs.get("Market Risk")?.enabled) {
        await marketRisk.startMonitoring();
      }

      // Initialize Social Sentiment
      const socialSentiment = SocialSentiment.getInstance();
      this.agents.set("Social Sentiment", socialSentiment);
      if (this.agentConfigs.get("Social Sentiment")?.enabled) {
        await socialSentiment.startMonitoring();
      }

      // Initialize Alert System
      const alertSystem = AlertSystem.getInstance();
      this.agents.set("Alert System", alertSystem);
      if (this.agentConfigs.get("Alert System")?.enabled) {
        await alertSystem.startAlertSystem();
      }

      // Initialize Risk Reporting
      const riskReporting = RiskReporting.getInstance();
      this.agents.set("Risk Reporting", riskReporting);
      if (this.agentConfigs.get("Risk Reporting")?.enabled) {
        await riskReporting.startReporting();
      }

      console.log(`[MasterOrchestrator] Initialized ${this.agents.size} agents`);
    } catch (error) {
      console.error('[MasterOrchestrator] Error initializing agents:', error);
      throw error;
    }
  }

  /**
   * Start orchestration process
   */
  async startOrchestration(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[MasterOrchestrator] Starting orchestration...');

    // Main orchestration loop
    this.orchestrationInterval = setInterval(async () => {
      await this.runOrchestrationCycle();
    }, 15000); // Every 15 seconds

    // Start real-time data broadcasting
    setInterval(async () => {
      await this.broadcastRealTimeUpdates();
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop orchestration
   */
  async stopOrchestration(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('[MasterOrchestrator] Stopping orchestration...');

    if (this.orchestrationInterval) {
      clearInterval(this.orchestrationInterval);
      this.orchestrationInterval = null;
    }

    // Stop all agents
    for (const [agentName, agent] of this.agents) {
      try {
        if (agent.stopMonitoring) {
          await agent.stopMonitoring();
        }
        await storage.updateAgentStatus(agentName, { status: "offline" });
      } catch (error) {
        console.error(`[MasterOrchestrator] Error stopping agent ${agentName}:`, error);
      }
    }
  }

  /**
   * Run orchestration cycle
   */
  private async runOrchestrationCycle(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Check agent health
      await this.checkAgentHealth();
      
      // Coordinate data flow between agents
      await this.coordinateDataFlow();
      
      // Update orchestration metrics
      const duration = Date.now() - startTime;
      await this.updateOrchestrationMetrics(duration);
      
      console.log(`[MasterOrchestrator] Orchestration cycle completed in ${duration}ms`);
    } catch (error) {
      console.error('[MasterOrchestrator] Error in orchestration cycle:', error);
    }
  }

  /**
   * Check health of all agents
   */
  private async checkAgentHealth(): Promise<void> {
    for (const [agentName, agent] of this.agents) {
      try {
        const config = this.agentConfigs.get(agentName);
        if (!config?.enabled) continue;

        // Check if agent is responsive
        const status = await storage.getAgentStatusByName(agentName);
        const lastHeartbeat = status?.lastHeartbeat || new Date(0);
        const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat > config.updateInterval * 2) {
          console.warn(`[MasterOrchestrator] Agent ${agentName} appears unresponsive`);
          await storage.updateAgentStatus(agentName, { status: "error" });
        }
      } catch (error) {
        console.error(`[MasterOrchestrator] Error checking health of ${agentName}:`, error);
      }
    }
  }

  /**
   * Coordinate data flow between agents
   */
  private async coordinateDataFlow(): Promise<void> {
    try {
      // Get fresh data from all sources
      const protocols = await storage.getProtocols();
      const riskAssessments = await storage.getRiskAssessments();
      
      // Check for significant changes that require cross-agent coordination
      for (const protocol of protocols) {
        if (!protocol.isActive) continue;
        
        const assessment = await storage.getRiskAssessment(protocol.id);
        if (!assessment) continue;
        
        // Check for high-risk conditions that require immediate attention
        if (assessment.overallRisk > 80) {
          await this.handleHighRiskProtocol(protocol.id);
        }
        
        // Check for rapid risk changes
        const riskChange = await this.calculateRiskChange(protocol.id);
        if (Math.abs(riskChange) > 20) {
          await this.handleRapidRiskChange(protocol.id, riskChange);
        }
      }
    } catch (error) {
      console.error('[MasterOrchestrator] Error coordinating data flow:', error);
    }
  }

  /**
   * Handle high-risk protocol
   */
  private async handleHighRiskProtocol(protocolId: number): Promise<void> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      if (!protocol) return;
      
      console.log(`[MasterOrchestrator] High-risk protocol detected: ${protocol.name}`);
      
      // Trigger enhanced monitoring
      const contractAnalyzer = this.agents.get("Smart Contract Analyzer");
      if (contractAnalyzer) {
        await contractAnalyzer.analyzeProtocol(protocolId);
      }
      
      // Check for immediate alerts
      const alertSystem = this.agents.get("Alert System");
      if (alertSystem) {
        // This would trigger immediate alert evaluation
      }
      
      // Broadcast high-risk update
      await this.broadcastRiskUpdate(protocolId);
    } catch (error) {
      console.error(`[MasterOrchestrator] Error handling high-risk protocol ${protocolId}:`, error);
    }
  }

  /**
   * Handle rapid risk change
   */
  private async handleRapidRiskChange(protocolId: number, riskChange: number): Promise<void> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      if (!protocol) return;
      
      console.log(`[MasterOrchestrator] Rapid risk change detected for ${protocol.name}: ${riskChange.toFixed(1)}%`);
      
      // Create alert for rapid change
      await storage.createAlert({
        protocolId,
        type: Math.abs(riskChange) > 30 ? "critical" : "high",
        title: "Rapid Risk Change Detected",
        message: `${protocol.name} risk score changed by ${riskChange.toFixed(1)}% rapidly`,
        severity: Math.min(90, 50 + Math.abs(riskChange)),
        isActive: true,
        isRead: false,
        metadata: {
          riskChange,
          reason: "rapid_change",
          orchestratorDetected: true
        }
      });
      
      // Broadcast the change
      await this.broadcastRiskUpdate(protocolId);
    } catch (error) {
      console.error(`[MasterOrchestrator] Error handling rapid risk change for ${protocolId}:`, error);
    }
  }

  /**
   * Calculate risk change for a protocol
   */
  private async calculateRiskChange(protocolId: number): Promise<number> {
    // In production, this would compare with historical data
    // For now, simulate risk change detection
    return (Math.random() - 0.5) * 30; // ±15% change
  }

  /**
   * Update orchestration metrics
   */
  private async updateOrchestrationMetrics(cycleDuration: number): Promise<void> {
    try {
      const agentStatus = await storage.getAgentStatus();
      const activeAgents = agentStatus.filter(a => a.status === 'active').length;
      const failedAgents = agentStatus.filter(a => a.status === 'error').length;
      
      // In production, this would be stored in database
      const metrics: OrchestrationMetrics = {
        totalAgents: agentStatus.length,
        activeAgents,
        failedAgents,
        lastOrchestrationCycle: new Date(),
        averageResponseTime: cycleDuration,
        totalDataPoints: await this.countDataPoints()
      };
      
      console.log(`[MasterOrchestrator] Metrics - Active: ${activeAgents}/${agentStatus.length}, Duration: ${cycleDuration}ms`);
    } catch (error) {
      console.error('[MasterOrchestrator] Error updating metrics:', error);
    }
  }

  /**
   * Count total data points processed
   */
  private async countDataPoints(): Promise<number> {
    const protocols = await storage.getProtocols();
    const assessments = await storage.getRiskAssessments();
    const alerts = await storage.getAlerts();
    
    return protocols.length + assessments.length + alerts.length;
  }

  /**
   * Setup WebSocket handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.webSocketServer) return;
    
    this.webSocketServer.on('connection', (ws: WebSocket) => {
      this.connectedClients.add(ws);
      console.log(`[MasterOrchestrator] WebSocket client connected. Total: ${this.connectedClients.size}`);
      
      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log(`[MasterOrchestrator] WebSocket client disconnected. Total: ${this.connectedClients.size}`);
      });
    });
  }

  /**
   * Broadcast real-time updates
   */
  private async broadcastRealTimeUpdates(): Promise<void> {
    if (this.connectedClients.size === 0) return;
    
    try {
      const agentStatus = await storage.getAgentStatus();
      const chainStatus = await storage.getChainStatus();
      const recentAlerts = await storage.getAlerts(true);
      
      const updateMessage: WebSocketMessage = {
        type: 'AGENT_STATUS' as any,
        data: {
          agentStatus,
          chainStatus,
          recentAlerts: recentAlerts.slice(0, 5), // Last 5 alerts
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
      
      this.broadcast(updateMessage);
    } catch (error) {
      console.error('[MasterOrchestrator] Error broadcasting real-time updates:', error);
    }
  }

  /**
   * Broadcast risk update for a specific protocol
   */
  private async broadcastRiskUpdate(protocolId: number): Promise<void> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      const assessment = await storage.getRiskAssessment(protocolId);
      
      if (!protocol || !assessment) return;
      
      const riskUpdate: RiskUpdateMessage = {
        type: 'RISK_UPDATE',
        data: {
          protocolId,
          riskScore: assessment.overallRisk,
          factors: {
            smartContractRisk: assessment.smartContractRisk,
            marketRisk: assessment.marketRisk,
            governanceRisk: assessment.governanceRisk,
            technicalRisk: assessment.technicalRisk,
            socialRisk: assessment.socialRisk,
            counterpartyRisk: assessment.counterpartyRisk
          }
        },
        timestamp: Date.now()
      };
      
      this.broadcast(riskUpdate);
    } catch (error) {
      console.error(`[MasterOrchestrator] Error broadcasting risk update for ${protocolId}:`, error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    
    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('[MasterOrchestrator] Error sending message to client:', error);
          this.connectedClients.delete(client);
        }
      }
    });
  }

  /**
   * Get orchestrator status
   */
  async getOrchestratorStatus(): Promise<any> {
    const agentStatus = await storage.getAgentStatus();
    
    return {
      isRunning: this.isRunning,
      totalAgents: this.agents.size,
      activeAgents: agentStatus.filter(a => a.status === 'active').length,
      connectedClients: this.connectedClients.size,
      lastCycle: new Date(),
      uptime: process.uptime()
    };
  }

  /**
   * Configure agent
   */
  async configureAgent(agentName: string, config: Partial<AgentConfig>): Promise<void> {
    const existingConfig = this.agentConfigs.get(agentName);
    if (!existingConfig) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    const updatedConfig = { ...existingConfig, ...config };
    this.agentConfigs.set(agentName, updatedConfig);
    
    console.log(`[MasterOrchestrator] Updated configuration for ${agentName}:`, config);
  }

  /**
   * Get agent configurations
   */
  getAgentConfigs(): Map<string, AgentConfig> {
    return new Map(this.agentConfigs);
  }
}
