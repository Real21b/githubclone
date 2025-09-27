import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { KafkaService } from './services/KafkaService';
import { EmailService } from './services/EmailService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { EmailController } from './controllers/EmailController';

const app = express();
const PORT = process.env.PORT || 3005;

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
  max: 100, // Lower limit for email sending
  message: 'Too many email requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '5mb'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '5mb' 
}));

// Initialize services
const kafkaService = new KafkaService();
const emailService = new EmailService(kafkaService);
const emailController = new EmailController(emailService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'email-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      smtp: await emailService.getSMTPStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'email-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await emailService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 📧 Email routes
app.post('/emails/send', emailController.sendEmail.bind(emailController));
app.post('/emails/send-template', emailController.sendTemplateEmail.bind(emailController));
app.get('/emails/status/:id', emailController.getEmailStatus.bind(emailController));
app.get('/emails/history/:userId', emailController.getEmailHistory.bind(emailController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await emailService.start();

    logger.info('📧 Email Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`📧 Email Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    logger.error('Failed to start Email Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Email Service shutting down gracefully');
  await kafkaService.disconnect();
  await emailService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Email Service shutting down gracefully');
  await kafkaService.disconnect();
  await emailService.disconnect();
  process.exit(0);
});

startServer();

export default app;
