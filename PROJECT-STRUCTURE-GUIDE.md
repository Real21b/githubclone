# 📁 Proje Yapısı ve Dosya Organizasyonu Rehberi

## 🏗️ **Genel Proje Yapısı**

```
githubclone/
├── 📁 .github/                    # GitHub Actions ve templates
│   ├── 📁 workflows/              # CI/CD pipeline'ları
│   │   ├── 📄 main.yml           # Ana workflow
│   │   ├── 📄 test.yml           # Test workflow
│   │   └── 📄 deploy.yml         # Deploy workflow
│   └── 📁 templates/              # Issue ve PR template'leri
├── 📁 backend/                    # Backend servisleri (legacy)
│   ├── 📁 src/                   # Source code
│   ├── 📄 Dockerfile             # Backend Dockerfile
│   └── 📄 package.json           # Backend dependencies
├── 📁 frontend/                   # Frontend uygulaması
│   ├── 📁 src/                   # Source code
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 pages/             # Next.js pages
│   │   ├── 📁 hooks/             # Custom hooks
│   │   ├── 📁 utils/             # Utility functions
│   │   ├── 📁 types/             # TypeScript types
│   │   └── 📁 styles/            # CSS/SCSS files
│   ├── 📁 public/                # Static assets
│   ├── 📄 Dockerfile.vite        # Vite Dockerfile
│   ├── 📄 Dockerfile.nextjs      # Next.js Dockerfile
│   ├── 📄 vite.config.ts         # Vite configuration
│   ├── 📄 next.config.js         # Next.js configuration
│   ├── 📄 nginx.conf             # Nginx configuration
│   └── 📄 package.json           # Frontend dependencies
├── 📁 services/                   # Mikro servisler
│   ├── 📁 auth-service/          # Authentication service
│   ├── 📁 core-service/          # Core business logic
│   ├── 📁 file-service/          # File management
│   ├── 📁 email-service/         # Email service
│   ├── 📁 sms-service/           # SMS service
│   ├── 📁 notification-service/  # Notification service
│   ├── 📁 wordpress-service/     # WordPress integration
│   ├── 📁 whatsapp-service/      # WhatsApp integration
│   ├── 📁 telegram-service/      # Telegram integration
│   ├── 📁 ai-service/            # AI/ML service
│   ├── 📁 realtime-service/      # Real-time communication
│   └── 📁 integration-service/   # Integration management
├── 📁 monitoring/                 # Monitoring ve observability
│   ├── 📁 prometheus/            # Prometheus configuration
│   ├── 📁 grafana/               # Grafana dashboards
│   └── 📁 logs/                  # Log files
├── 📁 nginx/                      # Nginx configuration
│   ├── 📄 nginx.conf             # Main nginx config
│   ├── 📄 ssl/                   # SSL certificates
│   └── 📄 conf.d/                # Additional configs
├── 📁 postgres/                   # PostgreSQL configuration
│   ├── 📁 init/                  # Database initialization
│   ├── 📁 migrations/            # Database migrations
│   └── 📁 seeds/                 # Database seeds
├── 📁 scripts/                    # Utility scripts
│   ├── 📄 quick-start-development.sh    # Quick start (Bash)
│   ├── 📄 quick-start-development.ps1   # Quick start (PowerShell)
│   ├── 📄 deploy-development.sh         # Development deployment
│   ├── 📄 deploy-production.sh          # Production deployment
│   ├── 📄 deploy-unified.sh             # Unified deployment
│   ├── 📄 test-microservices-vite-integration.ps1  # Integration tests
│   ├── 📄 run-microservices-performance-tests.ps1  # Performance tests
│   ├── 📄 monitor-resources.sh          # Resource monitoring
│   ├── 📄 scale-services.ps1            # Service scaling
│   └── 📄 startup-sequence.sh           # Startup sequence
├── 📁 performance-tests/          # Performance test scripts
│   ├── 📄 test-microservices-index-performance.js      # Index performance
│   ├── 📄 test-vite-vs-nextjs-comparison.js            # Vite vs Next.js
│   ├── 📄 test-microservices-integration-performance.js # Integration performance
│   ├── 📄 test-microservices.js                        # General microservices
│   ├── 📄 test-vite-development.js                     # Vite development
│   ├── 📄 test-nextjs-production.js                    # Next.js production
│   └── 📄 performance-test-suite.js                    # Test suite
├── 📁 k6/                         # k6 performance tests
│   ├── 📄 test.js                 # Main k6 test
│   └── 📁 scenarios/              # Test scenarios
├── 📁 docker-compose/             # Docker Compose files
│   ├── 📄 docker-compose.yml              # Main compose file
│   ├── 📄 docker-compose.unified.yml      # Unified microservices
│   ├── 📄 docker-compose.development.yml  # Development environment
│   ├── 📄 docker-compose.production.yml   # Production environment
│   ├── 📄 docker-compose.staging.yml      # Staging environment
│   ├── 📄 docker-compose.kafka.yml        # Kafka services
│   ├── 📄 docker-compose.lightweight.yml  # Lightweight setup
│   ├── 📄 docker-compose.optimized.yml    # Optimized setup
│   ├── 📄 docker-compose.ultra-optimized.yml # Ultra-optimized
│   ├── 📄 docker-compose.ultra-performance.yml # Ultra-performance
│   └── 📄 docker-compose.scalable.yml     # Scalable setup
├── 📁 docs/                       # Documentation
│   ├── 📄 README.md               # Main README
│   ├── 📄 API.md                  # API documentation
│   ├── 📄 DEPLOYMENT.md           # Deployment guide
│   └── 📄 CONTRIBUTING.md         # Contributing guide
├── 📁 tests/                      # Test files
│   ├── 📁 unit/                   # Unit tests
│   ├── 📁 integration/            # Integration tests
│   ├── 📁 e2e/                    # End-to-end tests
│   └── 📁 fixtures/               # Test fixtures
├── 📁 logs/                       # Application logs
├── 📁 uploads/                    # File uploads
├── 📁 test-results/               # Test results
├── 📄 .env                        # Environment variables
├── 📄 .env.example                # Environment template
├── 📄 .env.production             # Production environment
├── 📄 .gitignore                  # Git ignore rules
├── 📄 .dockerignore               # Docker ignore rules
├── 📄 package.json                # Root package.json
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 sonar-project.properties    # SonarQube configuration
└── 📄 README.md                   # Project README
```

