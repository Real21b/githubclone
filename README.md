# 🚀 GitHub Clone - Modern Microservices Platform

[![CI/CD](https://github.com/Real21b/githubclone/actions/workflows/ci.yml/badge.svg)](https://github.com/Real21b/githubclone/actions/workflows/ci.yml)
[![Code Quality](https://sonarcloud.io/api/project_badges/measure?project=githubclone&metric=alert_status)](https://sonarcloud.io/dashboard?id=githubclone)
[![Performance](https://img.shields.io/badge/performance-optimized-green.svg)](https://github.com/yourusername/githubclone)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 **Proje Hakkında**

GitHub Clone, modern mikro servis mimarisi kullanarak geliştirilmiş, ölçeklenebilir bir geliştirme platformu olmayı hedefler.

> ### 📘 **Önce bunu okuyun: [GELISTIRME-REHBERI.md](GELISTIRME-REHBERI.md)**
>
> Kod tabanının kanıta dayalı denetimi ve 15 fazlık geliştirme yol haritası orada.
>
> **Faz 1 tamamlandı** ✅ — monorepo temeli kuruldu, frontend ve API artık **gerçekten
> derleniyor**, CI gerçekten kırılabiliyor.
>
> **Kalan kritik boşluklar:** Git fonksiyonalitesi hâlâ yok (Faz 4) ·
> `services/core-service/` henüz `apps/api`'ye taşınmadı (Faz 5) · auth kalıcı değil (Faz 3) ·
> ürün testleri yok (Faz 11).

## 🏗️ **Mimari**

### **Mikro Servisler** *(eski yapı — ADR-003 ile modüllere taşınıyor)*
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

### **Frontend** (`apps/web`)
- **Next.js 16** (App Router) — tek framework; Vite kaldırıldı ([ADR-001](docs/adr/0001-frontend-framework.md))
- **React 19** — Server Components
- **Material-UI 7** — Faz 6'da Tailwind 4 + shadcn/ui'ye geçilecek
- **Apollo Client** — Faz 5'te tRPC ile değiştirilecek
- **Socket.IO** — gerçek zamanlı iletişim

### **Backend** (`apps/api`)
- **NestJS 11** — modüler monolit ([ADR-002](docs/adr/0002-backend-baseline.md), [ADR-003](docs/adr/0003-modular-monolith.md))
- **TypeScript 5.9** — `strict`, `noUncheckedIndexedAccess`
- **PostgreSQL 18** — ana veritabanı
- **Redis 8** — önbellek ve oturum
- **BullMQ** — kuyruk (Kafka yerine; gerekçe ADR-003'te)

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
- **Node.js 24 LTS** (`.nvmrc` mevcut → `nvm use`)
- **pnpm 10+** (`corepack enable`)
- Docker & Docker Compose
- Git

### **Kurulum**

#### **1. Projeyi Klonlayın**
```bash
git clone https://github.com/Real21b/githubclone.git
cd githubclone
```

#### **2. Kurulum**
```bash
corepack enable          # pnpm'i etkinleştir
pnpm install             # tüm workspace bağımlılıkları
cp .env.example .env     # sırları düzenleyin
```

#### **3. Çalıştırma**
```bash
docker compose -f infra/compose.yml up -d          # postgres, redis, minio
pnpm dev                                            # web + api (turbo)

# Gözlemlenebilirlik de istiyorsanız:
docker compose -f infra/compose.yml --profile monitoring up -d
```

### **Erişim URL'leri**

| Servis | Port |
|---|---|
| Frontend (web) | 3000 |
| API | 4000 |
| git-server | 4001 |
| realtime | 4002 |
| Postgres | 5432 |
| Redis | 6379 |
| Prometheus | 9090 |
| Grafana | 3100 |
| SonarQube | 9000 |

## 🛠️ **Geliştirme**

### **Geliştirme Komutları**

Tümü **depo kökünden** çalıştırılır (Turborepo görev grafiğini yönetir):

```bash
pnpm dev                  # tüm uygulamalar
pnpm --filter @app/web dev
pnpm --filter @app/api dev

pnpm lint                 # Biome (lint + format)
pnpm lint:fix
pnpm typecheck            # tüm paketler
pnpm test
pnpm build
```

### **Proje yapısı**

```
apps/
  web/       Next.js 16 (App Router)
  api/       NestJS 11
packages/
  config/    Zod ile ortam doğrulaması (@app/config)
services/    eski mikroservisler — ADR-003 ile taşınıyor
infra/       compose.yml + compose.prod.yml
docs/adr/    mimari karar kayıtları
docs/archive/ eski raporlar
```

### **Mikro Servis Geliştirme** *(eski yapı)*

`services/*` henüz pnpm workspace'ine dahil değildir ([ADR-003](docs/adr/0003-modular-monolith.md)).
Taşınana kadar kendi dizinlerinde `npm install` ile çalıştırılırlar.

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
cp .env.example .env
```

Şema ve doğrulama: [`packages/config/src/env.ts`](packages/config/src/env.ts).
**Fallback sır yoktur** — `JWT_SECRET` eksik veya 32 karakterden kısaysa uygulama açılmaz:

```bash
openssl rand -base64 48   # her sır için ayrı üretin
```

### **Docker Compose**
14 ayrı compose dosyası **2**'ye indirildi; varyant yerine profil kullanılır.

```bash
# Geliştirme
docker compose -f infra/compose.yml up -d

# Geliştirme + monitoring
docker compose -f infra/compose.yml --profile monitoring up -d

# Üretim (overlay)
docker compose -f infra/compose.yml -f infra/compose.prod.yml up -d
```

## 📚 **Dokümantasyon**

### **Ana doküman**

- **[📘 GELISTIRME-REHBERI.md](GELISTIRME-REHBERI.md)** — **Tek yetkili geliştirme rehberi.**
  Kanıta dayalı kod denetimi, hedef mimari, güncel teknoloji seçimleri (Ağustos 2026) ve
  kabul kriterleriyle 15 fazlık yol haritası.

### **Geçmiş dokümanlar**

Aşağıdaki dosyalar projenin erken dönemine aittir. Bir kısmı henüz yazılmamış kodun
performans/doğrulama raporlarıdır ve **doğrulanamaz**; Faz 1'de `docs/archive/`
altına taşındılar ve **bakım görmezler**.

<details>
<summary>Listeyi göster</summary>

- [MICROSERVICES-DEVELOPMENT-ROADMAP.md](docs/archive/MICROSERVICES-DEVELOPMENT-ROADMAP.md)
- [DEVELOPMENT-COMMANDS-GUIDE.md](docs/archive/DEVELOPMENT-COMMANDS-GUIDE.md)
- [PROJECT-STRUCTURE-GUIDE.md](docs/archive/PROJECT-STRUCTURE-GUIDE.md)
- [COMPLETE-ARCHITECTURE-GUIDE.md](docs/archive/COMPLETE-ARCHITECTURE-GUIDE.md)
- [PRODUCTION-DEPLOYMENT-GUIDE.md](docs/archive/PRODUCTION-DEPLOYMENT-GUIDE.md)
- [PORT-MAPPING-GUIDE.md](docs/archive/PORT-MAPPING-GUIDE.md) / [PORT-CONFLICT-RESOLUTION.md](docs/archive/PORT-CONFLICT-RESOLUTION.md)
- Performans ve doğrulama raporları (`*-REPORT.md`, `*-ANALYSIS*.md`, `ULTRA-*.md`)

</details>

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