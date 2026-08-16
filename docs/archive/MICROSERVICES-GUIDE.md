# 🏗️ Mikro Mimari Deployment Rehberi

## 📋 Kaynak Gereksinimleri

### Minimum Sistem Gereksinimleri:
- **CPU**: 2 core (4 core önerilen)
- **RAM**: 2GB (4GB önerilen)
- **Disk**: 10GB boş alan
- **Docker**: 20.10+

### Kaynak Dağılımı:
```
┌─────────────────────────────────────────┐
│              Toplam: 2GB RAM            │
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

## 🚀 Hızlı Başlangıç

### 1. Mikroservisleri Başlatın:
```bash
# Mikro mimari ile başlat
docker-compose -f docker-compose.microservices.yml up -d

# Kaynak kullanımını izleyin
./scripts/monitor-resources.sh
```

### 2. Erişim Noktaları:
- **Ana Uygulama**: http://localhost
- **API Gateway**: http://localhost (Nginx)
- **Auth Service**: http://localhost/auth/
- **GraphQL API**: http://localhost/graphql
- **File Service**: http://localhost/files/
- **Prometheus**: http://localhost:9090

## 🔧 Performans Optimizasyonları

### 1. Nginx Optimizasyonları:
```nginx
# nginx.conf içinde
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_types text/plain application/json application/javascript;

# Caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Redis Optimizasyonları:
```yaml
# docker-compose.microservices.yml içinde
redis:
  command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

### 3. PostgreSQL Optimizasyonları:
```sql
-- postgresql.conf optimizasyonları
shared_buffers = 128MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## 📊 Monitoring ve Alerting

### 1. Kaynak İzleme:
```bash
# Gerçek zamanlı izleme
watch -n 5 './scripts/monitor-resources.sh'

# Log izleme
docker-compose -f docker-compose.microservices.yml logs -f
```

### 2. Prometheus Metrikleri:
- **Request Rate**: İstek/saniye
- **Response Time**: Yanıt süresi
- **Error Rate**: Hata oranı
- **Memory Usage**: Bellek kullanımı
- **CPU Usage**: CPU kullanımı

### 3. Alert Kuralları:
```yaml
# prometheus/alerts.yml
groups:
- name: githubclone
  rules:
  - alert: HighMemoryUsage
    expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
```

## 🔄 Scaling Stratejileri

### 1. Horizontal Scaling:
```bash
# Core service'i scale et
docker-compose -f docker-compose.microservices.yml up -d --scale core-service=3

# Load balancer ile dağıt
# Nginx upstream'de multiple instance'lar
```

### 2. Vertical Scaling:
```yaml
# docker-compose.microservices.yml içinde
deploy:
  resources:
    limits:
      memory: 1G  # 512MB'den 1GB'a çıkar
      cpus: '2.0' # 1.0'dan 2.0'a çıkar
```

### 3. Database Scaling:
```bash
# Read replica ekle
# Connection pooling
# Query optimization
```

## 🛡️ Güvenlik

### 1. Service-to-Service Communication:
```typescript
// JWT token ile service authentication
const authHeader = `Bearer ${serviceToken}`;
```

### 2. Rate Limiting:
```nginx
# Nginx rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

### 3. Network Security:
```yaml
# Docker network isolation
networks:
  microservices-network:
    driver: bridge
    internal: false  # External access için
```

## 🔧 Troubleshooting

### 1. Yaygın Sorunlar:

**Memory Issues:**
```bash
# Memory kullanımını kontrol et
docker stats
# Container'ları restart et
docker-compose restart
```

**Service Discovery Issues:**
```bash
# Service health check
curl http://localhost/auth/health
curl http://localhost/graphql
```

**Database Connection Issues:**
```bash
# PostgreSQL connection test
docker exec -it postgres_db psql -U user -d githubclone -c "SELECT 1;"
```

### 2. Log Analysis:
```bash
# Service logları
docker-compose logs auth-service
docker-compose logs core-service
docker-compose logs file-service

# Nginx access logs
docker exec api_gateway tail -f /var/log/nginx/access.log
```

## 📈 Performance Benchmarks

### Beklenen Performans:
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: 1000+ requests/second
- **Memory Usage**: < 2GB total
- **CPU Usage**: < 80% average

### Load Testing:
```bash
# k6 ile test
k6 run k6/microservices-test.js

# Apache Bench ile test
ab -n 1000 -c 10 http://localhost/graphql
```

## 🚀 Production Deployment

### 1. Environment Variables:
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/githubclone
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-secret
```

### 2. SSL/TLS:
```nginx
# nginx.conf SSL configuration
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### 3. Backup Strategy:
```bash
# Database backup
docker exec postgres_db pg_dump -U user githubclone > backup.sql

# File storage backup
tar -czf files-backup.tar.gz ./volumes/file_storage/
```

Bu mikro mimari, düşük kaynaklı sistemlerde optimal performans sağlar! 🎯
