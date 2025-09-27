import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  timestamp: number;
  service: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  memoryUsage: number;
  cpuUsage: number;
  requestSize: number;
  responseSize: number;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  responseTime: number;
  error?: string;
}

interface AlertRule {
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private healthChecks: HealthCheck[] = [];
  private alertRules: AlertRule[] = [];
  private startTime: number = Date.now();

  private constructor() {
    super();
    this.initializeAlertRules();
    this.startMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 🚀 Record performance metrics
  recordMetric(data: Omit<PerformanceMetrics, 'timestamp'>): void {
    const metric: PerformanceMetrics = {
      ...data,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check alert rules
    this.checkAlertRules(metric);

    // Emit metric event for real-time monitoring
    this.emit('metric', metric);
  }

  // 🎯 Track request performance
  trackRequest(
    service: string,
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    requestSize: number = 0,
    responseSize: number = 0
  ): void {
    const responseTime = performance.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const cpuUsage = process.cpuUsage().user / 1000000; // Convert to seconds

    this.recordMetric({
      service,
      endpoint,
      method,
      responseTime: Math.round(responseTime * 100) / 100,
      statusCode,
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      requestSize,
      responseSize
    });
  }

  // 🏥 Record health check
  recordHealthCheck(service: string, status: HealthCheck['status'], responseTime: number, error?: string): void {
    const healthCheck: HealthCheck = {
      service,
      status,
      timestamp: Date.now(),
      responseTime: Math.round(responseTime * 100) / 100,
      error
    };

    this.healthChecks.push(healthCheck);
    
    // Keep only last 100 health checks
    if (this.healthChecks.length > 100) {
      this.healthChecks = this.healthChecks.slice(-100);
    }

    this.emit('healthCheck', healthCheck);
  }

  // 📊 Get performance statistics
  getPerformanceStats(timeWindow: number = 300000): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  // 🎯 Get service statistics
  getServiceStats(service: string, timeWindow: number = 300000): any {
    const stats = this.getPerformanceStats(timeWindow);
    const serviceStats = stats.filter(metric => metric.service === service);

    if (serviceStats.length === 0) {
      return null;
    }

    const responseTimes = serviceStats.map(s => s.responseTime);
    const statusCodes = serviceStats.map(s => s.statusCode);
    const memoryUsages = serviceStats.map(s => s.memoryUsage);

    return {
      service,
      totalRequests: serviceStats.length,
      averageResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length * 100) / 100,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      successRate: Math.round((statusCodes.filter(code => code >= 200 && code < 300).length / statusCodes.length) * 100),
      averageMemoryUsage: Math.round(memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length * 100) / 100,
      statusCodeDistribution: this.getStatusCodeDistribution(statusCodes),
      timeWindow: timeWindow
    };
  }

  // 📈 Get system overview
  getSystemOverview(): any {
    const stats = this.getPerformanceStats();
    const services = [...new Set(stats.map(s => s.service))];
    
    const overview = {
      uptime: Date.now() - this.startTime,
      totalRequests: stats.length,
      services: services.map(service => this.getServiceStats(service)),
      systemHealth: this.getSystemHealth(),
      alerts: this.getActiveAlerts(),
      timestamp: Date.now()
    };

    return overview;
  }

  // 🚨 Initialize alert rules
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        name: 'High Response Time',
        condition: (metric) => metric.responseTime > 1000,
        severity: 'high',
        message: `Response time ${metric.responseTime}ms exceeds 1000ms threshold for ${metric.service}/${metric.endpoint}`
      },
      {
        name: 'Very High Response Time',
        condition: (metric) => metric.responseTime > 5000,
        severity: 'critical',
        message: `Response time ${metric.responseTime}ms exceeds 5000ms threshold for ${metric.service}/${metric.endpoint}`
      },
      {
        name: 'High Memory Usage',
        condition: (metric) => metric.memoryUsage > 200,
        severity: 'medium',
        message: `Memory usage ${metric.memoryUsage}MB exceeds 200MB threshold`
      },
      {
        name: 'Server Error',
        condition: (metric) => metric.statusCode >= 500,
        severity: 'high',
        message: `Server error ${metric.statusCode} for ${metric.service}/${metric.endpoint}`
      },
      {
        name: 'Client Error Rate',
        condition: (metric) => metric.statusCode >= 400 && metric.statusCode < 500,
        severity: 'low',
        message: `Client error ${metric.statusCode} for ${metric.service}/${metric.endpoint}`
      }
    ];
  }

  // 🔍 Check alert rules
  private checkAlertRules(metric: PerformanceMetrics): void {
    for (const rule of this.alertRules) {
      if (rule.condition(metric)) {
        const alert = {
          rule: rule.name,
          severity: rule.severity,
          message: rule.message,
          metric,
          timestamp: Date.now()
        };

        this.emit('alert', alert);
        
        // Log critical alerts
        if (rule.severity === 'critical') {
          logger.error('CRITICAL ALERT:', alert);
        } else if (rule.severity === 'high') {
          logger.warn('HIGH ALERT:', alert);
        }
      }
    }
  }

  // 🏥 Get system health
  private getSystemHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const recentHealthChecks = this.healthChecks.filter(
      check => Date.now() - check.timestamp < 60000 // Last minute
    );

    if (recentHealthChecks.length === 0) {
      return 'unhealthy';
    }

    const unhealthyCount = recentHealthChecks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = recentHealthChecks.filter(check => check.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > recentHealthChecks.length * 0.3) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // 🚨 Get active alerts
  private getActiveAlerts(): any[] {
    // This would typically come from an alert store
    // For now, return empty array
    return [];
  }

  // 📊 Calculate percentile
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  // 📈 Get status code distribution
  private getStatusCodeDistribution(statusCodes: number[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const code of statusCodes) {
      const category = Math.floor(code / 100) * 100;
      const key = `${category}-${category + 99}`;
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return distribution;
  }

  // 🔄 Start monitoring
  private startMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
      
      if (memoryUsageMB > 150) {
        logger.warn(`High memory usage: ${Math.round(memoryUsageMB)}MB`);
      }
    }, 30000); // Every 30 seconds

    // Monitor CPU usage
    let lastCpuUsage = process.cpuUsage();
    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(lastCpuUsage);
      const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to seconds
      
      if (cpuPercent > 80) {
        logger.warn(`High CPU usage: ${Math.round(cpuPercent)}%`);
      }
      
      lastCpuUsage = process.cpuUsage();
    }, 30000); // Every 30 seconds

    logger.info('Performance monitoring started');
  }

  // 🧹 Clean up old data
  cleanup(): void {
    const cutoff = Date.now() - 3600000; // 1 hour
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    this.healthChecks = this.healthChecks.filter(check => check.timestamp > cutoff);
    
    logger.info('Performance monitor cleanup completed');
  }
}
