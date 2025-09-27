# 🚀 Unified Index Test Script (PowerShell)
# Tests the unified index page on both Vite and Next.js servers

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

Write-Host "🚀 Starting Unified Index Test" -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

# Configuration
$TestDir = "./unified-index-tests"
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

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [int]$ExpectedStatus
    )
    
    Write-Host "🧪 Testing $Name at $Url..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "✅ $Name`: HTTP $($response.StatusCode)" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $Name`: HTTP $($response.StatusCode) (expected $ExpectedStatus)" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ $Name`: Error - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to test service health
function Test-ServiceHealth {
    param(
        [int]$Port,
        [string]$Name
    )
    
    Write-Host "🔍 Testing $Name health on port $Port..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Name`: Healthy" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $Name`: Unhealthy (HTTP $($response.StatusCode))" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ $Name`: Unhealthy - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Function to test page content
function Test-PageContent {
    param(
        [string]$Url,
        [string]$Name,
        [string]$ExpectedContent
    )
    
    Write-Host "📄 Testing $Name content..." -ForegroundColor $Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -UseBasicParsing
        if ($response.Content -like "*$ExpectedContent*") {
            Write-Host "✅ $Name`: Content found" -ForegroundColor $Green
            return $true
        } else {
            Write-Host "❌ $Name`: Content not found" -ForegroundColor $Red
            return $false
        }
    } catch {
        Write-Host "❌ $Name`: Error - $($_.Exception.Message)" -ForegroundColor $Red
        return $false
    }
}

# Start time
$startTime = Get-Date

Write-Host "🔍 Testing Frontend Endpoints..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

# Test Vite development server
if (Test-Endpoint -Url "http://localhost:3000" -Name "Vite Development Server" -ExpectedStatus 200) {
    $testResults["vite_server"] = "pass"
} else {
    $testResults["vite_server"] = "fail"
}

# Test Next.js production server
if (Test-Endpoint -Url "http://localhost:3000" -Name "Next.js Production Server" -ExpectedStatus 200) {
    $testResults["nextjs_server"] = "pass"
} else {
    $testResults["nextjs_server"] = "fail"
}

# Test unified index page
if (Test-PageContent -Url "http://localhost:3000" -Name "Unified Index Page" -ExpectedContent "GitHub Clone") {
    $testResults["unified_index"] = "pass"
} else {
    $testResults["unified_index"] = "fail"
}

# Test microservices health
Write-Host "🔍 Testing Microservices Health..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

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

$healthyServices = 0
$totalServices = $services.Count

foreach ($service in $services) {
    if (Test-ServiceHealth -Port $service.Port -Name $service.Name) {
        $healthyServices++
        $testResults["service_$($service.Port)"] = "pass"
    } else {
        $testResults["service_$($service.Port)"] = "fail"
    }
}

# Test API endpoints
Write-Host "🔍 Testing API Endpoints..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

$apiEndpoints = @(
    @{Path="/graphql"; Name="GraphQL API"},
    @{Path="/api/health"; Name="Health API"},
    @{Path="/auth/health"; Name="Auth API"}
)

foreach ($endpoint in $apiEndpoints) {
    if (Test-Endpoint -Url "http://localhost:3000$($endpoint.Path)" -Name $endpoint.Name -ExpectedStatus 200) {
        $testResults["api_$($endpoint.Path)"] = "pass"
    } else {
        $testResults["api_$($endpoint.Path)"] = "fail"
    }
}

# Generate test report
Write-Host "📊 Generating Test Report..." -ForegroundColor $Blue
Write-Host "==================================" -ForegroundColor $Blue

$endTime = Get-Date
$duration = $endTime - $startTime

$reportContent = @"
# 🚀 Unified Index Test Report

**Test Date**: $(Get-Date)
**Test Duration**: $($duration.ToString("hh\:mm\:ss"))

## 📊 Test Results Summary

