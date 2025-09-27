import { Request, Response } from 'express';
import { SMSService } from '../services/SMSService';
import { logger } from '../utils/logger';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Validation schemas
const sendSMSSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  message: Joi.string().min(1).max(1600).required(),
  provider: Joi.string().valid('twilio', 'aws-sns', 'vonage').default('twilio'),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal'),
  type: Joi.string().valid('verification', 'notification', 'alert', 'marketing').default('notification')
});

const sendBulkSMSSchema = Joi.object({
  recipients: Joi.array().items(Joi.string().pattern(/^\+[1-9]\d{1,14}$/)).min(1).max(100).required(),
  message: Joi.string().min(1).max(1600).required(),
  provider: Joi.string().valid('twilio', 'aws-sns', 'vonage').default('twilio'),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal'),
  type: Joi.string().valid('verification', 'notification', 'alert', 'marketing').default('notification')
});

const sendTemplateSMSSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  template: Joi.string().required(),
  templateData: Joi.object().required(),
  provider: Joi.string().valid('twilio', 'aws-sns', 'vonage').default('twilio'),
  priority: Joi.string().valid('high', 'normal', 'low').default('normal'),
  type: Joi.string().valid('verification', 'notification', 'alert', 'marketing').default('notification')
});

export class SMSController {
  constructor(private smsService: SMSService) {}

  async sendSMS(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendSMSSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const smsData = {
        ...value,
        userId: req.user?.id
      };

      const sms = await this.smsService.sendSMS(smsData);

      logger.info('📱 SMS sent via API', {
        id: sms.id,
        to: sms.to,
        provider: sms.provider,
        cost: sms.cost,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: sms.id,
          status: sms.status,
          sentAt: sms.sentAt,
          cost: sms.cost,
          messageId: sms.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send SMS via API:', error);
      res.status(500).json({
        error: 'Failed to send SMS',
        message: error.message
      });
    }
  }

  async sendBulkSMS(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendBulkSMSSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const smsData = {
        ...value,
        userId: req.user?.id
      };

      const results = await this.smsService.sendBulkSMS(
        smsData.recipients,
        smsData.message,
        {
          provider: smsData.provider,
          priority: smsData.priority,
          type: smsData.type,
          userId: smsData.userId
        }
      );

      const successful = results.filter(r => r.status === 'sent').length;
      const failed = results.filter(r => r.status === 'failed').length;

      logger.info('📱 Bulk SMS sent via API', {
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
      logger.error('📱 Failed to send bulk SMS via API:', error);
      res.status(500).json({
        error: 'Failed to send bulk SMS',
        message: error.message
      });
    }
  }

  async sendTemplateSMS(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendTemplateSMSSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const smsData = {
        ...value,
        userId: req.user?.id
      };

      const sms = await this.smsService.sendSMS(smsData);

      logger.info('📱 Template SMS sent via API', {
        id: sms.id,
        to: sms.to,
        template: value.template,
        provider: sms.provider,
        cost: sms.cost,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: sms.id,
          status: sms.status,
          sentAt: sms.sentAt,
          cost: sms.cost,
          messageId: sms.messageId
        }
      });

    } catch (error) {
      logger.error('📱 Failed to send template SMS via API:', error);
      res.status(500).json({
        error: 'Failed to send template SMS',
        message: error.message
      });
    }
  }

  async getSMSStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'SMS ID is required'
        });
        return;
      }

      const sms = await this.smsService.getSMSStatus(id);

      if (!sms) {
        res.status(404).json({
          error: 'SMS not found'
        });
        return;
      }

      res.json({
        success: true,
        data: sms
      });

    } catch (error) {
      logger.error('📱 Failed to get SMS status:', error);
      res.status(500).json({
        error: 'Failed to get SMS status',
        message: error.message
      });
    }
  }

  async getSMSHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId) {
        res.status(400).json({
          error: 'User ID is required'
        });
        return;
      }

      const smsList = await this.smsService.getSMSHistory(userId, limit, offset);

      res.json({
        success: true,
        data: {
          sms: smsList,
          pagination: {
            limit,
            offset,
            total: smsList.length
          }
        }
      });

    } catch (error) {
      logger.error('📱 Failed to get SMS history:', error);
      res.status(500).json({
        error: 'Failed to get SMS history',
        message: error.message
      });
    }
  }

  async handleTwilioWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookData = req.body;

      logger.info('📱 Received Twilio webhook', {
        messageSid: webhookData.MessageSid,
        messageStatus: webhookData.MessageStatus,
        to: webhookData.To
      });

      // Process delivery report
      await this.smsService.processDeliveryReport('twilio', {
        messageId: webhookData.MessageSid,
        status: webhookData.MessageStatus,
        to: webhookData.To,
        from: webhookData.From,
        errorCode: webhookData.ErrorCode,
        errorMessage: webhookData.ErrorMessage,
        timestamp: new Date().toISOString()
      });

      res.status(200).send('OK');

    } catch (error) {
      logger.error('📱 Error processing Twilio webhook:', error);
      res.status(500).json({
        error: 'Failed to process webhook'
      });
    }
  }
}