## 🏢 **Mikro Servis Yapısı**

### **Auth Service Yapısı**
```
services/auth-service/
├── 📁 src/
│   ├── 📁 controllers/            # HTTP controllers
│   │   ├── 📄 AuthController.ts   # Authentication controller
│   │   └── 📄 UserController.ts   # User management controller
│   ├── 📁 services/               # Business logic
│   │   ├── 📄 AuthService.ts      # Authentication service
│   │   ├── 📄 UserService.ts      # User service
│   │   └── 📄 JwtService.ts       # JWT service
│   ├── 📁 entities/               # Database entities
│   │   ├── 📄 User.ts             # User entity
│   │   └── 📄 Session.ts          # Session entity
│   ├── 📁 dto/                    # Data transfer objects
│   │   ├── 📄 LoginDto.ts         # Login DTO
│   │   └── 📄 RegisterDto.ts      # Register DTO
│   ├── 📁 guards/                 # Authentication guards
│   │   ├── 📄 JwtAuthGuard.ts     # JWT guard
│   │   └── 📄 RolesGuard.ts       # Role-based guard
│   ├── 📁 decorators/             # Custom decorators
│   │   ├── 📄 CurrentUser.ts      # Current user decorator
│   │   └── 📄 Roles.ts            # Roles decorator
│   ├── 📁 middleware/             # Custom middleware
│   │   └── 📄 AuthMiddleware.ts   # Authentication middleware
│   ├── 📁 config/                 # Configuration
│   │   ├── 📄 database.config.ts  # Database configuration
│   │   └── 📄 jwt.config.ts       # JWT configuration
│   ├── 📁 utils/                  # Utility functions
│   │   ├── 📄 password.util.ts    # Password utilities
│   │   └── 📄 validation.util.ts  # Validation utilities
│   ├── 📁 tests/                  # Test files
│   │   ├── 📁 unit/               # Unit tests
│   │   └── 📁 integration/        # Integration tests
│   ├── 📄 app.module.ts           # Main module
│   ├── 📄 main.ts                 # Application entry point
│   └── 📄 app.controller.ts       # Main controller
├── 📁 migrations/                 # Database migrations
├── 📁 seeds/                      # Database seeds
├── 📄 Dockerfile                  # Service Dockerfile
├── 📄 package.json                # Service dependencies
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 .env                        # Service environment
└── 📄 README.md                   # Service documentation
```

