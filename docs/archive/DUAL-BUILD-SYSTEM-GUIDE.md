# 🔄 Dual Build System Guide

## 📋 **Vite (Development) + Next.js (Production)**

Bu rehber, GitHub Clone uygulamasının dual build sistemini açıklar: **Vite** development için, **Next.js** production için.

## 🎯 **Sistem Mimarisi**

### **Development Environment (Vite):**
- **Hızlı Geliştirme**: Hot Module Replacement (HMR)
- **Hızlı Build**: Vite'nin hızlı build sistemi
- **Development Server**: Vite dev server
- **Real-time Updates**: WebSocket entegrasyonu

### **Production Environment (Next.js):**
- **SSR/SSG**: Server-side rendering ve static generation
- **Performance**: Optimized production build
- **SEO**: Search engine optimization
- **Scalability**: Production-ready architecture

## 🚀 **Quick Start**

### **Development (Vite):**
```bash
# Development environment
./scripts/deploy-development.sh

# Or manually
docker-compose -f docker-compose.development.yml up -d
```

### **Production (Next.js):**
```bash
# Production environment
./scripts/deploy-production.sh

# Or manually
docker-compose -f docker-compose.production.yml up -d
```

## 📁 **Dosya Yapısı**

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── globals.css      # Global styles
│   ├── components/          # Shared components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   └── main.tsx             # Vite entry point
├── public/                  # Static assets
├── package.json             # Dual build scripts
├── next.config.js           # Next.js configuration
├── vite.config.ts           # Vite configuration
├── Dockerfile.vite          # Vite Docker image
├── Dockerfile.nextjs        # Next.js Docker image
└── tsconfig.json            # TypeScript configuration
```

## 🔧 **Package.json Scripts**

```json
{
  "scripts": {
    "dev": "vite",                    // Vite development server
    "dev:next": "next dev",           // Next.js development server
    "build": "next build",            // Next.js production build
    "build:vite": "tsc && vite build", // Vite production build
    "start": "next start",            // Next.js production server
    "start:vite": "vite preview",     // Vite preview server
    "lint": "next lint",              // Next.js linting
    "lint:vite": "eslint .",          // Vite linting
    "export": "next export"           // Next.js static export
  }
}
```

## 🐳 **Docker Konfigürasyonları**

### **Development (Vite):**
```yaml
# docker-compose.development.yml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.vite
  environment:
    - NODE_ENV=development
    - VITE_GRAPHQL_URL=http://localhost:3002/graphql
  ports:
    - "3000:3001"
  volumes:
    - ./frontend:/usr/src/app
    - /usr/src/app/node_modules
```

### **Production (Next.js):**
```yaml
# docker-compose.production.yml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile.nextjs
  environment:
    - NODE_ENV=production
    - NEXT_PUBLIC_GRAPHQL_URL=http://core-service:3002/graphql
  deploy:
    replicas: 2
    resources:
      limits:
        memory: 512M
        cpus: '0.5'
```

## ⚡ **Performance Karşılaştırması**

### **Development (Vite):**
- **Build Time**: 2-5 saniye
- **Hot Reload**: < 100ms
- **Bundle Size**: Development optimized
- **Memory Usage**: 200-400MB

### **Production (Next.js):**
- **Build Time**: 30-60 saniye
- **First Load**: 1-3 saniye
- **Bundle Size**: Optimized chunks
- **Memory Usage**: 100-200MB

## 🔄 **Development Workflow**

### **1. Vite ile Geliştirme:**
```bash
# Development server başlat
npm run dev

# Vite ile build
npm run build:vite

# Vite preview
npm run start:vite
```

### **2. Next.js ile Geliştirme:**
```bash
# Next.js development server
npm run dev:next

# Next.js production build
npm run build

# Next.js production server
npm run start
```

### **3. Docker ile Geliştirme:**
```bash
# Development environment
docker-compose -f docker-compose.development.yml up -d

