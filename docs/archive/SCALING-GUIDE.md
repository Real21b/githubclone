# 📈 Scaling Guide - GitHub Clone Services

## 🎯 **Konfigürasyon Seçenekleri**

### **1. Ultra-Light (10 Kullanıcı)**
```bash
# Linux/Mac
./scripts/scale-services.sh ultra-light

# Windows PowerShell
.\scripts\scale-services.ps1 ultra-light
```

**Özellikler:**
- **RAM**: ~400MB
- **CPU**: ~1.0 cores
- **Kullanıcı**: 10-20
- **Servisler**: Core only (Auth, Core, File, Frontend, Nginx)
- **Veritabanı**: PostgreSQL + Redis
- **Özellikler**: Temel GitHub clone özellikleri

### **2. Lightweight (50 Kullanıcı)**
```bash
# Linux/Mac
./scripts/scale-services.sh lightweight

# Windows PowerShell
.\scripts\scale-services.ps1 lightweight
```

**Özellikler:**
- **RAM**: ~1.0GB
- **CPU**: ~2.0 cores
- **Kullanıcı**: 50-100
- **Servisler**: Core + Kafka + Basic integrations
- **Veritabanı**: PostgreSQL + Redis + Kafka
- **Özellikler**: Email, SMS, Notification servisleri

### **3. Scalable (100+ Kullanıcı)**
```bash
# Linux/Mac
./scripts/scale-services.sh scalable 200

# Windows PowerShell
.\scripts\scale-services.ps1 scalable 200
```

**Özellikler:**
- **RAM**: ~2.0GB
- **CPU**: ~3.0 cores
- **Kullanıcı**: 100-500
- **Servisler**: All services with load balancing
- **Veritabanı**: PostgreSQL + Redis + Kafka
- **Özellikler**: Load balancing, horizontal scaling

### **4. Full (1000+ Kullanıcı)**
```bash
# Linux/Mac
./scripts/scale-services.sh full

# Windows PowerShell
.\scripts\scale-services.ps1 full
```

**Özellikler:**
- **RAM**: ~3.5GB
- **CPU**: ~4.5 cores
- **Kullanıcı**: 1000+
- **Servisler**: All services with AI and advanced features
- **Veritabanı**: PostgreSQL + Redis + Kafka
- **Özellikler**: AI Service, WhatsApp, Telegram, WordPress

## 🚀 **Hızlı Başlangıç**

### **10 Kullanıcı İçin (Ultra-Light):**
```bash
# 1. Ultra-light konfigürasyonu başlat
docker-compose -f docker-compose.ultra-light.yml up -d

# 2. Servis durumunu kontrol et
docker-compose -f docker-compose.ultra-light.yml ps

# 3. Uygulamaya eriş
# http://localhost
```

### **50 Kullanıcı İçin (Lightweight):**
```bash
# 1. Lightweight konfigürasyonu başlat
docker-compose -f docker-compose.lightweight.yml up -d

# 2. Servis durumunu kontrol et
docker-compose -f docker-compose.lightweight.yml ps

# 3. Uygulamaya eriş
# http://localhost
```

### **100+ Kullanıcı İçin (Scalable):**
```bash
# 1. Scalable konfigürasyonu başlat
docker-compose -f docker-compose.scalable.yml up -d

# 2. Servisleri ölçeklendir
docker-compose -f docker-compose.scalable.yml up -d --scale auth-service=2
docker-compose -f docker-compose.scalable.yml up -d --scale core-service=2

# 3. Uygulamaya eriş
# http://localhost
```

## 📊 **Resource Usage Comparison**

| Konfigürasyon | RAM | CPU | Kullanıcı | Servis Sayısı |
|---------------|-----|-----|-----------|---------------|
| **Ultra-Light** | 400MB | 1.0 cores | 10-20 | 6 |
| **Lightweight** | 1.0GB | 2.0 cores | 50-100 | 10 |
| **Scalable** | 2.0GB | 3.0 cores | 100-500 | 10+ |
| **Full** | 3.5GB | 4.5 cores | 1000+ | 15+ |

## 🔧 **Scaling Commands**

### **Manuel Scaling:**
```bash
# Auth service'i 3 replica'ya çıkar
docker-compose -f docker-compose.scalable.yml up -d --scale auth-service=3

# Core service'i 2 replica'ya çıkar
docker-compose -f docker-compose.scalable.yml up -d --scale core-service=2

# File service'i 2 replica'ya çıkar
docker-compose -f docker-compose.scalable.yml up -d --scale file-service=2

# Frontend'i 2 replica'ya çıkar
docker-compose -f docker-compose.scalable.yml up -d --scale frontend=2
```

### **Otomatik Scaling:**
```bash
# 200 kullanıcı için otomatik scaling
./scripts/scale-services.sh scalable 200

# 500 kullanıcı için otomatik scaling
./scripts/scale-services.sh scalable 500
```

## 📈 **Performance Metrics**

