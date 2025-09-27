import { Server as SocketIOServer } from 'socket.io'
import { KafkaService } from './KafkaService'
import { RedisService } from './RedisService'
import { logger } from '../utils/logger'

export class PerformanceOptimizedRealtimeService {
  private io: SocketIOServer
  private kafkaService: KafkaService
  private redisService: RedisService
  private connectionPool: Map<string, any> = new Map()
  private messageQueue: Map<string, any[]> = new Map()

  constructor(io: SocketIOServer, kafkaService: KafkaService, redisService: RedisService) {
    this.io = io
    this.kafkaService = kafkaService
    this.redisService = redisService
  }

  // 🚀 Optimized WebSocket Connection Management
  async handleConnection(socket: any, userId: string) {
    // Connection pooling for better performance
    this.connectionPool.set(socket.id, {
      socket,
      userId,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    })

    // Join user to optimized rooms
    await this.joinOptimizedRooms(socket, userId)

    // Setup optimized event handlers
    this.setupOptimizedEventHandlers(socket, userId)

    logger.info('🔌 Optimized WebSocket connection established', {
      socketId: socket.id,
      userId,
      totalConnections: this.connectionPool.size
    })
  }

  // 🎯 Optimized Room Management
  private async joinOptimizedRooms(socket: any, userId: string) {
    // Join user-specific room
    await socket.join(`user:${userId}`)
    
    // Join project rooms based on user permissions (cached)
    const userProjects = await this.getUserProjectsCached(userId)
    for (const project of userProjects) {
      await socket.join(`project:${project.id}`)
    }

    // Join organization rooms
    const userOrgs = await this.getUserOrganizationsCached(userId)
    for (const org of userOrgs) {
      await socket.join(`org:${org.id}`)
    }
  }

  // 📊 Cached Data Retrieval
  private async getUserProjectsCached(userId: string) {
    const cacheKey = `user:${userId}:projects`
    const cached = await this.redisService.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    // Fetch from Core Service
    const projects = await this.fetchUserProjects(userId)
    await this.redisService.setex(cacheKey, 300, JSON.stringify(projects)) // 5 min cache
    
    return projects
  }

  private async getUserOrganizationsCached(userId: string) {
    const cacheKey = `user:${userId}:organizations`
    const cached = await this.redisService.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    const orgs = await this.fetchUserOrganizations(userId)
    await this.redisService.setex(cacheKey, 600, JSON.stringify(orgs)) // 10 min cache
    
    return orgs
  }

  // 🔄 Optimized Event Handlers
  private setupOptimizedEventHandlers(socket: any, userId: string) {
    // Debounced message sending
    let messageTimeout: NodeJS.Timeout
    
    socket.on('send-message', async (data: any) => {
      clearTimeout(messageTimeout)
      
      messageTimeout = setTimeout(async () => {
        await this.handleOptimizedMessage(socket, data, userId)
      }, 100) // 100ms debounce
    })

    // Optimized presence updates
    socket.on('update-presence', async (data: any) => {
      await this.updatePresenceOptimized(userId, data)
    })

    // Batch file sharing
    socket.on('share-files', async (files: any[]) => {
      await this.handleBatchFileShare(socket, files, userId)
    })
  }

  // 📨 Optimized Message Handling
  private async handleOptimizedMessage(socket: any, data: any, userId: string) {
    const message = {
      id: this.generateMessageId(),
      ...data,
      userId,
      timestamp: new Date(),
      roomId: data.roomId
    }

    // Store in Redis for persistence
    await this.redisService.lpush(`messages:${data.roomId}`, JSON.stringify(message))
    await this.redisService.ltrim(`messages:${data.roomId}`, 0, 99) // Keep last 100 messages

    // Send to Kafka for other services
    await this.kafkaService.sendMessage({
      topic: 'realtime-messages',
      key: data.roomId,
      value: message
    })

    // Broadcast to room with optimization
    this.io.to(data.roomId).emit('new-message', message)

    // Update metrics
    this.updateMessageMetrics(data.roomId)
  }

  // 🎯 Optimized Presence Management
  private async updatePresenceOptimized(userId: string, data: any) {
    const presence = {
      userId,
      status: data.status,
      lastSeen: new Date(),
      location: data.location
    }

    // Update Redis with TTL
    await this.redisService.setex(`presence:${userId}`, 300, JSON.stringify(presence))

    // Broadcast to user's rooms
    const userRooms = await this.getUserRooms(userId)
    for (const room of userRooms) {
      this.io.to(room).emit('presence-update', presence)
    }
  }

  // 📁 Batch File Sharing
  private async handleBatchFileShare(socket: any, files: any[], userId: string) {
    const batchId = this.generateBatchId()
    
    // Process files in parallel
    const filePromises = files.map(file => this.processFileShare(file, userId, batchId))
    const results = await Promise.allSettled(filePromises)

    // Send batch completion
    socket.emit('batch-files-complete', {
      batchId,
      results: results.map(r => r.status === 'fulfilled' ? r.value : null)
    })
  }

  // 📊 Performance Metrics
  private updateMessageMetrics(roomId: string) {
    const metricsKey = `metrics:messages:${roomId}`
    this.redisService.incr(metricsKey)
    this.redisService.expire(metricsKey, 86400) // 24 hours
  }

  // 🔧 Utility Methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getUserRooms(userId: string): Promise<string[]> {
    const cacheKey = `user:${userId}:rooms`
    const cached = await this.redisService.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    // Fetch from database
    const rooms = await this.fetchUserRooms(userId)
    await this.redisService.setex(cacheKey, 300, JSON.stringify(rooms))
    
    return rooms
  }

  // 🚀 Kafka Event Handlers
  async handleKafkaEvents() {
    await this.kafkaService.subscribe('realtime-events', async (message) => {
      const event = JSON.parse(message.value.toString())
      
      switch (event.type) {
        case 'repository-update':
          await this.handleRepositoryUpdate(event)
          break
        case 'user-activity':
          await this.handleUserActivity(event)
          break
        case 'system-notification':
          await this.handleSystemNotification(event)
          break
      }
    })
  }

  private async handleRepositoryUpdate(event: any) {
    // Broadcast to repository watchers
    this.io.to(`repo:${event.repositoryId}`).emit('repository-updated', event)
  }

  private async handleUserActivity(event: any) {
    // Update user presence
    await this.updatePresenceOptimized(event.userId, {
      status: 'active',
      location: event.location
    })
  }

  private async handleSystemNotification(event: any) {
    // Send to specific users or broadcast
    if (event.targetUsers) {
      for (const userId of event.targetUsers) {
        this.io.to(`user:${userId}`).emit('system-notification', event)
      }
    } else {
      this.io.emit('system-notification', event)
    }
  }

  // 🧹 Cleanup
  async cleanup() {
    // Clean up inactive connections
    const now = Date.now()
    for (const [socketId, connection] of this.connectionPool.entries()) {
      if (now - connection.lastActivity > 300000) { // 5 minutes
        connection.socket.disconnect()
        this.connectionPool.delete(socketId)
      }
    }
  }
}
