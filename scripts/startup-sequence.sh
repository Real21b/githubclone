#!/bin/bash

# 🚀 Startup Sequence Script for GitHub Clone
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting GitHub Clone Services in Correct Order${NC}"
echo "=================================================="

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.unified.yml"

# Function to wait for service to be healthy
wait_for_service() {
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $service_name to be healthy...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if docker ps --filter "name=$service_name" --filter "status=running" | grep -q $service_name; then
            echo -e "${GREEN}✅ $service_name is running${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    
    echo -e "${YELLOW}🏥 Checking health of $service_name...${NC}"
    
    if curl -f -s $health_url > /dev/null; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name health check failed${NC}"
        return 1
    fi
}

# Step 1: Start Infrastructure Services
echo -e "${BLUE}📊 Step 1: Starting Infrastructure Services${NC}"
echo "=============================================="

# Start PostgreSQL
echo -e "${YELLOW}🗄️ Starting PostgreSQL...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres
wait_for_service "postgres_unified"

# Start Redis
echo -e "${YELLOW}🔴 Starting Redis...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d redis
wait_for_service "redis_unified"

# Start Zookeeper
echo -e "${YELLOW}🚀 Starting Zookeeper...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d zookeeper
wait_for_service "zookeeper_unified"

# Start Kafka
echo -e "${YELLOW}⚡ Starting Kafka...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d kafka
wait_for_service "kafka_unified"

echo -e "${GREEN}✅ Infrastructure services started successfully${NC}"

# Step 2: Start Core Services
echo -e "${BLUE}🔐 Step 2: Starting Core Services${NC}"
echo "====================================="

# Start Auth Service
echo -e "${YELLOW}🔐 Starting Auth Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d auth-service
wait_for_service "auth_service_unified"
check_service_health "Auth Service" "http://localhost:3001/health"

# Start Core Service
echo -e "${YELLOW}⚡ Starting Core Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d core-service
wait_for_service "core_service_unified"
check_service_health "Core Service" "http://localhost:3002/health"

# Start File Service
echo -e "${YELLOW}📁 Starting File Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d file-service
wait_for_service "file_service_unified"
check_service_health "File Service" "http://localhost:3003/health"

echo -e "${GREEN}✅ Core services started successfully${NC}"

# Step 3: Start Integration Services
echo -e "${BLUE}🔌 Step 3: Starting Integration Services${NC}"
echo "============================================="

# Start Email Service
echo -e "${YELLOW}📧 Starting Email Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d email-service
wait_for_service "email_service_unified"

# Start SMS Service
echo -e "${YELLOW}📱 Starting SMS Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d sms-service
wait_for_service "sms_service_unified"

# Start Notification Service
echo -e "${YELLOW}🔔 Starting Notification Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d notification-service
wait_for_service "notification_service_unified"

# Start Real-time Service
echo -e "${YELLOW}🔌 Starting Real-time Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d realtime-service
wait_for_service "realtime_service_unified"

echo -e "${GREEN}✅ Integration services started successfully${NC}"

# Step 4: Start External Integration Services
echo -e "${BLUE}🌐 Step 4: Starting External Integration Services${NC}"
echo "====================================================="

# Start WordPress Service
echo -e "${YELLOW}🌐 Starting WordPress Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d wordpress-service
wait_for_service "wordpress_service_unified"

# Start WhatsApp Service
echo -e "${YELLOW}💬 Starting WhatsApp Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d whatsapp-service
wait_for_service "whatsapp_service_unified"

# Start Telegram Service
echo -e "${YELLOW}📱 Starting Telegram Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d telegram-service
wait_for_service "telegram_service_unified"

# Start AI Service
echo -e "${YELLOW}🤖 Starting AI Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d ai-service
wait_for_service "ai_service_unified"

# Start Integration Service
echo -e "${YELLOW}🔧 Starting Integration Service...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d integration-service
wait_for_service "integration_service_unified"

echo -e "${GREEN}✅ External integration services started successfully${NC}"

# Step 5: Start Frontend and Gateway
echo -e "${BLUE}🌐 Step 5: Starting Frontend and Gateway${NC}"
echo "============================================="

# Start Frontend
echo -e "${YELLOW}🌐 Starting Frontend...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d frontend
wait_for_service "frontend_unified"

# Start Nginx Gateway
echo -e "${YELLOW}🌐 Starting Nginx Gateway...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d nginx
wait_for_service "nginx_unified"

echo -e "${GREEN}✅ Frontend and gateway started successfully${NC}"

# Step 6: Start Monitoring Services
echo -e "${BLUE}📊 Step 6: Starting Monitoring Services${NC}"
echo "============================================="

# Start Prometheus
echo -e "${YELLOW}📊 Starting Prometheus...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d prometheus
wait_for_service "prometheus_unified"

# Start Grafana
echo -e "${YELLOW}📈 Starting Grafana...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d grafana
wait_for_service "grafana_unified"

echo -e "${GREEN}✅ Monitoring services started successfully${NC}"

# Final Health Check
echo -e "${BLUE}🏥 Final Health Check${NC}"
echo "====================="

services=(
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

healthy_services=0
total_services=${#services[@]}

for endpoint in "${services[@]}"; do
    if curl -f -s $endpoint > /dev/null; then
        echo -e "${GREEN}✅ $endpoint is healthy${NC}"
        ((healthy_services++))
    else
        echo -e "${RED}❌ $endpoint is not responding${NC}"
    fi
done

# Health percentage
health_percentage=$((healthy_services * 100 / total_services))

echo ""
echo -e "${BLUE}📊 Startup Summary${NC}"
echo "=================="
echo -e "Healthy Services: ${GREEN}$healthy_services${NC}/$total_services"
echo -e "Health Percentage: ${GREEN}$health_percentage%${NC}"

if [ $health_percentage -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent! All services started successfully${NC}"
elif [ $health_percentage -ge 75 ]; then
    echo -e "${YELLOW}⚠️  Good! Most services started successfully${NC}"
else
    echo -e "${RED}❌ Warning! Some services failed to start${NC}"
fi

echo ""
echo -e "${GREEN}🚀 GitHub Clone is ready for development!${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}API Gateway: http://localhost${NC}"
echo -e "${BLUE}Monitoring: http://localhost:3001 (Grafana)${NC}"
