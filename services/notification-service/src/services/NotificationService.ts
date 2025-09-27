import { KafkaService } from './KafkaService';
import { RedisService } from './RedisService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  channels: ('in-app' | 'email' | 'push')[];
}

export interface NotificationMetrics {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  averageProcessingTime: number;
}

export class NotificationService {
  private kafkaService: KafkaService;
  private redisService: RedisService;
  private metrics: NotificationMetrics;
  private processingTimes: number[] = [];

  constructor(kafkaService: KafkaService, redisService: RedisService) {
    this.kafkaService = kafkaService;
    this.redisService = redisService;
    this.metrics = {
      totalSent: 0,
      totalRead: 0,
      totalUnread: 0,
      byType: {},
      byChannel: {},
      averageProcessingTime: 0
    };
  }

  async start(): Promise<void> {
    try {
      // Start Kafka consumer for user events
      await this.kafkaService.startConsumer({
        groupId: 'notification-service-group',
        topics: ['user-events', 'repository-events'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleEvent.bind(this));

      logger.info('Notification service started successfully');

    } catch (error) {
      logger.error('Failed to start notification service:', error);
      throw error;
    }
  }

  // 🔔 Send notification
  async sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const startTime = Date.now();

    try {
      const newNotification: Notification = {
        id: uuidv4(),
        ...notification,
        read: false,
        createdAt: new Date()
      };

      // Store notification in Redis
      await this.storeNotification(newNotification);

      // Send to Kafka for processing by other services
      await this.kafkaService.sendMessage({
        topic: 'notifications',
        key: newNotification.userId,
        value: {
          id: newNotification.id,
          userId: newNotification.userId,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          data: newNotification.data,
          channels: newNotification.channels,
          createdAt: newNotification.createdAt.toISOString(),
          expiresAt: newNotification.expiresAt?.toISOString()
        }
      });

      // Send to specific channels
      for (const channel of newNotification.channels) {
        await this.sendToChannel(newNotification, channel);
      }

      // Update metrics
      this.updateMetrics(newNotification, Date.now() - startTime);

      logger.info(`Notification sent successfully`, {
        id: newNotification.id,
        userId: newNotification.userId,
        type: newNotification.type,
        channels: newNotification.channels
      });

      return newNotification;

    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  // 📥 Handle events from other services
  private async handleEvent(payload: any): Promise<void> {
    try {
      const event = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`Processing event: ${event.type}`, { event });

      switch (event.type) {
        case 'user.created':
          await this.handleUserCreated(event);
          break;
        case 'user.updated':
          await this.handleUserUpdated(event);
          break;
        case 'repository.created':
          await this.handleRepositoryCreated(event);
          break;
        case 'repository.starred':
          await this.handleRepositoryStarred(event);
          break;
        case 'repository.forked':
          await this.handleRepositoryForked(event);
          break;
        default:
          logger.debug(`Unhandled event type: ${event.type}`);
      }

    } catch (error) {
      logger.error('Error handling event:', error);
    }
  }

  // 👤 Handle user created event
  private async handleUserCreated(event: any): Promise<void> {
    await this.sendNotification({
      userId: event.userId,
      type: 'success',
      title: 'Welcome to GitHub Clone!',
      message: 'Your account has been created successfully. Start exploring repositories!',
      channels: ['in-app', 'email']
    });
  }

  // 👤 Handle user updated event
  private async handleUserUpdated(event: any): Promise<void> {
    await this.sendNotification({
      userId: event.userId,
      type: 'info',
      title: 'Profile Updated',
      message: 'Your profile has been updated successfully.',
      channels: ['in-app']
    });
  }

  // 📁 Handle repository created event
  private async handleRepositoryCreated(event: any): Promise<void> {
    await this.sendNotification({
      userId: event.ownerId,
      type: 'success',
      title: 'Repository Created',
      message: `Repository "${event.repositoryName}" has been created successfully.`,
      data: { repositoryId: event.repositoryId },
      channels: ['in-app']
    });
  }

  // ⭐ Handle repository starred event
  private async handleRepositoryStarred(event: any): Promise<void> {
    await this.sendNotification({
      userId: event.ownerId,
      type: 'info',
      title: 'Repository Starred',
      message: `Someone starred your repository "${event.repositoryName}".`,
      data: { repositoryId: event.repositoryId, starrerId: event.userId },
      channels: ['in-app', 'push']
    });
  }

  // 🍴 Handle repository forked event
  private async handleRepositoryForked(event: any): Promise<void> {
    await this.sendNotification({
      userId: event.ownerId,
      type: 'info',
      title: 'Repository Forked',
      message: `Someone forked your repository "${event.repositoryName}".`,
      data: { repositoryId: event.repositoryId, forkerId: event.userId },
      channels: ['in-app', 'push']
    });
  }

  // 📤 Send to specific channel
  private async sendToChannel(notification: Notification, channel: string): Promise<void> {
    try {
      const topic = channel === 'email' ? 'email-notifications' : 
                   channel === 'push' ? 'push-notifications' : null;

      if (topic) {
        await this.kafkaService.sendMessage({
          topic,
          key: notification.userId,
          value: {
            notificationId: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt.toISOString()
          }
        });
      }

      logger.debug(`Notification sent to ${channel} channel`, {
        notificationId: notification.id,
        channel
      });

    } catch (error) {
      logger.error(`Failed to send notification to ${channel} channel:`, error);
    }
  }

  // 💾 Store notification in Redis
  private async storeNotification(notification: Notification): Promise<void> {
    const key = `notification:${notification.userId}:${notification.id}`;
    const userKey = `user_notifications:${notification.userId}`;
    
    // Store individual notification
    await this.redisService.set(key, notification, 604800); // 7 days TTL
    
    // Add to user's notification list
    await this.redisService.sadd(userKey, notification.id);
    await this.redisService.expire(userKey, 604800); // 7 days TTL
    
    // Update unread count
    await this.redisService.hincrby(`user_stats:${notification.userId}`, 'unread_count', 1);
  }

  // 📖 Get user notifications
  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    try {
      const userKey = `user_notifications:${userId}`;
      const notificationIds = await this.redisService.smembers(userKey);
      
      // Get notifications in reverse order (newest first)
      const sortedIds = notificationIds.reverse().slice(offset, offset + limit);
      
      const notifications: Notification[] = [];
      for (const id of sortedIds) {
        const key = `notification:${userId}:${id}`;
        const notification = await this.redisService.get<Notification>(key);
        if (notification) {
          notifications.push(notification);
        }
      }

      return notifications;

    } catch (error) {
      logger.error(`Failed to get notifications for user ${userId}:`, error);
      throw error;
    }
  }

  // ✅ Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `notification:${userId}:${notificationId}`;
      const notification = await this.redisService.get<Notification>(key);
      
      if (notification && !notification.read) {
        notification.read = true;
        await this.redisService.set(key, notification, 604800);
        
        // Update unread count
        await this.redisService.hincrby(`user_stats:${userId}`, 'unread_count', -1);
        
        // Update metrics
        this.metrics.totalRead++;
        this.metrics.totalUnread--;
      }

    } catch (error) {
      logger.error(`Failed to mark notification as read: ${notificationId}`, error);
      throw error;
    }
  }

  // 🗑️ Delete notification
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    try {
      const key = `notification:${userId}:${notificationId}`;
      const userKey = `user_notifications:${userId}`;
      
      // Remove from Redis
      await this.redisService.del(key);
      await this.redisService.srem(userKey, notificationId);
      
      // Update metrics
      this.metrics.totalUnread--;

    } catch (error) {
      logger.error(`Failed to delete notification: ${notificationId}`, error);
      throw error;
    }
  }

  // 📊 Get user notification stats
  async getUserStats(userId: string): Promise<any> {
    try {
      const stats = await this.redisService.hgetall(`user_stats:${userId}`);
      return {
        unreadCount: parseInt(stats.unread_count || '0'),
        totalCount: parseInt(stats.total_count || '0')
      };
    } catch (error) {
      logger.error(`Failed to get stats for user ${userId}:`, error);
      return { unreadCount: 0, totalCount: 0 };
    }
  }

  // 📈 Update metrics
  private updateMetrics(notification: Notification, processingTime: number): void {
    this.metrics.totalSent++;
    this.metrics.totalUnread++;
    
    // Update by type
    this.metrics.byType[notification.type] = (this.metrics.byType[notification.type] || 0) + 1;
    
    // Update by channel
    for (const channel of notification.channels) {
      this.metrics.byChannel[channel] = (this.metrics.byChannel[channel] || 0) + 1;
    }
    
    // Update average processing time
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-1000);
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  // 📊 Get service metrics
  getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }
}
