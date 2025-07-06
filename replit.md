# DeFi Risk Oracle - Multi-Agent Risk Assessment System

## Overview

This is a comprehensive DeFi (Decentralized Finance) Risk Oracle system that uses multiple specialized agents to monitor, analyze, and assess risks across various blockchain protocols. The system provides real-time risk scores, alerts, and insights for DeFi protocols including lending platforms, DEXs, and yield farming protocols.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **Real-time Communication**: WebSocket integration for live updates

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket server for live data streaming
- **Agent System**: Multi-agent orchestration with centralized coordinator

### Multi-Agent System
The system employs a hierarchical agent architecture:
- **Master Orchestrator**: Coordinates all agents and manages data flow
- **Protocol Monitor**: Tracks TVL, utilization, and protocol metrics
- **Smart Contract Analyzer**: Analyzes contract vulnerabilities and audit status
- **Market Risk Agent**: Monitors market conditions and correlations
- **Social Sentiment Agent**: Tracks social media and community sentiment
- **Alert System**: Generates and manages risk alerts
- **Risk Reporting Agent**: Creates comprehensive risk reports

## Key Components

### Database Schema
The system uses PostgreSQL with the following key tables:
- **protocols**: Stores protocol information (name, address, chain, TVL, risk scores)
- **risk_assessments**: Detailed risk breakdowns by category
- **alerts**: Risk alerts with severity levels and timestamps
- **agent_status**: Tracks the health and status of each agent
- **chain_status**: Monitors blockchain network health

### Risk Engine
Central risk calculation engine that:
- Aggregates risk factors from multiple agents
- Applies weighted scoring algorithms
- Generates overall risk scores (0-100 scale)
- Categorizes risks into low/medium/high/critical levels

### WebSocket Communication
Real-time data pipeline that:
- Streams live risk updates to the frontend
- Broadcasts alert notifications
- Provides agent status updates
- Enables responsive user experience

## Data Flow

1. **Data Collection**: Individual agents collect data from their respective sources
2. **Risk Assessment**: Each agent calculates risk scores for their domain
3. **Aggregation**: Master Orchestrator consolidates all risk data
4. **Risk Calculation**: Central Risk Engine computes overall risk scores
5. **Storage**: Risk data is persisted to PostgreSQL database
6. **Real-time Updates**: WebSocket server broadcasts updates to connected clients
7. **Alert Generation**: Alert System triggers notifications based on risk thresholds

## External Dependencies

### Data Sources
- **Blockchain RPCs**: For protocol data (Ethereum, Polygon, Arbitrum, Solana)
- **DeFi APIs**: TVL and protocol metrics (DefiLlama, DeFi Pulse)
- **Social Media**: Twitter/Discord APIs for sentiment analysis
- **Market Data**: Price feeds and market indicators

### Key Libraries
- **Frontend**: React, Tailwind CSS, TanStack Query, Wouter
- **Backend**: Express.js, WebSocket, Drizzle ORM
- **Database**: PostgreSQL, pg (node-postgres)
- **UI Components**: Radix UI primitives with shadcn/ui

## Deployment Strategy

### Development Environment
- **Database**: Neon PostgreSQL (serverless)
- **Build Process**: Vite for frontend, esbuild for backend
- **Development Server**: Express with Vite middleware integration

### Production Deployment
- **Database**: PostgreSQL with connection pooling
- **Frontend**: Static assets served from dist/public
- **Backend**: Bundled Node.js application
- **WebSocket**: Integrated with HTTP server for real-time features

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **NODE_ENV**: Environment mode (development/production)
- **Agent Configuration**: API keys and RPC endpoints

## Changelog

Changelog:
- July 06, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.