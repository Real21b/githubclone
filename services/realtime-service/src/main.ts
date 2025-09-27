import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { KafkaService } from './services/KafkaService';
import { RealtimeService } from './services/RealtimeService';
import { RoomService } from './services/RoomService';
import { PresenceService } from './services/PresenceService';
import { CollaborationService } from './services/CollaborationService';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { RealtimeController } from './controllers/RealtimeController';
import { authMiddleware } from './middleware/auth';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true
});

const PORT = process.env.PORT || 3011;

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

// 🎯 Rate limiting for WebSocket connections
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for real-time connections
  message: 'Too many real-time requests',
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
const roomService = new RoomService();
const presenceService = new PresenceService();
const collaborationService = new CollaborationService();
const realtimeService = new RealtimeService(io, kafkaService, roomService, presenceService, collaborationService);

const realtimeController = new RealtimeController(realtimeService);

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      service: 'realtime-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      kafka: await kafkaService.getHealthStatus(),
      redis: await realtimeService.getRedisStatus(),
      connections: realtimeService.getConnectionCount(),
      rooms: realtimeService.getRoomCount()
    };

    res.json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      service: 'realtime-service',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await realtimeService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// 🔐 Authentication middleware for HTTP routes
app.use('/api', authMiddleware);

// 📡 Real-time API routes
app.get('/api/rooms', realtimeController.getRooms.bind(realtimeController));
app.post('/api/rooms', realtimeController.createRoom.bind(realtimeController));
app.get('/api/rooms/:roomId', realtimeController.getRoom.bind(realtimeController));
app.put('/api/rooms/:roomId', realtimeController.updateRoom.bind(realtimeController));
app.delete('/api/rooms/:roomId', realtimeController.deleteRoom.bind(realtimeController));
app.post('/api/rooms/:roomId/join', realtimeController.joinRoom.bind(realtimeController));
app.post('/api/rooms/:roomId/leave', realtimeController.leaveRoom.bind(realtimeController));

// 👥 Presence API routes
app.get('/api/presence', realtimeController.getPresence.bind(realtimeController));
app.get('/api/presence/:userId', realtimeController.getUserPresence.bind(realtimeController));
app.put('/api/presence/:userId', realtimeController.updateUserPresence.bind(realtimeController));

// 🤝 Collaboration API routes
app.get('/api/collaboration/:roomId', realtimeController.getCollaboration.bind(realtimeController));
app.post('/api/collaboration/:roomId/start', realtimeController.startCollaboration.bind(realtimeController));
app.post('/api/collaboration/:roomId/stop', realtimeController.stopCollaboration.bind(realtimeController));

// 📊 Analytics routes
app.get('/api/analytics/connections', realtimeController.getConnectionAnalytics.bind(realtimeController));
app.get('/api/analytics/rooms', realtimeController.getRoomAnalytics.bind(realtimeController));
app.get('/api/analytics/messages', realtimeController.getMessageAnalytics.bind(realtimeController));

// WebSocket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const user = await realtimeService.authenticateUser(token);
    if (!user) {
      return next(new Error('Invalid authentication token'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// WebSocket connection handling
io.on('connection', async (socket) => {
  const user = socket.data.user;
  
  logger.info('🔌 Real-time client connected', {
    socketId: socket.id,
    userId: user.id,
    userEmail: user.email
  });

  // Join user to their personal room
  await realtimeService.joinUserRoom(socket, user.id);

  // Handle room operations
  socket.on('join-room', async (data) => {
    try {
      await realtimeService.joinRoom(socket, data.roomId, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leave-room', async (data) => {
    try {
      await realtimeService.leaveRoom(socket, data.roomId, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle messaging
  socket.on('send-message', async (data) => {
    try {
      await realtimeService.sendMessage(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle presence updates
  socket.on('update-presence', async (data) => {
    try {
      await realtimeService.updatePresence(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle collaboration events
  socket.on('collaboration-start', async (data) => {
    try {
      await realtimeService.startCollaboration(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('collaboration-update', async (data) => {
    try {
      await realtimeService.updateCollaboration(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('collaboration-stop', async (data) => {
    try {
      await realtimeService.stopCollaboration(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', async (data) => {
    try {
      await realtimeService.startTyping(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('typing-stop', async (data) => {
    try {
      await realtimeService.stopTyping(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle file sharing
  socket.on('share-file', async (data) => {
    try {
      await realtimeService.shareFile(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle screen sharing
  socket.on('screen-share-start', async (data) => {
    try {
      await realtimeService.startScreenShare(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('screen-share-stop', async (data) => {
    try {
      await realtimeService.stopScreenShare(socket, data, user.id);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async (reason) => {
    logger.info('🔌 Real-time client disconnected', {
      socketId: socket.id,
      userId: user.id,
      reason
    });

    await realtimeService.handleDisconnect(socket, user.id);
  });

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to real-time service',
    userId: user.id,
    timestamp: new Date().toISOString()
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
    await realtimeService.start();

    logger.info('🔌 Real-time Service initialized successfully');

    server.listen(PORT, () => {
      logger.info(`🔌 Real-time Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📈 Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start Real-time Service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Real-time Service shutting down gracefully');
  await kafkaService.disconnect();
  await realtimeService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Real-time Service shutting down gracefully');
  await kafkaService.disconnect();
  await realtimeService.disconnect();
  process.exit(0);
});

startServer();

export default app;
