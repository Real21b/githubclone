#!/bin/bash

# 🚀 Production Deployment Script for GitHub Clone
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="githubclone"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

echo -e "${BLUE}🚀 Starting Production Deployment${NC}"
echo "=================================="

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
    echo "Please create $ENV_FILE with production environment variables"
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=("DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET" "GRAFANA_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in $ENV_FILE${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p ssl
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p postgres

# Check if SSL certificates exist
if [ ! -f "ssl/githubclone.com.crt" ] || [ ! -f "ssl/githubclone.com.key" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. Creating self-signed certificates...${NC}"
    
    # Create self-signed certificate (for testing only)
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/githubclone.com.key \
        -out ssl/githubclone.com.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=githubclone.com"
    
    echo -e "${YELLOW}⚠️  WARNING: Using self-signed certificates. Replace with real certificates for production!${NC}"
fi

# Build and deploy services
echo -e "${YELLOW}🔨 Building and deploying services...${NC}"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans

# Build images
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
services=("postgres_production" "redis_production" "auth_service_production" "core_service_production" "realtime_service_production" "frontend_production" "nginx_production")

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
        echo "Checking logs for $service:"
        docker logs $service --tail 20
        exit 1
    fi
done

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE exec core-service npm run migration:run

# Warm up cache
echo -e "${YELLOW}🔥 Warming up cache...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE exec core-service npm run cache:warm

# Check application health
echo -e "${YELLOW}🔍 Checking application health...${NC}"
sleep 10

# Test endpoints
endpoints=(
    "http://localhost/health"
    "http://localhost:3001/health"
    "http://localhost:3002/health"
    "http://localhost:3011/health"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f -s $endpoint > /dev/null; then
        echo -e "${GREEN}✅ $endpoint is healthy${NC}"
    else
        echo -e "${RED}❌ $endpoint is not responding${NC}"
    fi
done

# Display deployment information
echo ""
echo -e "${GREEN}🎉 Production Deployment Completed Successfully!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "  • Frontend: https://githubclone.com"
echo "  • API: https://githubclone.com/graphql"
echo "  • Auth: https://githubclone.com/auth"
echo "  • Real-time: https://githubclone.com/socket.io"
echo "  • Monitoring: http://localhost:3000 (Grafana)"
echo "  • Metrics: http://localhost:9090 (Prometheus)"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  • View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service]"
echo "  • Scale service: docker-compose -f $DOCKER_COMPOSE_FILE up -d --scale [service]=N"
echo "  • Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "  • Update services: ./scripts/update-production.sh"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "  • Replace self-signed SSL certificates with real ones"
echo "  • Configure proper DNS records"
echo "  • Set up monitoring alerts"
echo "  • Configure backup strategies"
echo "  • Review security settings"
echo ""

# Show resource usage
echo -e "${BLUE}📊 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo -e "${GREEN}🚀 Deployment completed! Your GitHub Clone is now running in production.${NC}"
