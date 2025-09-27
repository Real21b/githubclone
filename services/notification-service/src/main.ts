import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { KafkaService } from './services/KafkaService';
import { NotificationService } from './services/NotificationService';
import { RedisService } from './services/RedisService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { NotificationController } from './controllers/NotificationController';

const app = express();
const PORT = process.env.PORT || 3004;

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
  contentSecurityPolicy: false,
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
  max: 1000, // Higher limit for notifications
  message: 'Too many notification requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '10mb'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Initialize services
const kafkaService = new KafkaService();
const redisService = new RedisService();
const notificationService = new NotificationService(kafkaService, redisService);
const notificationController = new NotificationController(notificationService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      redis: await redisService.getHealthStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'notification-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await notificationService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 🔔 Notification routes
app.post('/notifications/send', notificationController.sendNotification.bind(notificationController));
app.get('/notifications/:userId', notificationController.getUserNotifications.bind(notificationController));
app.put('/notifications/:id/read', notificationController.markAsRead.bind(notificationController));
app.delete('/notifications/:id', notificationController.deleteNotification.bind(notificationController));
app.post('/notifications/subscribe', notificationController.subscribeToTopics.bind(notificationController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await redisService.connect();
    await notificationService.start();

    logger.info('🚀 Notification Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`🔔 Notification Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    logger.error('Failed to start Notification Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Notification Service shutting down gracefully');
  await kafkaService.disconnect();
  await redisService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Notification Service shutting down gracefully');
  await kafkaService.disconnect();
  await redisService.disconnect();
  process.exit(0);
});

startServer();

export default app;
