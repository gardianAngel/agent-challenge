import { 
  protocols, 
  riskAssessments, 
  alerts, 
  agentStatus, 
  chainStatus,
  type Protocol, 
  type InsertProtocol,
  type RiskAssessment,
  type InsertRiskAssessment,
  type Alert,
  type InsertAlert,
  type AgentStatus,
  type InsertAgentStatus,
  type ChainStatus,
  type InsertChainStatus
} from "@shared/schema";

export interface IStorage {
  // Protocol methods
  getProtocol(id: number): Promise<Protocol | undefined>;
  getProtocols(): Promise<Protocol[]>;
  getProtocolsByChain(chain: string): Promise<Protocol[]>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: number, updates: Partial<InsertProtocol>): Promise<Protocol | undefined>;
  
  // Risk assessment methods
  getRiskAssessment(protocolId: number): Promise<RiskAssessment | undefined>;
  getRiskAssessments(protocolIds?: number[]): Promise<RiskAssessment[]>;
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment>;
  updateRiskAssessment(protocolId: number, assessment: Partial<InsertRiskAssessment>): Promise<RiskAssessment | undefined>;
  
  // Alert methods
  getAlerts(isActive?: boolean): Promise<Alert[]>;
  getAlertsByProtocol(protocolId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, updates: Partial<InsertAlert>): Promise<Alert | undefined>;
  
  // Agent status methods
  getAgentStatus(): Promise<AgentStatus[]>;
  getAgentStatusByName(agentName: string): Promise<AgentStatus | undefined>;
  updateAgentStatus(agentName: string, status: Partial<InsertAgentStatus>): Promise<AgentStatus>;
  
  // Chain status methods
  getChainStatus(): Promise<ChainStatus[]>;
  getChainStatusByName(chainName: string): Promise<ChainStatus | undefined>;
  updateChainStatus(chainName: string, status: Partial<InsertChainStatus>): Promise<ChainStatus>;
}

export class MemStorage implements IStorage {
  private protocols: Map<number, Protocol> = new Map();
  private riskAssessments: Map<number, RiskAssessment> = new Map();
  private alerts: Map<number, Alert> = new Map();
  private agentStatus: Map<string, AgentStatus> = new Map();
  private chainStatus: Map<string, ChainStatus> = new Map();
  
  private currentProtocolId = 1;
  private currentRiskAssessmentId = 1;
  private currentAlertId = 1;
  private currentAgentStatusId = 1;
  private currentChainStatusId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize some default protocols
    const defaultProtocols: Protocol[] = [
      {
        id: 1,
        name: "Aave V3",
        symbol: "AAVE",
        address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
        chain: "ethereum",
        category: "lending",
        tvl: 6200000000,
        utilization: 0.45,
        riskScore: 28,
        isActive: true,
        lastUpdated: new Date(),
        metadata: { audited: true, timelock: true }
      },
      {
        id: 2,
        name: "Uniswap V3",
        symbol: "UNI",
        address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        chain: "ethereum",
        category: "dex",
        tvl: 3800000000,
        utilization: 0.72,
        riskScore: 45,
        isActive: true,
        lastUpdated: new Date(),
        metadata: { audited: true, timelock: false }
      },
      {
        id: 3,
        name: "Compound V2",
        symbol: "COMP",
        address: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
        chain: "ethereum",
        category: "lending",
        tvl: 2100000000,
        utilization: 0.94,
        riskScore: 78,
        isActive: true,
        lastUpdated: new Date(),
        metadata: { audited: true, timelock: false, upgradesPending: true }
      }
    ];

    defaultProtocols.forEach(protocol => {
      this.protocols.set(protocol.id, protocol);
    });

