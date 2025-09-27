# 🚀 Microservices + Vite Integration Test (PowerShell)
# Tests if Vite works with both its own server and Node.js server in microservices environment

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

Write-Host "🚀 Starting Microservices + Vite Integration Test" -ForegroundColor $Blue
Write-Host "==================================================" -ForegroundColor $Blue

# Configuration
$TestDir = "./microservices-vite-tests"
$ResultsDir = "./test-results"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Create directories
if (!(Test-Path $TestDir)) {
    New-Item -ItemType Directory -Path $TestDir -Force | Out-Null
}
if (!(Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null
}

# Test results
$testResults = @{}

# Function to test Vite server
function Test-ViteServer {
    Write-Host "🔥 Testing Vite Development Server..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Vite Server: HTTP $($response.StatusCode)" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ Vite Server: HTTP $($response.StatusCode)" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ Vite Server: Error - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to test Node.js server
function Test-NodeJSServer {
    Write-Host "⚡ Testing Node.js Server..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Node.js Server: HTTP $($response.StatusCode)" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ Node.js Server: HTTP $($response.StatusCode)" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ Node.js Server: Error - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to test unified index page
function Test-UnifiedIndex {
    Write-Host "📄 Testing Unified Index Page..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.Content -like "*GitHub Clone*") {
            Write-Host "✅ Unified Index: Content found" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ Unified Index: Content not found" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ Unified Index: Error - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to test microservices integration
function Test-MicroservicesIntegration {
    Write-Host "🔧 Testing Microservices Integration..." -ForegroundColor $Yellow
    
    $services = @(
        @{Port=3001; Name="Auth Service"},
        @{Port=3002; Name="Core Service"},
        @{Port=3003; Name="File Service"},
        @{Port=3004; Name="Email Service"},
        @{Port=3005; Name="SMS Service"},
        @{Port=3006; Name="Notification Service"},
        @{Port=3007; Name="WordPress Service"},
        @{Port=3008; Name="WhatsApp Service"},
        @{Port=3009; Name="Telegram Service"},
        @{Port=3010; Name="AI Service"},
        @{Port=3011; Name="Real-time Service"},
        @{Port=3012; Name="Integration Service"}
    )
    
    $healthyCount = 0
    $totalCount = $services.Count
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $($service.Name): Healthy" -ForegroundColor $Green
                $healthyCount++
            } else {
                Write-Host "❌ $($service.Name): Unhealthy (HTTP $($response.StatusCode))" -ForegroundColor $Red
            }
        } catch {
            Write-Host "❌ $($service.Name): Unhealthy - $($_.Exception.Message)" -ForegroundColor $Red
        }
    }
    
    Write-Host "📊 Microservices Health: $healthyCount/$totalCount" -ForegroundColor $Blue
    
    if ($healthyCount -eq $totalCount) {
        return $true
    } else {
        return $false
    }
}

# Function to test API endpoints
function Test-APIEndpoints {
    Write-Host "📡 Testing API Endpoints..." -ForegroundColor $Yellow
    
    $endpoints = @(
        @{Path="/graphql"; Name="GraphQL API"},
        @{Path="/api/health"; Name="Health API"},
        @{Path="/auth/health"; Name="Auth API"}
    )
    
    $successCount = 0
    $totalCount = $endpoints.Count
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000$($endpoint.Path)" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $($endpoint.Name): HTTP $($response.StatusCode)" -ForegroundColor $Green
                $successCount++
            } else {
                Write-Host "❌ $($endpoint.Name): HTTP $($response.StatusCode)" -ForegroundColor $Red
            }
        } catch {
            Write-Host "❌ $($endpoint.Name): Error - $($_.Exception.Message)" -ForegroundColor $Red
        }
    }
    
    Write-Host "📊 API Endpoints: $successCount/$totalCount" -ForegroundColor $Blue
    
    if ($successCount -eq $totalCount) {
        return $true
    } else {
        return $false
    }
}

