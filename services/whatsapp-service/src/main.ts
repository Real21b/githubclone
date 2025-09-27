import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import { KafkaService } from './services/KafkaService';
import { WhatsAppService } from './services/WhatsAppService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { WhatsAppController } from './controllers/WhatsAppController';

const app = express();
const PORT = process.env.PORT || 3008;

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

// 🎯 Advanced rate limiting for WhatsApp (strict)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for WhatsApp
  message: 'Too many WhatsApp requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics' || req.path === '/webhook';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '5mb' // Medium limit for WhatsApp media
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '5mb' 
}));

// File upload configuration for media
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx|txt/;
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
const whatsappService = new WhatsAppService(kafkaService);
const whatsappController = new WhatsAppController(whatsappService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'whatsapp-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      whatsapp: await whatsappService.getWhatsAppStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'whatsapp-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await whatsappService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 📱 WhatsApp routes
app.post('/whatsapp/send-message', whatsappController.sendMessage.bind(whatsappController));
app.post('/whatsapp/send-media', upload.single('media'), whatsappController.sendMedia.bind(whatsappController));
app.post('/whatsapp/send-bulk', whatsappController.sendBulkMessage.bind(whatsappController));
app.post('/whatsapp/send-template', whatsappController.sendTemplateMessage.bind(whatsappController));

app.get('/whatsapp/qr', whatsappController.getQRCode.bind(whatsappController));
app.get('/whatsapp/status', whatsappController.getConnectionStatus.bind(whatsappController));
app.post('/whatsapp/disconnect', whatsappController.disconnect.bind(whatsappController));
app.post('/whatsapp/reconnect', whatsappController.reconnect.bind(whatsappController));

app.get('/whatsapp/contacts', whatsappController.getContacts.bind(whatsappController));
app.get('/whatsapp/chats', whatsappController.getChats.bind(whatsappController));
app.get('/whatsapp/messages/:chatId', whatsappController.getMessages.bind(whatsappController));

app.post('/whatsapp/webhook', whatsappController.handleWebhook.bind(whatsappController));
app.get('/whatsapp/webhook', whatsappController.verifyWebhook.bind(whatsappController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await whatsappService.start();

    logger.info('📱 WhatsApp Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`📱 WhatsApp Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    logger.error('Failed to start WhatsApp Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('WhatsApp Service shutting down gracefully');
  await kafkaService.disconnect();
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('WhatsApp Service shutting down gracefully');
  await kafkaService.disconnect();
  await whatsappService.disconnect();
  process.exit(0);
});

startServer();

export default app;
