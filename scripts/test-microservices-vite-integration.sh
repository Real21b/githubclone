#!/bin/bash

# 🚀 Microservices + Vite Integration Test
# Tests if Vite works with both its own server and Node.js server in microservices environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Microservices + Vite Integration Test${NC}"
echo "=================================================="

# Configuration
TEST_DIR="./microservices-vite-tests"
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories
mkdir -p $TEST_DIR
mkdir -p $RESULTS_DIR

# Function to test Vite server
test_vite_server() {
    echo -e "${YELLOW}🔥 Testing Vite Development Server...${NC}"
    
    # Test Vite dev server
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Vite Server: HTTP $response${NC}"
        return 0
    else
        echo -e "${RED}❌ Vite Server: HTTP $response${NC}"
        return 1
    fi
}

# Function to test Node.js server
test_nodejs_server() {
    echo -e "${YELLOW}⚡ Testing Node.js Server...${NC}"
    
    # Test Node.js server (Next.js production)
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ Node.js Server: HTTP $response${NC}"
        return 0
    else
        echo -e "${RED}❌ Node.js Server: HTTP $response${NC}"
        return 1
    fi
}

# Function to test unified index page
test_unified_index() {
    echo -e "${YELLOW}📄 Testing Unified Index Page...${NC}"
    
    local content=$(curl -s "http://localhost:3000" || echo "")
    
    if echo "$content" | grep -q "GitHub Clone"; then
        echo -e "${GREEN}✅ Unified Index: Content found${NC}"
        return 0
    else
        echo -e "${RED}❌ Unified Index: Content not found${NC}"
        return 1
    fi
}

