import { Request, Response } from 'express';
import { TelegramService } from '../services/TelegramService';
import { logger } from '../utils/logger';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Validation schemas
const sendMessageSchema = Joi.object({
  chatId: Joi.alternatives().try(
    Joi.string(),
    Joi.number()
  ).required(),
  message: Joi.string().min(1).max(4096).required(),
  type: Joi.string().valid('text', 'photo', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'animation').default('text'),
  parseMode: Joi.string().valid('HTML', 'Markdown', 'MarkdownV2').optional(),
  disableWebPagePreview: Joi.boolean().optional(),
  disableNotification: Joi.boolean().optional(),
  replyToMessageId: Joi.number().integer().positive().optional(),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

const sendBulkMessageSchema = Joi.object({
  chatIds: Joi.array().items(
    Joi.alternatives().try(Joi.string(), Joi.number())
  ).min(1).max(100).required(),
  message: Joi.string().min(1).max(4096).required(),
  type: Joi.string().valid('text', 'photo', 'video', 'audio', 'document').default('text'),
  parseMode: Joi.string().valid('HTML', 'Markdown', 'MarkdownV2').optional(),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

const sendTemplateMessageSchema = Joi.object({
  chatId: Joi.alternatives().try(
    Joi.string(),
    Joi.number()
  ).required(),
  template: Joi.string().required(),
  templateData: Joi.object().required(),
  parseMode: Joi.string().valid('HTML', 'Markdown', 'MarkdownV2').default('HTML'),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

const sendLocationSchema = Joi.object({
  chatId: Joi.alternatives().try(
    Joi.string(),
    Joi.number()
  ).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

const sendContactSchema = Joi.object({
  chatId: Joi.alternatives().try(
    Joi.string(),
    Joi.number()
  ).required(),
  phone_number: Joi.string().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().optional(),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendMessageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const messageData = {
        ...value,
        userId: req.user?.id
      };

      const message = await this.telegramService.sendMessage(messageData);

      logger.info('📱 Telegram message sent via API', {
        id: message.id,
        chatId: message.chatId,
        type: message.type,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram message via API:', error);
      res.status(500).json({
        error: 'Failed to send message',
        message: error.message
      });
    }
  }

  async sendMedia(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No media file provided'
        });
        return;
      }

      const { chatId, caption } = req.body;

      if (!chatId) {
        res.status(400).json({
          error: 'Chat ID is required'
        });
        return;
      }

      const message = await this.telegramService.sendMediaMessage(
        chatId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        caption
      );

      logger.info('📱 Telegram media sent via API', {
        id: message.id,
        chatId: message.chatId,
        filename: req.file.originalname,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram media via API:', error);
      res.status(500).json({
        error: 'Failed to send media',
        message: error.message
      });
    }
  }

  async sendBulkMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendBulkMessageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const messageData = {
        ...value,
        userId: req.user?.id
      };

      const results = await this.telegramService.sendBulkMessages(
        messageData.chatIds,
        messageData.message,
        {
          type: messageData.type,
          parseMode: messageData.parseMode,
          priority: messageData.priority,
          userId: messageData.userId
        }
      );

      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      logger.info('📱 Telegram bulk message sent via API', {
        total: results.length,
        successful,
        failed,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          total: results.length,
          successful,
          failed,
          results: results.map(r => ({
            id: r.id,
            chatId: r.chatId,
            status: r.status,
            sentAt: r.sentAt,
            error: r.error
          }))
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram bulk message via API:', error);
      res.status(500).json({
        error: 'Failed to send bulk message',
        message: error.message
      });
    }
  }

  async sendTemplateMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendTemplateMessageSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const messageData = {
        ...value,
        userId: req.user?.id
      };

      const message = await this.telegramService.sendTemplateMessage(
        messageData.chatId,
        messageData.template,
        messageData.templateData
      );

      logger.info('📱 Telegram template message sent via API', {
        id: message.id,
        chatId: message.chatId,
        template: value.template,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram template message via API:', error);
      res.status(500).json({
        error: 'Failed to send template message',
        message: error.message
      });
    }
  }

  async sendPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No photo file provided'
        });
        return;
      }

      const { chatId, caption } = req.body;

      if (!chatId) {
        res.status(400).json({
          error: 'Chat ID is required'
        });
        return;
      }

      const message = await this.telegramService.sendMediaMessage(
        chatId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        caption
      );

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram photo:', error);
      res.status(500).json({
        error: 'Failed to send photo',
        message: error.message
      });
    }
  }

  async sendDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'No document file provided'
        });
        return;
      }

      const { chatId, caption } = req.body;

      if (!chatId) {
        res.status(400).json({
          error: 'Chat ID is required'
        });
        return;
      }

      const message = await this.telegramService.sendMediaMessage(
        chatId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        caption
      );

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram document:', error);
      res.status(500).json({
        error: 'Failed to send document',
        message: error.message
      });
    }
  }

  async sendLocation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendLocationSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const messageData = {
        ...value,
        userId: req.user?.id
      };

      const message = await this.telegramService.sendMessage({
        chatId: messageData.chatId,
        message: '',
        type: 'location',
        location: {
          latitude: messageData.latitude,
          longitude: messageData.longitude
        },
        priority: messageData.priority,
        userId: messageData.userId
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram location:', error);
      res.status(500).json({
        error: 'Failed to send location',
        message: error.message
      });
    }
  }

  async sendContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendContactSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const messageData = {
        ...value,
        userId: req.user?.id
      };

      const message = await this.telegramService.sendMessage({
        chatId: messageData.chatId,
        message: '',
        type: 'contact',
        contact: {
          phone_number: messageData.phone_number,
          first_name: messageData.first_name,
          last_name: messageData.last_name
        },
        priority: messageData.priority,
        userId: messageData.userId
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          status: message.status,
          sentAt: message.sentAt,
          messageId: message.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send Telegram contact:', error);
      res.status(500).json({
        error: 'Failed to send contact',
        message: error.message
      });
    }
  }

  async getBotInfo(req: Request, res: Response): Promise<void> {
    try {
      const botInfo = await this.telegramService.getBotInfo();

      res.json({
        success: true,
        data: botInfo
      });

    } catch (error) {
      logger.error('📱 Failed to get Telegram bot info:', error);
      res.status(500).json({
        error: 'Failed to get bot info',
        message: error.message
      });
    }
  }

  async getUpdates(req: Request, res: Response): Promise<void> {
    try {
      // This would typically get recent updates from Telegram
      res.json({
        success: true,
        data: {
          message: 'Updates endpoint - implementation depends on specific requirements'
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get Telegram updates:', error);
      res.status(500).json({
        error: 'Failed to get updates',
        message: error.message
      });
    }
  }

  async getWebhookInfo(req: Request, res: Response): Promise<void> {
    try {
      const webhookInfo = await this.telegramService.getWebhookInfo();

      res.json({
        success: true,
        data: webhookInfo
      });

    } catch (error) {
      logger.error('📱 Failed to get Telegram webhook info:', error);
      res.status(500).json({
        error: 'Failed to get webhook info',
        message: error.message
      });
    }
  }

  async setWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        res.status(400).json({
          error: 'Webhook URL is required'
        });
        return;
      }

      const success = await this.telegramService.setWebhook(webhookUrl);

      if (success) {
        res.json({
          success: true,
          message: 'Webhook set successfully'
        });
      } else {
        res.status(500).json({
          error: 'Failed to set webhook'
        });
      }

    } catch (error) {
      logger.error('📱 Failed to set Telegram webhook:', error);
      res.status(500).json({
        error: 'Failed to set webhook',
        message: error.message
      });
    }
  }

  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.telegramService.deleteWebhook();

      if (success) {
        res.json({
          success: true,
          message: 'Webhook deleted successfully'
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete webhook'
        });
      }

    } catch (error) {
      logger.error('📱 Failed to delete Telegram webhook:', error);
      res.status(500).json({
        error: 'Failed to delete webhook',
        message: error.message
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookData = req.body;

      logger.info('📱 Received Telegram webhook', webhookData);

      // Process webhook data
      // This would typically handle incoming messages, updates, etc.

      res.status(200).send('OK');

    } catch (error) {
      logger.error('📱 Error processing Telegram webhook:', error);
      res.status(500).json({
        error: 'Failed to process webhook'
      });
    }
  }

  async getChats(req: Request, res: Response): Promise<void> {
    try {
      const chats = await this.telegramService.getChats();

      res.json({
        success: true,
        data: {
          chats,
          total: chats.length
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get Telegram chats:', error);
      res.status(500).json({
        error: 'Failed to get chats',
        message: error.message
      });
    }
  }

  async getChat(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;

      if (!chatId) {
        res.status(400).json({
          error: 'Chat ID is required'
        });
        return;
      }

      const chat = await this.telegramService.getChat(chatId);

      res.json({
        success: true,
        data: chat
      });

    } catch (error) {
      logger.error('📱 Failed to get Telegram chat:', error);
      res.status(500).json({
        error: 'Failed to get chat',
        message: error.message
      });
    }
  }

  async getChatMembers(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;

      if (!chatId) {
        res.status(400).json({
          error: 'Chat ID is required'
        });
        return;
      }

      const members = await this.telegramService.getChatMembers(chatId);

      res.json({
        success: true,
        data: {
          members,
          total: members.length,
          chatId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get Telegram chat members:', error);
      res.status(500).json({
        error: 'Failed to get chat members',
        message: error.message
      });
    }
  }
}