### **Ultra-Light Performance:**
- **Response Time**: < 100ms
- **Throughput**: 50 req/s
- **Concurrent Users**: 10-20
- **Memory Usage**: 400MB
- **CPU Usage**: 1.0 cores

### **Lightweight Performance:**
- **Response Time**: < 200ms
- **Throughput**: 200 req/s
- **Concurrent Users**: 50-100
- **Memory Usage**: 1.0GB
- **CPU Usage**: 2.0 cores

### **Scalable Performance:**
- **Response Time**: < 300ms
- **Throughput**: 500 req/s
- **Concurrent Users**: 100-500
- **Memory Usage**: 2.0GB
- **CPU Usage**: 3.0 cores

### **Full Performance:**
- **Response Time**: < 500ms
- **Throughput**: 1000+ req/s
- **Concurrent Users**: 1000+
- **Memory Usage**: 3.5GB
- **CPU Usage**: 4.5 cores

## 🔍 **Monitoring & Health Checks**

### **Service Health:**
```bash
# Tüm servislerin durumunu kontrol et
docker-compose ps

# Belirli bir servisin durumunu kontrol et
docker-compose ps auth-service

# Servis loglarını görüntüle
docker-compose logs -f auth-service
```

### **Resource Monitoring:**
```bash
# Real-time resource usage
docker stats

# Memory usage
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# CPU usage
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}"
```

### **Health Check Endpoints:**
- **Frontend**: http://localhost/health
- **Auth Service**: http://localhost/auth/health
- **Core Service**: http://localhost/graphql (GraphQL playground)
- **File Service**: http://localhost/files/health

## 🚨 **Troubleshooting**

### **High Memory Usage:**
```bash
# Memory usage'ı kontrol et
docker stats --no-stream

# High memory kullanan servisleri restart et
docker-compose restart auth-service core-service

# Memory limit'leri azalt
# docker-compose.yml dosyasında memory limits'i düşür
```

### **High CPU Usage:**
```bash
# CPU usage'ı kontrol et
docker stats --no-stream

# CPU-intensive servisleri scale et
docker-compose up -d --scale core-service=2

# CPU limit'leri artır
# docker-compose.yml dosyasında cpu limits'i artır
```

### **Slow Performance:**
```bash
# Service health'ini kontrol et
docker-compose ps

# Logs'ları kontrol et
docker-compose logs -f

# Network connectivity'yi kontrol et
docker network ls
docker network inspect network-name
```

## 📋 **Configuration Files**

### **Ultra-Light:**
- `docker-compose.ultra-light.yml` - Minimal resource usage
- `nginx/nginx-ultra-light.conf` - Ultra-optimized Nginx

### **Lightweight:**
- `docker-compose.lightweight.yml` - Balanced performance
- `nginx/nginx-light.conf` - Optimized Nginx

### **Scalable:**
- `docker-compose.scalable.yml` - Load balanced services
- `nginx/nginx-scalable.conf` - High-performance Nginx

### **Full:**
- `docker-compose.kafka.yml` - Complete feature set
- `nginx/nginx.conf` - Full-featured Nginx

## 🎯 **Best Practices**

### **1. Start Small:**
- Ultra-light ile başla
- Kullanıcı sayısına göre scale et
- Performance'ı monitor et

### **2. Monitor Resources:**
- Memory usage'ı takip et
- CPU usage'ı takip et
- Response time'ı takip et

### **3. Scale Gradually:**
- Kullanıcı sayısına göre step-by-step scale et
- Her scale'den sonra performance'ı test et
- Resource usage'ı optimize et

### **4. Use Health Checks:**
- Regular health check'ler yap
- Service status'u monitor et
- Error rate'leri takip et

## 🚀 **Quick Commands**

### **Start Services:**
```bash
# Ultra-light (10 users)
docker-compose -f docker-compose.ultra-light.yml up -d

# Lightweight (50 users)
docker-compose -f docker-compose.lightweight.yml up -d

# Scalable (100+ users)
docker-compose -f docker-compose.scalable.yml up -d

# Full (1000+ users)
docker-compose -f docker-compose.kafka.yml up -d
```

### **Stop Services:**
```bash
# Stop all services
docker-compose down

# Stop specific configuration
docker-compose -f docker-compose.ultra-light.yml down
```

### **View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
```

### **Scale Services:**
```bash
# Scale auth service
docker-compose up -d --scale auth-service=2

# Scale multiple services
docker-compose up -d --scale auth-service=2 --scale core-service=2
```

## 🎉 **Conclusion**

Bu scaling guide ile:
- **10 kullanıcı** için ultra-light konfigürasyon
- **50 kullanıcı** için lightweight konfigürasyon
- **100+ kullanıcı** için scalable konfigürasyon
- **1000+ kullanıcı** için full konfigürasyon

kullanabilirsiniz. Her konfigürasyon optimize edilmiş resource usage ile maksimum performance sağlar.
