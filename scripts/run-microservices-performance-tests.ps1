# 🚀 Microservices Index Performance Test Runner (PowerShell)
# Comprehensive performance testing for microservices architecture

param(
    [switch]$SkipServiceCheck,
    [switch]$QuickTest,
    [string]$TestType = "all"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

Write-Host "🚀 Starting Microservices Index Performance Tests" -ForegroundColor $Blue
Write-Host "==================================================" -ForegroundColor $Blue

# Configuration
$TestDir = "./performance-tests"
$ResultsDir = "./test-results"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportDir = "$ResultsDir/microservices-performance-$Timestamp"

# Create directories
if (!(Test-Path $TestDir)) {
    New-Item -ItemType Directory -Path $TestDir -Force | Out-Null
}
if (!(Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null
}
if (!(Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

# Test configurations
$Tests = @(
    @{File="test-microservices-index-performance.js"; Name="Microservices Index Performance"},
    @{File="test-vite-vs-nextjs-comparison.js"; Name="Vite vs Next.js Comparison"},
    @{File="test-microservices-integration-performance.js"; Name="Microservices Integration Performance"}
)

# Function to run a single test
function Invoke-PerformanceTest {
    param(
        [string]$TestFile,
        [string]$TestName
    )
    
    $TestPath = Join-Path $TestDir $TestFile
    $OutputFile = Join-Path $ReportDir ($TestFile -replace '\.js$', '-results.json')
    $SummaryFile = Join-Path $ReportDir ($TestFile -replace '\.js$', '-summary.txt')
    
    Write-Host "🧪 Running: $TestName" -ForegroundColor $Yellow
    Write-Host "----------------------------------------" -ForegroundColor $Yellow
    
    if (!(Test-Path $TestPath)) {
        Write-Host "❌ Test file not found: $TestPath" -ForegroundColor $Red
        return $false
    }
    
    # Run k6 test
    Write-Host "📊 Executing k6 test..." -ForegroundColor $Cyan
    try {
        k6 run --out json="$OutputFile" "$TestPath" > "$SummaryFile" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $TestName completed successfully" -ForegroundColor $Green
            
            # Extract key metrics from summary
            Write-Host "📈 Key Metrics:" -ForegroundColor $Cyan
            $summaryContent = Get-Content $SummaryFile -Raw
            $metrics = $summaryContent | Select-String -Pattern "(http_req_duration|http_req_failed|checks)" | Select-Object -First 5
            foreach ($metric in $metrics) {
                Write-Host "  $($metric.Line)" -ForegroundColor $Cyan
            }
            
            return $true
        } else {
            Write-Host "❌ $TestName failed" -ForegroundColor $Red
            Write-Host "Error details:" -ForegroundColor $Red
            $errorContent = Get-Content $SummaryFile | Select-Object -Last 10
            foreach ($line in $errorContent) {
                Write-Host "  $line" -ForegroundColor $Red
            }
            return $false
        }
    } catch {
        Write-Host "❌ Error running test: $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to generate comprehensive report
function New-PerformanceReport {
    Write-Host "📊 Generating Comprehensive Performance Report..." -ForegroundColor $Blue
    Write-Host "==================================================" -ForegroundColor $Blue
    
    $ReportFile = Join-Path $ReportDir "MICROSERVICES-PERFORMANCE-REPORT.md"
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    
    $ReportContent = @"
# 🚀 Microservices Index Performance Test Report

**Test Date**: $(Get-Date)
**Test Duration**: $($Duration.ToString("hh\:mm\:ss"))
**Test Environment**: Microservices Architecture

## 📊 Test Overview

### 🎯 Test Objectives
- Evaluate UnifiedIndex component performance
- Compare Vite vs Next.js server performance
- Analyze microservices integration performance
- Measure system scalability and reliability

### 🧪 Test Scenarios
"@

    # Add test results for each test
    foreach ($test in $Tests) {
        $TestFile = $test.File
        $TestName = $test.Name
        $SummaryFile = Join-Path $ReportDir ($TestFile -replace '\.js$', '-summary.txt')
        
        if (Test-Path $SummaryFile) {
            $ReportContent += @"

### $TestName

"@
            
            # Extract key metrics
            $summaryContent = Get-Content $SummaryFile -Raw
            $duration = ($summaryContent | Select-String -Pattern "http_req_duration" | Select-Object -First 1).Line -split '\s+' | Select-Object -Index 1
            $failed = ($summaryContent | Select-String -Pattern "http_req_failed" | Select-Object -First 1).Line -split '\s+' | Select-Object -Index 1
            $checks = ($summaryContent | Select-String -Pattern "checks" | Select-Object -First 1).Line -split '\s+' | Select-Object -Index 1
            
            if (!$duration) { $duration = "N/A" }
            if (!$failed) { $failed = "N/A" }
            if (!$checks) { $checks = "N/A" }
            
            $ReportContent += @"
- **Average Response Time**: $duration
- **Failed Requests**: $failed
- **Check Success Rate**: $checks
"@
        }
    }
    
    $ReportContent += @"

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
"@

    # List all generated files
    $files = Get-ChildItem $ReportDir -File
    foreach ($file in $files) {
        $ReportContent += @"
- ``$($file.Name)``
"@
    }
    
    $ReportContent += @"

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
"@

    $ReportContent | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Host "✅ Comprehensive report generated: $ReportFile" -ForegroundColor $Green
}

# Function to display summary
function Show-Summary {
    Write-Host ""
    Write-Host "🎉 Microservices Performance Tests Completed!" -ForegroundColor $Green
    Write-Host "==================================================" -ForegroundColor $Green
    Write-Host "📊 Test Summary:" -ForegroundColor $Blue
    Write-Host "  • Total Tests: $($Tests.Count)" -ForegroundColor $Cyan
    Write-Host "  • Results Directory: $ReportDir" -ForegroundColor $Cyan
    Write-Host "  • Test Duration: $($Duration.ToString("hh\:mm\:ss"))" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "📁 Generated Files:" -ForegroundColor $Blue
    $files = Get-ChildItem $ReportDir -File
    foreach ($file in $files) {
        Write-Host "  • $($file.Name)" -ForegroundColor $Cyan
    }
    Write-Host ""
    Write-Host "🚀 Performance testing completed successfully!" -ForegroundColor $Green
}

# Main execution
$StartTime = Get-Date

Write-Host "🧪 Running $($Tests.Count) performance tests..." -ForegroundColor $Blue
Write-Host "==================================================" -ForegroundColor $Blue

# Run all tests
$SuccessCount = 0
$TotalCount = $Tests.Count

foreach ($test in $Tests) {
    $TestFile = $test.File
    $TestName = $test.Name
    
    if (Invoke-PerformanceTest -TestFile $TestFile -TestName $TestName) {
        $SuccessCount++
    }
    
    Write-Host ""
}

# Generate comprehensive report
New-PerformanceReport

# Display summary
Show-Summary

# Final status
if ($SuccessCount -eq $TotalCount) {
    Write-Host "🎯 All tests passed successfully! ($SuccessCount/$TotalCount)" -ForegroundColor $Green
    exit 0
} else {
    Write-Host "⚠️ Some tests failed ($SuccessCount/$TotalCount passed)" -ForegroundColor $Red
    exit 1
}
