import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import multer from 'multer';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { KafkaService } from './services/KafkaService';
import { AIService } from './services/AIService';
import { AgentService } from './services/AgentService';
import { PromptService } from './services/PromptService';
import { TaskService } from './services/TaskService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { AIController } from './controllers/AIController';
import { AgentController } from './controllers/AgentController';
import { TaskController } from './controllers/TaskController';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3010;

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

// 🎯 Advanced rate limiting for AI (higher limits)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for AI operations
  message: 'Too many AI requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// 🚀 Optimized body parsing
app.use(express.json({ 
  limit: '50mb' // Large limit for AI content
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// File upload configuration for AI documents
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|md|json|xml|html|png|jpg|jpeg|gif|mp4|mp3|wav/;
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
const aiService = new AIService(kafkaService);
const agentService = new AgentService(aiService, kafkaService);
const promptService = new PromptService();
const taskService = new TaskService(agentService, kafkaService);

const aiController = new AIController(aiService, promptService);
const agentController = new AgentController(agentService);
const taskController = new TaskController(taskService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'ai-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      ai: await aiService.getAIStatus(),
      agents: await agentService.getAgentStatus(),
      tasks: await taskService.getTaskStatus()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'ai-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      ai: await aiService.getMetrics(),
      agents: await agentService.getMetrics(),
      tasks: await taskService.getMetrics()
    };
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 🤖 AI routes
app.post('/ai/chat', aiController.chat.bind(aiController));
app.post('/ai/complete', aiController.complete.bind(aiController));
app.post('/ai/generate', aiController.generate.bind(aiController));
app.post('/ai/analyze', upload.array('files', 10), aiController.analyze.bind(aiController));
app.post('/ai/translate', aiController.translate.bind(aiController));
app.post('/ai/summarize', aiController.summarize.bind(aiController));
app.post('/ai/extract', upload.array('files', 10), aiController.extract.bind(aiController));
app.post('/ai/classify', aiController.classify.bind(aiController));
app.post('/ai/sentiment', aiController.sentiment.bind(aiController));

// 🎯 Agent routes
app.post('/agents/create', agentController.createAgent.bind(agentController));
app.get('/agents', agentController.getAgents.bind(agentController));
app.get('/agents/:id', agentController.getAgent.bind(agentController));
app.put('/agents/:id', agentController.updateAgent.bind(agentController));
app.delete('/agents/:id', agentController.deleteAgent.bind(agentController));
app.post('/agents/:id/execute', agentController.executeAgent.bind(agentController));
app.post('/agents/:id/chat', agentController.chatWithAgent.bind(agentController));

// 📋 Task routes
app.post('/tasks/create', taskController.createTask.bind(taskController));
app.get('/tasks', taskController.getTasks.bind(taskController));
app.get('/tasks/:id', taskController.getTask.bind(taskController));
app.put('/tasks/:id', taskController.updateTask.bind(taskController));
app.delete('/tasks/:id', taskController.deleteTask.bind(taskController));
app.post('/tasks/:id/execute', taskController.executeTask.bind(taskController));
app.get('/tasks/:id/status', taskController.getTaskStatus.bind(taskController));
app.get('/tasks/:id/result', taskController.getTaskResult.bind(taskController));

// 🔧 Prompt routes
app.get('/prompts', aiController.getPrompts.bind(aiController));
app.post('/prompts', aiController.createPrompt.bind(aiController));
app.get('/prompts/:id', aiController.getPrompt.bind(aiController));
app.put('/prompts/:id', aiController.updatePrompt.bind(aiController));
app.delete('/prompts/:id', aiController.deletePrompt.bind(aiController));

// 📊 Analytics routes
app.get('/analytics/usage', aiController.getUsageAnalytics.bind(aiController));
app.get('/analytics/performance', aiController.getPerformanceAnalytics.bind(aiController));
app.get('/analytics/costs', aiController.getCostAnalytics.bind(aiController));

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('🤖 AI Service WebSocket client connected', { socketId: socket.id });

  socket.on('join-task', (taskId) => {
    socket.join(`task-${taskId}`);
    logger.info('🤖 Client joined task room', { socketId: socket.id, taskId });
  });

  socket.on('leave-task', (taskId) => {
    socket.leave(`task-${taskId}`);
    logger.info('🤖 Client left task room', { socketId: socket.id, taskId });
  });

  socket.on('disconnect', () => {
    logger.info('🤖 AI Service WebSocket client disconnected', { socketId: socket.id });
  });
});

// Make io available to services
app.set('io', io);

// Error handling
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize services
    await kafkaService.initialize();
    await aiService.start();
    await agentService.start();
    await taskService.start();

    logger.info('🤖 AI Service initialized successfully');

    server.listen(PORT, () => {
      logger.info(`🤖 AI Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start AI Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('AI Service shutting down gracefully');
  await kafkaService.disconnect();
  await aiService.disconnect();
  await agentService.disconnect();
  await taskService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('AI Service shutting down gracefully');
  await kafkaService.disconnect();
  await aiService.disconnect();
  await agentService.disconnect();
  await taskService.disconnect();
  process.exit(0);
});

startServer();

export default app;
