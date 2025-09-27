import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

export class AdvancedCacheService {
  private redis: Redis;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

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
      keyPrefix: 'githubclone:',
      // Connection pooling
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      // Performance optimizations
      enableAutoPipelining: true,
      maxLoadingTimeout: 10000,
    });

    this.redis.on('connect', () => {
      logger.info('Advanced Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Advanced Redis connection error:', error);
    });
  }

  async connect(): Promise<void> {
    try {
      await this.redis.ping();
      logger.info('Advanced cache service connected successfully');
    } catch (error) {
      logger.error('Advanced cache service connection failed:', error);
      throw error;
    }
  }

  // 🚀 Advanced caching with compression and serialization
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key);
      const value = await this.redis.get(cacheKey);
      
      if (value) {
        this.metrics.hits++;
        logger.debug(`Cache HIT: ${key}`);
        return this.deserialize<T>(value, options);
      } else {
        this.metrics.misses++;
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }
    } catch (error) {
      logger.error(`Error getting key ${key}:`, error);
      this.metrics.misses++;
      return null;
    }
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.buildKey(key);
      const serializedValue = this.serialize(value, options);
      const ttl = options.ttl || 3600; // Default 1 hour

      // Use pipeline for better performance
      const pipeline = this.redis.pipeline();
      pipeline.setex(cacheKey, ttl, serializedValue);

      // Add to tag sets for efficient invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          pipeline.sadd(`tag:${tag}`, cacheKey);
          pipeline.expire(`tag:${tag}`, ttl);
        }
      }

      await pipeline.exec();
      this.metrics.sets++;
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Error setting key ${key}:`, error);
    }
  }

  // 🎯 Smart cache invalidation by tags
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          pipeline.del(...keys);
          pipeline.del(`tag:${tag}`);
        }
      }

      await pipeline.exec();
      this.metrics.deletes += tags.length;
      logger.info(`Cache invalidated for tags: ${tags.join(', ')}`);
    } catch (error) {
      logger.error(`Error invalidating tags ${tags}:`, error);
    }
  }

  // 🔄 Atomic operations for counters
  async increment(key: string, value: number = 1, ttl?: number): Promise<number> {
    try {
      const cacheKey = this.buildKey(key);
      const result = await this.redis.incrby(cacheKey, value);
      
      if (ttl) {
        await this.redis.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  // 📊 Batch operations for better performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.buildKey(key));
      const values = await this.redis.mget(...cacheKeys);
      
      return values.map((value, index) => {
        if (value) {
          this.metrics.hits++;
          return this.deserialize<T>(value);
        } else {
          this.metrics.misses++;
          return null;
        }
      });
    } catch (error) {
      logger.error(`Error mget keys ${keys}:`, error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const cacheKey = this.buildKey(key);
        const serializedValue = this.serialize(value);
        
        if (ttl) {
          pipeline.setex(cacheKey, ttl, serializedValue);
        } else {
          pipeline.set(cacheKey, serializedValue);
        }
      }
      
      await pipeline.exec();
      this.metrics.sets += Object.keys(keyValuePairs).length;
    } catch (error) {
      logger.error(`Error mset:`, error);
    }
  }

  // 🏆 Cache warming strategies
  async warmCache<T>(
    keyGenerator: () => string,
    dataFetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      const key = keyGenerator();
      const cached = await this.get<T>(key, options);
      
      if (cached) {
        return cached;
      }
      
      const fresh = await dataFetcher();
      await this.set(key, fresh, options);
      return fresh;
    } catch (error) {
      logger.error('Error warming cache:', error);
      throw error;
    }
  }

  // 📈 Cache statistics
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? Math.round((this.metrics.hits / total) * 100) / 100 : 0
    };
  }

  async getCacheInfo(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const stats = await this.redis.info('stats');
      return { info, stats, metrics: this.getMetrics() };
    } catch (error) {
      logger.error('Error getting cache info:', error);
      return null;
    }
  }

  // Private helper methods
  private buildKey(key: string): string {
    return key.startsWith('githubclone:') ? key : `githubclone:${key}`;
  }

  private serialize(value: any, options: CacheOptions = {}): string {
    if (options.serialize === false) {
      return value;
    }
    
    const serialized = JSON.stringify(value);
    
    // Simple compression for large values
    if (options.compress && serialized.length > 1024) {
      // In production, use actual compression like gzip
      return `compressed:${serialized}`;
    }
    
    return serialized;
  }

  private deserialize<T>(value: string, options: CacheOptions = {}): T {
    if (options.serialize === false) {
      return value as T;
    }
    
    try {
      if (value.startsWith('compressed:')) {
        const decompressed = value.substring(11);
        return JSON.parse(decompressed);
      }
      
      return JSON.parse(value);
    } catch (error) {
      logger.error('Error deserializing cache value:', error);
      return null as T;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
    logger.info('Advanced cache service connection closed');
  }
}