# Production environment
docker-compose -f docker-compose.production.yml up -d
```

## 🌐 **Environment Variables**

### **Development (Vite):**
```env
# .env.development
VITE_GRAPHQL_URL=http://localhost:3002/graphql
VITE_API_URL=http://localhost:3002
VITE_REALTIME_URL=http://localhost:3011
VITE_INTEGRATION_URL=http://localhost:3012
```

### **Production (Next.js):**
```env
# .env.production
NEXT_PUBLIC_GRAPHQL_URL=https://api.githubclone.com/graphql
NEXT_PUBLIC_API_URL=https://api.githubclone.com
NEXT_PUBLIC_REALTIME_URL=https://realtime.githubclone.com
NEXT_PUBLIC_INTEGRATION_URL=https://integrations.githubclone.com
```

## 🔧 **Konfigürasyon Dosyaları**

### **Vite (vite.config.ts):**
```typescript
export default defineConfig({
  plugins: [react(), PWA()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': 'http://localhost:3002',
      '/graphql': 'http://localhost:3002',
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material'],
        },
      },
    },
  },
});
```

### **Next.js (next.config.js):**
```javascript
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material'],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};
```

## 🚀 **Deployment Stratejisi**

### **Development Deployment:**
1. **Vite Development Server**: Hızlı geliştirme için
2. **Hot Module Replacement**: Anında kod değişiklikleri
3. **Development Database**: Test verileri
4. **Debug Mode**: Detaylı logging

### **Production Deployment:**
1. **Next.js Production Build**: Optimized build
2. **Server-Side Rendering**: SEO ve performance
3. **Production Database**: Gerçek veriler
4. **Monitoring**: Production monitoring

## 📊 **Monitoring ve Logging**

### **Development:**
- **Console Logs**: Browser console
- **Vite HMR**: Hot module replacement logs
- **Docker Logs**: Container logs

### **Production:**
- **Structured Logs**: JSON format
- **Metrics**: Prometheus metrics
- **Dashboards**: Grafana dashboards
- **Alerts**: Automated alerts

## 🔒 **Security Considerations**

### **Development:**
- **CORS**: Permissive CORS for development
- **Debug Mode**: Detailed error messages
- **Local Database**: No sensitive data

### **Production:**
- **CORS**: Restricted CORS
- **Error Handling**: Sanitized error messages
- **Database Security**: Encrypted connections
- **HTTPS**: SSL/TLS encryption

## 🎯 **Best Practices**

### **Development:**
1. **Use Vite for Development**: Faster development cycle
2. **Hot Reload**: Leverage HMR for faster iteration
3. **Debug Mode**: Enable detailed logging
4. **Local Testing**: Test with local services

### **Production:**
1. **Use Next.js for Production**: Better performance and SEO
2. **Optimize Builds**: Use production optimizations
3. **Monitor Performance**: Track key metrics
4. **Security First**: Implement security best practices

## 📋 **Migration Guide**

### **Vite to Next.js:**
1. **Update package.json**: Add Next.js dependencies
2. **Create Next.js config**: Configure Next.js
3. **Update Dockerfile**: Use Next.js Dockerfile
4. **Update environment variables**: Use Next.js format
5. **Test production build**: Verify functionality

### **Next.js to Vite:**
1. **Update package.json**: Add Vite dependencies
2. **Create Vite config**: Configure Vite
3. **Update Dockerfile**: Use Vite Dockerfile
4. **Update environment variables**: Use Vite format
5. **Test development build**: Verify functionality

## 🎉 **Sonuç**

Bu dual build sistemi ile:
- ✅ **Development**: Vite ile hızlı geliştirme
- ✅ **Production**: Next.js ile production-ready deployment
- ✅ **Flexibility**: Her iki sistemi de kullanabilme
- ✅ **Performance**: Her ortam için optimize edilmiş
- ✅ **Scalability**: Production'da ölçeklenebilir

**Status**: 🚀 **Dual Build System Ready** - Development ve Production için optimize edilmiş!
