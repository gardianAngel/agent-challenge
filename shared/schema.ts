import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Protocol schema
export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  address: text("address").notNull(),
  chain: text("chain").notNull(),
  category: text("category").notNull(), // lending, dex, yield, etc.
  tvl: real("tvl").notNull().default(0),
  utilization: real("utilization").notNull().default(0),
  riskScore: real("risk_score").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
});

// Risk assessments schema
export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  protocolId: integer("protocol_id").references(() => protocols.id).notNull(),
  smartContractRisk: real("smart_contract_risk").notNull().default(0),
  marketRisk: real("market_risk").notNull().default(0),
  governanceRisk: real("governance_risk").notNull().default(0),
  technicalRisk: real("technical_risk").notNull().default(0),
  socialRisk: real("social_risk").notNull().default(0),
  counterpartyRisk: real("counterparty_risk").notNull().default(0),
  overallRisk: real("overall_risk").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
});

// Alerts schema
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  protocolId: integer("protocol_id").references(() => protocols.id),
  type: text("type").notNull(), // 'critical', 'high', 'medium', 'low', 'info'
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: integer("severity").notNull().default(0), // 0-100
  isActive: boolean("is_active").notNull().default(true),
  isRead: boolean("is_read").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
});

// Agent status schema
export const agentStatus = pgTable("agent_status", {
  id: serial("id").primaryKey(),
  agentName: text("agent_name").notNull(),
  status: text("status").notNull(), // 'active', 'syncing', 'error', 'offline'
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
});

// Chain status schema
export const chainStatus = pgTable("chain_status", {
  id: serial("id").primaryKey(),
  chainName: text("chain_name").notNull(),
  chainId: integer("chain_id").notNull(),
  status: text("status").notNull(), // 'active', 'syncing', 'error'
  latestBlock: integer("latest_block").default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Schema validations
export const insertProtocolSchema = createInsertSchema(protocols).omit({
  id: true,
  lastUpdated: true,
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({
  id: true,
  lastHeartbeat: true,
});

export const insertChainStatusSchema = createInsertSchema(chainStatus).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AgentStatus = typeof agentStatus.$inferSelect;
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;
export type ChainStatus = typeof chainStatus.$inferSelect;
export type InsertChainStatus = z.infer<typeof insertChainStatusSchema>;

// WebSocket message types
export interface WebSocketMessage {
  type: 'RISK_UPDATE' | 'PROTOCOL_UPDATE' | 'ALERT' | 'AGENT_STATUS' | 'CHAIN_STATUS';
  data: any;
  timestamp: number;
}

export interface RiskUpdateMessage extends WebSocketMessage {
  type: 'RISK_UPDATE';
  data: {
    protocolId: number;
    riskScore: number;
    factors: {
      smartContractRisk: number;
      marketRisk: number;
      governanceRisk: number;
      technicalRisk: number;
      socialRisk: number;
      counterpartyRisk: number;
    };
  };
}

export interface ProtocolUpdateMessage extends WebSocketMessage {
  type: 'PROTOCOL_UPDATE';
  data: {
    protocol: Protocol;
    tvlChange: number;
    utilizationChange: number;
  };
}

export interface AlertMessage extends WebSocketMessage {
  type: 'ALERT';
  data: Alert;
}
