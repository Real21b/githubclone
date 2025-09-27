import { Request, Response } from 'express';
import { EmailService } from '../services/EmailService';
import { logger } from '../utils/logger';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Validation schemas
const sendEmailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).required(),
  cc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  bcc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  subject: Joi.string().min(1).max(200).required(),
  html: Joi.string().optional(),
  text: Joi.string().optional(),
  priority: Joi.string().valid('high', 'normal', 'low').optional(),
  replyTo: Joi.string().email().optional(),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      content: Joi.string().required(),
      contentType: Joi.string().optional()
    })
  ).optional()
});

const sendTemplateEmailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).required(),
  template: Joi.string().required(),
  templateData: Joi.object().required(),
  subject: Joi.string().min(1).max(200).required(),
  priority: Joi.string().valid('high', 'normal', 'low').optional(),
  replyTo: Joi.string().email().optional(),
  cc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  bcc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional()
});

export class EmailController {
  constructor(private emailService: EmailService) {}

  async sendEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendEmailSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const emailData = {
        ...value,
        type: 'transactional' as const,
        userId: req.user?.id
      };

      const email = await this.emailService.sendEmail(emailData);

      logger.info('📧 Email sent via API', {
        id: email.id,
        to: email.to,
        subject: email.subject,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: email.id,
          status: email.status,
          sentAt: email.sentAt
        }
      });

    } catch (error) {
      logger.error('📧 Failed to send email via API:', error);
      res.status(500).json({
        error: 'Failed to send email',
        message: error.message
      });
    }
  }

  async sendTemplateEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = sendTemplateEmailSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const emailData = {
        ...value,
        type: 'notification' as const,
        userId: req.user?.id
      };

      const email = await this.emailService.sendEmail(emailData);

      logger.info('📧 Template email sent via API', {
        id: email.id,
        to: email.to,
        template: value.template,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: {
          id: email.id,
          status: email.status,
          sentAt: email.sentAt
        }
      });

    } catch (error) {
      logger.error('📧 Failed to send template email via API:', error);
      res.status(500).json({
        error: 'Failed to send template email',
        message: error.message
      });
    }
  }

  async getEmailStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Email ID is required'
        });
        return;
      }

      const email = await this.emailService.getEmailStatus(id);

      if (!email) {
        res.status(404).json({
          error: 'Email not found'
        });
        return;
      }

      res.json({
        success: true,
        data: email
      });

    } catch (error) {
      logger.error('📧 Failed to get email status:', error);
      res.status(500).json({
        error: 'Failed to get email status',
        message: error.message
      });
    }
  }

  async getEmailHistory(req: Request, res: Response): Promise<void> {
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

      const emails = await this.emailService.getEmailHistory(userId, limit, offset);

      res.json({
        success: true,
        data: {
          emails,
          pagination: {
            limit,
            offset,
            total: emails.length
          }
        }
      });

    } catch (error) {
      logger.error('📧 Failed to get email history:', error);
      res.status(500).json({
        error: 'Failed to get email history',
        message: error.message
      });
    }
  }
}
