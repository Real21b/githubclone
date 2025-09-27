# 🚀 GitHub Clone - Modern Microservices Platform

[![CI/CD](https://github.com/Real21b/githubclone/actions/workflows/ci.yml/badge.svg)](https://github.com/Real21b/githubclone/actions/workflows/ci.yml)
[![Code Quality](https://sonarcloud.io/api/project_badges/measure?project=githubclone&metric=alert_status)](https://sonarcloud.io/dashboard?id=githubclone)
[![Performance](https://img.shields.io/badge/performance-optimized-green.svg)](https://github.com/yourusername/githubclone)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 **Proje Hakkında**

GitHub Clone, modern mikro servis mimarisi kullanarak geliştirilmiş, yüksek performanslı ve ölçeklenebilir bir geliştirme platformudur. 12 mikro servis, gerçek zamanlı iletişim, AI entegrasyonu ve kapsamlı monitoring sistemi ile donatılmıştır.

## 🏗️ **Mimari**

### **Mikro Servisler**
- **Auth Service** (3001) - Kimlik doğrulama ve yetkilendirme
- **Core Service** (3002) - Ana iş mantığı ve GraphQL API
- **File Service** (3003) - Dosya yönetimi ve depolama
- **Email Service** (3004) - E-posta gönderimi
- **SMS Service** (3005) - SMS gönderimi
- **Notification Service** (3006) - Bildirim yönetimi
- **WordPress Service** (3007) - WordPress entegrasyonu
- **WhatsApp Service** (3008) - WhatsApp entegrasyonu
- **Telegram Service** (3009) - Telegram entegrasyonu
- **AI Service** (3010) - Yapay zeka entegrasyonu
- **Real-time Service** (3011) - Gerçek zamanlı iletişim
- **Integration Service** (3012) - Entegrasyon yönetimi

### **Frontend**
- **Vite + React** - Hızlı geliştirme ortamı
- **Next.js + React** - Production build
- **Material-UI** - UI component library
- **Apollo Client** - GraphQL client
- **Socket.IO** - Real-time communication

### **Backend**
- **NestJS** - Mikro servis framework
- **TypeScript** - Type safety
- **PostgreSQL** - Ana veritabanı
- **Redis** - Cache ve session yönetimi
- **Kafka** - Event-driven architecture

### **DevOps & Monitoring**
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **GitHub Actions** - CI/CD
- **SonarQube** - Code quality
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards
- **k6** - Performance testing

## 🚀 **Hızlı Başlangıç**

### **Gereksinimler**
- Node.js 18+
- Docker & Docker Compose
- Git

### **Kurulum**

#### **1. Projeyi Klonlayın**
```bash
git clone https://github.com/Real21b/githubclone.git
cd githubclone
```

#### **2. Hızlı Başlangıç (Otomatik)**
```bash
# Windows PowerShell
./scripts/quick-start-development.ps1

# Linux/Mac
./scripts/quick-start-development.sh
```

#### **3. Manuel Kurulum**
```bash
# Bağımlılıkları yükleyin
npm install

# Docker servislerini başlatın
docker-compose -f docker-compose.unified.yml up -d

# Geliştirme sunucularını başlatın
npm run dev:vite
```

### **Erişim URL'leri**
- **Frontend**: http://localhost:3000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **SonarQube**: http://localhost:9000

## 🛠️ **Geliştirme**

### **Geliştirme Komutları**
```bash
# Vite development server
npm run dev:vite

# Next.js development server
npm run dev:nextjs

# Test çalıştır
npm run test

# Linting
npm run lint

# Build
npm run build:prod
```

### **Mikro Servis Geliştirme**
```bash
# Belirli bir servisi başlat
cd services/auth-service
npm run start:dev

# Tüm servisleri test et
./scripts/test-microservices-vite-integration.ps1
```

### **Performance Testing**
```bash
# Mikro servis performans testleri
./scripts/run-microservices-performance-tests.ps1

# Vite vs Next.js karşılaştırma
./scripts/run-microservices-performance-tests.ps1 -TestType comparison
```

## 📊 **Performans**

### **Hedef Metrikler**
- **Yanıt Süresi**: < 2 saniye (%95 istek)
- **Hata Oranı**: < %1
- **Uptime**: > %99.9
- **Throughput**: > 1000 requests/second

### **Optimizasyon**
- **Frontend**: Code splitting, lazy loading, caching
- **Backend**: Connection pooling, query optimization
- **Database**: Indexing, partitioning
- **Caching**: Redis, CDN
- **Load Balancing**: Nginx, horizontal scaling

## 🔧 **Konfigürasyon**

### **Environment Variables**
```bash
# .env dosyasını oluşturun
cp .env.example .env

# Gerekli değişkenleri düzenleyin
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/githubclone
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### **Docker Compose**
```bash
# Development
docker-compose -f docker-compose.development.yml up -d

# Production
docker-compose -f docker-compose.production.yml up -d

# Unified (Tüm servisler)
docker-compose -f docker-compose.unified.yml up -d
```

## 📚 **Dokümantasyon**

- **[Geliştirme Rehberi](MICROSERVICES-DEVELOPMENT-ROADMAP.md)** - Detaylı geliştirme yol haritası
- **[Komutlar Rehberi](DEVELOPMENT-COMMANDS-GUIDE.md)** - Tüm geliştirme komutları
- **[Proje Yapısı](PROJECT-STRUCTURE-GUIDE.md)** - Dosya organizasyonu
- **[Performans Raporu](MICROSERVICES-INDEX-PERFORMANCE-REPORT.md)** - Performans analizi
- **[Mimari Rehberi](COMPLETE-ARCHITECTURE-GUIDE.md)** - Sistem mimarisi

## 🧪 **Testing**

### **Test Türleri**
- **Unit Tests** - Bireysel component testleri
- **Integration Tests** - Servis entegrasyon testleri
- **E2E Tests** - End-to-end testler
- **Performance Tests** - Performans testleri

### **Test Çalıştırma**
```bash
# Tüm testler
npm run test

# Coverage raporu
npm run test:coverage

# E2E testler
npm run test:e2e

# Performance testler
./scripts/run-microservices-performance-tests.ps1
```

## 🚀 **Deployment**

### **Development**
```bash
./scripts/deploy-development.sh
```

### **Production**
```bash
./scripts/deploy-production.sh
```

### **Staging**
```bash
./scripts/deploy-staging.sh
```

## 📈 **Monitoring**

### **Metrics**
- **Application Metrics** - Prometheus
- **Infrastructure Metrics** - Grafana
- **Logs** - Centralized logging
- **Alerts** - Automated alerting

### **Dashboards**
- **Microservices Dashboard** - Servis sağlığı
- **Performance Dashboard** - Performans metrikleri
- **Infrastructure Dashboard** - Sistem kaynakları

## 🤝 **Katkıda Bulunma**

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### **Geliştirme Standartları**
- TypeScript kullanın
- ESLint kurallarına uyun
- Test yazın
- Dokümantasyon güncelleyin

## 📄 **Lisans**

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👥 **Takım**

- **Lead Developer** - [Real21b](https://github.com/Real21b)
- **DevOps Engineer** - [Real21b](https://github.com/Real21b)
- **Frontend Developer** - [Real21b](https://github.com/Real21b)

## 📞 **İletişim**

- **Email**: your.email@example.com
- **GitHub**: [@Real21b](https://github.com/Real21b)
- **LinkedIn**: [Your Profile](https://linkedin.com/in/yourprofile)

## 🙏 **Teşekkürler**

- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Material-UI](https://mui.com/) - UI components
- [Docker](https://www.docker.com/) - Containerization
- [Prometheus](https://prometheus.io/) - Monitoring

---

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**