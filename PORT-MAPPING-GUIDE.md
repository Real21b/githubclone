# 🚀 Port Mapping Guide - Dual Server Environment

## 📋 **Port Allocation Strategy**

### **🔧 Development Environment (Vite + Node.js):**
```
Frontend (Vite):     3000 → 3001 (container)
Auth Service:        3001 → 3001 (container)
Core Service:        3002 → 3002 (container)
File Service:        3003 → 3003 (container)
Email Service:       3004 → 3004 (container)
SMS Service:         3005 → 3005 (container)
Notification:        3006 → 3006 (container)
WordPress:           3007 → 3007 (container)
WhatsApp:            3008 → 3008 (container)
Telegram:            3009 → 3009 (container)
AI Service:          3010 → 3010 (container)
Real-time:           3011 → 3011 (container)
Integration:         3012 → 3012 (container)
PostgreSQL:          5432 → 5432 (container)
Redis:               6379 → 6379 (container)
Kafka:               9092 → 9092 (container)
Zookeeper:           2181 → 2181 (container)
Nginx:               80 → 80 (container)
Prometheus:          9090 → 9090 (container)
Grafana:             3000 → 3000 (container) ⚠️ CONFLICT!
```

### **🏭 Production Environment (Next.js + Node.js):**
```
Frontend (Next.js):  3000 → 3000 (container)
Auth Service:        3001 → 3001 (container)
Core Service:        3002 → 3002 (container)
File Service:        3003 → 3003 (container)
Email Service:       3004 → 3004 (container)
SMS Service:         3005 → 3005 (container)
Notification:        3006 → 3006 (container)
WordPress:           3007 → 3007 (container)
WhatsApp:            3008 → 3008 (container)
Telegram:            3009 → 3009 (container)
AI Service:          3010 → 3010 (container)
Real-time:           3011 → 3011 (container)
Integration:         3012 → 3012 (container)
PostgreSQL:          5432 → 5432 (container)
Redis:               6379 → 6379 (container)
Kafka:               9092 → 9092 (container)
Zookeeper:           2181 → 2181 (container)
Nginx:               80 → 80 (container)
Prometheus:          9090 → 9090 (container)
Grafana:             3000 → 3000 (container) ⚠️ CONFLICT!
```

## ⚠️ **Port Conflicts Identified:**

1. **Grafana (3000) ↔ Frontend (3000)** - CRITICAL CONFLICT!
2. **Development vs Production** - Same ports used

## 🔧 **Solution: Port Reallocation**

### **✅ Fixed Port Mapping:**

#### **Development Environment:**
```
Frontend (Vite):     3000 → 3001 (container)
Auth Service:        3001 → 3001 (container)
Core Service:        3002 → 3002 (container)
File Service:        3003 → 3003 (container)
Email Service:       3004 → 3004 (container)
SMS Service:         3005 → 3005 (container)
Notification:        3006 → 3006 (container)
WordPress:           3007 → 3007 (container)
WhatsApp:            3008 → 3008 (container)
Telegram:            3009 → 3009 (container)
AI Service:          3010 → 3010 (container)
Real-time:           3011 → 3011 (container)
Integration:         3012 → 3012 (container)
PostgreSQL:          5432 → 5432 (container)
Redis:               6379 → 6379 (container)
Kafka:               9092 → 9092 (container)
Zookeeper:           2181 → 2181 (container)
Nginx:               80 → 80 (container)
Prometheus:          9090 → 9090 (container)
Grafana:             3000 → 3000 (container) ✅ FIXED
```

#### **Production Environment:**
```
Frontend (Next.js):  3000 → 3000 (container)
Auth Service:        3001 → 3001 (container)
Core Service:        3002 → 3002 (container)
File Service:        3003 → 3003 (container)
Email Service:       3004 → 3004 (container)
SMS Service:         3005 → 3005 (container)
Notification:        3006 → 3006 (container)
WordPress:           3007 → 3007 (container)
WhatsApp:            3008 → 3008 (container)
Telegram:            3009 → 3009 (container)
AI Service:          3010 → 3010 (container)
Real-time:           3011 → 3011 (container)
Integration:         3012 → 3012 (container)
PostgreSQL:          5432 → 5432 (container)
Redis:               6379 → 6379 (container)
Kafka:               9092 → 9092 (container)
Zookeeper:           2181 → 2181 (container)
Nginx:               80 → 80 (container)
Prometheus:          9090 → 9090 (container)
Grafana:             3000 → 3000 (container) ✅ FIXED
```

## 🎯 **Port Conflict Resolution Strategy:**

1. **Grafana Port**: Move to 3001 (separate from frontend)
2. **Development Frontend**: Use 3000 (Vite)
3. **Production Frontend**: Use 3000 (Next.js)
4. **Service Ports**: Keep consistent across environments
5. **Infrastructure Ports**: Keep standard ports
