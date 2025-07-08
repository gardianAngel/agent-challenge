import { storage } from "../storage";
import { RiskEngine } from "./riskEngine";

export interface ContractAnalysis {
  address: string;
  chain: string;
  vulnerabilities: Vulnerability[];
  auditStatus: AuditStatus;
  codeQuality: CodeQuality;
  riskScore: number;
}

export interface Vulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
}

export interface AuditStatus {
  isAudited: boolean;
  auditors: string[];
  auditDate?: Date;
  auditScore?: number;
}

export interface CodeQuality {
  complexity: number;
  documentation: number;
  testCoverage: number;
  upgradeability: 'immutable' | 'upgradeable' | 'proxy';
}

export class SmartContractAnalyzer {
  private static instance: SmartContractAnalyzer;
  private riskEngine: RiskEngine;
  private analysisCache: Map<string, ContractAnalysis> = new Map();

  private constructor() {
    this.riskEngine = RiskEngine.getInstance();
  }

  static getInstance(): SmartContractAnalyzer {
    if (!SmartContractAnalyzer.instance) {
      SmartContractAnalyzer.instance = new SmartContractAnalyzer();
    }
    return SmartContractAnalyzer.instance;
  }

  /**
   * Start the analyzer service
   */
  async startAnalysis(): Promise<void> {
    console.log('[SmartContractAnalyzer] Starting analysis service');
    
    // Analyze all protocols
    await this.analyzeAllProtocols();
    
    // Set up periodic analysis
    setInterval(async () => {
      await this.analyzeAllProtocols();
    }, 60000); // Every minute

    await storage.updateAgentStatus("Smart Contract Analyzer", { status: "active" });
  }

  /**
   * Analyze all protocols
   */
  private async analyzeAllProtocols(): Promise<void> {
    try {
      const protocols = await storage.getProtocols();
      
      for (const protocol of protocols) {
        if (protocol.isActive) {
          await this.analyzeProtocol(protocol.id);
        }
      }

      console.log(`[SmartContractAnalyzer] Analyzed ${protocols.length} protocols`);
    } catch (error) {
      console.error('[SmartContractAnalyzer] Error during analysis:', error);
      await storage.updateAgentStatus("Smart Contract Analyzer", { status: "error" });
    }
  }

  /**
   * Analyze a specific protocol
   */
  async analyzeProtocol(protocolId: number): Promise<void> {
    try {
      const protocol = await storage.getProtocol(protocolId);
      if (!protocol) return;

      const analysis = await this.analyzeContract(protocol.address, protocol.chain);
      if (analysis) {
        // Update risk assessment with smart contract risk
        await this.riskEngine.updateRiskAssessment(protocolId, {
          smartContractRisk: analysis.riskScore
        });

        // Cache the analysis
        this.analysisCache.set(`${protocol.address}-${protocol.chain}`, analysis);
      }
    } catch (error) {
      console.error(`[SmartContractAnalyzer] Error analyzing protocol ${protocolId}:`, error);
    }
  }

  /**
   * Analyze a smart contract
   */
  async analyzeContract(address: string, chain: string): Promise<ContractAnalysis | null> {
    try {
      // In production, this would:
      // 1. Fetch contract source code from Etherscan/Polygonscan
      // 2. Parse Solidity code for vulnerability patterns
      // 3. Check audit databases
      // 4. Analyze upgrade patterns
      
      const analysis = await this.mockContractAnalysis(address, chain);
      return analysis;
    } catch (error) {
      console.error(`[SmartContractAnalyzer] Error analyzing contract ${address}:`, error);
      return null;
    }
  }

  /**
   * Mock contract analysis (in production, this would use real static analysis)
   */
  private async mockContractAnalysis(address: string, chain: string): Promise<ContractAnalysis> {
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock vulnerabilities based on known patterns
    const vulnerabilities: Vulnerability[] = [];
    
    // Simulate finding vulnerabilities based on address patterns
    const addressLower = address.toLowerCase();
    
    if (addressLower.includes('compound') || addressLower.includes('3d9819')) {
      vulnerabilities.push({
        type: 'reentrancy',
        severity: 'medium',
        description: 'Potential reentrancy vulnerability in borrow function',
        confidence: 0.6
      });
      vulnerabilities.push({
        type: 'governance',
        severity: 'high',
        description: 'Admin can upgrade contracts without timelock',
        confidence: 0.8
      });
    }

    if (addressLower.includes('uniswap') || addressLower.includes('1f98431')) {
      vulnerabilities.push({
        type: 'price_manipulation',
        severity: 'medium',
        description: 'Price oracle vulnerable to flash loan attacks',
        confidence: 0.5
      });
    }

    // Mock audit status
    const auditStatus: AuditStatus = {
      isAudited: true,
      auditors: ['ConsenSys', 'Trail of Bits'],
      auditDate: new Date('2023-01-15'),
      auditScore: Math.random() * 40 + 60 // 60-100
    };

    // Mock code quality
    const codeQuality: CodeQuality = {
      complexity: Math.random() * 50 + 30, // 30-80
      documentation: Math.random() * 40 + 50, // 50-90
      testCoverage: Math.random() * 30 + 60, // 60-90
      upgradeability: Math.random() > 0.5 ? 'upgradeable' : 'proxy'
    };

    // Calculate risk score
    const riskScore = this.calculateContractRiskScore(vulnerabilities, auditStatus, codeQuality);

    return {
      address,
      chain,
      vulnerabilities,
      auditStatus,
      codeQuality,
      riskScore
    };
  }

