import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { MasterOrchestrator } from "./services/masterOrchestrator";
import { NosanaIntegration } from "./services/nosanaIntegration";
import { RealDataProvider } from "./services/realDataProvider";
import { WebSocketMessage } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize master orchestrator
  const orchestrator = MasterOrchestrator.getInstance();
  await orchestrator.initialize(wss);
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New client connected');
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        await handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });
    
    // Send initial data
    sendInitialData(ws);
  });

  // API Routes
  
  // Get all protocols
  app.get('/api/protocols', async (req, res) => {
    try {
      const protocols = await storage.getProtocols();
      res.json(protocols);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch protocols' });
    }
  });

  // Get Nosana network status
  app.get('/api/nosana/status', async (req, res) => {
    try {
      const nosana = NosanaIntegration.getInstance();
      const status = nosana.getNetworkStatus();
      res.json(status);
    } catch (error) {
      console.error('Nosana status error:', error);
      res.status(500).json({ error: 'Failed to fetch Nosana status' });
    }
  });

  // Submit job to Nosana network
  app.post('/api/nosana/jobs', async (req, res) => {
    try {
      const { type, data } = req.body;
      const nosana = NosanaIntegration.getInstance();
      const jobId = await nosana.submitJob(type, data);
      res.json({ jobId, status: 'submitted' });
    } catch (error) {
      console.error('Nosana job submission error:', error);
      res.status(500).json({ error: 'Failed to submit job' });
    }
  });

  // Get real market data summary
  app.get('/api/market/summary', async (req, res) => {
    try {
      const realDataProvider = RealDataProvider.getInstance();
      const summary = await realDataProvider.getMarketSummary();
      res.json(summary || { error: 'Market data unavailable' });
    } catch (error) {
      console.error('Market summary error:', error);
      res.status(500).json({ error: 'Failed to fetch market summary' });
    }
  });

  // Get protocol by ID
  app.get('/api/protocols/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const protocol = await storage.getProtocol(id);
      if (!protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
      }
      res.json(protocol);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch protocol' });
    }
  });

  // Get risk assessments
  app.get('/api/risk-assessments', async (req, res) => {
    try {
      const protocolIds = req.query.protocolIds as string;
      const ids = protocolIds ? protocolIds.split(',').map(Number) : undefined;
      const assessments = await storage.getRiskAssessments(ids);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch risk assessments' });
    }
  });

  // Get risk assessment for specific protocol
  app.get('/api/protocols/:id/risk', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getRiskAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: 'Risk assessment not found' });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch risk assessment' });
    }
  });

  // Get alerts
  app.get('/api/alerts', async (req, res) => {
    try {
      const isActive = req.query.active === 'true' ? true : 
                      req.query.active === 'false' ? false : undefined;
      const alerts = await storage.getAlerts(isActive);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Mark alert as read
  app.patch('/api/alerts/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.updateAlert(id, { isRead: true });
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  // Dismiss alert
  app.patch('/api/alerts/:id/dismiss', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.updateAlert(id, { isActive: false });
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: 'Failed to dismiss alert' });
    }
  });

  // Get agent status
  app.get('/api/agents/status', async (req, res) => {
    try {
      const agentStatus = await storage.getAgentStatus();
      res.json(agentStatus);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agent status' });
    }
  });

  // Get chain status
  app.get('/api/chains/status', async (req, res) => {
    try {
      const chainStatus = await storage.getChainStatus();
      res.json(chainStatus);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chain status' });
    }
  });

  // Get dashboard summary
  app.get('/api/dashboard/summary', async (req, res) => {
    try {
      const protocols = await storage.getProtocols();
      const activeProtocols = protocols.filter(p => p.isActive);
      const alerts = await storage.getAlerts(true);
      const assessments = await storage.getRiskAssessments();

      const totalTvl = activeProtocols.reduce((sum, p) => sum + p.tvl, 0);
      const avgRiskScore = assessments.length > 0 
        ? assessments.reduce((sum, a) => sum + a.overallRisk, 0) / assessments.length 
        : 0;

      const summary = {
        totalProtocols: activeProtocols.length,
        totalTvl,
        avgRiskScore,
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.type === 'critical').length,
        lastUpdated: new Date()
      };

      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
  });

  // Get risk trend data
  app.get('/api/protocols/:id/risk/trend', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const hours = parseInt(req.query.hours as string) || 24;
      
      // Generate trend data (in production, this would come from historical data)
      const assessment = await storage.getRiskAssessment(id);
      if (!assessment) {
        return res.status(404).json({ error: 'Risk assessment not found' });
      }

      const trendData = [];
      const currentTime = new Date();
      
      for (let i = hours; i >= 0; i--) {
        const timestamp = new Date(currentTime.getTime() - i * 60 * 60 * 1000);
        const variation = (Math.random() - 0.5) * 10;
        const riskScore = Math.max(0, Math.min(100, assessment.overallRisk + variation));
        
        trendData.push({
          timestamp,
          riskScore,
          smartContractRisk: Math.max(0, Math.min(100, assessment.smartContractRisk + variation)),
          marketRisk: Math.max(0, Math.min(100, assessment.marketRisk + variation)),
          governanceRisk: Math.max(0, Math.min(100, assessment.governanceRisk + variation))
        });
      }

      res.json(trendData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch risk trend' });
    }
  });

  return httpServer;
}

async function handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
  switch (message.type) {
    case 'SUBSCRIBE_PROTOCOL':
      // Handle protocol subscription
      break;
    case 'UNSUBSCRIBE_PROTOCOL':
      // Handle protocol unsubscription
      break;
    default:
      console.log('[WebSocket] Unknown message type:', message.type);
  }
}

async function sendInitialData(ws: WebSocket): Promise<void> {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      const protocols = await storage.getProtocols();
      const agentStatus = await storage.getAgentStatus();
      const chainStatus = await storage.getChainStatus();
      
      const initialData: WebSocketMessage = {
        type: 'INITIAL_DATA',
        data: {
          protocols,
          agentStatus,
          chainStatus
        },
        timestamp: Date.now()
      };
      
      ws.send(JSON.stringify(initialData));
    }
  } catch (error) {
    console.error('[WebSocket] Error sending initial data:', error);
  }
}
