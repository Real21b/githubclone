#!/bin/bash

# Resource monitoring script for microservices
echo "🔍 GitHub Clone - Resource Monitoring"
echo "======================================"

# Function to get container stats
get_container_stats() {
    local container_name=$1
    local stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $container_name 2>/dev/null | tail -n +2)
    if [ ! -z "$stats" ]; then
        echo "$stats"
    else
        echo "$container_name\tN/A\tN/A\tN/A"
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local port=$2
    local health_url="http://localhost:$port/health"
    
    if curl -s -f $health_url > /dev/null 2>&1; then
        echo "✅ $service_name: Healthy"
    else
        echo "❌ $service_name: Unhealthy"
    fi
}

echo ""
echo "📊 Container Resource Usage:"
echo "Container Name          CPU%    Memory Usage    Memory%"
echo "--------------------------------------------------------"

# Get stats for all microservices
get_container_stats "api_gateway"
get_container_stats "auth_service"
get_container_stats "core_service"
get_container_stats "file_service"
get_container_stats "frontend_ui"
get_container_stats "postgres_db"
get_container_stats "redis_cache"

echo ""
echo "🏥 Service Health Status:"
echo "------------------------"

# Check service health
check_service_health "API Gateway" 80
check_service_health "Auth Service" 3001
check_service_health "Core Service" 3002
check_service_health "File Service" 3003
check_service_health "Frontend" 3000

echo ""
echo "💾 System Resources:"
echo "-------------------"

# System memory usage
echo "System Memory:"
free -h

echo ""
echo "System CPU Load:"
uptime

echo ""
echo "Disk Usage:"
df -h / | tail -1

echo ""
echo "🐳 Docker System Info:"
echo "---------------------"
docker system df