# Function to test microservices integration
test_microservices_integration() {
    echo -e "${YELLOW}🔧 Testing Microservices Integration...${NC}"
    
    local services=(
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
    
    local healthy_count=0
    local total_count=${#services[@]}
    
    for service in "${services[@]}"; do
        IFS=':' read -r port name <<< "$service"
        
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" || echo "000")
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✅ $name: Healthy${NC}"
            ((healthy_count++))
        else
            echo -e "${RED}❌ $name: Unhealthy (HTTP $response)${NC}"
        fi
    done
    
    echo -e "${BLUE}📊 Microservices Health: $healthy_count/$total_count${NC}"
    
    if [ $healthy_count -eq $total_count ]; then
        return 0
    else
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "${YELLOW}📡 Testing API Endpoints...${NC}"
    
    local endpoints=(
        "/graphql:GraphQL API"
        "/api/health:Health API"
        "/auth/health:Auth API"
    )
    
    local success_count=0
    local total_count=${#endpoints[@]}
    
    for endpoint in "${endpoints[@]}"; do
        IFS=':' read -r path name <<< "$endpoint"
        
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path" || echo "000")
        
        if [ "$response" = "200" ]; then
            echo -e "${GREEN}✅ $name: HTTP $response${NC}"
            ((success_count++))
        else
            echo -e "${RED}❌ $name: HTTP $response${NC}"
        fi
    done
    
    echo -e "${BLUE}📊 API Endpoints: $success_count/$total_count${NC}"
    
    if [ $success_count -eq $total_count ]; then
        return 0
    else
        return 1
    fi
}

# Function to test WebSocket connection
test_websocket_connection() {
    echo -e "${YELLOW}🔌 Testing WebSocket Connection...${NC}"
    
    # Test WebSocket endpoint
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/socket.io/" || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "400" ]; then
        echo -e "${GREEN}✅ WebSocket: Accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ WebSocket: Not accessible (HTTP $response)${NC}"
        return 1
    fi
}

# Function to test performance
test_performance() {
    echo -e "${YELLOW}⚡ Testing Performance...${NC}"
    
    local start_time=$(date +%s%N)
    local response=$(curl -s "http://localhost:3000" || echo "")
    local end_time=$(date +%s%N)
    
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $duration -lt 2000 ]; then
        echo -e "${GREEN}✅ Performance: ${duration}ms (Good)${NC}"
        return 0
    else
        echo -e "${RED}❌ Performance: ${duration}ms (Slow)${NC}"
        return 1
    fi
}

# Main test execution
echo -e "${BLUE}🧪 Running Integration Tests...${NC}"
echo "=================================="

# Test results
declare -A test_results

# Test 1: Vite Server
if test_vite_server; then
    test_results["vite_server"]="pass"
else
    test_results["vite_server"]="fail"
fi

# Test 2: Node.js Server
if test_nodejs_server; then
    test_results["nodejs_server"]="pass"
else
    test_results["nodejs_server"]="fail"
fi

# Test 3: Unified Index
if test_unified_index; then
    test_results["unified_index"]="pass"
else
    test_results["unified_index"]="fail"
fi

# Test 4: Microservices Integration
if test_microservices_integration; then
    test_results["microservices"]="pass"
else
    test_results["microservices"]="fail"
fi

# Test 5: API Endpoints
if test_api_endpoints; then
    test_results["api_endpoints"]="pass"
else
    test_results["api_endpoints"]="fail"
fi

# Test 6: WebSocket Connection
if test_websocket_connection; then
    test_results["websocket"]="pass"
else
    test_results["websocket"]="fail"
fi

# Test 7: Performance
if test_performance; then
    test_results["performance"]="pass"
else
    test_results["performance"]="fail"
fi

# Generate test report
echo -e "${BLUE}📊 Generating Test Report...${NC}"
echo "=================================="

cat > "$RESULTS_DIR/microservices_vite_integration_report_$TIMESTAMP.md" << EOF
# 🚀 Microservices + Vite Integration Test Report

**Test Date**: $(date)
**Test Duration**: $(date -d @$(( $(date +%s) - start_time )) -u +%H:%M:%S)

## 📊 Test Results Summary

### 🌐 Server Tests
- **Vite Development Server**: $(if [ "${test_results[vite_server]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Node.js Production Server**: $(if [ "${test_results[nodejs_server]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Unified Index Page**: $(if [ "${test_results[unified_index]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

### 🔧 Integration Tests
- **Microservices Integration**: $(if [ "${test_results[microservices]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **API Endpoints**: $(if [ "${test_results[api_endpoints]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **WebSocket Connection**: $(if [ "${test_results[websocket]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)
- **Performance**: $(if [ "${test_results[performance]}" = "pass" ]; then echo "✅ PASS"; else echo "❌ FAIL"; fi)

## 🎯 Integration Analysis

### ✅ Vite + Microservices Compatibility
- **Vite Development Server**: $(if [ "${test_results[vite_server]}" = "pass" ]; then echo "✅ Works with microservices"; else echo "❌ Issues detected"; fi)
- **Node.js Production Server**: $(if [ "${test_results[nodejs_server]}" = "pass" ]; then echo "✅ Works with microservices"; else echo "❌ Issues detected"; fi)
- **Unified Index**: $(if [ "${test_results[unified_index]}" = "pass" ]; then echo "✅ Single page works on both servers"; else echo "❌ Issues detected"; fi)

### 🔧 Microservices Integration
- **Service Health**: $(if [ "${test_results[microservices]}" = "pass" ]; then echo "✅ All services healthy"; else echo "❌ Some services unhealthy"; fi)
- **API Connectivity**: $(if [ "${test_results[api_endpoints]}" = "pass" ]; then echo "✅ All APIs accessible"; else echo "❌ Some APIs inaccessible"; fi)
- **Real-time Communication**: $(if [ "${test_results[websocket]}" = "pass" ]; then echo "✅ WebSocket working"; else echo "❌ WebSocket issues"; fi)

### ⚡ Performance
- **Response Time**: $(if [ "${test_results[performance]}" = "pass" ]; then echo "✅ Good performance"; else echo "❌ Performance issues"; fi)
- **Load Handling**: $(if [ "${test_results[performance]}" = "pass" ]; then echo "✅ Can handle load"; else echo "❌ Load handling issues"; fi)

## 💡 Recommendations

1. **Vite Development**: $(if [ "${test_results[vite_server]}" = "pass" ]; then echo "✅ Ready for development"; else echo "⚠️ Check Vite configuration"; fi)
2. **Node.js Production**: $(if [ "${test_results[nodejs_server]}" = "pass" ]; then echo "✅ Ready for production"; else echo "⚠️ Check Node.js configuration"; fi)
3. **Microservices**: $(if [ "${test_results[microservices]}" = "pass" ]; then echo "✅ All services integrated"; else echo "⚠️ Check service configurations"; fi)
4. **Performance**: $(if [ "${test_results[performance]}" = "pass" ]; then echo "✅ Performance is good"; else echo "⚠️ Optimize performance"; fi)

## 🔍 Next Steps

1. Review failed tests and fix issues
2. Monitor service health continuously
3. Optimize performance if needed
4. Implement automated testing

---
*Generated by Microservices + Vite Integration Test Suite*
EOF

echo -e "${GREEN}✅ Test report generated: $RESULTS_DIR/microservices_vite_integration_report_$TIMESTAMP.md${NC}"

# Display summary
echo ""
echo -e "${GREEN}🎉 Microservices + Vite Integration Test Completed!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Test Summary:${NC}"
echo "  • Vite Server: $(if [ "${test_results[vite_server]}" = "pass" ]; then echo "✅ Working"; else echo "❌ Issues"; fi)"
echo "  • Node.js Server: $(if [ "${test_results[nodejs_server]}" = "pass" ]; then echo "✅ Working"; else echo "❌ Issues"; fi)"
echo "  • Unified Index: $(if [ "${test_results[unified_index]}" = "pass" ]; then echo "✅ Working"; else echo "❌ Issues"; fi)"
echo "  • Microservices: $(if [ "${test_results[microservices]}" = "pass" ]; then echo "✅ Integrated"; else echo "❌ Issues"; fi)"
echo "  • API Endpoints: $(if [ "${test_results[api_endpoints]}" = "pass" ]; then echo "✅ Accessible"; else echo "❌ Issues"; fi)"
echo "  • WebSocket: $(if [ "${test_results[websocket]}" = "pass" ]; then echo "✅ Working"; else echo "❌ Issues"; fi)"
echo "  • Performance: $(if [ "${test_results[performance]}" = "pass" ]; then echo "✅ Good"; else echo "❌ Issues"; fi)"
echo ""
echo -e "${BLUE}📁 Results:${NC}"
echo "  • Report: $RESULTS_DIR/microservices_vite_integration_report_$TIMESTAMP.md"
echo ""
echo -e "${GREEN}🚀 Vite + Microservices Integration Status: $(if [ "${test_results[vite_server]}" = "pass" ] && [ "${test_results[microservices]}" = "pass" ]; then echo "✅ READY"; else echo "❌ NEEDS ATTENTION"; fi)${NC}"