### **Core Service Yapısı**
```
services/core-service/
├── 📁 src/
│   ├── 📁 controllers/            # HTTP controllers
│   │   ├── 📄 RepositoryController.ts    # Repository controller
│   │   ├── 📄 ProjectController.ts       # Project controller
│   │   └── 📄 OrganizationController.ts  # Organization controller
│   ├── 📁 services/               # Business logic
│   │   ├── 📄 RepositoryService.ts       # Repository service
│   │   ├── 📄 ProjectService.ts          # Project service
│   │   └── 📄 OrganizationService.ts     # Organization service
│   ├── 📁 entities/               # Database entities
│   │   ├── 📄 Repository.ts              # Repository entity
│   │   ├── 📄 Project.ts                 # Project entity
│   │   └── 📄 Organization.ts            # Organization entity
│   ├── 📁 dto/                    # Data transfer objects
│   │   ├── 📄 CreateRepositoryDto.ts     # Create repository DTO
│   │   └── 📄 UpdateRepositoryDto.ts     # Update repository DTO
│   ├── 📁 resolvers/              # GraphQL resolvers
│   │   ├── 📄 RepositoryResolver.ts      # Repository resolver
│   │   └── 📄 ProjectResolver.ts         # Project resolver
│   ├── 📁 schemas/                # GraphQL schemas
│   │   ├── 📄 repository.schema.ts       # Repository schema
│   │   └── 📄 project.schema.ts          # Project schema
│   ├── 📁 config/                 # Configuration
│   │   └── 📄 database.config.ts         # Database configuration
│   ├── 📁 utils/                  # Utility functions
│   │   └── 📄 validation.util.ts         # Validation utilities
│   ├── 📁 tests/                  # Test files
│   │   ├── 📁 unit/               # Unit tests
│   │   └── 📁 integration/        # Integration tests
│   ├── 📄 app.module.ts           # Main module
│   ├── 📄 main.ts                 # Application entry point
│   └── 📄 app.controller.ts       # Main controller
├── 📁 migrations/                 # Database migrations
├── 📁 seeds/                      # Database seeds
├── 📄 Dockerfile                  # Service Dockerfile
├── 📄 package.json                # Service dependencies
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 .env                        # Service environment
└── 📄 README.md                   # Service documentation
```

## 🎨 **Frontend Yapısı**

### **Vite + React Yapısı**
```
frontend/
├── 📁 src/
│   ├── 📁 components/             # React components
│   │   ├── 📁 common/             # Common components
│   │   │   ├── 📄 Button.tsx      # Button component
│   │   │   ├── 📄 Input.tsx       # Input component
│   │   │   └── 📄 Modal.tsx       # Modal component
│   │   ├── 📁 layout/             # Layout components
│   │   │   ├── 📄 Header.tsx      # Header component
│   │   │   ├── 📄 Sidebar.tsx     # Sidebar component
│   │   │   └── 📄 Footer.tsx      # Footer component
│   │   ├── 📁 pages/              # Page components
│   │   │   ├── 📄 Home.tsx        # Home page
│   │   │   ├── 📄 Dashboard.tsx   # Dashboard page
│   │   │   └── 📄 Profile.tsx     # Profile page
│   │   ├── 📁 forms/              # Form components
│   │   │   ├── 📄 LoginForm.tsx   # Login form
│   │   │   └── 📄 RegisterForm.tsx # Register form
│   │   └── 📁 microservices/      # Microservice components
│   │       ├── 📄 UnifiedIndex.tsx # Unified index page
│   │       ├── 📄 ServiceStatus.tsx # Service status
│   │       └── 📄 HealthCheck.tsx  # Health check
│   ├── 📁 hooks/                  # Custom hooks
│   │   ├── 📄 useAuth.ts          # Authentication hook
│   │   ├── 📄 useApi.ts           # API hook
│   │   └── 📄 useWebSocket.ts     # WebSocket hook
│   ├── 📁 services/               # API services
│   │   ├── 📄 api.ts              # API client
│   │   ├── 📄 auth.service.ts     # Authentication service
│   │   └── 📄 user.service.ts     # User service
│   ├── 📁 store/                  # State management
│   │   ├── 📄 auth.store.ts       # Authentication store
│   │   ├── 📄 user.store.ts       # User store
│   │   └── 📄 app.store.ts        # App store
│   ├── 📁 utils/                  # Utility functions
│   │   ├── 📄 constants.ts        # Constants
│   │   ├── 📄 helpers.ts          # Helper functions
│   │   └── 📄 validation.ts       # Validation functions
│   ├── 📁 types/                  # TypeScript types
│   │   ├── 📄 api.types.ts        # API types
│   │   ├── 📄 user.types.ts       # User types
│   │   └── 📄 common.types.ts     # Common types
│   ├── 📁 styles/                 # Styles
│   │   ├── 📄 globals.css         # Global styles
│   │   ├── 📄 components.css      # Component styles
│   │   └── 📄 themes.css          # Theme styles
│   ├── 📁 assets/                 # Static assets
│   │   ├── 📁 images/             # Images
│   │   ├── 📁 icons/              # Icons
│   │   └── 📁 fonts/              # Fonts
│   ├── 📁 tests/                  # Test files
│   │   ├── 📁 components/         # Component tests
│   │   ├── 📁 hooks/              # Hook tests
│   │   └── 📁 utils/              # Utility tests
│   ├── 📄 App.tsx                 # Main App component
│   ├── 📄 main.tsx                # Application entry point
│   └── 📄 vite-env.d.ts           # Vite environment types
├── 📁 public/                     # Public assets
│   ├── 📄 index.html              # HTML template
│   ├── 📄 favicon.ico             # Favicon
│   └── 📄 manifest.json           # PWA manifest
├── 📁 dist/                       # Build output
├── 📄 vite.config.ts              # Vite configuration
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 package.json                # Dependencies
├── 📄 .env                        # Environment variables
└── 📄 README.md                   # Frontend documentation
```

