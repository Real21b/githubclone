import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { htmlToText } from 'html-to-text';
import { KafkaService } from './KafkaService';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface EmailMessage {
  id: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: any;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  replyTo?: string;
  from?: string;
  userId?: string;
  type: 'welcome' | 'notification' | 'alert' | 'marketing' | 'transactional';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byType: Record<string, number>;
  averageProcessingTime: number;
  smtpStatus: 'connected' | 'disconnected' | 'error';
}

export class EmailService {
  private kafkaService: KafkaService;
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private metrics: EmailMetrics;
  private processingTimes: number[] = [];

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.metrics = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      byType: {},
      averageProcessingTime: 0,
      smtpStatus: 'disconnected'
    };
  }

  async start(): Promise<void> {
    try {
      // Initialize SMTP transporter
      await this.initializeTransporter();
      
      // Load email templates
      await this.loadTemplates();
      
      // Start Kafka consumer for email notifications
      await this.kafkaService.startConsumer({
        groupId: 'email-service-group',
        topics: ['email-notifications'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleEmailMessage.bind(this));

      logger.info('📧 Email service started successfully');

    } catch (error) {
      logger.error('Failed to start email service:', error);
      throw error;
    }
  }

  // 🔧 Initialize SMTP transporter
  private async initializeTransporter(): Promise<void> {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5,
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.metrics.smtpStatus = 'connected';
      
      logger.info('📧 SMTP transporter initialized successfully');

    } catch (error) {
      this.metrics.smtpStatus = 'error';
      logger.error('Failed to initialize SMTP transporter:', error);
      throw error;
    }
  }

  // 📝 Load email templates
  private async loadTemplates(): Promise<void> {
    const templatesDir = path.join(__dirname, '../templates');
    
    try {
      if (fs.existsSync(templatesDir)) {
        const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));
        
        for (const file of templateFiles) {
          const templateName = file.replace('.hbs', '');
          const templatePath = path.join(templatesDir, file);
          const templateContent = fs.readFileSync(templatePath, 'utf8');
          
          this.templates.set(templateName, Handlebars.compile(templateContent));
          logger.info(`📝 Template loaded: ${templateName}`);
        }
      } else {
        logger.warn('📝 Templates directory not found, using inline templates');
        await this.createDefaultTemplates();
      }
    } catch (error) {
      logger.error('Error loading templates:', error);
      await this.createDefaultTemplates();
    }
  }

  // 📝 Create default templates
  private async createDefaultTemplates(): Promise<void> {
    const defaultTemplates = {
      welcome: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to GitHub Clone</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome {{username}}!</h1>
          <p>Thank you for joining GitHub Clone. Your account has been created successfully.</p>
          <p>Start exploring repositories and connect with other developers!</p>
          <a href="{{loginUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a>
        </body>
        </html>
      `,
      notification: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>{{title}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">{{title}}</h2>
          <p>{{message}}</p>
          {{#if actionUrl}}
          <a href="{{actionUrl}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{actionText}}</a>
          {{/if}}
        </body>
        </html>
      `,
      alert: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Security Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px;">
            <h2 style="color: #721c24;">Security Alert</h2>
            <p>{{message}}</p>
            <p>If you didn't perform this action, please secure your account immediately.</p>
            <a href="{{securityUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Secure Account</a>
          </div>
        </body>
        </html>
      `
    };

    for (const [name, template] of Object.entries(defaultTemplates)) {
      this.templates.set(name, Handlebars.compile(template));
    }
  }

  // 📤 Send email
  async sendEmail(emailData: Omit<EmailMessage, 'id' | 'status' | 'createdAt'>): Promise<EmailMessage> {
    const startTime = Date.now();

    try {
      const email: EmailMessage = {
        id: uuidv4(),
        ...emailData,
        status: 'pending',
        createdAt: new Date()
      };

      // Generate HTML from template if template is provided
      if (email.template && email.templateData) {
        const template = this.templates.get(email.template);
        if (template) {
          email.html = template(email.templateData);
          email.text = htmlToText(email.html);
        }
      }

      // Send email
      const mailOptions = {
        from: email.from || process.env.SMTP_FROM || 'noreply@githubclone.com',
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments,
        replyTo: email.replyTo,
        priority: email.priority || 'normal'
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      email.status = 'sent';
      email.sentAt = new Date();

      // Update metrics
      this.updateMetrics(email, Date.now() - startTime);

      logger.info(`📧 Email sent successfully`, {
        id: email.id,
        to: email.to,
        subject: email.subject,
        messageId: info.messageId
      });

      return email;

    } catch (error) {
      const email: EmailMessage = {
        id: uuidv4(),
        ...emailData,
        status: 'failed',
        createdAt: new Date(),
        error: error.message
      };

      this.metrics.totalFailed++;
      
      logger.error(`📧 Failed to send email:`, {
        id: email.id,
        to: email.to,
        subject: email.subject,
        error: error.message
      });

      throw error;
    }
  }

  // 📥 Handle Kafka email messages
  private async handleEmailMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`📧 Processing email notification`, {
        notificationId: message.notificationId,
        userId: message.userId,
        type: message.type
      });

      // Get user email from user service (in real implementation)
      const userEmail = await this.getUserEmail(message.userId);
      
      if (!userEmail) {
        logger.warn(`📧 User email not found for user ${message.userId}`);
        return;
      }

      // Send email based on notification type
      await this.sendEmail({
        to: userEmail,
        subject: message.title,
        html: message.message,
        text: message.message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        type: message.type,
        userId: message.userId,
        priority: message.type === 'alert' ? 'high' : 'normal'
      });

    } catch (error) {
      logger.error('📧 Error processing email message:', error);
    }
  }

  // 👤 Get user email (mock implementation)
  private async getUserEmail(userId: string): Promise<string | null> {
    // In real implementation, this would call the user service
    // For now, we'll use a mock email
    return `${userId}@example.com`;
  }

  // 📊 Get email status
  async getEmailStatus(emailId: string): Promise<EmailMessage | null> {
    // In real implementation, this would query the database
    // For now, return null
    return null;
  }

  // 📜 Get email history
  async getEmailHistory(userId: string, limit: number = 20, offset: number = 0): Promise<EmailMessage[]> {
    // In real implementation, this would query the database
    // For now, return empty array
    return [];
  }

  // 📈 Update metrics
  private updateMetrics(email: EmailMessage, processingTime: number): void {
    this.metrics.totalSent++;
    
    if (email.status === 'sent') {
      this.metrics.totalDelivered++;
    } else if (email.status === 'failed') {
      this.metrics.totalFailed++;
    }
    
    // Update by type
    this.metrics.byType[email.type] = (this.metrics.byType[email.type] || 0) + 1;
    
    // Update average processing time
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-1000);
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  // 📊 Get service metrics
  getMetrics(): EmailMetrics {
    return { ...this.metrics };
  }

  // 🔍 Get SMTP status
  async getSMTPStatus(): Promise<any> {
    try {
      if (this.transporter) {
        await this.transporter.verify();
        return {
          connected: true,
          status: this.metrics.smtpStatus,
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT
        };
      }
      return {
        connected: false,
        status: 'not_initialized'
      };
    } catch (error) {
      return {
        connected: false,
        status: 'error',
        error: error.message
      };
    }
  }

  // 🔄 Disconnect
  async disconnect(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
    logger.info('📧 Email service disconnected');
  }
}
