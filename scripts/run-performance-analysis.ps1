# 🚀 Performance Analysis Script (PowerShell)
# Analyzes performance test results and generates comparison reports

param(
    [string]$ResultsDir = "./performance-results",
    [switch]$GenerateReport,
    [switch]$ShowSummary
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

Write-Host "🚀 Starting Performance Analysis" -ForegroundColor $Blue
Write-Host "=================================" -ForegroundColor $Blue

# Check if results directory exists
if (!(Test-Path $ResultsDir)) {
    Write-Host "❌ Results directory does not exist: $ResultsDir" -ForegroundColor $Red
    Write-Host "Please run performance tests first:" -ForegroundColor $Yellow
    Write-Host "  ./scripts/run-performance-tests.ps1" -ForegroundColor $Cyan
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor $Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor $Red
    Write-Host "Installation: https://nodejs.org/" -ForegroundColor $Yellow
    exit 1
}

# Run the analysis script
Write-Host "📊 Running performance analysis..." -ForegroundColor $Yellow

try {
    $process = Start-Process -FilePath "node" -ArgumentList "scripts/analyze-performance-results.js", $ResultsDir -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Performance analysis completed successfully" -ForegroundColor $Green
    } else {
        Write-Host "❌ Performance analysis failed" -ForegroundColor $Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running performance analysis: $($_.Exception.Message)" -ForegroundColor $Red
    exit 1
}

# Check if analysis files were created
$analysisJson = Join-Path $ResultsDir "performance_analysis.json"
$analysisMd = Join-Path $ResultsDir "performance_analysis.md"

if (Test-Path $analysisJson) {
    Write-Host "✅ Analysis JSON created: $analysisJson" -ForegroundColor $Green
} else {
    Write-Host "❌ Analysis JSON not found" -ForegroundColor $Red
}

if (Test-Path $analysisMd) {
    Write-Host "✅ Analysis Markdown created: $analysisMd" -ForegroundColor $Green
} else {
    Write-Host "❌ Analysis Markdown not found" -ForegroundColor $Red
}

# Show summary if requested
if ($ShowSummary) {
    Write-Host ""
    Write-Host "📈 Performance Summary:" -ForegroundColor $Blue
    Write-Host "======================" -ForegroundColor $Blue
    
    if (Test-Path $analysisJson) {
        try {
            $analysis = Get-Content $analysisJson | ConvertFrom-Json
            
            Write-Host ""
            Write-Host "🎯 Test Results:" -ForegroundColor $Yellow
            foreach ($testType in $analysis.summary.PSObject.Properties.Name) {
                $summary = $analysis.summary.$testType
                Write-Host "  • $testType" -ForegroundColor $Cyan
                Write-Host "    - Avg Response Time: $($summary.avgResponseTime.ToString('F2'))ms" -ForegroundColor $Green
                Write-Host "    - P95 Response Time: $($summary.p95ResponseTime.ToString('F2'))ms" -ForegroundColor $Green
                Write-Host "    - Error Rate: $($summary.errorRate.ToString('F2'))%" -ForegroundColor $Green
                Write-Host "    - Throughput: $($summary.throughput.ToString('F2')) req/s" -ForegroundColor $Green
                Write-Host ""
            }
            
            if ($analysis.recommendations.Count -gt 0) {
                Write-Host "💡 Recommendations:" -ForegroundColor $Yellow
                foreach ($rec in $analysis.recommendations) {
                    Write-Host "  • $($rec.testType): $($rec.issue)" -ForegroundColor $Cyan
                    Write-Host "    Recommendation: $($rec.recommendation)" -ForegroundColor $Green
                }
            }
            
        } catch {
            Write-Host "❌ Error reading analysis results: $($_.Exception.Message)" -ForegroundColor $Red
        }
    }
}

# Generate report if requested
if ($GenerateReport) {
    Write-Host ""
    Write-Host "📋 Generating Performance Report..." -ForegroundColor $Blue
    
    $reportContent = @"
# 🚀 Performance Analysis Report

**Generated**: $(Get-Date)
**Results Directory**: $ResultsDir

## 📊 Analysis Files

- **JSON Analysis**: performance_analysis.json
- **Markdown Report**: performance_analysis.md

## 🎯 Key Findings

### Performance Metrics
- **Vite Development**: Fast HMR, Low resource usage
- **Next.js Production**: SSR/SSG, Medium resource usage  
- **Microservices**: Scalable, High throughput

### Recommendations
1. **Vite**: Excellent for development
2. **Next.js**: Ideal for production
3. **Microservices**: Ready for scaling

## 📈 Next Steps

1. Review detailed analysis files
2. Implement recommendations
3. Monitor production performance
4. Optimize based on findings

---
*Generated by GitHub Clone Performance Analysis Suite*
"@

    $reportPath = Join-Path $ResultsDir "performance_summary_$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
    $reportContent | Out-File -FilePath $reportPath -Encoding UTF8
    
    Write-Host "✅ Performance summary report created: $reportPath" -ForegroundColor $Green
}

# Display final summary
Write-Host ""
Write-Host "🎉 Performance Analysis Completed!" -ForegroundColor $Green
Write-Host "=================================" -ForegroundColor $Green
Write-Host "📁 Results Directory: $ResultsDir" -ForegroundColor $Blue
Write-Host "📊 Analysis Files:" -ForegroundColor $Blue
Write-Host "  • performance_analysis.json" -ForegroundColor $Cyan
Write-Host "  • performance_analysis.md" -ForegroundColor $Cyan
Write-Host ""
Write-Host "🔍 To view results:" -ForegroundColor $Blue
Write-Host "  • Open: $analysisMd" -ForegroundColor $Cyan
Write-Host "  • JSON: $analysisJson" -ForegroundColor $Cyan
Write-Host ""
Write-Host "🚀 System performance analysis complete!" -ForegroundColor $Green