### **Next.js Yapısı**
```
frontend/
├── 📁 src/
│   ├── 📁 app/                    # App Router (Next.js 13+)
│   │   ├── 📁 (auth)/             # Auth route group
│   │   │   ├── 📁 login/          # Login page
│   │   │   └── 📁 register/       # Register page
│   │   ├── 📁 dashboard/          # Dashboard pages
│   │   ├── 📁 api/                # API routes
│   │   │   ├── 📁 auth/           # Auth API
│   │   │   └── 📁 users/          # Users API
│   │   ├── 📄 layout.tsx          # Root layout
│   │   ├── 📄 page.tsx            # Home page
│   │   └── 📄 loading.tsx         # Loading component
│   ├── 📁 components/             # React components
│   │   ├── 📁 ui/                 # UI components
│   │   ├── 📁 forms/              # Form components
│   │   └── 📁 layout/             # Layout components
│   ├── 📁 lib/                    # Library code
│   │   ├── 📄 auth.ts             # Authentication
│   │   ├── 📄 db.ts               # Database
│   │   └── 📄 utils.ts            # Utilities
│   ├── 📁 hooks/                  # Custom hooks
│   ├── 📁 types/                  # TypeScript types
│   └── 📁 styles/                 # Styles
├── 📁 public/                     # Public assets
├── 📁 .next/                      # Next.js build output
├── 📄 next.config.js              # Next.js configuration
├── 📄 tailwind.config.js          # Tailwind configuration
├── 📄 postcss.config.js           # PostCSS configuration
├── 📄 package.json                # Dependencies
└── 📄 README.md                   # Frontend documentation
```

## 🐳 **Docker Yapısı**

### **Docker Compose Dosyaları**
```
docker-compose/
├── 📄 docker-compose.yml              # Ana compose file
├── 📄 docker-compose.unified.yml      # Unified microservices
├── 📄 docker-compose.development.yml  # Development environment
├── 📄 docker-compose.production.yml   # Production environment
├── 📄 docker-compose.staging.yml      # Staging environment
├── 📄 docker-compose.kafka.yml        # Kafka services
├── 📄 docker-compose.lightweight.yml  # Lightweight setup
├── 📄 docker-compose.optimized.yml    # Optimized setup
├── 📄 docker-compose.ultra-optimized.yml # Ultra-optimized
├── 📄 docker-compose.ultra-performance.yml # Ultra-performance
└── 📄 docker-compose.scalable.yml     # Scalable setup
```

### **Dockerfile Yapısı**
```
# Multi-stage Dockerfile example
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

## 📊 **Monitoring Yapısı**

### **Prometheus Yapısı**
```
monitoring/prometheus/
├── 📄 prometheus.yml              # Prometheus configuration
├── 📄 rules/                      # Alerting rules
│   ├── 📄 app.rules.yml           # Application rules
│   └── 📄 infrastructure.rules.yml # Infrastructure rules
└── 📁 targets/                    # Target configurations
    ├── 📄 services.yml            # Service targets
    └── 📄 infrastructure.yml      # Infrastructure targets