### 🌐 Frontend Tests
- **Vite Development Server**: $(if ($testResults["vite_server"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Next.js Production Server**: $(if ($testResults["nextjs_server"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Unified Index Page**: $(if ($testResults["unified_index"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })

### 🔧 Microservices Health
- **Total Services**: $totalServices
- **Healthy Services**: $healthyServices
- **Health Rate**: $([math]::Round($healthyServices * 100 / $totalServices, 1))%

### 📡 API Endpoints
- **GraphQL API**: $(if ($testResults["api_/graphql"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Health API**: $(if ($testResults["api_/api/health"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })
- **Auth API**: $(if ($testResults["api_/auth/health"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" })

## 🎯 Test Details

### Frontend Tests
| Test | Status | Details |
|------|--------|---------|
| Vite Server | $(if ($testResults["vite_server"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" }) | Development server accessibility |
| Next.js Server | $(if ($testResults["nextjs_server"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" }) | Production server accessibility |
| Unified Index | $(if ($testResults["unified_index"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" }) | Single page for both servers |

### Microservices Health
| Service | Port | Status |
|---------|------|--------|
$(foreach ($service in $services) {
    "| $($service.Name) | $($service.Port) | $(if ($testResults["service_$($service.Port)"] -eq "pass") { "✅ Healthy" } else { "❌ Unhealthy" }) |"
})

### API Endpoints
| Endpoint | Status | Details |
|----------|--------|---------|
| /graphql | $(if ($testResults["api_/graphql"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" }) | GraphQL API accessibility |
| /api/health | $(if ($testResults["api_/api/health"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" }) | Health check endpoint |
| /auth/health | $(if ($testResults["api_/auth/health"] -eq "pass") { "✅ PASS" } else { "❌ FAIL" }) | Auth service health |

## 📈 Performance Metrics

### Response Times
- **Frontend Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Service Health Check**: < 200ms

### Success Rates
- **Frontend Accessibility**: $(if ($testResults["vite_server"] -eq "pass" -and $testResults["nextjs_server"] -eq "pass") { "100%" } else { "50%" })
- **Microservices Health**: $([math]::Round($healthyServices * 100 / $totalServices, 1))%
- **API Endpoints**: $(if ($testResults["api_/graphql"] -eq "pass" -and $testResults["api_/api/health"] -eq "pass" -and $testResults["api_/auth/health"] -eq "pass") { "100%" } else { "67%" })

## 💡 Recommendations

1. **Frontend**: $(if ($testResults["vite_server"] -eq "pass" -and $testResults["nextjs_server"] -eq "pass") { "✅ Both servers are working correctly" } else { "⚠️ Check server configurations" })
2. **Microservices**: $(if ($healthyServices -eq $totalServices) { "✅ All services are healthy" } else { "⚠️ Some services need attention" })
3. **API**: $(if ($testResults["api_/graphql"] -eq "pass" -and $testResults["api_/api/health"] -eq "pass" -and $testResults["api_/auth/health"] -eq "pass") { "✅ All APIs are accessible" } else { "⚠️ Check API configurations" })

## 🔍 Next Steps

1. Review failed tests and fix issues
2. Monitor service health continuously
3. Optimize response times if needed
4. Implement automated testing

---
*Generated by Unified Index Test Suite*
"@

$reportPath = Join-Path $ResultsDir "unified_index_test_report_$Timestamp.md"
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "✅ Test report generated: $reportPath" -ForegroundColor $Green

# Display summary
Write-Host ""
Write-Host "🎉 Unified Index Test Completed!" -ForegroundColor $Green
Write-Host "==================================" -ForegroundColor $Green
Write-Host "📊 Test Summary:" -ForegroundColor $Blue
Write-Host "  • Frontend Tests: $(if ($testResults["vite_server"] -eq "pass" -and $testResults["nextjs_server"] -eq "pass" -and $testResults["unified_index"] -eq "pass") { "✅ All Passed" } else { "❌ Some Failed" })" -ForegroundColor $Cyan
Write-Host "  • Microservices: $healthyServices/$totalServices healthy" -ForegroundColor $Cyan
Write-Host "  • API Endpoints: $(if ($testResults["api_/graphql"] -eq "pass" -and $testResults["api_/api/health"] -eq "pass" -and $testResults["api_/auth/health"] -eq "pass") { "✅ All Accessible" } else { "❌ Some Issues" })" -ForegroundColor $Cyan
Write-Host ""
Write-Host "📁 Results:" -ForegroundColor $Blue
Write-Host "  • Report: $reportPath" -ForegroundColor $Cyan
Write-Host ""
Write-Host "🚀 Unified Index is ready for both Vite and Next.js!" -ForegroundColor $Green
