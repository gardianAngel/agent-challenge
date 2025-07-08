#!/bin/bash

# Script to create a new branch with only the agent-challenge directory
# This will be a clean branch containing just the competition submission

echo "Creating agent-challenge-only branch..."

# Remove git lock if it exists
rm -f .git/index.lock

# Create and switch to new branch
git checkout -b agent-challenge-only

# Remove everything except agent-challenge directory
find . -maxdepth 1 -not -name '.' -not -name '.git' -not -name 'agent-challenge' -exec rm -rf {} +

# Move agent-challenge contents to root
mv agent-challenge/* ./
mv agent-challenge/.* ./ 2>/dev/null || true
rmdir agent-challenge

# Add all files to the new branch
git add .
git commit -m "Create agent-challenge-only branch

- Complete DeFi Risk Oracle competition submission
- Contains all required files: client/, server/, shared/, nosana-integration/
- Multi-agent system with 6 specialized agents
- Real-time WebSocket updates and live data processing
- Professional UI with comprehensive risk assessment
- Docker containerization and deployment configuration
- Nosana network integration for GPU-powered analysis"

echo "Branch agent-challenge-only created successfully!"
echo "Current branch contains only the competition submission files."