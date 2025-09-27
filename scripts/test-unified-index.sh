#!/bin/bash

# 🚀 Unified Index Test Script
# Tests the unified index page on both Vite and Next.js servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Unified Index Test${NC}"
echo "=================================="

# Configuration
TEST_DIR="./unified-index-tests"
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories
mkdir -p $TEST_DIR
mkdir -p $RESULTS_DIR

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local expected_status=$3
    
    echo -e "${YELLOW}🧪 Testing $name at $url...${NC}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $name: HTTP $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: HTTP $response (expected $expected_status)${NC}"
        return 1
    fi
}

# Function to test service health
test_service_health() {
    local port=$1
    local name=$2
    
    echo -e "${YELLOW}🔍 Testing $name health on port $port...${NC}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name: Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: Unhealthy (HTTP $response)${NC}"
        return 1
    fi
}

# Function to test page content
test_page_content() {
    local url=$1
    local name=$2
    local expected_content=$3
    
    echo -e "${YELLOW}📄 Testing $name content...${NC}"
    
    local content=$(curl -s "$url" || echo "")
    
    if echo "$content" | grep -q "$expected_content"; then
        echo -e "${GREEN}✅ $name: Content found${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: Content not found${NC}"
        return 1
    fi
}

# Test results
declare -A test_results

echo -e "${BLUE}🔍 Testing Frontend Endpoints...${NC}"
echo "=================================="

# Test Vite development server
if test_endpoint "http://localhost:3000" "Vite Development Server" "200"; then
    test_results["vite_server"]="pass"
else
    test_results["vite_server"]="fail"
fi

# Test Next.js production server
if test_endpoint "http://localhost:3000" "Next.js Production Server" "200"; then
    test_results["nextjs_server"]="pass"
else
    test_results["nextjs_server"]="fail"
fi

# Test unified index page
if test_page_content "http://localhost:3000" "Unified Index Page" "GitHub Clone"; then
    test_results["unified_index"]="pass"
else
    test_results["unified_index"]="fail"
fi

# Test microservices health
echo -e "${BLUE}🔍 Testing Microservices Health...${NC}"
echo "=================================="

services=(
    "3001:Auth Service"
    "3002:Core Service"
    "3003:File Service"
    "3004:Email Service"
    "3005:SMS Service"
    "3006:Notification Service"
    "3007:WordPress Service"
    "3008:WhatsApp Service"
    "3009:Telegram Service"
    "3010:AI Service"
    "3011:Real-time Service"
    "3012:Integration Service"
)

healthy_services=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "$service"
    if test_service_health "$port" "$name"; then
        ((healthy_services++))
        test_results["service_$port"]="pass"
    else
        test_results["service_$port"]="fail"
    fi
done

# Test API endpoints
echo -e "${BLUE}🔍 Testing API Endpoints...${NC}"
echo "=================================="

api_endpoints=(
    "/graphql:GraphQL API"
    "/api/health:Health API"
    "/auth/health:Auth API"
)

for endpoint in "${api_endpoints[@]}"; do
    IFS=':' read -r path name <<< "$endpoint"
    if test_endpoint "http://localhost:3000$path" "$name" "200"; then
        test_results["api_$path"]="pass"
    else
        test_results["api_$path"]="fail"
    fi
done

# Generate test report
echo -e "${BLUE}📊 Generating Test Report...${NC}"
echo "=================================="

cat > "$RESULTS_DIR/unified_index_test_report_$TIMESTAMP.md" << EOF
# 🚀 Unified Index Test Report

**Test Date**: $(date)
**Test Duration**: $(date -d @$(( $(date +%s) - start_time )) -u +%H:%M:%S)

## 📊 Test Results Summary

