# Multi-stage Docker build for DeFi Risk Oracle on Nosana Network
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runner

# Install security updates and required tools
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    ca-certificates \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/agents ./agents
COPY --from=builder --chown=nodejs:nodejs /app/tools ./tools
COPY --from=builder --chown=nodejs:nodejs /app/mastra.config.js ./

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/tmp && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Metadata labels for better organization
LABEL maintainer="team@defiriskoracle.com"
LABEL version="1.0.0"
LABEL description="AI-powered DeFi Risk Oracle with multi-agent architecture for Nosana network"
LABEL org.opencontainers.image.title="DeFi Risk Oracle"
LABEL org.opencontainers.image.description="Real-time DeFi protocol risk assessment using AI agents and GPU compute"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="DeFi Risk Oracle Team"
LABEL org.opencontainers.image.licenses="MIT"
LABEL nosana.network.compatible="true"
LABEL nosana.gpu.required="false"
LABEL nosana.compute.type="cpu-optimized"