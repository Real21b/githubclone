import twilio from 'twilio';
import axios from 'axios';
import moment from 'moment';
import { KafkaService } from './KafkaService';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface SMSMessage {
  id: string;
  to: string;
  message: string;
  template?: string;
  templateData?: any;
  priority: 'high' | 'normal' | 'low';
  provider: 'twilio' | 'aws-sns' | 'vonage';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  cost?: number;
  userId?: string;
  type: 'verification' | 'notification' | 'alert' | 'marketing';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  messageId?: string; // Provider's message ID
  deliveryReport?: any;
}

export interface SMSMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  averageProcessingTime: number;
  totalCost: number;
  smsStatus: 'connected' | 'disconnected' | 'error';
}

export class SMSService {
  private kafkaService: KafkaService;
  private twilioClient: twilio.Twilio | null = null;
  private metrics: SMSMetrics;
  private processingTimes: number[] = [];
  private templates: Map<string, string> = new Map();

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.metrics = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      byType: {},
      byProvider: {},
      averageProcessingTime: 0,
      totalCost: 0,
      smsStatus: 'disconnected'
    };
  }

  async start(): Promise<void> {
    try {
      // Initialize SMS providers
      await this.initializeProviders();
      
      // Load SMS templates
      await this.loadTemplates();
      
      // Start Kafka consumer for SMS notifications
      await this.kafkaService.startConsumer({
        groupId: 'sms-service-group',
        topics: ['sms-notifications'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleSMSMessage.bind(this));

      logger.info('📱 SMS service started successfully');

    } catch (error) {
      logger.error('Failed to start SMS service:', error);
      throw error;
    }
  }

  // 🔧 Initialize SMS providers
  private async initializeProviders(): Promise<void> {
    try {
      // Initialize Twilio
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        
        // Test Twilio connection
        await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        this.metrics.smsStatus = 'connected';
        
        logger.info('📱 Twilio client initialized successfully');
      } else {
        logger.warn('📱 Twilio credentials not provided, SMS will use mock mode');
      }

    } catch (error) {
      this.metrics.smsStatus = 'error';
      logger.error('Failed to initialize SMS providers:', error);
      throw error;
    }
  }

  // 📝 Load SMS templates
  private async loadTemplates(): Promise<void> {
    const defaultTemplates = {
      verification: 'Your verification code is: {{code}}. Valid for {{minutes}} minutes.',
      welcome: 'Welcome to GitHub Clone! Your account has been created successfully.',
      notification: '{{message}}',
      alert: 'Security Alert: {{message}}. If this was not you, please secure your account.',
      twoFactor: 'Your 2FA code is: {{code}}. Do not share this code.',
      passwordReset: 'Reset your password with this code: {{code}}. Valid for {{minutes}} minutes.'
    };

    for (const [name, template] of Object.entries(defaultTemplates)) {
      this.templates.set(name, template);
    }

    logger.info(`📝 Loaded ${Object.keys(defaultTemplates).length} SMS templates`);
  }

  // 📤 Send SMS
  async sendSMS(smsData: Omit<SMSMessage, 'id' | 'status' | 'createdAt'>): Promise<SMSMessage> {
    const startTime = Date.now();

    try {
      const sms: SMSMessage = {
        id: uuidv4(),
        ...smsData,
        status: 'pending',
        createdAt: new Date()
      };

      // Process template if provided
      if (sms.template && sms.templateData) {
        sms.message = this.processTemplate(sms.template, sms.templateData);
      }

      // Send SMS based on provider
      const result = await this.sendViaProvider(sms);
      
      sms.status = 'sent';
      sms.sentAt = new Date();
      sms.messageId = result.messageId;
      sms.cost = result.cost;

      // Update metrics
      this.updateMetrics(sms, Date.now() - startTime);

      logger.info(`📱 SMS sent successfully`, {
        id: sms.id,
        to: sms.to,
        provider: sms.provider,
        cost: sms.cost,
        messageId: sms.messageId
      });

      return sms;

    } catch (error) {
      const sms: SMSMessage = {
        id: uuidv4(),
        ...smsData,
        status: 'failed',
        createdAt: new Date(),
        error: error.message
      };

      this.metrics.totalFailed++;
      
      logger.error(`📱 Failed to send SMS:`, {
        id: sms.id,
        to: sms.to,
        provider: sms.provider,
        error: error.message
      });

      throw error;
    }
  }

  // 📤 Send via provider
  private async sendViaProvider(sms: SMSMessage): Promise<{ messageId: string; cost: number }> {
    switch (sms.provider) {
      case 'twilio':
        return await this.sendViaTwilio(sms);
      case 'aws-sns':
        return await this.sendViaAWSSNS(sms);
      case 'vonage':
        return await this.sendViaVonage(sms);
      default:
        throw new Error(`Unsupported SMS provider: ${sms.provider}`);
    }
  }

  // 📤 Send via Twilio
  private async sendViaTwilio(sms: SMSMessage): Promise<{ messageId: string; cost: number }> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: sms.message,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: sms.to,
        statusCallback: `${process.env.SMS_WEBHOOK_URL}/sms/webhook/twilio`
      });

      // Estimate cost (Twilio pricing varies by country)
      const estimatedCost = this.estimateSMSCost(sms.message.length, sms.to);

      return {
        messageId: message.sid,
        cost: estimatedCost
      };

    } catch (error) {
      logger.error('Twilio SMS sending failed:', error);
      throw error;
    }
  }

  // 📤 Send via AWS SNS (mock implementation)
  private async sendViaAWSSNS(sms: SMSMessage): Promise<{ messageId: string; cost: number }> {
    // Mock implementation - in real scenario, use AWS SDK
    logger.info('📱 Sending SMS via AWS SNS (mock)', { to: sms.to });
    
    return {
      messageId: `aws-${uuidv4()}`,
      cost: 0.0075 // Average AWS SNS cost
    };
  }

  // 📤 Send via Vonage (mock implementation)
  private async sendViaVonage(sms: SMSMessage): Promise<{ messageId: string; cost: number }> {
    // Mock implementation - in real scenario, use Vonage SDK
    logger.info('📱 Sending SMS via Vonage (mock)', { to: sms.to });
    
    return {
      messageId: `vonage-${uuidv4()}`,
      cost: 0.008 // Average Vonage cost
    };
  }

  // 📝 Process template
  private processTemplate(templateName: string, data: any): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // 💰 Estimate SMS cost
  private estimateSMSCost(messageLength: number, phoneNumber: string): number {
    // Basic estimation - real cost depends on carrier and country
    const baseCost = 0.0075;
    const extraChars = Math.max(0, messageLength - 160);
    const extraMessages = Math.ceil(extraChars / 160);
    
    return baseCost * (1 + extraMessages);
  }

  // 📥 Handle Kafka SMS messages
  private async handleSMSMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`📱 Processing SMS notification`, {
        notificationId: message.notificationId,
        userId: message.userId,
        type: message.type
      });

      // Get user phone from user service (in real implementation)
      const userPhone = await this.getUserPhone(message.userId);
      
      if (!userPhone) {
        logger.warn(`📱 User phone not found for user ${message.userId}`);
        return;
      }

      // Send SMS based on notification type
      await this.sendSMS({
        to: userPhone,
        message: message.message,
        type: message.type,
        userId: message.userId,
        priority: message.type === 'alert' ? 'high' : 'normal',
        provider: 'twilio' // Default provider
      });

    } catch (error) {
      logger.error('📱 Error processing SMS message:', error);
    }
  }

  // 👤 Get user phone (mock implementation)
  private async getUserPhone(userId: string): Promise<string | null> {
    // In real implementation, this would call the user service
    // For now, we'll use a mock phone number
    return '+1234567890';
  }

  // 📤 Send bulk SMS
  async sendBulkSMS(recipients: string[], message: string, options: any = {}): Promise<SMSMessage[]> {
    const results: SMSMessage[] = [];
    
    for (const recipient of recipients) {
      try {
        const sms = await this.sendSMS({
          to: recipient,
          message,
          ...options
        });
        results.push(sms);
      } catch (error) {
        logger.error(`📱 Failed to send bulk SMS to ${recipient}:`, error);
        results.push({
          id: uuidv4(),
          to: recipient,
          message,
          ...options,
          status: 'failed',
          createdAt: new Date(),
          error: error.message
        });
      }
    }

    return results;
  }

  // 📊 Get SMS status
  async getSMSStatus(smsId: string): Promise<SMSMessage | null> {
    // In real implementation, this would query the database
    // For now, return null
    return null;
  }

  // 📜 Get SMS history
  async getSMSHistory(userId: string, limit: number = 20, offset: number = 0): Promise<SMSMessage[]> {
    // In real implementation, this would query the database
    // For now, return empty array
    return [];
  }

  // 📈 Update metrics
  private updateMetrics(sms: SMSMessage, processingTime: number): void {
    this.metrics.totalSent++;
    
    if (sms.status === 'sent') {
      this.metrics.totalDelivered++;
    } else if (sms.status === 'failed') {
      this.metrics.totalFailed++;
    }
    
    // Update by type
    this.metrics.byType[sms.type] = (this.metrics.byType[sms.type] || 0) + 1;
    
    // Update by provider
    this.metrics.byProvider[sms.provider] = (this.metrics.byProvider[sms.provider] || 0) + 1;
    
    // Update total cost
    if (sms.cost) {
      this.metrics.totalCost += sms.cost;
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
  getMetrics(): SMSMetrics {
    return { ...this.metrics };
  }

  // 🔍 Get SMS provider status
  async getSMSProviderStatus(): Promise<any> {
    try {
      if (this.twilioClient) {
        await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        return {
          twilio: {
            connected: true,
            status: 'active'
          }
        };
      }
      return {
        twilio: {
          connected: false,
          status: 'not_configured'
        }
      };
    } catch (error) {
      return {
        twilio: {
          connected: false,
          status: 'error',
          error: error.message
        }
      };
    }
  }

  // 🔄 Process delivery report
  async processDeliveryReport(provider: string, report: any): Promise<void> {
    try {
      logger.info(`📱 Processing delivery report from ${provider}`, report);

      // Update SMS status in database
      // In real implementation, this would update the database
      
      if (report.status === 'delivered') {
        this.metrics.totalDelivered++;
      }

    } catch (error) {
      logger.error('Error processing delivery report:', error);
    }
  }

  // 🔄 Disconnect
  async disconnect(): Promise<void> {
    logger.info('📱 SMS service disconnected');
  }
}
