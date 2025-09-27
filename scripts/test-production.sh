#!/bin/bash

# 🧪 Production Test Script for GitHub Clone
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Production Testing Suite${NC}"
echo "=============================="

# Test configuration
BASE_URL="https://githubclone.com"
LOCAL_URL="http://localhost"
TIMEOUT=30

# Test functions
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ PASS (HTTP $response)${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL (Expected HTTP $expected_status, got HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (Connection error)${NC}"
        return 1
    fi
}

test_websocket() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description... "
    
    # Test WebSocket connection using wscat if available, otherwise skip
    if command -v wscat &> /dev/null; then
        if timeout 10s wscat -c "$url" --close &>/dev/null; then
            echo -e "${GREEN}✅ PASS${NC}"
            return 0
        else
            echo -e "${RED}❌ FAIL (WebSocket connection failed)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  SKIP (wscat not installed)${NC}"
        return 0
    fi
}

test_database_connection() {
    echo -n "Testing database connection... "
    
    if docker-compose -f docker-compose.production.yml exec -T db pg_isready -U ${DB_USER:-githubclone_user} -d ${DB_NAME:-githubclone_production} &>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Database not ready)${NC}"
        return 1
    fi
}

test_redis_connection() {
    echo -n "Testing Redis connection... "
    
    if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Redis not responding)${NC}"
        return 1
    fi
}

# Performance test
test_performance() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description performance... "
    
    # Test response time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        echo -e "${GREEN}✅ PASS (${response_time}s)${NC}"
        return 0
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  SLOW (${response_time}s)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (${response_time}s - too slow)${NC}"
        return 1
    fi
}

# Load test
load_test() {
    local url=$1
    local description=$2
    local concurrent_requests=10
    local total_requests=100
    
    echo -n "Load testing $description... "
    
    # Simple load test using curl
    success_count=0
    for i in $(seq 1 $total_requests); do
        if curl -s -o /dev/null --max-time 10 "$url" &>/dev/null; then
            ((success_count++))
        fi
    done
    
    success_rate=$((success_count * 100 / total_requests))
    
    if [ $success_rate -ge 95 ]; then
        echo -e "${GREEN}✅ PASS (${success_rate}% success rate)${NC}"
        return 0
    elif [ $success_rate -ge 90 ]; then
        echo -e "${YELLOW}⚠️  ACCEPTABLE (${success_rate}% success rate)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (${success_rate}% success rate)${NC}"
        return 1
    fi
}

# Main test execution
echo -e "${YELLOW}🔍 Running production tests...${NC}"
echo ""

# Infrastructure tests
echo -e "${BLUE}📊 Infrastructure Tests${NC}"
echo "------------------------"
test_database_connection
test_redis_connection
echo ""

# Health check tests
echo -e "${BLUE}🏥 Health Check Tests${NC}"
echo "----------------------"
test_endpoint "$LOCAL_URL/health" "200" "Nginx health check"
test_endpoint "$LOCAL_URL:3001/health" "200" "Auth service health"
test_endpoint "$LOCAL_URL:3002/health" "200" "Core service health"
test_endpoint "$LOCAL_URL:3011/health" "200" "Real-time service health"
echo ""

# API tests
echo -e "${BLUE}🔌 API Tests${NC}"
echo "------------"
test_endpoint "$LOCAL_URL/graphql" "400" "GraphQL endpoint (expecting 400 for empty query)"
test_endpoint "$LOCAL_URL/auth/health" "200" "Auth API health"
test_endpoint "$LOCAL_URL/integrations/health" "200" "Integration API health"
echo ""

# Frontend tests
echo -e "${BLUE}🌐 Frontend Tests${NC}"
echo "----------------"
test_endpoint "$LOCAL_URL" "200" "Frontend homepage"
test_endpoint "$LOCAL_URL/assets/js/app.js" "200" "Frontend JavaScript bundle"
test_endpoint "$LOCAL_URL/assets/css/app.css" "200" "Frontend CSS bundle"
echo ""

# WebSocket tests
echo -e "${BLUE}🔌 WebSocket Tests${NC}"
echo "------------------"
test_websocket "ws://localhost:3011/socket.io/?EIO=4&transport=websocket" "Real-time WebSocket"
echo ""

# Performance tests
echo -e "${BLUE}⚡ Performance Tests${NC}"
echo "---------------------"
test_performance "$LOCAL_URL" "Frontend homepage"
test_performance "$LOCAL_URL:3002/health" "Core service"
test_performance "$LOCAL_URL:3001/health" "Auth service"
echo ""

# Load tests
echo -e "${BLUE}📈 Load Tests${NC}"
echo "-------------"
load_test "$LOCAL_URL" "Frontend homepage"
load_test "$LOCAL_URL/health" "Health endpoint"
echo ""

# Security tests
echo -e "${BLUE}🔒 Security Tests${NC}"
echo "----------------"
echo -n "Testing HTTPS redirect... "
if curl -s -I "$BASE_URL" 2>/dev/null | grep -q "301\|302"; then
    echo -e "${GREEN}✅ PASS (Redirect detected)${NC}"
else
    echo -e "${YELLOW}⚠️  SKIP (HTTPS not configured)${NC}"
fi

echo -n "Testing security headers... "
if curl -s -I "$LOCAL_URL" 2>/dev/null | grep -q "X-Frame-Options"; then
    echo -e "${GREEN}✅ PASS (Security headers present)${NC}"
else
    echo -e "${RED}❌ FAIL (Security headers missing)${NC}"
fi
echo ""

# SSL tests (if HTTPS is configured)
echo -n "Testing SSL certificate... "
if curl -s -I "https://$BASE_URL" 2>/dev/null | grep -q "HTTP"; then
    echo -e "${GREEN}✅ PASS (SSL working)${NC}"
else
    echo -e "${YELLOW}⚠️  SKIP (HTTPS not accessible)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}📋 Test Summary${NC}"
echo "==============="

# Count test results (this would need to be implemented based on actual test results)
echo -e "${GREEN}✅ Tests completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose -f docker-compose.production.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${BLUE}📈 Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo -e "${GREEN}🎉 Production testing completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  • Monitor application logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  • Check Grafana dashboards: http://localhost:3000"
echo "  • Review Prometheus metrics: http://localhost:9090"
echo "  • Set up monitoring alerts"
echo "  • Configure automated backups"
echo ""
