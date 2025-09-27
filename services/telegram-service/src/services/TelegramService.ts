import TelegramBot, { Message, Chat, User, Update } from 'node-telegram-bot-api';
import moment from 'moment';
import { KafkaService } from './KafkaService';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface TelegramMessage {
  id: string;
  chatId: string | number;
  message: string;
  type: 'text' | 'photo' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker' | 'animation';
  media?: {
    data: Buffer;
    filename: string;
    mimetype: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
  };
  replyToMessageId?: number;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disableWebPagePreview?: boolean;
  disableNotification?: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  messageId?: number; // Telegram message ID
  error?: string;
  userId?: string;
  priority: 'high' | 'normal' | 'low';
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  description?: string;
  invite_link?: string;
  member_count?: number;
  is_bot?: boolean;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  byType: Record<string, number>;
  byChatType: Record<string, number>;
  averageProcessingTime: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastActivity: string;
  botInfo?: {
    id: number;
    username: string;
    first_name: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
  };
}

export class TelegramService {
  private kafkaService: KafkaService;
  private bot: TelegramBot | null = null;
  private metrics: TelegramMetrics;
  private processingTimes: number[] = [];
  private isConnected: boolean = false;
  private messageQueue: TelegramMessage[] = [];

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.metrics = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      byType: {},
      byChatType: {},
      averageProcessingTime: 0,
      connectionStatus: 'disconnected',
      lastActivity: ''
    };
  }

  async start(): Promise<void> {
    try {
      // Initialize Telegram bot
      await this.initializeTelegramBot();
      
      // Start Kafka consumer for Telegram notifications
      await this.kafkaService.startConsumer({
        groupId: 'telegram-service-group',
        topics: ['telegram-notifications'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleTelegramMessage.bind(this));

      logger.info('📱 Telegram service started successfully');

    } catch (error) {
      logger.error('Failed to start Telegram service:', error);
      throw error;
    }
  }

  // 🔧 Initialize Telegram bot
  private async initializeTelegramBot(): Promise<void> {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!token) {
        throw new Error('Telegram bot token not provided');
      }

      this.bot = new TelegramBot(token, { polling: true });

      // Event handlers
      this.setupEventHandlers();

      // Get bot info
      const botInfo = await this.bot.getMe();
      this.metrics.botInfo = botInfo;
      this.isConnected = true;
      this.metrics.connectionStatus = 'connected';
      this.metrics.lastActivity = new Date().toISOString();
      
      logger.info('📱 Telegram bot initialized successfully', {
        username: botInfo.username,
        first_name: botInfo.first_name
      });

    } catch (error) {
      this.metrics.connectionStatus = 'error';
      logger.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  // 🎯 Setup Telegram event handlers
  private setupEventHandlers(): void {
    if (!this.bot) return;

    // Message received
    this.bot.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });

    // Error handling
    this.bot.on('error', (error) => {
      logger.error('📱 Telegram bot error:', error);
      this.metrics.connectionStatus = 'error';
    });

    // Polling error
    this.bot.on('polling_error', (error) => {
      logger.error('📱 Telegram polling error:', error);
    });

    // Webhook error
    this.bot.on('webhook_error', (error) => {
      logger.error('📱 Telegram webhook error:', error);
    });
  }

  // 📤 Send Telegram message
  async sendMessage(messageData: Omit<TelegramMessage, 'id' | 'status' | 'timestamp'>): Promise<TelegramMessage> {
    const startTime = Date.now();

    try {
      const message: TelegramMessage = {
        id: uuidv4(),
        ...messageData,
        status: 'pending',
        timestamp: new Date()
      };

      if (!this.isConnected || !this.bot) {
        // Queue message if not connected
        this.messageQueue.push(message);
        logger.info('📱 Message queued (Telegram not connected)', { id: message.id });
        return message;
      }

      let sentMessage: Message;

      const options: any = {
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        disable_notification: message.disableNotification
      };

      if (message.replyToMessageId) {
        options.reply_to_message_id = message.replyToMessageId;
      }

      switch (message.type) {
        case 'text':
          sentMessage = await this.bot.sendMessage(message.chatId, message.message, options);
          break;
        case 'photo':
          if (message.media) {
            sentMessage = await this.bot.sendPhoto(message.chatId, message.media.data, {
              caption: message.message,
              ...options
            });
          }
          break;
        case 'video':
          if (message.media) {
            sentMessage = await this.bot.sendVideo(message.chatId, message.media.data, {
              caption: message.message,
              ...options
            });
          }
          break;
        case 'audio':
          if (message.media) {
            sentMessage = await this.bot.sendAudio(message.chatId, message.media.data, {
              caption: message.message,
              ...options
            });
          }
          break;
        case 'document':
          if (message.media) {
            sentMessage = await this.bot.sendDocument(message.chatId, message.media.data, {
              caption: message.message,
              ...options
            });
          }
          break;
        case 'location':
          if (message.location) {
            sentMessage = await this.bot.sendLocation(
              message.chatId,
              message.location.latitude,
              message.location.longitude,
              options
            );
          }
          break;
        case 'contact':
          if (message.contact) {
            sentMessage = await this.bot.sendContact(
              message.chatId,
              message.contact.phone_number,
              message.contact.first_name,
              {
                last_name: message.contact.last_name,
                ...options
              }
            );
          }
          break;
        default:
          throw new Error(`Unsupported message type: ${message.type}`);
      }

      message.status = 'sent';
      message.messageId = sentMessage.message_id;
      this.updateMetrics(message, Date.now() - startTime);

      logger.info(`📱 Telegram message sent successfully`, {
        id: message.id,
        chatId: message.chatId,
        type: message.type,
        messageId: message.messageId
      });

      return message;

    } catch (error) {
      const message: TelegramMessage = {
        id: uuidv4(),
        ...messageData,
        status: 'failed',
        timestamp: new Date(),
        error: error.message
      };

      this.metrics.totalFailed++;
      
      logger.error(`📱 Failed to send Telegram message:`, {
        id: message.id,
        chatId: message.chatId,
        type: message.type,
        error: error.message
      });

      throw error;
    }
  }

  // 📤 Send media message
  async sendMediaMessage(chatId: string | number, mediaData: Buffer, filename: string, mimetype: string, caption?: string): Promise<TelegramMessage> {
    try {
      // Optimize image if it's an image
      let processedMedia = mediaData;
      if (mimetype.startsWith('image/')) {
        processedMedia = await sharp(mediaData)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
      }

      const messageType = mimetype.startsWith('image/') ? 'photo' : 
                         mimetype.startsWith('video/') ? 'video' :
                         mimetype.startsWith('audio/') ? 'audio' : 'document';

      const message = await this.sendMessage({
        chatId,
        message: caption || '',
        type: messageType,
        media: {
          data: processedMedia,
          filename,
          mimetype
        },
        priority: 'normal',
        userId: undefined
      });

      return message;
    } catch (error) {
      logger.error('Failed to send Telegram media message:', error);
      throw error;
    }
  }

  // 📤 Send bulk messages
  async sendBulkMessages(chatIds: (string | number)[], messageData: Omit<TelegramMessage, 'id' | 'status' | 'timestamp' | 'chatId'>): Promise<TelegramMessage[]> {
    const results: TelegramMessage[] = [];
    
    for (const chatId of chatIds) {
      try {
        const message = await this.sendMessage({
          ...messageData,
          chatId
        });
        results.push(message);
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`📱 Failed to send bulk message to ${chatId}:`, error);
        results.push({
          id: uuidv4(),
          ...messageData,
          chatId,
          status: 'failed',
          timestamp: new Date(),
          error: error.message
        });
      }
    }

    return results;
  }

  // 📤 Send template message
  async sendTemplateMessage(chatId: string | number, template: string, templateData: any): Promise<TelegramMessage> {
    try {
      const message = this.processTemplate(template, templateData);
      
      return await this.sendMessage({
        chatId,
        message,
        type: 'text',
        parseMode: 'HTML',
        priority: 'normal',
        userId: undefined
      });
    } catch (error) {
      logger.error('Failed to send Telegram template message:', error);
      throw error;
    }
  }

  // 📝 Process template
  private processTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // 📥 Handle incoming messages
  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      logger.info('📱 Received Telegram message', {
        chatId: message.chat.id,
        from: message.from?.username || message.from?.first_name,
        type: message.text ? 'text' : message.photo ? 'photo' : 'other',
        text: message.text?.substring(0, 100)
      });

      // Publish incoming message event to Kafka
      await this.kafkaService.publishMessage('telegram-events', {
        id: uuidv4(),
        eventType: 'message_received',
        timestamp: new Date().toISOString(),
        data: {
          messageId: message.message_id,
          chatId: message.chat.id,
          from: message.from,
          type: message.text ? 'text' : message.photo ? 'photo' : 'other',
          text: message.text,
          timestamp: message.date,
          isGroup: message.chat.type !== 'private',
          hasMedia: !!(message.photo || message.video || message.audio || message.document)
        }
      });

    } catch (error) {
      logger.error('Error handling incoming Telegram message:', error);
    }
  }

  // 📥 Handle Kafka Telegram messages
  private async handleTelegramMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`📱 Processing Telegram notification`, {
        notificationId: message.notificationId,
        userId: message.userId,
        type: message.type
      });

      // Get user chat ID from user service (in real implementation)
      const userChatId = await this.getUserChatId(message.userId);
      
      if (!userChatId) {
        logger.warn(`📱 User chat ID not found for user ${message.userId}`);
        return;
      }

      // Send Telegram message based on notification type
      await this.sendMessage({
        chatId: userChatId,
        message: message.message,
        type: 'text',
        parseMode: 'HTML',
        userId: message.userId,
        priority: message.type === 'alert' ? 'high' : 'normal'
      });

    } catch (error) {
      logger.error('📱 Error processing Telegram message:', error);
    }
  }

  // 👤 Get user chat ID (mock implementation)
  private async getUserChatId(userId: string): Promise<string | number | null> {
    // In real implementation, this would call the user service
    // For now, we'll use a mock chat ID
    return '123456789';
  }

  // 🔄 Process message queue
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    logger.info(`📱 Processing ${this.messageQueue.length} queued messages`);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        await this.sendMessage(message);
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      } catch (error) {
        logger.error('Failed to process queued message:', error);
      }
    }
  }

  // 💬 Get Telegram chats
  async getChats(): Promise<TelegramChat[]> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      // Note: Telegram Bot API doesn't provide a direct way to get all chats
      // This would require storing chat information when messages are received
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get Telegram chats:', error);
      throw error;
    }
  }

  // 💬 Get specific chat
  async getChat(chatId: string | number): Promise<Chat> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      const chat = await this.bot.getChat(chatId);
      return chat;
    } catch (error) {
      logger.error(`Failed to get Telegram chat ${chatId}:`, error);
      throw error;
    }
  }

  // 👥 Get chat members
  async getChatMembers(chatId: string | number): Promise<User[]> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      const members = await this.bot.getChatAdministrators(chatId);
      return members.map(member => member.user);
    } catch (error) {
      logger.error(`Failed to get Telegram chat members for ${chatId}:`, error);
      throw error;
    }
  }

  // 🤖 Get bot info
  async getBotInfo(): Promise<any> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      const botInfo = await this.bot.getMe();
      return botInfo;
    } catch (error) {
      logger.error('Failed to get Telegram bot info:', error);
      throw error;
    }
  }

  // 🔗 Set webhook
  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      await this.bot.setWebHook(webhookUrl);
      logger.info('📱 Telegram webhook set successfully', { webhookUrl });
      return true;
    } catch (error) {
      logger.error('Failed to set Telegram webhook:', error);
      throw error;
    }
  }

  // 🔗 Delete webhook
  async deleteWebhook(): Promise<boolean> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      await this.bot.deleteWebHook();
      logger.info('📱 Telegram webhook deleted successfully');
      return true;
    } catch (error) {
      logger.error('Failed to delete Telegram webhook:', error);
      throw error;
    }
  }

  // 🔗 Get webhook info
  async getWebhookInfo(): Promise<any> {
    if (!this.bot || !this.isConnected) {
      throw new Error('Telegram bot not connected');
    }

    try {
      const webhookInfo = await this.bot.getWebHookInfo();
      return webhookInfo;
    } catch (error) {
      logger.error('Failed to get Telegram webhook info:', error);
      throw error;
    }
  }

  // 📈 Update metrics
  private updateMetrics(message: TelegramMessage, processingTime: number): void {
    this.metrics.totalSent++;
    this.metrics.byType[message.type] = (this.metrics.byType[message.type] || 0) + 1;
    
    // Update average processing time
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-1000);
    }
    
    this.metrics.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  // 📊 Get service metrics
  getMetrics(): TelegramMetrics {
    return { ...this.metrics };
  }

  // 🔍 Get Telegram status
  async getTelegramStatus(): Promise<any> {
    return {
      connected: this.isConnected,
      status: this.metrics.connectionStatus,
      lastActivity: this.metrics.lastActivity,
      queuedMessages: this.messageQueue.length,
      botInfo: this.metrics.botInfo
    };
  }

  // 🔄 Disconnect
  async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
    }
    this.isConnected = false;
    this.metrics.connectionStatus = 'disconnected';
    logger.info('📱 Telegram service disconnected');
  }

  // 🔄 Reconnect
  async reconnect(): Promise<void> {
    try {
      await this.disconnect();
      await this.initializeTelegramBot();
      logger.info('📱 Telegram service reconnected');
    } catch (error) {
      logger.error('Failed to reconnect Telegram service:', error);
      throw error;
    }
  }
}
