import { Injectable } from '@nestjs/common';
import { Health } from './health.entity';

@Injectable()
export class HealthService {
  getHealth(): Health {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
