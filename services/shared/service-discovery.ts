// Shared service discovery utility
export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
}

export class ServiceDiscovery {
  private services: Map<string, ServiceConfig> = new Map();
  private healthCache: Map<string, boolean> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices() {
    this.services.set('auth', {
      name: 'auth-service',
      url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      healthCheck: '/health',
      timeout: 5000
    });

    this.services.set('core', {
      name: 'core-service',
      url: process.env.CORE_SERVICE_URL || 'http://core-service:3002',
      healthCheck: '/health',
      timeout: 5000
    });

    this.services.set('file', {
      name: 'file-service',
      url: process.env.FILE_SERVICE_URL || 'http://file-service:3003',
      healthCheck: '/health',
      timeout: 5000
    });
  }

  private async startHealthChecks() {
    setInterval(async () => {
      for (const [name, config] of this.services) {
        try {
          const response = await fetch(`${config.url}${config.healthCheck}`, {
            timeout: config.timeout
          });
          this.healthCache.set(name, response.ok);
        } catch (error) {
          this.healthCache.set(name, false);
        }
      }
    }, this.cacheTimeout);
  }

  getServiceUrl(serviceName: string): string {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    return service.url;
  }

  isServiceHealthy(serviceName: string): boolean {
    return this.healthCache.get(serviceName) || false;
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }
}

export const serviceDiscovery = new ServiceDiscovery();
