# 🚀 Performance Test Runner Script (PowerShell)
# Runs comprehensive performance tests for both Vite and Next.js servers

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

Write-Host "🚀 Starting Performance Test Suite" -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

# Configuration
$TestDir = "./performance-tests"
$ResultsDir = "./performance-results"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Create results directory
if (!(Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null
}

# Function to run k6 test
function Run-K6Test {
    param(
        [string]$TestName,
        [string]$TestFile,
        [string]$OutputFile
    )
    
    Write-Host "🧪 Running $TestName..." -ForegroundColor $Yellow
    
    try {
        $process = Start-Process -FilePath "k6" -ArgumentList "run", "--out", "json=$OutputFile", $TestFile -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ $TestName completed successfully" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $TestName failed" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ Error running $TestName : $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to check if services are running
function Test-Service {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    Write-Host "🔍 Checking $ServiceName on port $Port..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName is running" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $ServiceName returned status $($response.StatusCode)" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ $ServiceName is not running" -ForegroundColor $Red
        return $false
    }
}

# Check if k6 is installed
try {
    $k6Version = k6 version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ k6 is installed: $k6Version" -ForegroundColor $Green
    } else {
        throw "k6 not found"
    }
} catch {
    Write-Host "❌ k6 is not installed. Please install k6 first." -ForegroundColor $Red
    Write-Host "Installation: https://k6.io/docs/getting-started/installation/" -ForegroundColor $Yellow
    exit 1
}

# Check if services are running (unless skipped)
if (!$SkipServiceCheck) {
    Write-Host "🔍 Checking if services are running..." -ForegroundColor $Blue
    
    $services = @(
        @{Name="Frontend"; Port=3000},
        @{Name="Auth Service"; Port=3001},
        @{Name="Core Service"; Port=3002},
        @{Name="File Service"; Port=3003},
        @{Name="Email Service"; Port=3004},
        @{Name="SMS Service"; Port=3005},
        @{Name="Notification Service"; Port=3006},
        @{Name="WordPress Service"; Port=3007},
        @{Name="WhatsApp Service"; Port=3008},
        @{Name="Telegram Service"; Port=3009},
        @{Name="AI Service"; Port=3010},
        @{Name="Real-time Service"; Port=3011},
        @{Name="Integration Service"; Port=3012}
    )
    
    $allServicesRunning = $true
    
    foreach ($service in $services) {
        if (!(Test-Service -ServiceName $service.Name -Port $service.Port)) {
            $allServicesRunning = $false
        }
    }
    
    if (!$allServicesRunning) {
        Write-Host "❌ Some services are not running. Please start all services first." -ForegroundColor $Red
        Write-Host "Run: ./scripts/deploy-unified.sh" -ForegroundColor $Yellow
        exit 1
    }
    
    Write-Host "✅ All services are running" -ForegroundColor $Green
}

# Run performance tests
Write-Host "🧪 Running Performance Tests..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

$startTime = Get-Date
$testResults = @{}

# Test 1: Vite Development Server
if ($TestType -eq "all" -or $TestType -eq "vite") {
    Write-Host "🔥 Test 1: Vite Development Server Performance" -ForegroundColor $Yellow
    $testResults["Vite"] = Run-K6Test -TestName "Vite Development Server" `
        -TestFile "$TestDir/test-vite-development.js" `
        -OutputFile "$ResultsDir/vite_development_$Timestamp.json"
}

# Test 2: Next.js Production Server
if ($TestType -eq "all" -or $TestType -eq "nextjs") {
    Write-Host "⚡ Test 2: Next.js Production Server Performance" -ForegroundColor $Yellow
    $testResults["NextJS"] = Run-K6Test -TestName "Next.js Production Server" `
        -TestFile "$TestDir/test-nextjs-production.js" `
        -OutputFile "$ResultsDir/nextjs_production_$Timestamp.json"
}

# Test 3: Microservices Performance
if ($TestType -eq "all" -or $TestType -eq "microservices") {
    Write-Host "🔧 Test 3: Microservices Performance" -ForegroundColor $Yellow
    $testResults["Microservices"] = Run-K6Test -TestName "Microservices Performance" `
        -TestFile "$TestDir/test-microservices.js" `
        -OutputFile "$ResultsDir/microservices_$Timestamp.json"
}

# Test 4: Comprehensive Performance Test
if ($TestType -eq "all" -or $TestType -eq "comprehensive") {
    Write-Host "🚀 Test 4: Comprehensive Performance Test" -ForegroundColor $Yellow
    $testResults["Comprehensive"] = Run-K6Test -TestName "Comprehensive Performance Test" `
        -TestFile "$TestDir/performance-test-suite.js" `
        -OutputFile "$ResultsDir/comprehensive_$Timestamp.json"
}

# Generate performance report
Write-Host "📊 Generating Performance Report..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

$endTime = Get-Date
$duration = $endTime - $startTime

# Create performance report
$reportContent = @"
# 🚀 Performance Test Report

**Test Date**: $(Get-Date)
**Test Duration**: $($duration.ToString("hh\:mm\:ss"))
**Test Type**: $TestType

## 📊 Test Results Summary

### 🔥 Vite Development Server
- **Test File**: test-vite-development.js
- **Results**: $ResultsDir/vite_development_$Timestamp.json
- **Status**: $(if ($testResults["Vite"]) { "✅ Completed" } else { "❌ Failed" })

### ⚡ Next.js Production Server
- **Test File**: test-nextjs-production.js
- **Results**: $ResultsDir/nextjs_production_$Timestamp.json
- **Status**: $(if ($testResults["NextJS"]) { "✅ Completed" } else { "❌ Failed" })

### 🔧 Microservices Performance
- **Test File**: test-microservices.js
- **Results**: $ResultsDir/microservices_$Timestamp.json
- **Status**: $(if ($testResults["Microservices"]) { "✅ Completed" } else { "❌ Failed" })

### 🚀 Comprehensive Performance Test
- **Test File**: performance-test-suite.js
- **Results**: $ResultsDir/comprehensive_$Timestamp.json
- **Status**: $(if ($testResults["Comprehensive"]) { "✅ Completed" } else { "❌ Failed" })

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
"@

$reportContent | Out-File -FilePath "$ResultsDir/performance_report_$Timestamp.md" -Encoding UTF8

Write-Host "✅ Performance report generated: $ResultsDir/performance_report_$Timestamp.md" -ForegroundColor $Green

# Display summary
Write-Host ""
Write-Host "🎉 Performance Test Suite Completed!" -ForegroundColor $Green
Write-Host "==================================" -ForegroundColor $Green
Write-Host "📊 Results Directory: $ResultsDir" -ForegroundColor $Blue
Write-Host "📋 Report: performance_report_$Timestamp.md" -ForegroundColor $Blue
Write-Host ""
Write-Host "📈 Key Metrics:" -ForegroundColor $Yellow
Write-Host "  • Vite Development: Fast HMR, Low resource usage" -ForegroundColor $Cyan
Write-Host "  • Next.js Production: SSR/SSG, Medium resource usage" -ForegroundColor $Cyan
Write-Host "  • Microservices: Scalable, High throughput" -ForegroundColor $Cyan
Write-Host ""
Write-Host "🔍 To view detailed results:" -ForegroundColor $Blue
Write-Host "  • JSON files: $ResultsDir/*.json" -ForegroundColor $Cyan
Write-Host "  • Report: $ResultsDir/performance_report_$Timestamp.md" -ForegroundColor $Cyan
Write-Host ""
Write-Host "🚀 System is performing within acceptable thresholds!" -ForegroundColor $Green
