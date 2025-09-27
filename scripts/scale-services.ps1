# Scaling Script for GitHub Clone Services (PowerShell)
# Usage: .\scale-services.ps1 [ultra-light|lightweight|scalable|full] [user-count]

param(
    [string]$Config = "ultra-light",
    [int]$UserCount = 10
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

Write-Host "🚀 GitHub Clone Service Scaling" -ForegroundColor $Blue
Write-Host "Configuration: $Config" -ForegroundColor $Blue
Write-Host "Target Users: $UserCount" -ForegroundColor $Blue
Write-Host ""

# Function to stop all services
function Stop-AllServices {
    Write-Host "🛑 Stopping all services..." -ForegroundColor $Yellow
    try {
        docker-compose -f docker-compose.ultra-light.yml down 2>$null
        docker-compose -f docker-compose.lightweight.yml down 2>$null
        docker-compose -f docker-compose.scalable.yml down 2>$null
        docker-compose -f docker-compose.kafka.yml down 2>$null
        Write-Host "✅ All services stopped" -ForegroundColor $Green
    }
    catch {
        Write-Host "⚠️ Some services may not have been running" -ForegroundColor $Yellow
    }
}

# Function to start ultra-light configuration
function Start-UltraLight {
    Write-Host "🚀 Starting Ultra-Light configuration (10 users)..." -ForegroundColor $Green
    docker-compose -f docker-compose.ultra-light.yml up -d
    Write-Host "✅ Ultra-Light services started" -ForegroundColor $Green
}

# Function to start lightweight configuration
function Start-Lightweight {
    Write-Host "🚀 Starting Lightweight configuration (50 users)..." -ForegroundColor $Green
    docker-compose -f docker-compose.lightweight.yml up -d
    Write-Host "✅ Lightweight services started" -ForegroundColor $Green
}

# Function to start scalable configuration
function Start-Scalable {
    Write-Host "🚀 Starting Scalable configuration (100+ users)..." -ForegroundColor $Green
    docker-compose -f docker-compose.scalable.yml up -d
    Write-Host "✅ Scalable services started" -ForegroundColor $Green
}

# Function to start full configuration
function Start-Full {
    Write-Host "🚀 Starting Full configuration (1000+ users)..." -ForegroundColor $Green
    docker-compose -f docker-compose.kafka.yml up -d
    Write-Host "✅ Full services started" -ForegroundColor $Green
}

# Function to scale specific services
function Scale-Services {
    param([int]$UserCount)
    
    $AuthReplicas = 1
    $CoreReplicas = 1
    $FileReplicas = 1
    $FrontendReplicas = 1

    # Calculate replicas based on user count
    if ($UserCount -gt 100) {
        $AuthReplicas = 3
        $CoreReplicas = 3
        $FileReplicas = 2
        $FrontendReplicas = 2
    }
    elseif ($UserCount -gt 50) {
        $AuthReplicas = 2
        $CoreReplicas = 2
        $FileReplicas = 2
        $FrontendReplicas = 1
    }
    elseif ($UserCount -gt 20) {
        $AuthReplicas = 2
        $CoreReplicas = 2
        $FileReplicas = 1
        $FrontendReplicas = 1
    }

    Write-Host "📈 Scaling services for $UserCount users..." -ForegroundColor $Yellow
    Write-Host "Auth Service: $AuthReplicas replicas" -ForegroundColor $Blue
    Write-Host "Core Service: $CoreReplicas replicas" -ForegroundColor $Blue
    Write-Host "File Service: $FileReplicas replicas" -ForegroundColor $Blue
    Write-Host "Frontend: $FrontendReplicas replicas" -ForegroundColor $Blue

    # Scale services
    docker-compose -f docker-compose.scalable.yml up -d --scale auth-service=$AuthReplicas
    docker-compose -f docker-compose.scalable.yml up -d --scale core-service=$CoreReplicas
    docker-compose -f docker-compose.scalable.yml up -d --scale file-service=$FileReplicas
    docker-compose -f docker-compose.scalable.yml up -d --scale frontend=$FrontendReplicas

    Write-Host "✅ Services scaled successfully" -ForegroundColor $Green
}

# Function to show service status
function Show-Status {
    Write-Host "📊 Service Status:" -ForegroundColor $Blue
    docker-compose ps
    Write-Host ""
    Write-Host "📈 Resource Usage:" -ForegroundColor $Blue
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Function to show configuration info
function Show-ConfigInfo {
    Write-Host "📋 Configuration Information:" -ForegroundColor $Blue
    Write-Host ""
    
    switch ($Config) {
        "ultra-light" {
            Write-Host "Ultra-Light Configuration:" -ForegroundColor $Green
            Write-Host "  • RAM: ~400MB"
            Write-Host "  • CPU: ~1.0 cores"
            Write-Host "  • Users: 10-20"
            Write-Host "  • Services: Core only (no Kafka, no AI)"
        }
        "lightweight" {
            Write-Host "Lightweight Configuration:" -ForegroundColor $Green
            Write-Host "  • RAM: ~1.0GB"
            Write-Host "  • CPU: ~2.0 cores"
            Write-Host "  • Users: 50-100"
            Write-Host "  • Services: Core + Kafka + Basic integrations"
        }
        "scalable" {
            Write-Host "Scalable Configuration:" -ForegroundColor $Green
            Write-Host "  • RAM: ~2.0GB"
            Write-Host "  • CPU: ~3.0 cores"
            Write-Host "  • Users: 100-500"
            Write-Host "  • Services: All services with load balancing"
        }
        "full" {
            Write-Host "Full Configuration:" -ForegroundColor $Green
            Write-Host "  • RAM: ~3.5GB"
            Write-Host "  • CPU: ~4.5 cores"
            Write-Host "  • Users: 1000+"
            Write-Host "  • Services: All services with AI and advanced features"
        }
    }
    Write-Host ""
}

# Main execution
function Main {
    Show-ConfigInfo
    
    # Stop all services first
    Stop-AllServices
    
    # Start services based on configuration
    switch ($Config) {
        "ultra-light" {
            Start-UltraLight
        }
        "lightweight" {
            Start-Lightweight
        }
        "scalable" {
            Start-Scalable
            Scale-Services $UserCount
        }
        "full" {
            Start-Full
        }
        default {
            Write-Host "❌ Invalid configuration: $Config" -ForegroundColor $Red
            Write-Host "Available configurations: ultra-light, lightweight, scalable, full" -ForegroundColor $Yellow
            exit 1
        }
    }
    
    # Wait for services to start
    Write-Host "⏳ Waiting for services to start..." -ForegroundColor $Yellow
    Start-Sleep -Seconds 10
    
    # Show status
    Show-Status
    
    Write-Host ""
    Write-Host "🎉 Services started successfully!" -ForegroundColor $Green
    Write-Host "Access your application at: http://localhost" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "📚 Available commands:" -ForegroundColor $Yellow
    Write-Host "  • View logs: docker-compose logs -f"
    Write-Host "  • Scale services: .\scale-services.ps1 scalable 200"
    Write-Host "  • Stop services: docker-compose down"
    Write-Host "  • View status: docker-compose ps"
}

# Run main function
Main