```

### **Grafana Yapısı**
```
monitoring/grafana/
├── 📁 dashboards/                 # Dashboard definitions
│   ├── 📄 microservices.json      # Microservices dashboard
│   ├── 📄 infrastructure.json     # Infrastructure dashboard
│   └── 📄 application.json        # Application dashboard
├── 📁 datasources/                # Data source configurations
│   ├── 📄 prometheus.yml          # Prometheus datasource
│   └── 📄 postgres.yml            # PostgreSQL datasource
└── 📁 provisioning/               # Provisioning configurations
    ├── 📁 dashboards/             # Dashboard provisioning
    └── 📁 datasources/            # Datasource provisioning
```

## 🧪 **Test Yapısı**

### **Test Organizasyonu**
```
tests/
├── 📁 unit/                       # Unit tests
│   ├── 📁 services/               # Service unit tests
│   ├── 📁 controllers/            # Controller unit tests
│   └── 📁 utils/                  # Utility unit tests
├── 📁 integration/                # Integration tests
│   ├── 📁 api/                    # API integration tests
│   ├── 📁 database/               # Database integration tests
│   └── 📁 microservices/          # Microservice integration tests
├── 📁 e2e/                        # End-to-end tests
│   ├── 📁 user-flows/             # User flow tests
│   ├── 📁 api-flows/              # API flow tests
│   └── 📁 performance/            # Performance tests
├── 📁 fixtures/                   # Test fixtures
│   ├── 📁 data/                   # Test data
│   ├── 📁 images/                 # Test images
│   └── 📁 files/                  # Test files
└── 📁 helpers/                    # Test helpers
    ├── 📄 test-setup.ts           # Test setup
    ├── 📄 test-utils.ts           # Test utilities
    └── 📄 mock-data.ts            # Mock data
```

## 📚 **Dokümantasyon Yapısı**

### **Dokümantasyon Organizasyonu**
```
docs/
├── 📁 api/                        # API documentation
│   ├── 📄 authentication.md       # Auth API docs
│   ├── 📄 users.md                # Users API docs
│   └── 📄 repositories.md         # Repositories API docs
├── 📁 deployment/                 # Deployment guides
│   ├── 📄 development.md          # Development deployment
│   ├── 📄 production.md           # Production deployment
│   └── 📄 docker.md               # Docker deployment
├── 📁 architecture/               # Architecture documentation
│   ├── 📄 microservices.md        # Microservices architecture
│   ├── 📄 database.md             # Database design
│   └── 📄 security.md             # Security architecture
├── 📁 development/                # Development guides
│   ├── 📄 setup.md                # Development setup
│   ├── 📄 coding-standards.md     # Coding standards
│   └── 📄 testing.md              # Testing guidelines
└── 📁 user/                       # User documentation
    ├── 📄 getting-started.md      # Getting started
    ├── 📄 features.md             # Features guide
    └── 📄 troubleshooting.md      # Troubleshooting
```

## 🎯 **Best Practices**

### **Dosya İsimlendirme**
- **Kebab-case**: `user-service.ts`, `auth-controller.ts`
- **PascalCase**: `UserService.ts`, `AuthController.ts`
- **camelCase**: `userService.ts`, `authController.ts`
- **UPPER_CASE**: `API_ENDPOINTS.ts`, `CONSTANTS.ts`

### **Klasör Organizasyonu**
- **Feature-based**: Her feature için ayrı klasör
- **Layer-based**: Controller, Service, Entity ayrı klasörler
- **Type-based**: Components, Hooks, Utils ayrı klasörler

### **Import/Export Organizasyonu**
```typescript
// 1. Node modules
import React from 'react';
import { Router } from 'express';

// 2. Internal modules (absolute paths)
import { UserService } from '@/services/UserService';
import { AuthController } from '@/controllers/AuthController';

// 3. Relative imports
import './styles.css';
import { helper } from '../utils/helper';
```

### **Environment Variables**
```bash
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

## 🎉 **Sonuç**

Bu proje yapısı, mikro servis mimarisini destekleyen, ölçeklenebilir ve maintainable bir kod organizasyonu sağlar. Her klasör ve dosya, belirli bir amaca hizmet eder ve geliştirme sürecini kolaylaştırır.

### **✅ Avantajlar:**
- **Organize**: Mantıklı klasör yapısı
- **Scalable**: Büyümeye uygun yapı
- **Maintainable**: Kolay bakım
- **Testable**: Test edilebilir yapı
- **Documented**: İyi dokümante edilmiş
- **Consistent**: Tutarlı isimlendirme

---

**🚀 Bu yapıyı kullanarak mikro servis projenizi organize ve verimli bir şekilde geliştirebilirsiniz!**
