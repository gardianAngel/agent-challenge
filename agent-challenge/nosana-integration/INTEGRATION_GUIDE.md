# DeFi Risk Oracle - Nosana Challenge Integration Guide

## Overview

This guide shows how to integrate our working DeFi Risk Oracle system into your forked `nosana-ci/agent-challenge` repository for submission.

## Step 1: Fork and Clone the Official Repository

```bash
# Fork the repository on GitHub
# https://github.com/nosana-ci/agent-challenge

# Clone your fork
git clone https://github.com/YOUR_USERNAME/agent-challenge.git
cd agent-challenge

# Add upstream remote
git remote add upstream https://github.com/nosana-ci/agent-challenge.git
```

## Step 2: Copy DeFi Risk Oracle Files

Copy all files from the `nosana-integration/` directory to your forked repository:

```bash
# From this project directory, copy to your forked repo
cp nosana-integration/package.json /path/to/agent-challenge/
cp nosana-integration/mastra.config.ts /path/to/agent-challenge/
cp nosana-integration/Dockerfile /path/to/agent-challenge/
cp nosana-integration/docker-compose.yml /path/to/agent-challenge/
cp nosana-integration/.env.example /path/to/agent-challenge/
cp -r nosana-integration/src/ /path/to/agent-challenge/
cp -r nosana-integration/agents/ /path/to/agent-challenge/
cp -r nosana-integration/tools/ /path/to/agent-challenge/
cp nosana-integration/README.md /path/to/agent-challenge/
cp nosana-integration/DEPLOYMENT.md /path/to/agent-challenge/
```

## Step 3: Install Dependencies and Test

```bash
cd /path/to/agent-challenge

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Test locally
pnpm dev
```

## Step 4: Build and Deploy

```bash
# Build Docker image
docker build -t YOUR_DOCKERHUB_USERNAME/defi-risk-oracle .

# Test Docker container
docker run -p 3000:3000 --env-file .env YOUR_DOCKERHUB_USERNAME/defi-risk-oracle

# Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/defi-risk-oracle:latest

# Deploy to Nosana
nosana deploy --image YOUR_DOCKERHUB_USERNAME/defi-risk-oracle:latest --public
```

## Step 5: Verify Deployment

Access your deployed application:

- Dashboard: `https://your-nosana-url/`
- Health Check: `https://your-nosana-url/health`
- API Status: `https://your-nosana-url/api/agents/status`

## Step 6: Submit to Competition

1. Commit and push to your forked repository
2. Create demo video showing functionality
3. Submit to Nosana challenge platform
4. Share on social media with required tags

## Key Files for Submission

### Required Files
- `package.json` - Dependencies and scripts
- `mastra.config.ts` - Mastra framework configuration
- `Dockerfile` - Container configuration
- `src/index.ts` - Main application entry point
- `agents/` - AI agent implementations
- `tools/` - Nosana integration tools

### Documentation
- `README.md` - Project overview and quick start
- `DEPLOYMENT.md` - Detailed deployment instructions
- `.env.example` - Environment configuration template

## Competition Compliance Checklist

### Technical Requirements
- [ ] Forked from `nosana-ci/agent-challenge`
- [ ] Implements custom AI agents using Mastra framework
- [ ] Includes proper documentation
- [ ] Working code in forked repository

### Deployment Requirements
- [ ] Docker container published to Docker Hub
- [ ] Successfully deployed on Nosana network
- [ ] Application publicly accessible
- [ ] All endpoints functional

### Demonstration
- [ ] Live demo available
- [ ] Health checks passing
- [ ] Real data processing
- [ ] Multi-agent coordination working
- [ ] Nosana GPU integration active

## Support

If you encounter issues during integration:

1. Check the DEPLOYMENT.md for troubleshooting
2. Verify all environment variables are set
3. Test Docker build locally before deploying
4. Check Nosana network status and quotas

## Success Criteria

Your submission should demonstrate:

1. **Real DeFi data processing** - Not mock data
2. **Functional AI agents** - 6+ agents working together
3. **Nosana GPU integration** - Cost-effective compute
4. **Production readiness** - Proper error handling, monitoring
5. **Professional presentation** - Clean UI and comprehensive API

The DeFi Risk Oracle system provides all these features and is ready for immediate deployment to Nosana network.