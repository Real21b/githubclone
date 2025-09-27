#!/bin/bash

# 🚀 Development Deployment Script for GitHub Clone
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Development Deployment${NC}"
echo "====================================="

# Configuration
PROJECT_NAME="githubclone"
DOCKER_COMPOSE_FILE="docker-compose.development.yml"

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans

# Build and start services
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
services=("postgres_development" "redis_development" "auth_service_development" "core_service_development" "realtime_service_development" "frontend_development")

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
        echo "Checking logs for $service:"
        docker logs $service --tail 20
    fi
done

# Display development information
echo ""
echo -e "${GREEN}🎉 Development Environment Ready!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "  • Frontend (Vite): http://localhost:3000"
echo "  • API: http://localhost:3002/graphql"
echo "  • Auth: http://localhost:3001"
echo "  • Real-time: http://localhost:3011"
echo "  • Database: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  • View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service]"
echo "  • Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "  • Restart service: docker-compose -f $DOCKER_COMPOSE_FILE restart [service]"
echo "  • Access database: docker exec -it postgres_development psql -U githubclone_user -d githubclone_development"
echo ""
echo -e "${YELLOW}💡 Development Tips:${NC}"
echo "  • Frontend hot reload is enabled"
echo "  • All services have volume mounts for live code changes"
echo "  • Use 'npm run dev' in frontend for Vite development server"
echo "  • Use 'npm run dev:next' for Next.js development server"
echo ""

# Show resource usage
echo -e "${BLUE}📊 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo -e "${GREEN}🚀 Development environment is ready!${NC}"
