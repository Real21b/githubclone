import { Resolver, Query } from 'type-graphql';
import { Health } from '../entities/Health';

@Resolver(() => Health)
export class HealthResolver {
  @Query(() => Health, { name: 'getHealth' })
  getHealth(): Health {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      service: 'core-service',
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }
}
