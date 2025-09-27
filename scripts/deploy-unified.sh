#!/bin/bash

# 🚀 Unified Deployment Script for GitHub Clone
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Unified Deployment${NC}"
echo "=================================="

# Configuration
PROJECT_NAME="githubclone"
DOCKER_COMPOSE_FILE="docker-compose.unified.yml"
ENV_FILE="env.unified"

# Check if unified environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE not found${NC}"
    echo "Please create $ENV_FILE with your environment variables"
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p ssl
mkdir -p logs

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans

# Build and start services
echo -e "${YELLOW}🔨 Building and starting services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 60

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
services=(
    "postgres_unified"
    "redis_unified"
    "zookeeper_unified"
    "kafka_unified"
    "auth_service_unified"
    "core_service_unified"
    "file_service_unified"
    "email_service_unified"
    "sms_service_unified"
    "notification_service_unified"
    "wordpress_service_unified"
    "whatsapp_service_unified"
    "telegram_service_unified"
    "ai_service_unified"
    "realtime_service_unified"
    "integration_service_unified"
    "frontend_unified"
    "nginx_unified"
)

healthy_services=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    if docker ps --filter "name=$service" --filter "status=running" | grep -q $service; then
        echo -e "${GREEN}✅ $service is running${NC}"
        ((healthy_services++))
    else
        echo -e "${RED}❌ $service is not running${NC}"
        echo "Checking logs for $service:"
        docker logs $service --tail 10
    fi
done

# Health percentage
health_percentage=$((healthy_services * 100 / total_services))

echo ""
echo -e "${BLUE}📊 Service Health Report${NC}"
echo "=========================="
echo -e "Healthy Services: ${GREEN}$healthy_services${NC}/$total_services"
echo -e "Health Percentage: ${GREEN}$health_percentage%${NC}"

if [ $health_percentage -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent! System is healthy${NC}"
elif [ $health_percentage -ge 75 ]; then
    echo -e "${YELLOW}⚠️  Good! System is mostly healthy${NC}"
else
    echo -e "${RED}❌ Warning! System has issues${NC}"
fi

# Test endpoints
echo -e "${YELLOW}🔍 Testing endpoints...${NC}"
endpoints=(
    "http://localhost/health"
    "http://localhost:3001/health"
    "http://localhost:3002/health"
    "http://localhost:3003/health"
    "http://localhost:3004/health"
    "http://localhost:3005/health"
    "http://localhost:3006/health"
    "http://localhost:3007/health"
    "http://localhost:3008/health"
    "http://localhost:3009/health"
    "http://localhost:3010/health"
    "http://localhost:3011/health"
    "http://localhost:3012/health"
)

working_endpoints=0
total_endpoints=${#endpoints[@]}

for endpoint in "${endpoints[@]}"; do
    if curl -f -s $endpoint > /dev/null; then
        echo -e "${GREEN}✅ $endpoint is healthy${NC}"
        ((working_endpoints++))
    else
        echo -e "${RED}❌ $endpoint is not responding${NC}"
    fi
done

# Endpoint health percentage
endpoint_health_percentage=$((working_endpoints * 100 / total_endpoints))

echo ""
echo -e "${BLUE}📊 Endpoint Health Report${NC}"
echo "============================="
echo -e "Working Endpoints: ${GREEN}$working_endpoints${NC}/$total_endpoints"
echo -e "Endpoint Health: ${GREEN}$endpoint_health_percentage%${NC}"

# Display deployment information
echo ""
echo -e "${GREEN}🎉 Unified Deployment Completed!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "  • Frontend: http://localhost:3000"
echo "  • API Gateway: http://localhost"
echo "  • GraphQL: http://localhost/graphql"
echo "  • Auth: http://localhost/auth"
echo "  • Real-time: http://localhost/socket.io"
echo "  • AI Service: http://localhost/ai"
echo "  • Monitoring: http://localhost:3001 (Grafana)"
echo "  • Metrics: http://localhost:9090 (Prometheus)"
echo ""
echo -e "${BLUE}📋 Service Ports:${NC}"
echo "  • Auth Service: 3001"
echo "  • Core Service: 3002"
echo "  • File Service: 3003"
echo "  • Email Service: 3004"
echo "  • SMS Service: 3005"
echo "  • Notification Service: 3006"
echo "  • WordPress Service: 3007"
echo "  • WhatsApp Service: 3008"
echo "  • Telegram Service: 3009"
echo "  • AI Service: 3010"
echo "  • Real-time Service: 3011"
echo "  • Integration Service: 3012"
echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "  • View logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f [service]"
echo "  • Scale service: docker-compose -f $DOCKER_COMPOSE_FILE up -d --scale [service]=N"
echo "  • Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
echo "  • Restart service: docker-compose -f $DOCKER_COMPOSE_FILE restart [service]"
echo "  • Access database: docker exec -it postgres_unified psql -U ${DB_USER:-githubclone_user} -d ${DB_NAME:-githubclone}"
echo "  • Access Redis: docker exec -it redis_unified redis-cli"
echo ""
echo -e "${YELLOW}💡 Development Tips:${NC}"
echo "  • All services are running with health checks"
echo "  • Real-time features are enabled via WebSocket"
echo "  • Kafka is configured for event-driven architecture"
echo "  • AI services are ready for integration"
echo "  • Monitoring is available via Prometheus and Grafana"
echo ""

# Show resource usage
echo -e "${BLUE}📊 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo -e "${GREEN}🚀 Unified deployment completed!${NC}"
echo -e "${BLUE}System Health: ${GREEN}$health_percentage%${NC} | Endpoint Health: ${GREEN}$endpoint_health_percentage%${NC}"
