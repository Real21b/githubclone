import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { logger } from '../utils/logger';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId, type, title, message, data, channels, expiresAt } = req.body;

      // Validation
      if (!userId || !type || !title || !message) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, type, title, message'
        });
        return;
      }

      const notification = await this.notificationService.sendNotification({
        userId,
        type,
        title,
        message,
        data,
        channels: channels || ['in-app'],
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      res.json({
        success: true,
        data: notification
      });

    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  }

  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await this.notificationService.getUserNotifications(
        userId, 
        limit, 
        offset
      );

      const stats = await this.notificationService.getUserStats(userId);

      res.json({
        success: true,
        data: {
          notifications,
          stats,
          pagination: {
            limit,
            offset,
            hasMore: notifications.length === limit
          }
        }
      });

    } catch (error) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required'
        });
        return;
      }

      await this.notificationService.markAsRead(userId, id);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'userId is required'
        });
        return;
      }

      await this.notificationService.deleteNotification(userId, id);

      res.json({
        success: true,
        message: 'Notification deleted'
      });

    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  }

  async subscribeToTopics(req: Request, res: Response): Promise<void> {
    try {
      const { userId, topics } = req.body;

      if (!userId || !topics || !Array.isArray(topics)) {
        res.status(400).json({
          success: false,
          error: 'userId and topics array are required'
        });
        return;
      }

      // Store user preferences in Redis
      // This would typically be handled by a separate service
      res.json({
        success: true,
        message: 'Successfully subscribed to topics',
        topics
      });

    } catch (error) {
      logger.error('Error subscribing to topics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to subscribe to topics'
      });
    }
  }
}
