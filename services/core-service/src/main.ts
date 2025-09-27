import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { UserResolver } from './resolvers/UserResolver';
import { RepositoryResolver } from './resolvers/RepositoryResolver';
import { HealthResolver } from './resolvers/HealthResolver';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { OptimizedDatabaseService } from './services/OptimizedDatabaseService';
import { AdvancedCacheService } from './services/AdvancedCacheService';
import { ClusterService } from './services/ClusterService';
import { ProcessManager } from './services/ClusterService';
import { PerformanceMonitor } from './services/PerformanceMonitor';

const app = express();
const PORT = process.env.PORT || 3002;

// 🚀 Ultra-performance optimizations
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for GraphQL playground
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🎯 Advanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit for better performance
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    // Store raw body for GraphQL
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// 🏥 Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const startTime = performance.now();
  
  try {
    const healthCheck = {
      status: 'OK',
      service: 'core-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      cluster: ClusterService.getInstance().getClusterStats(),
      performance: PerformanceMonitor.getInstance().getSystemOverview()
    };

    const responseTime = performance.now() - startTime;
    PerformanceMonitor.getInstance().recordHealthCheck('core-service', 'healthy', responseTime);
    
    res.json(healthCheck);
  } catch (error) {
    const responseTime = performance.now() - startTime;
    PerformanceMonitor.getInstance().recordHealthCheck('core-service', 'unhealthy', responseTime, error.message);
    
    res.status(503).json({
      status: 'ERROR',
      service: 'core-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Performance metrics endpoint
app.get('/metrics', (req, res) => {
  try {
    const metrics = PerformanceMonitor.getInstance().getSystemOverview();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // 🚀 Initialize optimized services
    const databaseService = new OptimizedDatabaseService();
    const cacheService = new AdvancedCacheService();
    const processManager = ProcessManager.getInstance();
    
    // Optimize process settings
    processManager.optimizeProcess();
    processManager.startHealthMonitoring();
    
    await databaseService.connect();
    await cacheService.connect();
    
    // Create optimized database indexes
    await databaseService.createOptimizedIndexes();

    // Build GraphQL schema
    const schema = await buildSchema({
      resolvers: [UserResolver, RepositoryResolver, HealthResolver],
      validate: false,
    });

    // 🚀 Create optimized Apollo Server
    const server = new ApolloServer({
      schema,
      context: ({ req }) => ({
        req,
        databaseService,
        cacheService,
        user: req.user, // From auth middleware
        performanceMonitor: PerformanceMonitor.getInstance()
      }),
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
      // Performance optimizations
      cacheControl: {
        defaultMaxAge: 300, // 5 minutes
        calculateHttpHeaders: true,
        stripFormattedExtensions: false
      },
      plugins: [
        // Custom plugin for performance monitoring
        {
          requestDidStart() {
            return {
              willSendResponse(requestContext) {
                const { request, response } = requestContext;
                const startTime = request.http?.headers?.startTime || Date.now();
                
                PerformanceMonitor.getInstance().trackRequest(
                  'core-service',
                  '/graphql',
                  'POST',
                  startTime,
                  response.http?.status || 200,
                  request.http?.body?.length || 0,
                  response.http?.body?.length || 0
                );
              }
            };
          }
        }
      ]
    });

    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    // 🎯 Start server with clustering
    const clusterService = ClusterService.getInstance();
    clusterService.initializeCluster(app, PORT);

    logger.info(`🚀 Ultra-Optimized Core Service initialized`);
    logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);

  } catch (error) {
    logger.error('Failed to start Core Service:', error);
    process.exit(1);
  }
}

startServer();

export default app;
