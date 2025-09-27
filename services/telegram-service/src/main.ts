import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import { KafkaService } from './services/KafkaService';
import { TelegramService } from './services/TelegramService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { TelegramController } from './controllers/TelegramController';

const app = express();
const PORT = process.env.PORT || 3009;

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

// 🎯 Advanced rate limiting for Telegram
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Higher limit for Telegram
  message: 'Too many Telegram requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics' || req.path === '/webhook';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '10mb' // Larger limit for Telegram media
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// File upload configuration for media
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB (Telegram limit)
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Initialize services
const kafkaService = new KafkaService();
const telegramService = new TelegramService(kafkaService);
const telegramController = new TelegramController(telegramService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'telegram-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      telegram: await telegramService.getTelegramStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'telegram-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await telegramService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 📱 Telegram routes
app.post('/telegram/send-message', telegramController.sendMessage.bind(telegramController));
app.post('/telegram/send-media', upload.single('media'), telegramController.sendMedia.bind(telegramController));
app.post('/telegram/send-bulk', telegramController.sendBulkMessage.bind(telegramController));
app.post('/telegram/send-template', telegramController.sendTemplateMessage.bind(telegramController));

app.post('/telegram/send-photo', upload.single('photo'), telegramController.sendPhoto.bind(telegramController));
app.post('/telegram/send-document', upload.single('document'), telegramController.sendDocument.bind(telegramController));
app.post('/telegram/send-location', telegramController.sendLocation.bind(telegramController));
app.post('/telegram/send-contact', telegramController.sendContact.bind(telegramController));

app.get('/telegram/bot-info', telegramController.getBotInfo.bind(telegramController));
app.get('/telegram/updates', telegramController.getUpdates.bind(telegramController));
app.get('/telegram/webhook-info', telegramController.getWebhookInfo.bind(telegramController));

app.post('/telegram/set-webhook', telegramController.setWebhook.bind(telegramController));
app.post('/telegram/delete-webhook', telegramController.deleteWebhook.bind(telegramController));
app.post('/telegram/webhook', telegramController.handleWebhook.bind(telegramController));

app.get('/telegram/chats', telegramController.getChats.bind(telegramController));
app.get('/telegram/chats/:chatId', telegramController.getChat.bind(telegramController));
app.get('/telegram/chats/:chatId/members', telegramController.getChatMembers.bind(telegramController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await telegramService.start();

    logger.info('📱 Telegram Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`📱 Telegram Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    logger.error('Failed to start Telegram Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Telegram Service shutting down gracefully');
  await kafkaService.disconnect();
  await telegramService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Telegram Service shutting down gracefully');
  await kafkaService.disconnect();
  await telegramService.disconnect();
  process.exit(0);
});

startServer();

export default app;
