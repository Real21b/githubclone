# 🚀 Mikro Mimari Deployment Rehberi

## 📋 Ön Gereksinimler

- Docker ve Docker Compose
- En az 2GB RAM
- En az 2 CPU core
- 10GB boş disk alanı

## 🏗️ Mikro Mimari Yapısı

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Nginx)                     │
│                   Port: 80 (Load Balancer)                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐    ┌────▼────┐    ┌───▼───┐
│ Auth  │    │  Core   │    │ File  │
│Service│    │ Service │    │Service│
│:3001  │    │ :3002   │    │ :3003 │
└───────┘    └─────────┘    └───────┘
    │             │             │
    └─────────────┼─────────────┘
                  │
            ┌─────▼─────┐
            │ PostgreSQL│
            │  :5432    │
            └───────────┘
                  │
            ┌─────▼─────┐
            │   Redis   │
            │  :6379    │
            └───────────┘
```

## 🚀 Hızlı Başlatma

### 1. Mikroservisleri Başlatın:
```bash
cd githubclone
docker-compose -f docker-compose.microservices.yml up -d
```

### 2. Servis Durumunu Kontrol Edin:
```bash
# Tüm servislerin durumunu görün
docker-compose -f docker-compose.microservices.yml ps

# Logları izleyin
docker-compose -f docker-compose.microservices.yml logs -f
```

### 3. Test Edin:
```bash
# Mikroservis testi çalıştırın
node scripts/test-microservices.js