    // Initialize risk assessments
    const defaultRiskAssessments: RiskAssessment[] = [
      {
        id: 1,
        protocolId: 1,
        smartContractRisk: 15,
        marketRisk: 25,
        governanceRisk: 20,
        technicalRisk: 10,
        socialRisk: 15,
        counterpartyRisk: 20,
        overallRisk: 28,
        timestamp: new Date(),
        metadata: {}
      },
      {
        id: 2,
        protocolId: 2,
        smartContractRisk: 30,
        marketRisk: 45,
        governanceRisk: 50,
        technicalRisk: 35,
        socialRisk: 40,
        counterpartyRisk: 25,
        overallRisk: 45,
        timestamp: new Date(),
        metadata: {}
      },
      {
        id: 3,
        protocolId: 3,
        smartContractRisk: 65,
        marketRisk: 85,
        governanceRisk: 70,
        technicalRisk: 80,
        socialRisk: 75,
        counterpartyRisk: 60,
        overallRisk: 78,
        timestamp: new Date(),
        metadata: {}
      }
    ];

    defaultRiskAssessments.forEach(assessment => {
      this.riskAssessments.set(assessment.protocolId, assessment);
    });

    // Initialize alerts
    const defaultAlerts: Alert[] = [
      {
        id: 1,
        protocolId: 3,
        type: "critical",
        title: "High Risk Alert",
        message: "Compound V2 utilization exceeded 90%",
        severity: 85,
        isActive: true,
        isRead: false,
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        metadata: {}
      },
      {
        id: 2,
        protocolId: null,
        type: "medium",
        title: "Medium Risk Alert",
        message: "Unusual whale activity detected",
        severity: 60,
        isActive: true,
        isRead: false,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        metadata: {}
      },
      {
        id: 3,
        protocolId: null,
        type: "info",
        title: "Info Alert",
        message: "New protocol added to monitoring",
        severity: 20,
        isActive: true,
        isRead: false,
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        metadata: {}
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });

    // Initialize agent status
    const defaultAgentStatus: AgentStatus[] = [
      {
        id: 1,
        agentName: "Protocol Monitor",
        status: "active",
        lastHeartbeat: new Date(),
        metadata: {}
      },
      {
        id: 2,
        agentName: "Smart Contract Analyzer",
        status: "active",
        lastHeartbeat: new Date(),
        metadata: {}
      },
      {
        id: 3,
        agentName: "Market Risk",
        status: "active",
        lastHeartbeat: new Date(),
        metadata: {}
      },
      {
        id: 4,
        agentName: "Social Sentiment",
        status: "syncing",
        lastHeartbeat: new Date(),
        metadata: {}
      },
      {
        id: 5,
        agentName: "Alert System",
        status: "active",
        lastHeartbeat: new Date(),
        metadata: {}
      },
      {
        id: 6,
        agentName: "Risk Reporting",
        status: "active",
        lastHeartbeat: new Date(),
        metadata: {}
      }
    ];

    defaultAgentStatus.forEach(status => {
      this.agentStatus.set(status.agentName, status);
    });

    // Initialize chain status
    const defaultChainStatus: ChainStatus[] = [
      {
        id: 1,
        chainName: "Ethereum",
        chainId: 1,
        status: "active",
        latestBlock: 18500000,
        lastUpdated: new Date()
      },
      {
        id: 2,
        chainName: "Polygon",
        chainId: 137,
        status: "active",
        latestBlock: 50000000,
        lastUpdated: new Date()
      },
      {
        id: 3,
        chainName: "Arbitrum",
        chainId: 42161,
        status: "syncing",
        latestBlock: 150000000,
        lastUpdated: new Date()
      }
    ];

    defaultChainStatus.forEach(status => {
      this.chainStatus.set(status.chainName, status);
    });

