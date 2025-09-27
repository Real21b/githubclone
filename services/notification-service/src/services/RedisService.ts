import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: 'notification:',
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.ping();
      logger.info('Redis service connected successfully');
    } catch (error) {
      logger.error('Redis service connection failed:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      logger.error(`Error setting key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(`Error deleting key ${key}:`, error);
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error(`Error getting set members for key ${key}:`, error);
      return [];
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      logger.error(`Error adding set members for key ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redis.srem(key, ...members);
    } catch (error) {
      logger.error(`Error removing set members for key ${key}:`, error);
      return 0;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      logger.error(`Error getting hash for key ${key}:`, error);
      return {};
    }
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    try {
      return await this.redis.hincrby(key, field, increment);
    } catch (error) {
      logger.error(`Error incrementing hash field ${key}.${field}:`, error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return await this.redis.expire(key, seconds);
    } catch (error) {
      logger.error(`Error setting expiry for key ${key}:`, error);
      return false;
    }
  }

  async getHealthStatus(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      return {
        connected: true,
        memory: info.split('\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim(),
        info: info.substring(0, 200)
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
    logger.info('Redis service disconnected');
  }
}
