# 🛠️ Geliştirme Komutları Rehberi

## 📋 **Hızlı Başlangıç Komutları**

### **🚀 Proje Başlatma**
```bash
# Hızlı başlangıç (Bash)
./scripts/quick-start-development.sh

# Hızlı başlangıç (PowerShell)
./scripts/quick-start-development.ps1

# Manuel başlangıç
docker-compose -f docker-compose.unified.yml up -d
npm run dev:vite
```

### **🔧 Geliştirme Ortamı**
```bash
# Vite development server
npm run dev:vite

# Next.js development server
npm run dev:nextjs

# Her iki sunucuyu aynı anda
npm run dev:all

# Docker servisleri
docker-compose -f docker-compose.unified.yml up -d
docker-compose -f docker-compose.unified.yml down
```

## 🧪 **Test Komutları**

### **Unit Tests**
```bash
# Tüm testler
npm run test

# Watch mode
npm run test:watch

# Coverage raporu
npm run test:coverage

# Specific test file
npm run test -- --testNamePattern="UserService"
```

### **Integration Tests**
```bash
# Mikro servis entegrasyon testleri
./scripts/test-microservices-vite-integration.ps1

# Unified index testleri
./scripts/test-unified-index.ps1

# Tüm entegrasyon testleri
./scripts/test-all-integrations.js
```

### **Performance Tests**
```bash
# Mikro servis performans testleri
./scripts/run-microservices-performance-tests.ps1

# Vite vs Next.js karşılaştırma
./scripts/run-microservices-performance-tests.ps1 -TestType comparison

# Hızlı performans testi
./scripts/run-microservices-performance-tests.ps1 -QuickTest
```

### **E2E Tests**
```bash
# End-to-end testler
npm run test:e2e

# E2E testler (headless)
npm run test:e2e:headless

# E2E testler (specific browser)
npm run test:e2e:chrome
npm run test:e2e:firefox
```

## 🔍 **Code Quality Komutları**

### **Linting**
```bash
# ESLint
npm run lint

# ESLint (fix)
npm run lint:fix

# TypeScript check
npm run type-check

# Prettier format
npm run format

# Prettier check
npm run format:check
```

### **Code Analysis**
```bash
# SonarQube analizi
docker run --rm -v $(pwd):/usr/src sonarqube:lts-community sonar-scanner

# Dependency audit
npm audit

# Dependency audit (fix)
npm audit fix

# Outdated packages
npm outdated
```

## 🏗️ **Build Komutları**

### **Frontend Build**
```bash
# Vite build
npm run build:vite

# Next.js build
npm run build:nextjs

# Production build
npm run build:prod

# Development build
npm run build:dev

# Build analysis
npm run build:analyze
```

### **Backend Build**
```bash
# Tüm servisleri build et
npm run build:services

# Specific service build
npm run build:service -- --service=auth-service

# Docker build
docker-compose -f docker-compose.unified.yml build

# Docker build (no cache)
docker-compose -f docker-compose.unified.yml build --no-cache
```

## 🚀 **Deployment Komutları**

### **Development Deployment**
```bash
# Development ortamına deploy
./scripts/deploy-development.sh

# Development servisleri başlat
docker-compose -f docker-compose.development.yml up -d
```

### **Production Deployment**
```bash
# Production ortamına deploy
./scripts/deploy-production.sh

# Production servisleri başlat
docker-compose -f docker-compose.production.yml up -d

# Unified deployment
./scripts/deploy-unified.sh
```

### **Staging Deployment**
```bash
# Staging ortamına deploy
./scripts/deploy-staging.sh

# Staging servisleri başlat
docker-compose -f docker-compose.staging.yml up -d
```

## 📊 **Monitoring Komutları**

