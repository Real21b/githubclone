import Redis from 'ioredis'
import { logger } from '../utils/logger'

// 🚀 Advanced Cache Strategy for Microservices
export class MicroservicesCacheStrategy {
  private redis: Redis
  private cachePrefix: string

  constructor(redis: Redis, prefix: string = 'githubclone') {
    this.redis = redis
    this.cachePrefix = prefix
  }

  // 📊 Repository Data Caching (ISR-like behavior)
  async cacheRepositoryData(repoId: string, data: any, ttl: number = 300) {
    const key = `${this.cachePrefix}:repo:${repoId}`
    
    // Store with metadata
    const cacheData = {
      data,
      cachedAt: Date.now(),
      ttl,
      version: '1.0'
    }

    await this.redis.setex(key, ttl, JSON.stringify(cacheData))
    
    // Also cache in a list for batch operations
    await this.redis.lpush(`${this.cachePrefix}:repos:list`, repoId)
    await this.redis.expire(`${this.cachePrefix}:repos:list`, ttl)

    logger.info('📦 Repository data cached', { repoId, ttl })
  }

  async getCachedRepositoryData(repoId: string): Promise<any | null> {
    const key = `${this.cachePrefix}:repo:${repoId}`
    const cached = await this.redis.get(key)
    
    if (!cached) return null

    try {
      const cacheData = JSON.parse(cached)
      
      // Check if cache is still valid
      const age = Date.now() - cacheData.cachedAt
      if (age > cacheData.ttl * 1000) {
        await this.redis.del(key)
        return null
      }

      return cacheData.data
    } catch (error) {
      logger.error('Failed to parse cached repository data', error)
      await this.redis.del(key)
      return null
    }
  }

  // 👤 User Data Caching with Invalidation
  async cacheUserData(userId: string, data: any, ttl: number = 600) {
    const key = `${this.cachePrefix}:user:${userId}`
    
    const cacheData = {
      data,
      cachedAt: Date.now(),
      ttl,
      version: '1.0'
    }

    await this.redis.setex(key, ttl, JSON.stringify(cacheData))
    
    // Track user cache for invalidation
    await this.redis.sadd(`${this.cachePrefix}:users:active`, userId)
    
    logger.info('👤 User data cached', { userId, ttl })
  }

  async invalidateUserCache(userId: string) {
    const keys = [
      `${this.cachePrefix}:user:${userId}`,
      `${this.cachePrefix}:user:${userId}:repos`,
      `${this.cachePrefix}:user:${userId}:organizations`,
      `${this.cachePrefix}:user:${userId}:activity`
    ]

    await Promise.all(keys.map(key => this.redis.del(key)))
    
    logger.info('🗑️ User cache invalidated', { userId })
  }

  // 📋 Issues and PRs Caching
  async cacheIssuesList(repoId: string, issues: any[], ttl: number = 120) {
    const key = `${this.cachePrefix}:issues:${repoId}`
    
    const cacheData = {
      issues,
      cachedAt: Date.now(),
      ttl,
      count: issues.length
    }

    await this.redis.setex(key, ttl, JSON.stringify(cacheData))
    
    // Cache individual issues for quick access
    for (const issue of issues) {
      await this.cacheIssue(issue.id, issue, ttl)
    }

    logger.info('📋 Issues list cached', { repoId, count: issues.length })
  }

  async cacheIssue(issueId: string, issue: any, ttl: number = 300) {
    const key = `${this.cachePrefix}:issue:${issueId}`
    
    const cacheData = {
      data: issue,
      cachedAt: Date.now(),
      ttl
    }

    await this.redis.setex(key, ttl, JSON.stringify(cacheData))
  }

  // 🔄 Real-time Data Invalidation
  async invalidateRepositoryCache(repoId: string) {
    const keys = [
      `${this.cachePrefix}:repo:${repoId}`,
      `${this.cachePrefix}:issues:${repoId}`,
      `${this.cachePrefix}:prs:${repoId}`,
      `${this.cachePrefix}:commits:${repoId}`
    ]

    await Promise.all(keys.map(key => this.redis.del(key)))
    
    // Publish invalidation event
    await this.redis.publish('cache-invalidation', JSON.stringify({
      type: 'repository',
      id: repoId,
      timestamp: Date.now()
    }))

    logger.info('🔄 Repository cache invalidated', { repoId })
  }

  // 📊 Analytics Data Caching
  async cacheAnalyticsData(type: string, data: any, ttl: number = 3600) {
    const key = `${this.cachePrefix}:analytics:${type}`
    
    const cacheData = {
      data,
      cachedAt: Date.now(),
      ttl,
      type
    }

    await this.redis.setex(key, ttl, JSON.stringify(cacheData))
    
    logger.info('📊 Analytics data cached', { type, ttl })
  }

  // 🎯 Smart Cache Warming
  async warmCache() {
    logger.info('🔥 Starting cache warming...')

    // Warm popular repositories
    const popularRepos = await this.getPopularRepositories()
    for (const repo of popularRepos) {
      await this.cacheRepositoryData(repo.id, repo, 600)
    }

    // Warm active users
    const activeUsers = await this.getActiveUsers()
    for (const user of activeUsers) {
      await this.cacheUserData(user.id, user, 300)
    }

    // Warm trending issues
    const trendingIssues = await this.getTrendingIssues()
    for (const issue of trendingIssues) {
      await this.cacheIssue(issue.id, issue, 180)
    }

    logger.info('✅ Cache warming completed')
  }

  // 📈 Cache Performance Monitoring
  async getCacheStats() {
    const info = await this.redis.info('memory')
    const keyspace = await this.redis.info('keyspace')
    
    return {
      memory: this.parseRedisInfo(info),
      keyspace: this.parseRedisInfo(keyspace),
      hitRate: await this.calculateHitRate()
    }
  }

  private async calculateHitRate(): Promise<number> {
    const stats = await this.redis.info('stats')
    const parsed = this.parseRedisInfo(stats)
    
    const hits = parsed.keyspace_hits || 0
    const misses = parsed.keyspace_misses || 0
    const total = hits + misses
    
    return total > 0 ? (hits / total) * 100 : 0
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {}
    
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        result[key] = isNaN(Number(value)) ? value : Number(value)
      }
    })
    
    return result
  }

  // 🧹 Cache Cleanup
  async cleanupExpiredCache() {
    const pattern = `${this.cachePrefix}:*`
    const keys = await this.redis.keys(pattern)
    
    let cleaned = 0
    for (const key of keys) {
      const ttl = await this.redis.ttl(key)
      if (ttl === -1) { // No expiration set
        await this.redis.del(key)
        cleaned++
      }
    }

    logger.info('🧹 Cache cleanup completed', { cleaned })
    return cleaned
  }

  // 🔄 Cache Synchronization Across Services
  async syncCacheAcrossServices(serviceName: string, data: any) {
    const syncKey = `${this.cachePrefix}:sync:${serviceName}`
    
    await this.redis.setex(syncKey, 60, JSON.stringify({
      data,
      service: serviceName,
      timestamp: Date.now()
    }))

    // Notify other services
    await this.redis.publish('cache-sync', JSON.stringify({
      service: serviceName,
      data,
      timestamp: Date.now()
    }))
  }

  // Helper methods (would be implemented based on your data sources)
  private async getPopularRepositories(): Promise<any[]> {
    // Implementation depends on your data source
    return []
  }

  private async getActiveUsers(): Promise<any[]> {
    // Implementation depends on your data source
    return []
  }

  private async getTrendingIssues(): Promise<any[]> {
    // Implementation depends on your data source
    return []
  }
}