  /**
   * Calculate contract risk score
   */
  private calculateContractRiskScore(
    vulnerabilities: Vulnerability[],
    auditStatus: AuditStatus,
    codeQuality: CodeQuality
  ): number {
    let riskScore = 0;

    // Vulnerability scoring
    vulnerabilities.forEach(vuln => {
      const severityMultiplier = {
        'low': 5,
        'medium': 15,
        'high': 30,
        'critical': 50
      };
      riskScore += severityMultiplier[vuln.severity] * vuln.confidence;
    });

    // Audit status impact
    if (!auditStatus.isAudited) {
      riskScore += 25;
    } else if (auditStatus.auditScore && auditStatus.auditScore < 70) {
      riskScore += 15;
    }

    // Code quality impact
    if (codeQuality.complexity > 70) riskScore += 10;
    if (codeQuality.documentation < 60) riskScore += 5;
    if (codeQuality.testCoverage < 70) riskScore += 10;
    if (codeQuality.upgradeability === 'upgradeable') riskScore += 5;

    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * Get vulnerability patterns to detect
   */
  private getVulnerabilityPatterns(): Record<string, RegExp[]> {
    return {
      reentrancy: [
        /\.call\s*\(/,
        /\.transfer\s*\(/,
        /msg\.sender\.call/
      ],
      integer_overflow: [
        /\+\+/,
        /--/,
        /\*\s*\d+/
      ],
      access_control: [
        /onlyOwner/,
        /require\s*\(\s*msg\.sender/,
        /modifier/
      ],
      unchecked_calls: [
        /\.call\s*\(/,
        /\.send\s*\(/,
        /\.delegatecall\s*\(/
      ]
    };
  }

  /**
   * Check for recent upgrades
   */
  async checkRecentUpgrades(protocolId: number): Promise<any> {
    const protocol = await storage.getProtocol(protocolId);
    if (!protocol) return null;

    // In production, this would check blockchain events for upgrades
    // For now, return mock data
    const hasRecentUpgrade = Math.random() > 0.8;
    
    if (hasRecentUpgrade) {
      await storage.createAlert({
        protocolId,
        type: "medium",
        title: "Contract Upgrade Detected",
        message: `${protocol.name} contract was recently upgraded`,
        severity: 60,
        isActive: true,
        isRead: false,
        metadata: {
          upgradeDate: new Date().toISOString(),
          blockNumber: Math.floor(Math.random() * 1000000) + 18000000
        }
      });
    }

    return {
      protocolId,
      hasRecentUpgrade,
      upgradeDate: hasRecentUpgrade ? new Date() : null,
      riskImpact: hasRecentUpgrade ? 15 : 0
    };
  }

  /**
   * Get audit reputation score
   */
  private getAuditorReputation(auditor: string): number {
    const reputationScores: Record<string, number> = {
      'ConsenSys': 95,
      'Trail of Bits': 98,
      'OpenZeppelin': 92,
      'Certik': 88,
      'Quantstamp': 85,
      'Mythril': 80,
      'unknown': 50
    };

    return reputationScores[auditor] || reputationScores['unknown'];
  }

  /**
   * Get contract analysis by address
   */
  async getContractAnalysis(address: string, chain: string): Promise<ContractAnalysis | null> {
    const cacheKey = `${address}-${chain}`;
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    // Perform fresh analysis
    const analysis = await this.analyzeContract(address, chain);
    if (analysis) {
      this.analysisCache.set(cacheKey, analysis);
    }

    return analysis;
  }

  /**
   * Get vulnerability statistics
   */
  async getVulnerabilityStats(): Promise<any> {
    const protocols = await storage.getProtocols();
    const stats = {
      totalAnalyzed: 0,
      vulnerabilitiesFound: 0,
      criticalVulnerabilities: 0,
      auditedPercentage: 0,
      averageRiskScore: 0
    };

    let totalRiskScore = 0;
    let auditedCount = 0;

    for (const protocol of protocols) {
      const analysis = await this.getContractAnalysis(protocol.address, protocol.chain);
      if (analysis) {
        stats.totalAnalyzed++;
        stats.vulnerabilitiesFound += analysis.vulnerabilities.length;
        stats.criticalVulnerabilities += analysis.vulnerabilities.filter(v => v.severity === 'critical').length;
        totalRiskScore += analysis.riskScore;
        
        if (analysis.auditStatus.isAudited) {
          auditedCount++;
        }
      }
    }

    if (stats.totalAnalyzed > 0) {
      stats.auditedPercentage = (auditedCount / stats.totalAnalyzed) * 100;
      stats.averageRiskScore = totalRiskScore / stats.totalAnalyzed;
    }

    return stats;
  }
}