### **Service Health**
```bash
# Servis sağlık kontrolü
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Core Service
curl http://localhost:3003/health  # File Service
curl http://localhost:3004/health  # Email Service
curl http://localhost:3005/health  # SMS Service
curl http://localhost:3006/health  # Notification Service
curl http://localhost:3007/health  # WordPress Service
curl http://localhost:3008/health  # WhatsApp Service
curl http://localhost:3009/health  # Telegram Service
curl http://localhost:3010/health  # AI Service
curl http://localhost:3011/health  # Real-time Service
curl http://localhost:3012/health  # Integration Service
```

### **Monitoring Tools**
```bash
# Grafana
open http://localhost:3001

# Prometheus
open http://localhost:9090

# Docker stats
docker stats

# Container logs
docker-compose -f docker-compose.unified.yml logs -f

# Specific service logs
docker-compose -f docker-compose.unified.yml logs -f auth-service
```

### **Performance Monitoring**
```bash
# Resource monitoring
./scripts/monitor-resources.sh

# Performance analysis
./scripts/run-performance-analysis.ps1

# Load testing
./scripts/run-performance-tests.ps1
```

## 🔧 **Database Komutları**

### **PostgreSQL**
```bash
# Database bağlantısı
psql -h localhost -p 5432 -U githubclone_user -d githubclone

# Migration çalıştır
npm run migration:run

# Migration geri al
npm run migration:revert

# Database seed
npm run seed

# Database reset
npm run db:reset
```

### **Redis**
```bash
# Redis CLI
redis-cli -h localhost -p 6379

# Redis monitor
redis-cli -h localhost -p 6379 monitor

# Redis info
redis-cli -h localhost -p 6379 info
```

## 🐳 **Docker Komutları**

### **Container Management**
```bash
# Tüm containerları listele
docker ps -a

# Container durdur
docker stop <container_name>

# Container başlat
docker start <container_name>

# Container yeniden başlat
docker restart <container_name>

# Container sil
docker rm <container_name>

# Container logs
docker logs <container_name>

# Container içine gir
docker exec -it <container_name> /bin/bash
```

### **Image Management**
```bash
# Tüm imageleri listele
docker images

# Image sil
docker rmi <image_name>

# Image build
docker build -t <image_name> .

# Image push
docker push <image_name>

# Image pull
docker pull <image_name>
```

### **Volume Management**
```bash
# Tüm volumeleri listele
docker volume ls

# Volume sil
docker volume rm <volume_name>

# Volume detayları
docker volume inspect <volume_name>
```

### **Network Management**
```bash
# Tüm networkleri listele
docker network ls

# Network detayları
docker network inspect <network_name>

# Network sil
docker network rm <network_name>
```

## 🔄 **Git Komutları**

### **Branch Management**
```bash
# Yeni branch oluştur
git checkout -b feature/new-feature

# Branch değiştir
git checkout <branch_name>

# Branch listele
git branch -a

# Branch sil
git branch -d <branch_name>

# Remote branch sil
git push origin --delete <branch_name>
```

### **Commit Management**
```bash
# Değişiklikleri ekle
git add .

# Commit oluştur
git commit -m "feat: add new feature"

# Son commit'i düzenle
git commit --amend

# Commit geçmişi
git log --oneline

# Commit detayları
git show <commit_hash>
```

### **Remote Management**
```bash
# Remote repository ekle
git remote add origin <repository_url>

# Remote repository listele
git remote -v

# Remote repository güncelle
git remote update

# Remote repository sil
git remote remove <remote_name>
```

## 📦 **Package Management**

### **npm Komutları**
```bash
# Package yükle
npm install <package_name>

# Package yükle (dev dependency)
npm install -D <package_name>

# Package yükle (global)
npm install -g <package_name>

# Package güncelle
npm update <package_name>

# Package sil
npm uninstall <package_name>

# Package listele
npm list

# Package outdated
npm outdated
```

### **yarn Komutları**
```bash
# Package yükle
yarn add <package_name>

# Package yükle (dev dependency)
yarn add -D <package_name>

# Package güncelle
yarn upgrade <package_name>

# Package sil
yarn remove <package_name>

# Package listele
yarn list

# Package outdated
yarn outdated
```

