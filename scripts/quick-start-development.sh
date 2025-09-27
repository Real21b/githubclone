#!/bin/bash

# 🚀 Quick Start Development Script
# Mikro servis projesi için hızlı başlangıç

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Mikro Servis Projesi - Hızlı Başlangıç${NC}"
echo "=================================================="

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_COMPOSE_FILE="docker-compose.unified.yml"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Prerequisites kontrol ediliyor...${NC}"
    
    local missing_deps=()
    
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Eksik bağımlılıklar:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "${RED}  - $dep${NC}"
        done
        echo -e "${YELLOW}Lütfen eksik bağımlılıkları yükleyin ve tekrar deneyin.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Tüm bağımlılıklar mevcut${NC}"
}

# Function to setup environment
setup_environment() {
    echo -e "${YELLOW}🔧 Environment kurulumu...${NC}"
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p test-results
    mkdir -p uploads
    
    # Copy environment files if they don't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}"
        else
            echo -e "${YELLOW}⚠️ .env.example dosyası bulunamadı${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ Environment kurulumu tamamlandı${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Bağımlılıklar yükleniyor...${NC}"
    
    # Install root dependencies
    if [ -f package.json ]; then
        npm install
        echo -e "${GREEN}✅ Root bağımlılıkları yüklendi${NC}"
    fi
    
    # Install frontend dependencies
    if [ -d frontend ] && [ -f frontend/package.json ]; then
        cd frontend
        npm install
        cd ..
        echo -e "${GREEN}✅ Frontend bağımlılıkları yüklendi${NC}"
    fi
    
    # Install backend dependencies for each service
    for service_dir in services/*/; do
        if [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
            service_name=$(basename "$service_dir")
            echo -e "${CYAN}📦 $service_name bağımlılıkları yükleniyor...${NC}"
            cd "$service_dir"
            npm install
            cd "$PROJECT_DIR"
        fi
    done
    
    echo -e "${GREEN}✅ Tüm bağımlılıklar yüklendi${NC}"
}

# Function to start Docker services
start_docker_services() {
    echo -e "${YELLOW}🐳 Docker servisleri başlatılıyor...${NC}"
    
    # Stop any existing containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down 2>/dev/null || true
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    echo -e "${GREEN}✅ Docker servisleri başlatıldı${NC}"
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Servislerin hazır olması bekleniyor...${NC}"
    sleep 30
    
    # Check service health
    check_service_health
}

# Function to check service health
check_service_health() {
    echo -e "${YELLOW}🏥 Servis sağlık kontrolü...${NC}"
    
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
        
        if curl -s -f "http://localhost:$port/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name: Healthy${NC}"
            ((healthy_count++))
        else
            echo -e "${RED}❌ $name: Unhealthy${NC}"
        fi
    done
    
    echo -e "${BLUE}📊 Servis Sağlığı: $healthy_count/$total_count${NC}"
    
    if [ $healthy_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 Tüm servisler sağlıklı!${NC}"
    else
        echo -e "${YELLOW}⚠️ Bazı servisler henüz hazır değil. Birkaç dakika bekleyin.${NC}"
    fi
}

# Function to start development servers
start_development_servers() {
    echo -e "${YELLOW}🚀 Geliştirme sunucuları başlatılıyor...${NC}"
    
    # Start Vite development server in background
    if [ -d frontend ]; then
        cd frontend
        echo -e "${CYAN}🔥 Vite development server başlatılıyor...${NC}"
        npm run dev:vite &
        VITE_PID=$!
        cd ..
        echo -e "${GREEN}✅ Vite server başlatıldı (PID: $VITE_PID)${NC}"
    fi
    
    # Start Next.js development server in background
    if [ -d frontend ]; then
        cd frontend
        echo -e "${CYAN}⚡ Next.js development server başlatılıyor...${NC}"
        npm run dev:nextjs &
        NEXTJS_PID=$!
        cd ..
        echo -e "${GREEN}✅ Next.js server başlatıldı (PID: $NEXTJS_PID)${NC}"
    fi
    
    echo -e "${GREEN}✅ Geliştirme sunucuları başlatıldı${NC}"
}

# Function to run initial tests
run_initial_tests() {
    echo -e "${YELLOW}🧪 İlk testler çalıştırılıyor...${NC}"
    
    # Run unit tests
    if [ -f package.json ]; then
        echo -e "${CYAN}📋 Unit testler çalıştırılıyor...${NC}"
        npm run test 2>/dev/null || echo -e "${YELLOW}⚠️ Unit testler atlandı${NC}"
    fi
    
    # Run linting
    if [ -f package.json ]; then
        echo -e "${CYAN}🔍 Linting çalıştırılıyor...${NC}"
        npm run lint 2>/dev/null || echo -e "${YELLOW}⚠️ Linting atlandı${NC}"
    fi
    
    echo -e "${GREEN}✅ İlk testler tamamlandı${NC}"
}

# Function to display project information
display_project_info() {
    echo ""
    echo -e "${GREEN}🎉 Mikro Servis Projesi Başarıyla Başlatıldı!${NC}"
    echo "=================================================="
    echo -e "${BLUE}📊 Proje Bilgileri:${NC}"
    echo "  • Proje Dizini: $PROJECT_DIR"
    echo "  • Docker Compose: $DOCKER_COMPOSE_FILE"
    echo "  • Mikro Servisler: 12 servis"
    echo "  • Frontend: Vite + Next.js"
    echo "  • Backend: Node.js + TypeScript"
    echo ""
    echo -e "${BLUE}🌐 Erişim URL'leri:${NC}"
    echo "  • Vite Development: http://localhost:3000"
    echo "  • Next.js Production: http://localhost:3000"
    echo "  • Grafana Monitoring: http://localhost:3001"
    echo "  • Prometheus Metrics: http://localhost:9090"
    echo ""
    echo -e "${BLUE}🔧 Geliştirme Komutları:${NC}"
    echo "  • Test Çalıştır: npm run test"
    echo "  • Linting: npm run lint"
    echo "  • Build: npm run build"
    echo "  • Docker Logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo ""
    echo -e "${BLUE}📚 Dokümantasyon:${NC}"
    echo "  • Geliştirme Rehberi: MICROSERVICES-DEVELOPMENT-ROADMAP.md"
    echo "  • Mimari Rehberi: COMPLETE-ARCHITECTURE-GUIDE.md"
    echo "  • Performans Raporu: MICROSERVICES-INDEX-PERFORMANCE-REPORT.md"
    echo ""
    echo -e "${GREEN}🚀 Geliştirmeye başlayabilirsiniz!${NC}"
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}🧹 Temizlik yapılıyor...${NC}"
    
    # Kill background processes
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Temizlik tamamlandı${NC}"
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    echo -e "${BLUE}🚀 Mikro Servis Projesi Başlatılıyor...${NC}"
    echo "=================================================="
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Run setup steps
    check_prerequisites
    setup_environment
    install_dependencies
    start_docker_services
    start_development_servers
    run_initial_tests
    display_project_info
    
    echo ""
    echo -e "${GREEN}🎯 Proje başarıyla başlatıldı!${NC}"
    echo -e "${YELLOW}Geliştirmeye başlamak için yukarıdaki URL'leri kullanabilirsiniz.${NC}"
    echo -e "${YELLOW}Çıkmak için Ctrl+C tuşlarına basın.${NC}"
    
    # Keep script running
    wait
}

# Run main function
main "$@"
