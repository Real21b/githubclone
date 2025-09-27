import { Request, Response } from 'express';
import { WhatsAppService } from '../services/WhatsAppService';
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
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  message: Joi.string().min(1).max(4096).required(),
  type: Joi.string().valid('text', 'image', 'video', 'audio', 'document', 'location', 'contact').default('text'),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

const sendBulkMessageSchema = Joi.object({
  recipients: Joi.array().items(Joi.string().pattern(/^\+[1-9]\d{1,14}$/)).min(1).max(100).required(),
  message: Joi.string().min(1).max(4096).required(),
  type: Joi.string().valid('text', 'image', 'video', 'audio', 'document').default('text'),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

const sendTemplateMessageSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  template: Joi.string().required(),
  templateData: Joi.object().required(),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal')
});

export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

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

      const message = await this.whatsappService.sendMessage(messageData);

      logger.info('📱 WhatsApp message sent via API', {
        id: message.id,
        to: message.to,
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
      logger.error('📱 Failed to send WhatsApp message via API:', error);
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

      const { to, caption } = req.body;

      if (!to) {
        res.status(400).json({
          error: 'Recipient phone number is required'
        });
        return;
      }

      const message = await this.whatsappService.sendMediaMessage(
        to,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        caption
      );

      logger.info('📱 WhatsApp media sent via API', {
        id: message.id,
        to: message.to,
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
      logger.error('📱 Failed to send WhatsApp media via API:', error);
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

      const results = await this.whatsappService.sendBulkMessages(
        messageData.recipients,
        messageData.message,
        {
          type: messageData.type,
          priority: messageData.priority,
          userId: messageData.userId
        }
      );

      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      logger.info('📱 WhatsApp bulk message sent via API', {
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
            to: r.to,
            status: r.status,
            sentAt: r.sentAt,
            error: r.error
          }))
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send WhatsApp bulk message via API:', error);
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

      const message = await this.whatsappService.sendTemplateMessage(
        messageData.to,
        messageData.template,
        messageData.templateData
      );

      logger.info('📱 WhatsApp template message sent via API', {
        id: message.id,
        to: message.to,
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
      logger.error('📱 Failed to send WhatsApp template message via API:', error);
      res.status(500).json({
        error: 'Failed to send template message',
        message: error.message
      });
    }
  }

  async getQRCode(req: Request, res: Response): Promise<void> {
    try {
      const qrCode = this.whatsappService.getQRCode();

      if (!qrCode) {
        res.status(404).json({
          error: 'QR code not available'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          qrCode: qrCode
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get WhatsApp QR code:', error);
      res.status(500).json({
        error: 'Failed to get QR code',
        message: error.message
      });
    }
  }

  async getConnectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.whatsappService.getWhatsAppStatus();

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('📱 Failed to get WhatsApp connection status:', error);
      res.status(500).json({
        error: 'Failed to get connection status',
        message: error.message
      });
    }
  }

  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      await this.whatsappService.disconnect();

      logger.info('📱 WhatsApp service disconnected via API');

      res.json({
        success: true,
        message: 'WhatsApp service disconnected successfully'
      });

    } catch (error) {
      logger.error('📱 Failed to disconnect WhatsApp service:', error);
      res.status(500).json({
        error: 'Failed to disconnect service',
        message: error.message
      });
    }
  }

  async reconnect(req: Request, res: Response): Promise<void> {
    try {
      await this.whatsappService.reconnect();

      logger.info('📱 WhatsApp service reconnected via API');

      res.json({
        success: true,
        message: 'WhatsApp service reconnected successfully'
      });

    } catch (error) {
      logger.error('📱 Failed to reconnect WhatsApp service:', error);
      res.status(500).json({
        error: 'Failed to reconnect service',
        message: error.message
      });
    }
  }

  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const contacts = await this.whatsappService.getContacts();

      res.json({
        success: true,
        data: {
          contacts,
          total: contacts.length
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get WhatsApp contacts:', error);
      res.status(500).json({
        error: 'Failed to get contacts',
        message: error.message
      });
    }
  }

  async getChats(req: Request, res: Response): Promise<void> {
    try {
      const chats = await this.whatsappService.getChats();

      res.json({
        success: true,
        data: {
          chats,
          total: chats.length
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get WhatsApp chats:', error);
      res.status(500).json({
        error: 'Failed to get chats',
        message: error.message
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await this.whatsappService.getMessages(chatId, limit);

      res.json({
        success: true,
        data: {
          messages,
          total: messages.length,
          chatId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get WhatsApp messages:', error);
      res.status(500).json({
        error: 'Failed to get messages',
        message: error.message
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookData = req.body;

      logger.info('📱 Received WhatsApp webhook', webhookData);

      // Process webhook data
      // This would typically handle incoming messages, status updates, etc.

      res.status(200).send('OK');

    } catch (error) {
      logger.error('📱 Error processing WhatsApp webhook:', error);
      res.status(500).json({
        error: 'Failed to process webhook'
      });
    }
  }
}