## 🚨 **Troubleshooting Komutları**

### **Log Analysis**
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Access logs
tail -f logs/access.log

# Docker logs
docker-compose -f docker-compose.unified.yml logs -f

# System logs
journalctl -f
```

### **Process Management**
```bash
# Process listele
ps aux | grep node

# Process durdur
kill <pid>

# Process zorla durdur
kill -9 <pid>

# Port kullanımı
netstat -tulpn | grep :3000

# Port kullanan process
lsof -i :3000
```

### **System Resources**
```bash
# CPU kullanımı
top

# Memory kullanımı
free -h

# Disk kullanımı
df -h

# Network kullanımı
iftop

# System info
uname -a
```

## 🎯 **Development Workflow**

### **Daily Workflow**
```bash
# 1. Proje başlat
./scripts/quick-start-development.sh

# 2. Feature geliştir
git checkout -b feature/new-feature
# ... geliştirme yap ...

# 3. Test çalıştır
npm run test
npm run lint

# 4. Commit oluştur
git add .
git commit -m "feat: add new feature"

# 5. Push et
git push origin feature/new-feature
```

### **Weekly Workflow**
```bash
# 1. Haftalık test
npm run test:coverage
./scripts/run-microservices-performance-tests.ps1

# 2. Dependency güncelle
npm update
npm audit fix

# 3. Build test
npm run build:prod

# 4. Deployment test
./scripts/deploy-staging.sh
```

### **Release Workflow**
```bash
# 1. Release branch oluştur
git checkout -b release/v1.0.0

# 2. Version güncelle
npm version patch

# 3. Build ve test
npm run build:prod
npm run test:e2e

# 4. Deploy
./scripts/deploy-production.sh

# 5. Tag oluştur
git tag v1.0.0
git push origin v1.0.0
```

## 📚 **Useful Aliases**

### **Bash Aliases**
```bash
# .bashrc veya .zshrc dosyasına ekle
alias dev="npm run dev:vite"
alias build="npm run build:prod"
alias test="npm run test"
alias lint="npm run lint"
alias docker-up="docker-compose -f docker-compose.unified.yml up -d"
alias docker-down="docker-compose -f docker-compose.unified.yml down"
alias docker-logs="docker-compose -f docker-compose.unified.yml logs -f"
alias quick-start="./scripts/quick-start-development.sh"
```

### **PowerShell Aliases**
```powershell
# PowerShell profile dosyasına ekle
Set-Alias dev "npm run dev:vite"
Set-Alias build "npm run build:prod"
Set-Alias test "npm run test"
Set-Alias lint "npm run lint"
Set-Alias docker-up "docker-compose -f docker-compose.unified.yml up -d"
Set-Alias docker-down "docker-compose -f docker-compose.unified.yml down"
Set-Alias docker-logs "docker-compose -f docker-compose.unified.yml logs -f"
Set-Alias quick-start "./scripts/quick-start-development.ps1"
```

## 🎉 **Sonuç**

Bu rehber, mikro servis projesi geliştirme sürecinde ihtiyaç duyacağınız tüm komutları kapsamlı bir şekilde sunar. Her komut, projenin farklı aşamalarında kullanılabilir ve geliştirme sürecini hızlandırır.

### **✅ Avantajlar:**
- **Hızlı Erişim**: Tüm komutlar tek yerde
- **Kategorize**: Komutlar kategorilere ayrılmış
- **Açıklamalı**: Her komut açıklanmış
- **Workflow**: Günlük, haftalık ve release workflow'ları
- **Troubleshooting**: Sorun giderme komutları
- **Aliases**: Hızlı erişim için alias'lar

---

**🚀 Bu rehberi kullanarak mikro servis projenizi verimli bir şekilde geliştirebilirsiniz!**
