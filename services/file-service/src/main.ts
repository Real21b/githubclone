import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileRoutes } from './routes/file';
import { healthRoutes } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { FileService } from './services/FileService';
import { CacheService } from './services/CacheService';

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize services
const fileService = new FileService();
const cacheService = new CacheService();

// Make services available to routes
app.use((req: any, res, next) => {
  req.fileService = fileService;
  req.cacheService = cacheService;
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/files', fileRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {
  try {
    await cacheService.connect();
    logger.info(`🚀 File Service running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start File Service:', error);
    process.exit(1);
  }
});

export default app;
