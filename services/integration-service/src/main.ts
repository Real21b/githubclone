import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import { KafkaService } from './services/KafkaService';
import { PluginService } from './services/PluginService';
import { IntegrationService } from './services/IntegrationService';
import { WebhookService } from './services/WebhookService';
import { MarketplaceService } from './services/MarketplaceService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { IntegrationController } from './controllers/IntegrationController';
import { PluginController } from './controllers/PluginController';
import { WebhookController } from './controllers/WebhookController';
import { MarketplaceController } from './controllers/MarketplaceController';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3012;

// 🚀 Performance optimizations
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
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🎯 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many integration requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '50mb' // Large limit for plugin uploads
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb'
}));

// File upload configuration for plugins
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /zip|tar|gz|json|yaml|yml|js|ts/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type for plugin'));
    }
  }
});

// Initialize services
const kafkaService = new KafkaService();
const pluginService = new PluginService(kafkaService);
const integrationService = new IntegrationService(kafkaService);
const webhookService = new WebhookService(kafkaService);
const marketplaceService = new MarketplaceService();

const integrationController = new IntegrationController(integrationService);
const pluginController = new PluginController(pluginService);
const webhookController = new WebhookController(webhookService);
const marketplaceController = new MarketplaceController(marketplaceService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'integration-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      plugins: await pluginService.getPluginCount(),
      integrations: await integrationService.getIntegrationCount(),
      webhooks: await webhookService.getWebhookCount()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'integration-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      plugins: await pluginService.getMetrics(),
      integrations: await integrationService.getMetrics(),
      webhooks: await webhookService.getMetrics(),
      marketplace: await marketplaceService.getMetrics()
    };
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 🔐 Authentication middleware for API routes
app.use('/api', authMiddleware);

// 🔌 Plugin routes
app.get('/api/plugins', pluginController.getPlugins.bind(pluginController));
app.post('/api/plugins', upload.single('plugin'), pluginController.installPlugin.bind(pluginController));
app.get('/api/plugins/:id', pluginController.getPlugin.bind(pluginController));
app.put('/api/plugins/:id', pluginController.updatePlugin.bind(pluginController));
app.delete('/api/plugins/:id', pluginController.uninstallPlugin.bind(pluginController));
app.post('/api/plugins/:id/activate', pluginController.activatePlugin.bind(pluginController));
app.post('/api/plugins/:id/deactivate', pluginController.deactivatePlugin.bind(pluginController));
app.post('/api/plugins/:id/configure', pluginController.configurePlugin.bind(pluginController));
app.get('/api/plugins/:id/logs', pluginController.getPluginLogs.bind(pluginController));

// 🔗 Integration routes
app.get('/api/integrations', integrationController.getIntegrations.bind(integrationController));
app.post('/api/integrations', integrationController.createIntegration.bind(integrationController));
app.get('/api/integrations/:id', integrationController.getIntegration.bind(integrationController));
app.put('/api/integrations/:id', integrationController.updateIntegration.bind(integrationController));
app.delete('/api/integrations/:id', integrationController.deleteIntegration.bind(integrationController));
app.post('/api/integrations/:id/test', integrationController.testIntegration.bind(integrationController));
app.post('/api/integrations/:id/sync', integrationController.syncIntegration.bind(integrationController));

// 🪝 Webhook routes
app.get('/api/webhooks', webhookController.getWebhooks.bind(webhookController));
app.post('/api/webhooks', webhookController.createWebhook.bind(webhookController));
app.get('/api/webhooks/:id', webhookController.getWebhook.bind(webhookController));
app.put('/api/webhooks/:id', webhookController.updateWebhook.bind(webhookController));
app.delete('/api/webhooks/:id', webhookController.deleteWebhook.bind(webhookController));
app.post('/api/webhooks/:id/test', webhookController.testWebhook.bind(webhookController));
app.get('/api/webhooks/:id/logs', webhookController.getWebhookLogs.bind(webhookController));

// 🏪 Marketplace routes
app.get('/api/marketplace', marketplaceController.getMarketplace.bind(marketplaceController));
app.get('/api/marketplace/categories', marketplaceController.getCategories.bind(marketplaceController));
app.get('/api/marketplace/plugins', marketplaceController.getMarketplacePlugins.bind(marketplaceController));
app.get('/api/marketplace/plugins/:id', marketplaceController.getMarketplacePlugin.bind(marketplaceController));
app.post('/api/marketplace/plugins/:id/install', marketplaceController.installFromMarketplace.bind(marketplaceController));
app.get('/api/marketplace/search', marketplaceController.searchPlugins.bind(marketplaceController));

// 📊 Analytics routes
app.get('/api/analytics/plugins', pluginController.getPluginAnalytics.bind(pluginController));
app.get('/api/analytics/integrations', integrationController.getIntegrationAnalytics.bind(integrationController));
app.get('/api/analytics/webhooks', webhookController.getWebhookAnalytics.bind(webhookController));

// 🔧 System routes
app.get('/api/system/status', integrationController.getSystemStatus.bind(integrationController));
app.post('/api/system/backup', integrationController.createBackup.bind(integrationController));
app.post('/api/system/restore', upload.single('backup'), integrationController.restoreBackup.bind(integrationController));
app.get('/api/system/logs', integrationController.getSystemLogs.bind(integrationController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await pluginService.start();
    await integrationService.start();
    await webhookService.start();
    await marketplaceService.start();

    logger.info('🔌 Integration Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`🔌 Integration Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`🔌 API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to start Integration Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Integration Service shutting down gracefully');
  await kafkaService.disconnect();
  await pluginService.disconnect();
  await integrationService.disconnect();
  await webhookService.disconnect();
  await marketplaceService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Integration Service shutting down gracefully');
  await kafkaService.disconnect();
  await pluginService.disconnect();
  await integrationService.disconnect();
  await webhookService.disconnect();
  await marketplaceService.disconnect();
  process.exit(0);
});

startServer();

export default app;