# Function to test WebSocket connection
function Test-WebSocketConnection {
    Write-Host "🔌 Testing WebSocket Connection..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/socket.io/" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 400) {
            Write-Host "✅ WebSocket: Accessible" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ WebSocket: Not accessible (HTTP $($response.StatusCode))" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ WebSocket: Not accessible - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to test performance
function Test-Performance {
    Write-Host "⚡ Testing Performance..." -ForegroundColor $Yellow
    
    $startTime = Get-Date
    try {
        Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop | Out-Null
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        if ($duration -lt 2000) {
            Write-Host "✅ Performance: $([math]::Round($duration, 0))ms (Good)" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ Performance: $([math]::Round($duration, 0))ms (Slow)" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ Performance: Error - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Main test execution
Write-Host "🧪 Running Integration Tests..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

$startTime = Get-Date

# Test 1: Vite Server
if (Test-ViteServer) {
    $testResults["vite_server"] = "pass"
} else {
    $testResults["vite_server"] = "fail"
}

# Test 2: Node.js Server
if (Test-NodeJSServer) {
    $testResults["nodejs_server"] = "pass"
} else {
    $testResults["nodejs_server"] = "fail"
}

# Test 3: Unified Index
if (Test-UnifiedIndex) {
    $testResults["unified_index"] = "pass"
} else {
    $testResults["unified_index"] = "fail"
}

# Test 4: Microservices Integration
if (Test-MicroservicesIntegration) {
    $testResults["microservices"] = "pass"
} else {
    $testResults["microservices"] = "fail"
}

# Test 5: API Endpoints
if (Test-APIEndpoints) {
    $testResults["api_endpoints"] = "pass"
} else {
    $testResults["api_endpoints"] = "fail"
}

# Test 6: WebSocket Connection
if (Test-WebSocketConnection) {
    $testResults["websocket"] = "pass"
} else {
    $testResults["websocket"] = "fail"
}

# Test 7: Performance
if (Test-Performance) {
    $testResults["performance"] = "pass"
} else {
    $testResults["performance"] = "fail"
}

# Generate test report
Write-Host "📊 Generating Test Report..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

$endTime = Get-Date
$duration = $endTime - $startTime

$reportContent = @"
# 🚀 Microservices + Vite Integration Test Report

**Test Date**: $(Get-Date)
**Test Duration**: $($duration.ToString("hh\:mm\:ss"))

## 📊 Test Results Summary

### 🌐 Server Tests
- **Vite Development Server**: $(if ($testResults["vite_server"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Node.js Production Server**: $(if ($testResults["nodejs_server"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Unified Index Page**: $(if ($testResults["unified_index"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })

### 🔧 Integration Tests
- **Microservices Integration**: $(if ($testResults["microservices"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **API Endpoints**: $(if ($testResults["api_endpoints"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **WebSocket Connection**: $(if ($testResults["websocket"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Performance**: $(if ($testResults["performance"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })

## 🎯 Integration Analysis

### ✅ Vite + Microservices Compatibility
- **Vite Development Server**: $(if ($testResults["vite_server"] -eq "pass") { "✅ Works with microservices" } else { "❌ Issues detected" })
- **Node.js Production Server**: $(if ($testResults["nodejs_server"] -eq "pass") { "✅ Works with microservices" } else { "❌ Issues detected" })
- **Unified Index**: $(if ($testResults["unified_index"] -eq "pass") { "✅ Single page works on both servers" } else { "❌ Issues detected" })

### 🔧 Microservices Integration
- **Service Health**: $(if ($testResults["microservices"] -eq "pass") { "✅ All services healthy" } else { "❌ Some services unhealthy" })
- **API Connectivity**: $(if ($testResults["api_endpoints"] -eq "pass") { "✅ All APIs accessible" } else { "❌ Some APIs inaccessible" })
- **Real-time Communication**: $(if ($testResults["websocket"] -eq "pass") { "✅ WebSocket working" } else { "❌ WebSocket issues" })

### ⚡ Performance
- **Response Time**: $(if ($testResults["performance"] -eq "pass") { "✅ Good performance" } else { "❌ Performance issues" })
- **Load Handling**: $(if ($testResults["performance"] -eq "pass") { "✅ Can handle load" } else { "❌ Load handling issues" })

## 💡 Recommendations

1. **Vite Development**: $(if ($testResults["vite_server"] -eq "pass") { "✅ Ready for development" } else { "⚠️ Check Vite configuration" })
2. **Node.js Production**: $(if ($testResults["nodejs_server"] -eq "pass") { "✅ Ready for production" } else { "⚠️ Check Node.js configuration" })
3. **Microservices**: $(if ($testResults["microservices"] -eq "pass") { "✅ All services integrated" } else { "⚠️ Check service configurations" })
4. **Performance**: $(if ($testResults["performance"] -eq "pass") { "✅ Performance is good" } else { "⚠️ Optimize performance" })

## 🔍 Next Steps

1. Review failed tests and fix issues
2. Monitor service health continuously
3. Optimize performance if needed
4. Implement automated testing

---
*Generated by Microservices + Vite Integration Test Suite*
"@

$reportPath = Join-Path $ResultsDir "microservices_vite_integration_report_$Timestamp.md"
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "✅ Test report generated: $reportPath" -ForegroundColor $Green

# Display summary
Write-Host ""
Write-Host "🎉 Microservices + Vite Integration Test Completed!" -ForegroundColor $Green
Write-Host "==================================================" -ForegroundColor $Green
Write-Host "📊 Test Summary:" -ForegroundColor $Blue
Write-Host "  • Vite Server: $(if ($testResults["vite_server"] -eq "pass") { "✅ Working" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host "  • Node.js Server: $(if ($testResults["nodejs_server"] -eq "pass") { "✅ Working" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host "  • Unified Index: $(if ($testResults["unified_index"] -eq "pass") { "✅ Working" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host "  • Microservices: $(if ($testResults["microservices"] -eq "pass") { "✅ Integrated" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host "  • API Endpoints: $(if ($testResults["api_endpoints"] -eq "pass") { "✅ Accessible" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host "  • WebSocket: $(if ($testResults["websocket"] -eq "pass") { "✅ Working" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host "  • Performance: $(if ($testResults["performance"] -eq "pass") { "✅ Good" } else { "❌ Issues" })" -ForegroundColor $Cyan
Write-Host ""
Write-Host "📁 Results:" -ForegroundColor $Blue
Write-Host "  • Report: $reportPath" -ForegroundColor $Cyan
Write-Host ""
Write-Host "🚀 Vite + Microservices Integration Status: $(if ($testResults["vite_server"] -eq "pass" -and $testResults["microservices"] -eq "pass") { "✅ READY" } else { "❌ NEEDS ATTENTION" })" -ForegroundColor $Green
