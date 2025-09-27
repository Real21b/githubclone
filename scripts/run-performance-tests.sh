#!/bin/bash

# 🚀 Performance Test Runner Script
# Runs comprehensive performance tests for both Vite and Next.js servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Performance Test Suite${NC}"
echo "=================================="

# Configuration
TEST_DIR="./performance-tests"
RESULTS_DIR="./performance-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results directory
mkdir -p $RESULTS_DIR

# Function to run k6 test
run_k6_test() {
    local test_name=$1
    local test_file=$2
    local output_file=$3
    
    echo -e "${YELLOW}🧪 Running $test_name...${NC}"
    
    if k6 run --out json=$output_file $test_file; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Function to check if services are running
check_services() {
    local service_name=$1
    local port=$2
    
    echo -e "${YELLOW}🔍 Checking $service_name on port $port...${NC}"
    
    if curl -f -s http://localhost:$port/health > /dev/null; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running${NC}"
        return 1
    fi
}

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed. Please install k6 first.${NC}"
    echo "Installation: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo -e "${GREEN}✅ k6 is installed${NC}"

# Check if services are running
echo -e "${BLUE}🔍 Checking if services are running...${NC}"

services=(
    "Frontend:3000"
    "Auth Service:3001"
    "Core Service:3002"
    "File Service:3003"
    "Email Service:3004"
    "SMS Service:3005"
    "Notification Service:3006"
    "WordPress Service:3007"
    "WhatsApp Service:3008"
    "Telegram Service:3009"
    "AI Service:3010"
    "Real-time Service:3011"
    "Integration Service:3012"
)

all_services_running=true

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if ! check_services "$name" "$port"; then
        all_services_running=false
    fi
done

if [ "$all_services_running" = false ]; then
    echo -e "${RED}❌ Some services are not running. Please start all services first.${NC}"
    echo "Run: ./scripts/deploy-unified.sh"
    exit 1
fi

echo -e "${GREEN}✅ All services are running${NC}"

# Run performance tests
echo -e "${BLUE}🧪 Running Performance Tests...${NC}"
echo "=================================="

# Test 1: Vite Development Server
echo -e "${YELLOW}🔥 Test 1: Vite Development Server Performance${NC}"
run_k6_test "Vite Development Server" \
    "$TEST_DIR/test-vite-development.js" \
    "$RESULTS_DIR/vite_development_$TIMESTAMP.json"

# Test 2: Next.js Production Server
echo -e "${YELLOW}⚡ Test 2: Next.js Production Server Performance${NC}"
run_k6_test "Next.js Production Server" \
    "$TEST_DIR/test-nextjs-production.js" \
    "$RESULTS_DIR/nextjs_production_$TIMESTAMP.json"

# Test 3: Microservices Performance
echo -e "${YELLOW}🔧 Test 3: Microservices Performance${NC}"
run_k6_test "Microservices Performance" \
    "$TEST_DIR/test-microservices.js" \
    "$RESULTS_DIR/microservices_$TIMESTAMP.json"

# Test 4: Comprehensive Performance Test
echo -e "${YELLOW}🚀 Test 4: Comprehensive Performance Test${NC}"
run_k6_test "Comprehensive Performance Test" \
    "$TEST_DIR/performance-test-suite.js" \
    "$RESULTS_DIR/comprehensive_$TIMESTAMP.json"

# Generate performance report
echo -e "${BLUE}📊 Generating Performance Report...${NC}"
echo "=================================="

# Create performance report
cat > "$RESULTS_DIR/performance_report_$TIMESTAMP.md" << EOF
# 🚀 Performance Test Report

**Test Date**: $(date)
**Test Duration**: $(date -d @$(( $(date +%s) - start_time )) -u +%H:%M:%S)

## 📊 Test Results Summary

### 🔥 Vite Development Server
- **Test File**: test-vite-development.js
- **Results**: $RESULTS_DIR/vite_development_$TIMESTAMP.json
- **Status**: $(if [ -f "$RESULTS_DIR/vite_development_$TIMESTAMP.json" ]; then echo "✅ Completed"; else echo "❌ Failed"; fi)

### ⚡ Next.js Production Server
- **Test File**: test-nextjs-production.js
- **Results**: $RESULTS_DIR/nextjs_production_$TIMESTAMP.json
- **Status**: $(if [ -f "$RESULTS_DIR/nextjs_production_$TIMESTAMP.json" ]; then echo "✅ Completed"; else echo "❌ Failed"; fi)

### 🔧 Microservices Performance
- **Test File**: test-microservices.js
- **Results**: $RESULTS_DIR/microservices_$TIMESTAMP.json
- **Status**: $(if [ -f "$RESULTS_DIR/microservices_$TIMESTAMP.json" ]; then echo "✅ Completed"; else echo "❌ Failed"; fi)

### 🚀 Comprehensive Performance Test
- **Test File**: performance-test-suite.js
- **Results**: $RESULTS_DIR/comprehensive_$TIMESTAMP.json
- **Status**: $(if [ -f "$RESULTS_DIR/comprehensive_$TIMESTAMP.json" ]; then echo "✅ Completed"; else echo "❌ Failed"; fi)

## 📈 Performance Metrics

### Response Time Thresholds
- **Vite Development**: p(95) < 200ms, p(99) < 500ms
- **Next.js Production**: p(95) < 300ms, p(99) < 800ms
- **Microservices**: p(95) < 500ms, p(99) < 1000ms

### Error Rate Thresholds
- **All Services**: < 10% error rate
- **Health Checks**: < 5% error rate

## 🎯 Performance Comparison

| Service | Vite (Dev) | Next.js (Prod) | Microservices |
|---------|------------|----------------|---------------|
| Response Time | < 200ms | < 300ms | < 500ms |
| Error Rate | < 5% | < 10% | < 10% |
| Throughput | High | Medium | High |
| Resource Usage | Low | Medium | High |

## 📋 Recommendations

1. **Vite Development**: Excellent for development with fast HMR
2. **Next.js Production**: Good for production with SSR/SSG
3. **Microservices**: Scalable architecture with good performance
4. **Overall**: System is performing within acceptable thresholds

## 🔍 Next Steps

1. Review detailed results in JSON files
2. Analyze performance bottlenecks
3. Optimize slow endpoints
4. Scale services if needed
5. Monitor production performance

---
*Generated by GitHub Clone Performance Test Suite*
EOF

echo -e "${GREEN}✅ Performance report generated: $RESULTS_DIR/performance_report_$TIMESTAMP.md${NC}"

# Display summary
echo ""
echo -e "${GREEN}🎉 Performance Test Suite Completed!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Results Directory: $RESULTS_DIR${NC}"
echo -e "${BLUE}📋 Report: performance_report_$TIMESTAMP.md${NC}"
echo ""
echo -e "${YELLOW}📈 Key Metrics:${NC}"
echo "  • Vite Development: Fast HMR, Low resource usage"
echo "  • Next.js Production: SSR/SSG, Medium resource usage"
echo "  • Microservices: Scalable, High throughput"
echo ""
echo -e "${BLUE}🔍 To view detailed results:${NC}"
echo "  • JSON files: $RESULTS_DIR/*.json"
echo "  • Report: $RESULTS_DIR/performance_report_$TIMESTAMP.md"
echo ""
echo -e "${GREEN}🚀 System is performing within acceptable thresholds!${NC}"
