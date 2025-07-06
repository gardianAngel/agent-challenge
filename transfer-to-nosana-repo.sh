#!/bin/bash

# DeFi Risk Oracle - Transfer to Nosana Challenge Repository
# This script transfers all necessary files to your forked agent-challenge repository

echo "🚀 Starting DeFi Risk Oracle transfer to Nosana repository..."

# Check if target directory is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 /path/to/your/agent-challenge"
    echo "Example: $0 ~/Desktop/agent-challenge"
    exit 1
fi

TARGET_DIR="$1"

# Validate target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: Directory $TARGET_DIR does not exist"
    echo "Please provide the path to your forked agent-challenge repository"
    exit 1
fi

echo "📁 Target directory: $TARGET_DIR"

# Copy core application files
echo "📋 Copying core application files..."
cp nosana-integration/package.json "$TARGET_DIR/"
cp nosana-integration/mastra.config.ts "$TARGET_DIR/"
cp nosana-integration/Dockerfile "$TARGET_DIR/"
cp nosana-integration/docker-compose.yml "$TARGET_DIR/"
cp nosana-integration/.env.example "$TARGET_DIR/"

# Copy source code
echo "💻 Copying source code..."
mkdir -p "$TARGET_DIR/src"
cp -r nosana-integration/src/* "$TARGET_DIR/src/"

# Copy agents
echo "🤖 Copying AI agents..."
mkdir -p "$TARGET_DIR/agents"
cp -r nosana-integration/agents/* "$TARGET_DIR/agents/"

# Copy tools
echo "🔧 Copying tools..."
mkdir -p "$TARGET_DIR/tools"
cp -r nosana-integration/tools/* "$TARGET_DIR/tools/"

# Copy documentation
echo "📚 Copying documentation..."
cp nosana-integration/README.md "$TARGET_DIR/"
cp nosana-integration/DEPLOYMENT.md "$TARGET_DIR/"
cp nosana-integration/INTEGRATION_GUIDE.md "$TARGET_DIR/"

# Copy additional config files
echo "⚙️ Copying configuration files..."
if [ -f "tsconfig.json" ]; then
    cp tsconfig.json "$TARGET_DIR/"
fi

echo "✅ Transfer complete!"
echo ""
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. cp .env.example .env"
echo "3. Edit .env with your API keys"
echo "4. pnpm install"
echo "5. pnpm dev"
echo ""
echo "🎯 Your DeFi Risk Oracle is ready for Nosana challenge submission!"