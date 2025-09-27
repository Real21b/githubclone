# Ultra-optimized Telegram Service Dockerfile
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S telegramuser && \
    adduser -S telegramuser -u 1001

# Install runtime dependencies
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built application
COPY --from=builder --chown=telegramuser:telegramuser /app/dist ./dist
COPY --from=builder --chown=telegramuser:telegramuser /app/node_modules ./node_modules
COPY --from=builder --chown=telegramuser:telegramuser /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown telegramuser:telegramuser logs

# Switch to non-root user
USER telegramuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Expose port
EXPOSE 3009

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
