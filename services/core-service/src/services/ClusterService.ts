import cluster from 'cluster';
import os from 'os';
import { logger } from '../utils/logger';

export class ClusterService {
  private static instance: ClusterService;
  private workers: Map<number, any> = new Map();
  private isMaster: boolean = cluster.isMaster;

  private constructor() {}

  static getInstance(): ClusterService {
    if (!ClusterService.instance) {
      ClusterService.instance = new ClusterService();
    }
    return ClusterService.instance;
  }

  // 🚀 Initialize cluster with optimal worker count
  initializeCluster(app: any, port: number): void {
    if (!this.isMaster) {
      // Worker process - start the application
      this.startWorker(app, port);
      return;
    }

    const numCPUs = this.getOptimalWorkerCount();
    logger.info(`🚀 Starting cluster with ${numCPUs} workers`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
      this.forkWorker();
    }

    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`);
      
      // Restart worker if it died unexpectedly
      if (!worker.exitedAfterDisconnect) {
        logger.info(`Restarting worker ${worker.process.pid}`);
        this.forkWorker();
      }
    });

    cluster.on('online', (worker) => {
      logger.info(`Worker ${worker.process.pid} is online`);
      this.workers.set(worker.process.pid, worker);
    });

    cluster.on('disconnect', (worker) => {
      logger.info(`Worker ${worker.process.pid} disconnected`);
      this.workers.delete(worker.process.pid);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  // 🎯 Start worker process
  private startWorker(app: any, port: number): void {
    const server = app.listen(port, () => {
      logger.info(`🚀 Worker ${process.pid} listening on port ${port}`);
    });

    // Graceful shutdown for workers
    process.on('SIGTERM', () => {
      logger.info(`Worker ${process.pid} shutting down gracefully`);
      server.close(() => {
        process.exit(0);
      });
    });
  }

  // 🔧 Fork new worker
  private forkWorker(): cluster.Worker {
    const worker = cluster.fork();
    
    // Set worker environment
    worker.send({ type: 'config', data: { workerId: worker.id } });
    
    return worker;
  }

  // 📊 Get optimal worker count
  private getOptimalWorkerCount(): number {
    const numCPUs = os.cpus().length;
    
    // For I/O intensive applications, use more workers than CPU cores
    // For CPU intensive applications, use fewer workers
    const optimalCount = Math.min(numCPUs * 2, 8); // Max 8 workers
    
    logger.info(`Detected ${numCPUs} CPU cores, using ${optimalCount} workers`);
    return optimalCount;
  }

  // 🔄 Graceful shutdown
  private gracefulShutdown(): void {
    logger.info('Master process shutting down gracefully');
    
    // Disconnect all workers
    for (const [pid, worker] of this.workers) {
      logger.info(`Disconnecting worker ${pid}`);
      worker.disconnect();
    }

    // Wait for workers to disconnect
    const checkWorkers = () => {
      if (this.workers.size === 0) {
        logger.info('All workers disconnected, exiting master process');
        process.exit(0);
      } else {
        setTimeout(checkWorkers, 1000);
      }
    };

    checkWorkers();
  }

  // 📈 Get cluster statistics
  getClusterStats(): any {
    return {
      isMaster: this.isMaster,
      pid: process.pid,
      workers: Array.from(this.workers.values()).map(worker => ({
        id: worker.id,
        pid: worker.process.pid,
        connected: worker.connected,
        state: worker.state
      })),
      totalWorkers: this.workers.size,
      cpuCount: os.cpus().length,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  // 🔄 Restart all workers
  restartWorkers(): void {
    if (!this.isMaster) {
      logger.warn('Cannot restart workers from worker process');
      return;
    }

    logger.info('Restarting all workers');
    
    for (const [pid, worker] of this.workers) {
      logger.info(`Restarting worker ${pid}`);
      worker.kill('SIGTERM');
    }

    // Workers will be automatically restarted by the 'exit' event handler
  }

  // 📊 Broadcast message to all workers
  broadcastToWorkers(message: any): void {
    if (!this.isMaster) {
      logger.warn('Cannot broadcast from worker process');
      return;
    }

    for (const [pid, worker] of this.workers) {
      worker.send(message);
    }
  }
}

// 🚀 Process management utilities
export class ProcessManager {
  private static instance: ProcessManager;
  private startTime: number = Date.now();

  private constructor() {}

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  // 📊 Get process information
  getProcessInfo(): any {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      pid: process.pid,
      uptime: process.uptime(),
      startTime: this.startTime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      platform: process.platform,
      nodeVersion: process.version,
      argv: process.argv,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    };
  }

  // 🔧 Optimize process settings
  optimizeProcess(): void {
    // Increase max listeners
    process.setMaxListeners(20);
    
    // Optimize garbage collection
    if (global.gc) {
      setInterval(() => {
        if (process.memoryUsage().heapUsed > 100 * 1024 * 1024) { // 100MB
          global.gc();
          logger.debug('Garbage collection triggered');
        }
      }, 30000); // Every 30 seconds
    }

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    logger.info('Process optimization applied');
  }

  // 📈 Monitor process health
  startHealthMonitoring(): void {
    setInterval(() => {
      const info = this.getProcessInfo();
      const memoryUsagePercent = (info.memory.heapUsed / info.memory.heapTotal) * 100;
      
      if (memoryUsagePercent > 90) {
        logger.warn(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      if (info.memory.heapUsed > 200 * 1024 * 1024) { // 200MB
        logger.warn(`High heap usage: ${info.memory.heapUsed / 1024 / 1024}MB`);
      }
    }, 10000); // Check every 10 seconds
  }
}
