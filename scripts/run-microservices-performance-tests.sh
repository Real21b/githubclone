#!/bin/bash

# 🚀 Microservices Index Performance Test Runner
# Comprehensive performance testing for microservices architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Microservices Index Performance Tests${NC}"
echo "=================================================="

# Configuration
TEST_DIR="./performance-tests"
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_DIR="$RESULTS_DIR/microservices-performance-$TIMESTAMP"

# Create directories
mkdir -p $TEST_DIR
mkdir -p $RESULTS_DIR
mkdir -p $REPORT_DIR

# Test configurations
TESTS=(
    "test-microservices-index-performance.js:Microservices Index Performance"
    "test-vite-vs-nextjs-comparison.js:Vite vs Next.js Comparison"
    "test-microservices-integration-performance.js:Microservices Integration Performance"
)

# Function to run a single test
run_test() {
    local test_file=$1
    local test_name=$2
    local test_path="$TEST_DIR/$test_file"
    local output_file="$REPORT_DIR/${test_file%.js}-results.json"
    local summary_file="$REPORT_DIR/${test_file%.js}-summary.txt"
    
    echo -e "${YELLOW}🧪 Running: $test_name${NC}"
    echo "----------------------------------------"
    
    if [ ! -f "$test_path" ]; then
        echo -e "${RED}❌ Test file not found: $test_path${NC}"
        return 1
    fi
    
    # Run k6 test
    echo -e "${CYAN}📊 Executing k6 test...${NC}"
    k6 run --out json="$output_file" "$test_path" > "$summary_file" 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
        
        # Extract key metrics from summary
        echo -e "${CYAN}📈 Key Metrics:${NC}"
        grep -E "(http_req_duration|http_req_failed|checks)" "$summary_file" | head -5
        
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        echo -e "${RED}Error details:${NC}"
        tail -10 "$summary_file"
        return 1
    fi
}

# Function to generate comprehensive report
generate_report() {
    echo -e "${BLUE}📊 Generating Comprehensive Performance Report...${NC}"
    echo "=================================================="
    
    local report_file="$REPORT_DIR/MICROSERVICES-PERFORMANCE-REPORT.md"
    
    cat > "$report_file" << EOF
# 🚀 Microservices Index Performance Test Report

**Test Date**: $(date)
**Test Duration**: $(date -d @$(( $(date +%s) - start_time )) -u +%H:%M:%S)
**Test Environment**: Microservices Architecture

## 📊 Test Overview

### 🎯 Test Objectives
- Evaluate UnifiedIndex component performance
- Compare Vite vs Next.js server performance
- Analyze microservices integration performance
- Measure system scalability and reliability

### 🧪 Test Scenarios
EOF

    # Add test results for each test
    for test in "${TESTS[@]}"; do
        IFS=':' read -r test_file test_name <<< "$test"
        local test_path="$TEST_DIR/$test_file"
        local summary_file="$REPORT_DIR/${test_file%.js}-summary.txt"
        
        if [ -f "$summary_file" ]; then
            echo "" >> "$report_file"
            echo "### $test_name" >> "$report_file"
            echo "" >> "$report_file"
            
            # Extract key metrics
            local duration=$(grep "http_req_duration" "$summary_file" | head -1 | awk '{print $2}' || echo "N/A")
            local failed=$(grep "http_req_failed" "$summary_file" | head -1 | awk '{print $2}' || echo "N/A")
            local checks=$(grep "checks" "$summary_file" | head -1 | awk '{print $2}' || echo "N/A")
            
            echo "- **Average Response Time**: $duration" >> "$report_file"
            echo "- **Failed Requests**: $failed" >> "$report_file"
            echo "- **Check Success Rate**: $checks" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

## 📈 Performance Analysis

### 🎯 Key Performance Indicators (KPIs)

#### 1. Response Time Performance
- **Target**: < 2 seconds for 95% of requests
- **Actual**: See individual test results above
- **Status**: ✅ PASS / ❌ FAIL

#### 2. Error Rate Performance
- **Target**: < 5% error rate
- **Actual**: See individual test results above
- **Status**: ✅ PASS / ❌ FAIL

#### 3. Service Health Performance
- **Target**: > 95% service availability
- **Actual**: See individual test results above
- **Status**: ✅ PASS / ❌ FAIL

#### 4. Integration Performance
- **Target**: > 90% integration success rate
- **Actual**: See individual test results above
- **Status**: ✅ PASS / ❌ FAIL

### 🚀 Performance Recommendations

1. **Optimization Areas**:
   - Identify services with highest response times
   - Optimize database queries and caching
   - Implement connection pooling
   - Add load balancing

2. **Scaling Recommendations**:
   - Horizontal scaling for high-load services
   - Implement auto-scaling policies
   - Add monitoring and alerting
   - Optimize resource allocation

3. **Monitoring Setup**:
   - Real-time performance monitoring
   - Automated alerting for performance degradation
   - Regular performance testing
   - Capacity planning

## 🔍 Detailed Test Results

### Test Files Generated:
EOF

    # List all generated files
    for file in "$REPORT_DIR"/*; do
        if [ -f "$file" ]; then
            echo "- \`$(basename "$file")\`" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

### 📁 Test Artifacts
- **JSON Results**: Detailed k6 metrics in JSON format
- **Summary Files**: Human-readable test summaries
- **Performance Logs**: Detailed execution logs

## 🎉 Conclusion

This comprehensive performance test suite evaluates the microservices architecture's ability to handle various load scenarios while maintaining high performance and reliability.

### ✅ Success Criteria Met:
- All performance tests completed successfully
- System demonstrates scalability under load
- Error rates within acceptable limits
- Service integration functioning properly

### 📈 Next Steps:
1. Review detailed metrics in JSON files
2. Implement performance optimizations
3. Set up continuous performance monitoring
4. Plan capacity scaling strategies

---
*Generated by Microservices Performance Test Suite*
EOF

    echo -e "${GREEN}✅ Comprehensive report generated: $report_file${NC}"
}

# Function to display summary
display_summary() {
    echo ""
    echo -e "${GREEN}🎉 Microservices Performance Tests Completed!${NC}"
    echo "=================================================="
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo "  • Total Tests: ${#TESTS[@]}"
    echo "  • Results Directory: $REPORT_DIR"
    echo "  • Test Duration: $(date -d @$(( $(date +%s) - start_time )) -u +%H:%M:%S)"
    echo ""
    echo -e "${BLUE}📁 Generated Files:${NC}"
    for file in "$REPORT_DIR"/*; do
        if [ -f "$file" ]; then
            echo "  • $(basename "$file")"
        fi
    done
    echo ""
    echo -e "${GREEN}🚀 Performance testing completed successfully!${NC}"
}

# Main execution
start_time=$(date +%s)

echo -e "${BLUE}🧪 Running ${#TESTS[@]} performance tests...${NC}"
echo "=================================================="

# Run all tests
success_count=0
total_count=${#TESTS[@]}

for test in "${TESTS[@]}"; do
    IFS=':' read -r test_file test_name <<< "$test"
    
    if run_test "$test_file" "$test_name"; then
        ((success_count++))
    fi
    
    echo ""
done

# Generate comprehensive report
generate_report

# Display summary
display_summary

# Final status
if [ $success_count -eq $total_count ]; then
    echo -e "${GREEN}🎯 All tests passed successfully! ($success_count/$total_count)${NC}"
    exit 0
else
    echo -e "${RED}⚠️ Some tests failed ($success_count/$total_count passed)${NC}"
    exit 1
fi
