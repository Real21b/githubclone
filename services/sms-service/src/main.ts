import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { KafkaService } from './services/KafkaService';
import { SMSService } from './services/SMSService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { SMSController } from './controllers/SMSController';

const app = express();
const PORT = process.env.PORT || 3006;

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

// 🎯 Advanced rate limiting for SMS (more restrictive)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Lower limit for SMS sending
  message: 'Too many SMS requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '1mb' // Smaller limit for SMS
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '1mb' 
}));

// Initialize services
const kafkaService = new KafkaService();
const smsService = new SMSService(kafkaService);
const smsController = new SMSController(smsService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'sms-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      sms: await smsService.getSMSProviderStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'sms-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await smsService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 📱 SMS routes
app.post('/sms/send', smsController.sendSMS.bind(smsController));
app.post('/sms/send-bulk', smsController.sendBulkSMS.bind(smsController));
app.post('/sms/send-template', smsController.sendTemplateSMS.bind(smsController));
app.get('/sms/status/:id', smsController.getSMSStatus.bind(smsController));
app.get('/sms/history/:userId', smsController.getSMSHistory.bind(smsController));
app.post('/sms/webhook/twilio', smsController.handleTwilioWebhook.bind(smsController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await smsService.start();

    logger.info('📱 SMS Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`📱 SMS Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    logger.error('Failed to start SMS Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SMS Service shutting down gracefully');
  await kafkaService.disconnect();
  await smsService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SMS Service shutting down gracefully');
  await kafkaService.disconnect();
  await smsService.disconnect();
  process.exit(0);
});

startServer();

export default app;
