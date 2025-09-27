import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import { KafkaService } from './services/KafkaService';
import { WordPressService } from './services/WordPressService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { WordPressController } from './controllers/WordPressController';

const app = express();
const PORT = process.env.PORT || 3007;

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🎯 Advanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for WordPress operations
  message: 'Too many WordPress requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '10mb' // Larger limit for WordPress content
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
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
const wordpressService = new WordPressService(kafkaService);
const wordpressController = new WordPressController(wordpressService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'wordpress-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      wordpress: await wordpressService.getWordPressStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'wordpress-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await wordpressService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 🌐 WordPress routes
app.post('/wordpress/posts', wordpressController.createPost.bind(wordpressController));
app.get('/wordpress/posts', wordpressController.getPosts.bind(wordpressController));
app.get('/wordpress/posts/:id', wordpressController.getPost.bind(wordpressController));
app.put('/wordpress/posts/:id', wordpressController.updatePost.bind(wordpressController));
app.delete('/wordpress/posts/:id', wordpressController.deletePost.bind(wordpressController));

app.post('/wordpress/media', upload.array('files', 5), wordpressController.uploadMedia.bind(wordpressController));
app.get('/wordpress/media', wordpressController.getMedia.bind(wordpressController));
app.get('/wordpress/media/:id', wordpressController.getMediaItem.bind(wordpressController));
app.delete('/wordpress/media/:id', wordpressController.deleteMedia.bind(wordpressController));

app.get('/wordpress/categories', wordpressController.getCategories.bind(wordpressController));
app.post('/wordpress/categories', wordpressController.createCategory.bind(wordpressController));
app.get('/wordpress/tags', wordpressController.getTags.bind(wordpressController));
app.post('/wordpress/tags', wordpressController.createTag.bind(wordpressController));

app.get('/wordpress/users', wordpressController.getUsers.bind(wordpressController));
app.get('/wordpress/users/:id', wordpressController.getUser.bind(wordpressController));

app.post('/wordpress/sync', wordpressController.syncContent.bind(wordpressController));
app.get('/wordpress/export', wordpressController.exportContent.bind(wordpressController));

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await wordpressService.start();

    logger.info('🌐 WordPress Service initialized successfully');

    app.listen(PORT, () => {
      logger.info(`🌐 WordPress Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
    });

  } catch (error) {
    logger.error('Failed to start WordPress Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('WordPress Service shutting down gracefully');
  await kafkaService.disconnect();
  await wordpressService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('WordPress Service shutting down gracefully');
  await kafkaService.disconnect();
  await wordpressService.disconnect();
  process.exit(0);
});

startServer();

export default app;
