# 🚀 Quick Start Development Script (PowerShell)
# Mikro servis projesi için hızlı başlangıç

param(
    [switch]$SkipTests,
    [switch]$SkipDocker,
    [switch]$SkipDependencies,
    [string]$Environment = "development"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

Write-Host "🚀 Mikro Servis Projesi - Hızlı Başlangıç" -ForegroundColor $Blue
Write-Host "==================================================" -ForegroundColor $Blue

# Configuration
$ProjectDir = Split-Path -Parent $PSScriptRoot
$DockerComposeFile = "docker-compose.unified.yml"

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "🔍 Prerequisites kontrol ediliyor..." -ForegroundColor $Yellow
    
    $missingDeps = @()
    
    if (!(Test-Command "docker")) {
        $missingDeps += "docker"
    }
    
    if (!(Test-Command "docker-compose")) {
        $missingDeps += "docker-compose"
    }
    
    if (!(Test-Command "node")) {
        $missingDeps += "node"
    }
    
    if (!(Test-Command "npm")) {
        $missingDeps += "npm"
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Host "❌ Eksik bağımlılıklar:" -ForegroundColor $Red
        foreach ($dep in $missingDeps) {
            Write-Host "  - $dep" -ForegroundColor $Red
        }
        Write-Host "Lütfen eksik bağımlılıkları yükleyin ve tekrar deneyin." -ForegroundColor $Yellow
        exit 1
    }
    
    Write-Host "✅ Tüm bağımlılıklar mevcut" -ForegroundColor $Green
}

# Function to setup environment
function Initialize-Environment {
    Write-Host "🔧 Environment kurulumu..." -ForegroundColor $Yellow
    
    # Create necessary directories
    $directories = @("logs", "test-results", "uploads")
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    # Copy environment files if they don't exist
    if (!(Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ .env dosyası oluşturuldu" -ForegroundColor $Green
        } else {
            Write-Host "⚠️ .env.example dosyası bulunamadı" -ForegroundColor $Yellow
        }
    }
    
    Write-Host "✅ Environment kurulumu tamamlandı" -ForegroundColor $Green
}

# Function to install dependencies
function Install-Dependencies {
    if ($SkipDependencies) {
        Write-Host "⏭️ Bağımlılık yükleme atlandı" -ForegroundColor $Yellow
        return
    }
    
    Write-Host "📦 Bağımlılıklar yükleniyor..." -ForegroundColor $Yellow
    
    # Install root dependencies
    if (Test-Path "package.json") {
        npm install
        Write-Host "✅ Root bağımlılıkları yüklendi" -ForegroundColor $Green
    }
    
    # Install frontend dependencies
    if ((Test-Path "frontend") -and (Test-Path "frontend/package.json")) {
        Push-Location "frontend"
        npm install
        Pop-Location
        Write-Host "✅ Frontend bağımlılıkları yüklendi" -ForegroundColor $Green
    }
    
    # Install backend dependencies for each service
    $serviceDirs = Get-ChildItem "services" -Directory
    foreach ($serviceDir in $serviceDirs) {
        $servicePath = $serviceDir.FullName
        if (Test-Path "$servicePath/package.json") {
            $serviceName = $serviceDir.Name
            Write-Host "📦 $serviceName bağımlılıkları yükleniyor..." -ForegroundColor $Cyan
            Push-Location $servicePath
            npm install
            Pop-Location
        }
    }
    
    Write-Host "✅ Tüm bağımlılıklar yüklendi" -ForegroundColor $Green
}

# Function to start Docker services
function Start-DockerServices {
    if ($SkipDocker) {
        Write-Host "⏭️ Docker servisleri atlandı" -ForegroundColor $Yellow
        return
    }
    
    Write-Host "🐳 Docker servisleri başlatılıyor..." -ForegroundColor $Yellow
    
    # Stop any existing containers
    try {
        docker-compose -f $DockerComposeFile down 2>$null
    } catch {
        # Ignore errors if no containers are running
    }
    
    # Start services
    docker-compose -f $DockerComposeFile up -d
    
    Write-Host "✅ Docker servisleri başlatıldı" -ForegroundColor $Green
    
    # Wait for services to be ready
    Write-Host "⏳ Servislerin hazır olması bekleniyor..." -ForegroundColor $Yellow
    Start-Sleep -Seconds 30
    
    # Check service health
    Test-ServiceHealth
}

# Function to check service health
function Test-ServiceHealth {
    Write-Host "🏥 Servis sağlık kontrolü..." -ForegroundColor $Yellow
    
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
                Write-Host "❌ $($service.Name): Unhealthy" -ForegroundColor $Red
            }
        } catch {
            Write-Host "❌ $($service.Name): Unhealthy" -ForegroundColor $Red
        }
    }
    
    Write-Host "📊 Servis Sağlığı: $healthyCount/$totalCount" -ForegroundColor $Blue
    
    if ($healthyCount -eq $totalCount) {
        Write-Host "🎉 Tüm servisler sağlıklı!" -ForegroundColor $Green
    } else {
        Write-Host "⚠️ Bazı servisler henüz hazır değil. Birkaç dakika bekleyin." -ForegroundColor $Yellow
    }
}