# Performans testi
node scripts/performance-test.js
```

## 📊 Erişim Noktaları

| Servis | URL | Açıklama |
|--------|-----|----------|
| **Ana Uygulama** | http://localhost | Nginx Gateway üzerinden |
| **Auth Service** | http://localhost:3001 | Kimlik doğrulama |
| **Core Service** | http://localhost:3002 | GraphQL API |
| **File Service** | http://localhost:3003 | Dosya yönetimi |
| **Frontend** | http://localhost:3000 | React uygulaması |
| **Prometheus** | http://localhost:9090 | Metrikler |
| **Grafana** | http://localhost:3002 | Dashboard |

## 🔧 Servis Detayları

### Auth Service (Port 3001)
- **Endpoint**: `/auth/*`
- **Fonksiyonlar**: Login, Register, Token Refresh
- **Kaynak**: 256MB RAM, 0.5 CPU
- **Health Check**: `GET /health`

### Core Service (Port 3002)
- **Endpoint**: `/graphql`
- **Fonksiyonlar**: User/Repository CRUD, GraphQL API
- **Kaynak**: 512MB RAM, 1.0 CPU
- **Health Check**: `GET /health`

### File Service (Port 3003)
- **Endpoint**: `/files/*`
- **Fonksiyonlar**: File upload/download, Image processing
- **Kaynak**: 256MB RAM, 0.5 CPU
- **Health Check**: `GET /health`

### API Gateway (Port 80)
- **Fonksiyonlar**: Load balancing, Rate limiting, SSL termination
- **Kaynak**: 128MB RAM, 0.5 CPU
- **Health Check**: `GET /health`

## 📈 Performans Metrikleri

### Beklenen Performans:
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: 1000+ requests/second
- **Memory Usage**: < 2.2GB total
- **CPU Usage**: < 80% average

### Kaynak Dağılımı:
```
┌─────────────────────────────────────────┐
│           TOPLAM: 2.2GB RAM             │
├─────────────────────────────────────────┤
│ Nginx Gateway      │ 128MB              │
│ Auth Service       │ 256MB              │
│ Core Service       │ 512MB              │
│ File Service       │ 256MB              │
│ Frontend           │ 256MB              │
│ PostgreSQL         │ 512MB              │
│ Redis              │ 128MB              │
│ Prometheus         │ 256MB              │
└─────────────────────────────────────────┘
```

## 🔍 Monitoring ve Debugging

### 1. Log İzleme:
```bash
# Tüm servislerin logları
docker-compose -f docker-compose.microservices.yml logs -f

# Belirli bir servisin logları
docker-compose -f docker-compose.microservices.yml logs -f auth-service
docker-compose -f docker-compose.microservices.yml logs -f core-service
docker-compose -f docker-compose.microservices.yml logs -f file-service
```

### 2. Kaynak Kullanımı:
```bash
# Container kaynak kullanımı
docker stats

# Sistem kaynakları
./scripts/monitor-resources.sh
```

### 3. Health Checks:
```bash
# Tüm servislerin health durumu
curl http://localhost/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

## 🛠️ Troubleshooting

### Yaygın Sorunlar:

#### 1. Servis Başlamıyor:
```bash
# Container durumunu kontrol et
docker-compose -f docker-compose.microservices.yml ps

# Logları kontrol et
docker-compose -f docker-compose.microservices.yml logs [service-name]

# Yeniden başlat
docker-compose -f docker-compose.microservices.yml restart [service-name]
```

#### 2. Database Bağlantı Sorunu:
```bash
# PostgreSQL durumunu kontrol et
docker exec postgres_db psql -U user -d githubclone -c "SELECT 1;"

# Redis durumunu kontrol et
docker exec redis_cache redis-cli ping
```

#### 3. Memory/CPU Sorunları:
```bash
# Kaynak kullanımını kontrol et
docker stats

# Servisleri yeniden başlat
docker-compose -f docker-compose.microservices.yml restart
```

#### 4. Network Sorunları:
```bash
# Network durumunu kontrol et
docker network ls
docker network inspect githubclone_microservices-network
```

## 🔄 Scaling

### Horizontal Scaling:
```bash
# Core service'i scale et (en çok yük alan)
docker-compose -f docker-compose.microservices.yml up -d --scale core-service=3

# Nginx upstream'i güncelle (nginx.conf)
upstream core_service {
    server core-service_1:3002;
    server core-service_2:3002;
    server core-service_3:3002;
}
```

### Vertical Scaling:
```yaml
# docker-compose.microservices.yml içinde
deploy:
  resources:
    limits:
      memory: 1G  # 512MB'den 1GB'a çıkar
      cpus: '2.0' # 1.0'dan 2.0'a çıkar
```

## 🚀 Production Deployment

### 1. Environment Variables:
```bash
# .env.production dosyası oluştur
cp env.production.example .env.production

# Güvenli değerlerle güncelle
JWT_SECRET=your-super-secure-jwt-secret
POSTGRES_PASSWORD=your-secure-db-password
REDIS_PASSWORD=your-secure-redis-password
```

### 2. SSL/TLS:
```nginx
# nginx.conf SSL konfigürasyonu
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://frontend;
    }
}
```

### 3. Backup Strategy:
```bash
# Database backup
docker exec postgres_db pg_dump -U user githubclone > backup.sql

# File storage backup
tar -czf files-backup.tar.gz ./volumes/file_storage/
```

## 📊 Performance Benchmarks

### Load Testing:
```bash
# k6 ile test
k6 run k6/microservices-test.js

# Apache Bench ile test
ab -n 1000 -c 10 http://localhost/graphql
```

### Expected Results:
- **Response Time**: < 200ms
- **Throughput**: 1000+ req/s
- **Error Rate**: < 1%
- **Memory Usage**: < 2.2GB
- **CPU Usage**: < 80%

## 🎯 Sonuç

Bu mikro mimari ile:
- ✅ **Scalability**: Horizontal ve vertical scaling
- ✅ **Fault Tolerance**: Tek servis çökse diğerleri çalışır
- ✅ **Resource Efficiency**: Her servis sadece ihtiyacı kadar kaynak
- ✅ **Development Speed**: Bağımsız geliştirme
- ✅ **Monitoring**: Detaylı izleme ve alerting

**Mikro mimari başarıyla deploy edildi!** 🎉