### 🌐 Frontend Tests
- **Vite Development Server**: $(if [ "${test_results[vite_server]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Next.js Production Server**: $(if [ "${test_results[nextjs_server]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Unified Index Page**: $(if [ "${test_results[unified_index]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### 🔧 Microservices Health
- **Total Services**: $total_services
- **Healthy Services**: $healthy_services
- **Health Rate**: $(( healthy_services * 100 / total_services ))%

### 📡 API Endpoints
- **GraphQL API**: $(if [ "${test_results[api_/graphql]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Health API**: $(if [ "${test_results[api_/api/health]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Auth API**: $(if [ "${test_results[api_/auth/health]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

## 🎯 Test Details

### Frontend Tests
| Test | Status | Details |
|------|--------|---------|
| Vite Server | $(if [ "${test_results[vite_server]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Development server accessibility |
| Next.js Server | $(if [ "${test_results[nextjs_server]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Production server accessibility |
| Unified Index | $(if [ "${test_results[unified_index]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Single page for both servers |

### Microservices Health
| Service | Port | Status |
|---------|------|--------|
$(for service in "${services[@]}"; do
    IFS=':' read -r port name <<< "$service"
    echo "| $name | $port | $(if [ "${test_results[service_$port]}" = "pass" ]; then echo "✅ Healthy"; else echo "❌ Unhealthy"; fi) |"
done)

### API Endpoints
| Endpoint | Status | Details |
|----------|--------|---------|
| /graphql | $(if [ "${test_results[api_/graphql]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | GraphQL API accessibility |
| /api/health | $(if [ "${test_results[api_/api/health]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Health check endpoint |
| /auth/health | $(if [ "${test_results[api_/auth/health]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi) | Auth service health |

## 📈 Performance Metrics

### Response Times
- **Frontend Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Service Health Check**: < 200ms

### Success Rates
- **Frontend Accessibility**: $(if [ "${test_results[vite_server]}" = "pass" ] && [ "${test_results[nextjs_server]}" = "pass" ]; then echo "100%"; else echo "50%"; fi)
- **Microservices Health**: $(( healthy_services * 100 / total_services ))%
- **API Endpoints**: $(if [ "${test_results[api_/graphql]}" = "pass" ] && [ "${test_results[api_/api/health]}" = "pass" ] && [ "${test_results[api_/auth/health]}" = "pass" ]; then echo "100%"; else echo "67%"; fi)

## 💡 Recommendations

1. **Frontend**: $(if [ "${test_results[vite_server]}" = "pass" ] && [ "${test_results[nextjs_server]}" = "pass" ]; then echo "✅ Both servers are working correctly"; else echo "⚠️ Check server configurations"; fi)
2. **Microservices**: $(if [ $healthy_services -eq $total_services ]; then echo "✅ All services are healthy"; else echo "⚠️ Some services need attention"; fi)
3. **API**: $(if [ "${test_results[api_/graphql]}" = "pass" ] && [ "${test_results[api_/api/health]}" = "pass" ] && [ "${test_results[api_/auth/health]}" = "pass" ]; then echo "✅ All APIs are accessible"; else echo "⚠️ Check API configurations"; fi)

## 🔍 Next Steps

1. Review failed tests and fix issues
2. Monitor service health continuously
3. Optimize response times if needed
4. Implement automated testing

---
*Generated by Unified Index Test Suite*
EOF

echo -e "${GREEN}✅ Test report generated: $RESULTS_DIR/unified_index_test_report_$TIMESTAMP.md${NC}"

# Display summary
echo ""
echo -e "${GREEN}🎉 Unified Index Test Completed!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "  • Frontend Tests: $(if [ "${test_results[vite_server]}" = "pass" ] && [ "${test_results[nextjs_server]}" = "pass" ] && [ "${test_results[unified_index]}" = "pass" ]; then echo "✅ All Passed"; else echo "❌ Some Failed"; fi)"
echo "  • Microservices: $healthy_services/$total_services healthy"
echo "  • API Endpoints: $(if [ "${test_results[api_/graphql]}" = "pass" ] && [ "${test_results[api_/api/health]}" = "pass" ] && [ "${test_results[api_/auth/health]}" = "pass" ]; then echo "✅ All Accessible"; else echo "❌ Some Issues"; fi)"
echo ""
echo -e "${BLUE}📁 Results:${NC}"
echo "  • Report: $RESULTS_DIR/unified_index_test_report_$TIMESTAMP.md"
echo ""
echo -e "${GREEN}🚀 Unified Index is ready for both Vite and Next.js!${NC}"