# Function to start development servers
function Start-DevelopmentServers {
    Write-Host "🚀 Geliştirme sunucuları başlatılıyor..." -ForegroundColor $Yellow
    
    # Start Vite development server in background
    if (Test-Path "frontend") {
        Push-Location "frontend"
        Write-Host "🔥 Vite development server başlatılıyor..." -ForegroundColor $Cyan
        Start-Process -FilePath "npm" -ArgumentList "run", "dev:vite" -WindowStyle Hidden
        Pop-Location
        Write-Host "✅ Vite server başlatıldı" -ForegroundColor $Green
    }
    
    # Start Next.js development server in background
    if (Test-Path "frontend") {
        Push-Location "frontend"
        Write-Host "⚡ Next.js development server başlatılıyor..." -ForegroundColor $Cyan
        Start-Process -FilePath "npm" -ArgumentList "run", "dev:nextjs" -WindowStyle Hidden
        Pop-Location
        Write-Host "✅ Next.js server başlatıldı" -ForegroundColor $Green
    }
    
    Write-Host "✅ Geliştirme sunucuları başlatıldı" -ForegroundColor $Green
}

# Function to run initial tests
function Invoke-InitialTests {
    if ($SkipTests) {
        Write-Host "⏭️ Testler atlandı" -ForegroundColor $Yellow
        return
    }
    
    Write-Host "🧪 İlk testler çalıştırılıyor..." -ForegroundColor $Yellow
    
    # Run unit tests
    if (Test-Path "package.json") {
        Write-Host "📋 Unit testler çalıştırılıyor..." -ForegroundColor $Cyan
        try {
            npm run test 2>$null
        } catch {
            Write-Host "⚠️ Unit testler atlandı" -ForegroundColor $Yellow
        }
    }
    
    # Run linting
    if (Test-Path "package.json") {
        Write-Host "🔍 Linting çalıştırılıyor..." -ForegroundColor $Cyan
        try {
            npm run lint 2>$null
        } catch {
            Write-Host "⚠️ Linting atlandı" -ForegroundColor $Yellow
        }
    }
    
    Write-Host "✅ İlk testler tamamlandı" -ForegroundColor $Green
}

# Function to display project information
function Show-ProjectInfo {
    Write-Host ""
    Write-Host "🎉 Mikro Servis Projesi Başarıyla Başlatıldı!" -ForegroundColor $Green
    Write-Host "==================================================" -ForegroundColor $Green
    Write-Host "📊 Proje Bilgileri:" -ForegroundColor $Blue
    Write-Host "  • Proje Dizini: $ProjectDir" -ForegroundColor $Cyan
    Write-Host "  • Docker Compose: $DockerComposeFile" -ForegroundColor $Cyan
    Write-Host "  • Mikro Servisler: 12 servis" -ForegroundColor $Cyan
    Write-Host "  • Frontend: Vite + Next.js" -ForegroundColor $Cyan
    Write-Host "  • Backend: Node.js + TypeScript" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "🌐 Erişim URL'leri:" -ForegroundColor $Blue
    Write-Host "  • Vite Development: http://localhost:3000" -ForegroundColor $Cyan
    Write-Host "  • Next.js Production: http://localhost:3000" -ForegroundColor $Cyan
    Write-Host "  • Grafana Monitoring: http://localhost:3001" -ForegroundColor $Cyan
    Write-Host "  • Prometheus Metrics: http://localhost:9090" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "🔧 Geliştirme Komutları:" -ForegroundColor $Blue
    Write-Host "  • Test Çalıştır: npm run test" -ForegroundColor $Cyan
    Write-Host "  • Linting: npm run lint" -ForegroundColor $Cyan
    Write-Host "  • Build: npm run build" -ForegroundColor $Cyan
    Write-Host "  • Docker Logs: docker-compose -f $DockerComposeFile logs -f" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "📚 Dokümantasyon:" -ForegroundColor $Blue
    Write-Host "  • Geliştirme Rehberi: MICROSERVICES-DEVELOPMENT-ROADMAP.md" -ForegroundColor $Cyan
    Write-Host "  • Mimari Rehberi: COMPLETE-ARCHITECTURE-GUIDE.md" -ForegroundColor $Cyan
    Write-Host "  • Performans Raporu: MICROSERVICES-INDEX-PERFORMANCE-REPORT.md" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "🚀 Geliştirmeye başlayabilirsiniz!" -ForegroundColor $Green
}

# Function to cleanup on exit
function Invoke-Cleanup {
    Write-Host "🧹 Temizlik yapılıyor..." -ForegroundColor $Yellow
    
    # Stop background processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*vite*" -or $_.MainWindowTitle -like "*next*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Temizlik tamamlandı" -ForegroundColor $Green
}

# Set trap for cleanup on exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Invoke-Cleanup }

# Main execution
function Start-Main {
    Write-Host "🚀 Mikro Servis Projesi Başlatılıyor..." -ForegroundColor $Blue
    Write-Host "==================================================" -ForegroundColor $Blue
    
    # Change to project directory
    Set-Location $ProjectDir
    
    # Run setup steps
    Test-Prerequisites
    Initialize-Environment
    Install-Dependencies
    Start-DockerServices
    Start-DevelopmentServers
    Invoke-InitialTests
    Show-ProjectInfo
    
    Write-Host ""
    Write-Host "🎯 Proje başarıyla başlatıldı!" -ForegroundColor $Green
    Write-Host "Geliştirmeye başlamak için yukarıdaki URL'leri kullanabilirsiniz." -ForegroundColor $Yellow
    Write-Host "Çıkmak için Ctrl+C tuşlarına basın." -ForegroundColor $Yellow
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } catch {
        Invoke-Cleanup
    }
}

# Run main function
Start-Main
