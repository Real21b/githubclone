#!/bin/bash

# Scaling Script for GitHub Clone Services
# Usage: ./scale-services.sh [ultra-light|lightweight|scalable|full] [user-count]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CONFIG="ultra-light"
USER_COUNT=10

# Parse arguments
if [ $# -ge 1 ]; then
    CONFIG=$1
fi

if [ $# -ge 2 ]; then
    USER_COUNT=$2
fi

echo -e "${BLUE}🚀 GitHub Clone Service Scaling${NC}"
echo -e "${BLUE}Configuration: ${CONFIG}${NC}"
echo -e "${BLUE}Target Users: ${USER_COUNT}${NC}"
echo ""

# Function to stop all services
stop_all_services() {
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    docker-compose -f docker-compose.ultra-light.yml down 2>/dev/null || true
    docker-compose -f docker-compose.lightweight.yml down 2>/dev/null || true
    docker-compose -f docker-compose.scalable.yml down 2>/dev/null || true
    docker-compose -f docker-compose.kafka.yml down 2>/dev/null || true
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to start ultra-light configuration
start_ultra_light() {
    echo -e "${GREEN}🚀 Starting Ultra-Light configuration (10 users)...${NC}"
    docker-compose -f docker-compose.ultra-light.yml up -d
    echo -e "${GREEN}✅ Ultra-Light services started${NC}"
}

# Function to start lightweight configuration
start_lightweight() {
    echo -e "${GREEN}🚀 Starting Lightweight configuration (50 users)...${NC}"
    docker-compose -f docker-compose.lightweight.yml up -d
    echo -e "${GREEN}✅ Lightweight services started${NC}"
}

# Function to start scalable configuration
start_scalable() {
    echo -e "${GREEN}🚀 Starting Scalable configuration (100+ users)...${NC}"
    docker-compose -f docker-compose.scalable.yml up -d
    echo -e "${GREEN}✅ Scalable services started${NC}"
}

# Function to start full configuration
start_full() {
    echo -e "${GREEN}🚀 Starting Full configuration (1000+ users)...${NC}"
    docker-compose -f docker-compose.kafka.yml up -d
    echo -e "${GREEN}✅ Full services started${NC}"
}

# Function to scale specific services
scale_services() {
    local user_count=$1
    local auth_replicas=1
    local core_replicas=1
    local file_replicas=1
    local frontend_replicas=1

    # Calculate replicas based on user count
    if [ $user_count -gt 100 ]; then
        auth_replicas=3
        core_replicas=3
        file_replicas=2
        frontend_replicas=2
    elif [ $user_count -gt 50 ]; then
        auth_replicas=2
        core_replicas=2
        file_replicas=2
        frontend_replicas=1
    elif [ $user_count -gt 20 ]; then
        auth_replicas=2
        core_replicas=2
        file_replicas=1
        frontend_replicas=1
    fi

    echo -e "${YELLOW}📈 Scaling services for ${user_count} users...${NC}"
    echo -e "${BLUE}Auth Service: ${auth_replicas} replicas${NC}"
    echo -e "${BLUE}Core Service: ${core_replicas} replicas${NC}"
    echo -e "${BLUE}File Service: ${file_replicas} replicas${NC}"
    echo -e "${BLUE}Frontend: ${frontend_replicas} replicas${NC}"

    # Scale services
    docker-compose -f docker-compose.scalable.yml up -d --scale auth-service=$auth_replicas
    docker-compose -f docker-compose.scalable.yml up -d --scale core-service=$core_replicas
    docker-compose -f docker-compose.scalable.yml up -d --scale file-service=$file_replicas
    docker-compose -f docker-compose.scalable.yml up -d --scale frontend=$frontend_replicas

    echo -e "${GREEN}✅ Services scaled successfully${NC}"
}

# Function to show service status
show_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}📈 Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Function to show configuration info
show_config_info() {
    echo -e "${BLUE}📋 Configuration Information:${NC}"
    echo ""
    
    case $CONFIG in
        "ultra-light")
            echo -e "${GREEN}Ultra-Light Configuration:${NC}"
            echo "  • RAM: ~400MB"
            echo "  • CPU: ~1.0 cores"
            echo "  • Users: 10-20"
            echo "  • Services: Core only (no Kafka, no AI)"
            ;;
        "lightweight")
            echo -e "${GREEN}Lightweight Configuration:${NC}"
            echo "  • RAM: ~1.0GB"
            echo "  • CPU: ~2.0 cores"
            echo "  • Users: 50-100"
            echo "  • Services: Core + Kafka + Basic integrations"
            ;;
        "scalable")
            echo -e "${GREEN}Scalable Configuration:${NC}"
            echo "  • RAM: ~2.0GB"
            echo "  • CPU: ~3.0 cores"
            echo "  • Users: 100-500"
            echo "  • Services: All services with load balancing"
            ;;
        "full")
            echo -e "${GREEN}Full Configuration:${NC}"
            echo "  • RAM: ~3.5GB"
            echo "  • CPU: ~4.5 cores"
            echo "  • Users: 1000+"
            echo "  • Services: All services with AI and advanced features"
            ;;
    esac
    echo ""
}

# Main execution
main() {
    show_config_info
    
    # Stop all services first
    stop_all_services
    
    # Start services based on configuration
    case $CONFIG in
        "ultra-light")
            start_ultra_light
            ;;
        "lightweight")
            start_lightweight
            ;;
        "scalable")
            start_scalable
            scale_services $USER_COUNT
            ;;
        "full")
            start_full
            ;;
        *)
            echo -e "${RED}❌ Invalid configuration: ${CONFIG}${NC}"
            echo -e "${YELLOW}Available configurations: ultra-light, lightweight, scalable, full${NC}"
            exit 1
            ;;
    esac
    
    # Wait for services to start
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 10
    
    # Show status
    show_status
    
    echo ""
    echo -e "${GREEN}🎉 Services started successfully!${NC}"
    echo -e "${BLUE}Access your application at: http://localhost${NC}"
    echo ""
    echo -e "${YELLOW}📚 Available commands:${NC}"
    echo "  • View logs: docker-compose logs -f"
    echo "  • Scale services: ./scale-services.sh scalable 200"
    echo "  • Stop services: docker-compose down"
    echo "  • View status: docker-compose ps"
}

# Run main function
main