    this.currentProtocolId = 4;
    this.currentRiskAssessmentId = 4;
    this.currentAlertId = 4;
    this.currentAgentStatusId = 7;
    this.currentChainStatusId = 4;
  }

  // Protocol methods
  async getProtocol(id: number): Promise<Protocol | undefined> {
    return this.protocols.get(id);
  }

  async getProtocols(): Promise<Protocol[]> {
    return Array.from(this.protocols.values());
  }

  async getProtocolsByChain(chain: string): Promise<Protocol[]> {
    return Array.from(this.protocols.values()).filter(p => p.chain === chain);
  }

  async createProtocol(insertProtocol: InsertProtocol): Promise<Protocol> {
    const id = this.currentProtocolId++;
    const protocol: Protocol = {
      ...insertProtocol,
      id,
      lastUpdated: new Date()
    };
    this.protocols.set(id, protocol);
    return protocol;
  }

  async updateProtocol(id: number, updates: Partial<InsertProtocol>): Promise<Protocol | undefined> {
    const protocol = this.protocols.get(id);
    if (!protocol) return undefined;
    
    const updated = { ...protocol, ...updates, lastUpdated: new Date() };
    this.protocols.set(id, updated);
    return updated;
  }

  // Risk assessment methods
  async getRiskAssessment(protocolId: number): Promise<RiskAssessment | undefined> {
    return this.riskAssessments.get(protocolId);
  }

  async getRiskAssessments(protocolIds?: number[]): Promise<RiskAssessment[]> {
    const assessments = Array.from(this.riskAssessments.values());
    if (protocolIds) {
      return assessments.filter(a => protocolIds.includes(a.protocolId));
    }
    return assessments;
  }

  async createRiskAssessment(insertAssessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const id = this.currentRiskAssessmentId++;
    const assessment: RiskAssessment = {
      ...insertAssessment,
      id,
      timestamp: new Date()
    };
    this.riskAssessments.set(insertAssessment.protocolId, assessment);
    return assessment;
  }

  async updateRiskAssessment(protocolId: number, updates: Partial<InsertRiskAssessment>): Promise<RiskAssessment | undefined> {
    const assessment = this.riskAssessments.get(protocolId);
    if (!assessment) return undefined;
    
    const updated = { ...assessment, ...updates, timestamp: new Date() };
    this.riskAssessments.set(protocolId, updated);
    return updated;
  }

  // Alert methods
  async getAlerts(isActive?: boolean): Promise<Alert[]> {
    const alerts = Array.from(this.alerts.values());
    if (isActive !== undefined) {
      return alerts.filter(a => a.isActive === isActive);
    }
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAlertsByProtocol(protocolId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(a => a.protocolId === protocolId);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentAlertId++;
    const alert: Alert = {
      ...insertAlert,
      id,
      timestamp: new Date()
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, updates: Partial<InsertAlert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updated = { ...alert, ...updates };
    this.alerts.set(id, updated);
    return updated;
  }

  // Agent status methods
  async getAgentStatus(): Promise<AgentStatus[]> {
    return Array.from(this.agentStatus.values());
  }

  async getAgentStatusByName(agentName: string): Promise<AgentStatus | undefined> {
    return this.agentStatus.get(agentName);
  }

  async updateAgentStatus(agentName: string, updates: Partial<InsertAgentStatus>): Promise<AgentStatus> {
    const existing = this.agentStatus.get(agentName);
    const status: AgentStatus = {
      id: existing?.id || this.currentAgentStatusId++,
      agentName,
      status: updates.status || existing?.status || "offline",
      lastHeartbeat: new Date(),
      metadata: { ...existing?.metadata, ...updates.metadata }
    };
    this.agentStatus.set(agentName, status);
    return status;
  }

  // Chain status methods
  async getChainStatus(): Promise<ChainStatus[]> {
    return Array.from(this.chainStatus.values());
  }

  async getChainStatusByName(chainName: string): Promise<ChainStatus | undefined> {
    return this.chainStatus.get(chainName);
  }

  async updateChainStatus(chainName: string, updates: Partial<InsertChainStatus>): Promise<ChainStatus> {
    const existing = this.chainStatus.get(chainName);
    const status: ChainStatus = {
      id: existing?.id || this.currentChainStatusId++,
      chainName,
      chainId: updates.chainId || existing?.chainId || 0,
      status: updates.status || existing?.status || "offline",
      latestBlock: updates.latestBlock || existing?.latestBlock || 0,
      lastUpdated: new Date()
    };
    this.chainStatus.set(chainName, status);
    return status;
  }
}

export const storage = new MemStorage();
