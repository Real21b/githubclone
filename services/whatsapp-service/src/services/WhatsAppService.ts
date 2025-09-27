import { Client, MessageMedia, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import moment from 'moment';
import { KafkaService } from './KafkaService';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface WhatsAppMessage {
  id: string;
  to: string;
  message: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact';
  media?: {
    data: Buffer;
    filename: string;
    mimetype: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
  contact?: {
    name: string;
    phone: string;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  messageId?: string; // WhatsApp message ID
  error?: string;
  userId?: string;
  priority: 'high' | 'normal' | 'low';
}

export interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
  profilePicUrl?: string;
  status?: string;
}

export interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
  unreadCount: number;
}

export interface WhatsAppMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  byType: Record<string, number>;
  averageProcessingTime: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastActivity: string;
  qrCodeGenerated: boolean;
}

export class WhatsAppService {
  private kafkaService: KafkaService;
  private client: Client | null = null;
  private metrics: WhatsAppMetrics;
  private processingTimes: number[] = [];
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private messageQueue: WhatsAppMessage[] = [];
  private sessionPath: string;

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.sessionPath = path.join(process.cwd(), 'whatsapp-session');
    this.metrics = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      byType: {},
      averageProcessingTime: 0,
      connectionStatus: 'disconnected',
      lastActivity: '',
      qrCodeGenerated: false
    };
  }

  async start(): Promise<void> {
    try {
      // Initialize WhatsApp client
      await this.initializeWhatsAppClient();
      
      // Start Kafka consumer for WhatsApp notifications
      await this.kafkaService.startConsumer({
        groupId: 'whatsapp-service-group',
        topics: ['whatsapp-notifications'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleWhatsAppMessage.bind(this));

      logger.info('📱 WhatsApp service started successfully');

    } catch (error) {
      logger.error('Failed to start WhatsApp service:', error);
      throw error;
    }
  }

  // 🔧 Initialize WhatsApp client
  private async initializeWhatsAppClient(): Promise<void> {
    try {
      // Create session directory if it doesn't exist
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'github-clone-whatsapp',
          dataPath: this.sessionPath
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      // Event handlers
      this.setupEventHandlers();

      // Initialize client
      await this.client.initialize();
      
      this.metrics.connectionStatus = 'connecting';

    } catch (error) {
      this.metrics.connectionStatus = 'error';
      logger.error('Failed to initialize WhatsApp client:', error);
      throw error;
    }
  }

  // 🎯 Setup WhatsApp event handlers
  private setupEventHandlers(): void {
    if (!this.client) return;

    // QR Code generation
    this.client.on('qr', (qr) => {
      this.qrCode = qr;
      this.metrics.qrCodeGenerated = true;
      logger.info('📱 WhatsApp QR Code generated');
      
      // Display QR code in terminal
      qrcode.generate(qr, { small: true });
    });

    // Client ready
    this.client.on('ready', () => {
      this.isConnected = true;
      this.metrics.connectionStatus = 'connected';
      this.metrics.lastActivity = new Date().toISOString();
      logger.info('📱 WhatsApp client is ready!');
      
      // Process queued messages
      this.processMessageQueue();
    });

    // Client disconnected
    this.client.on('disconnected', (reason) => {
      this.isConnected = false;
      this.metrics.connectionStatus = 'disconnected';
      logger.warn('📱 WhatsApp client disconnected:', reason);
    });

    // Message received
    this.client.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });

    // Message status updates
    this.client.on('message_ack', (message, ack) => {
      this.handleMessageAck(message, ack);
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      this.metrics.connectionStatus = 'error';
      logger.error('📱 WhatsApp authentication failed:', msg);
    });
  }

  // 📤 Send WhatsApp message
  async sendMessage(messageData: Omit<WhatsAppMessage, 'id' | 'status' | 'timestamp'>): Promise<WhatsAppMessage> {
    const startTime = Date.now();

    try {
      const message: WhatsAppMessage = {
        id: uuidv4(),
        ...messageData,
        status: 'pending',
        timestamp: new Date()
      };

      if (!this.isConnected) {
        // Queue message if not connected
        this.messageQueue.push(message);
        logger.info('📱 Message queued (WhatsApp not connected)', { id: message.id });
        return message;
      }

      let sentMessage: any;

      switch (message.type) {
        case 'text':
          sentMessage = await this.client!.sendMessage(message.to, message.message);
          break;
        case 'image':
        case 'video':
        case 'audio':
        case 'document':
          if (message.media) {
            const media = new MessageMedia(message.media.mimetype, message.media.data.toString('base64'), message.media.filename);
            sentMessage = await this.client!.sendMessage(message.to, media);
          }
          break;
        case 'location':
          if (message.location) {
            sentMessage = await this.client!.sendMessage(message.to, '', {
              location: {
                latitude: message.location.latitude,
                longitude: message.location.longitude,
                description: message.location.description
              }
            });
          }
          break;
        case 'contact':
          if (message.contact) {
            const contact = await this.client!.getContactById(message.contact.phone);
            sentMessage = await this.client!.sendMessage(message.to, contact);
          }
          break;
        default:
          throw new Error(`Unsupported message type: ${message.type}`);
      }

      message.status = 'sent';
      message.messageId = sentMessage.id._serialized;
      this.updateMetrics(message, Date.now() - startTime);

      logger.info(`📱 WhatsApp message sent successfully`, {
        id: message.id,
        to: message.to,
        type: message.type,
        messageId: message.messageId
      });

      return message;

    } catch (error) {
      const message: WhatsAppMessage = {
        id: uuidv4(),
        ...messageData,
        status: 'failed',
        timestamp: new Date(),
        error: error.message
      };

      this.metrics.totalFailed++;
      
      logger.error(`📱 Failed to send WhatsApp message:`, {
        id: message.id,
        to: message.to,
        type: message.type,
        error: error.message
      });

      throw error;
    }
  }

  // 📤 Send media message
  async sendMediaMessage(to: string, mediaData: Buffer, filename: string, mimetype: string, caption?: string): Promise<WhatsAppMessage> {
    try {
      // Optimize image if it's an image
      let processedMedia = mediaData;
      if (mimetype.startsWith('image/')) {
        processedMedia = await sharp(mediaData)
          .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      const message = await this.sendMessage({
        to,
        message: caption || '',
        type: mimetype.startsWith('image/') ? 'image' : 
              mimetype.startsWith('video/') ? 'video' :
              mimetype.startsWith('audio/') ? 'audio' : 'document',
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
      logger.error('Failed to send WhatsApp media message:', error);
      throw error;
    }
  }

  // 📤 Send bulk messages
  async sendBulkMessages(recipients: string[], messageData: Omit<WhatsAppMessage, 'id' | 'status' | 'timestamp' | 'to'>): Promise<WhatsAppMessage[]> {
    const results: WhatsAppMessage[] = [];
    
    for (const recipient of recipients) {
      try {
        const message = await this.sendMessage({
          ...messageData,
          to: recipient
        });
        results.push(message);
        
        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`📱 Failed to send bulk message to ${recipient}:`, error);
        results.push({
          id: uuidv4(),
          ...messageData,
          to: recipient,
          status: 'failed',
          timestamp: new Date(),
          error: error.message
        });
      }
    }

    return results;
  }

  // 📤 Send template message
  async sendTemplateMessage(to: string, template: string, templateData: any): Promise<WhatsAppMessage> {
    try {
      const message = this.processTemplate(template, templateData);
      
      return await this.sendMessage({
        to,
        message,
        type: 'text',
        priority: 'normal',
        userId: undefined
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp template message:', error);
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
      logger.info('📱 Received WhatsApp message', {
        from: message.from,
        type: message.type,
        body: message.body?.substring(0, 100)
      });

      // Publish incoming message event to Kafka
      await this.kafkaService.publishMessage('whatsapp-events', {
        id: uuidv4(),
        eventType: 'message_received',
        timestamp: new Date().toISOString(),
        data: {
          messageId: message.id._serialized,
          from: message.from,
          to: message.to,
          type: message.type,
          body: message.body,
          timestamp: message.timestamp,
          isGroup: message.from.includes('@g.us'),
          isForwarded: message.isForwarded,
          hasMedia: message.hasMedia
        }
      });

    } catch (error) {
      logger.error('Error handling incoming WhatsApp message:', error);
    }
  }

  // 📥 Handle message acknowledgments
  private handleMessageAck(message: Message, ack: any): void {
    try {
      logger.info('📱 WhatsApp message acknowledgment', {
        messageId: message.id._serialized,
        ack: ack
      });

      // Update metrics based on acknowledgment
      switch (ack) {
        case 1: // Message sent
          this.metrics.totalSent++;
          break;
        case 2: // Message delivered
          this.metrics.totalDelivered++;
          break;
        case 3: // Message read
          this.metrics.totalRead++;
          break;
      }

      this.metrics.lastActivity = new Date().toISOString();

    } catch (error) {
      logger.error('Error handling WhatsApp message acknowledgment:', error);
    }
  }

  // 📥 Handle Kafka WhatsApp messages
  private async handleWhatsAppMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`📱 Processing WhatsApp notification`, {
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

      // Send WhatsApp message based on notification type
      await this.sendMessage({
        to: userPhone,
        message: message.message,
        type: 'text',
        userId: message.userId,
        priority: message.type === 'alert' ? 'high' : 'normal'
      });

    } catch (error) {
      logger.error('📱 Error processing WhatsApp message:', error);
    }
  }

  // 👤 Get user phone (mock implementation)
  private async getUserPhone(userId: string): Promise<string | null> {
    // In real implementation, this would call the user service
    // For now, we'll use a mock phone number
    return '+1234567890';
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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        logger.error('Failed to process queued message:', error);
      }
    }
  }

  // 👥 Get WhatsApp contacts
  async getContacts(): Promise<WhatsAppContact[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp client not connected');
    }

    try {
      const contacts = await this.client.getContacts();
      
      return contacts.map(contact => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname || 'Unknown',
        number: contact.number,
        isGroup: contact.isGroup,
        isUser: contact.isUser,
        isWAContact: contact.isWAContact,
        profilePicUrl: contact.profilePicUrl,
        status: contact.status
      }));
    } catch (error) {
      logger.error('Failed to get WhatsApp contacts:', error);
      throw error;
    }
  }

  // 💬 Get WhatsApp chats
  async getChats(): Promise<WhatsAppChat[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp client not connected');
    }

    try {
      const chats = await this.client.getChats();
      
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        participants: chat.participants?.map(p => p.id._serialized) || [],
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp,
          from: chat.lastMessage.from
        } : undefined,
        unreadCount: chat.unreadCount
      }));
    } catch (error) {
      logger.error('Failed to get WhatsApp chats:', error);
      throw error;
    }
  }

  // 💬 Get chat messages
  async getMessages(chatId: string, limit: number = 50): Promise<any[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('WhatsApp client not connected');
    }

    try {
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map(message => ({
        id: message.id._serialized,
        body: message.body,
        type: message.type,
        timestamp: message.timestamp,
        from: message.from,
        to: message.to,
        isForwarded: message.isForwarded,
        hasMedia: message.hasMedia,
        ack: message.ack
      }));
    } catch (error) {
      logger.error('Failed to get WhatsApp messages:', error);
      throw error;
    }
  }

  // 📈 Update metrics
  private updateMetrics(message: WhatsAppMessage, processingTime: number): void {
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
  getMetrics(): WhatsAppMetrics {
    return { ...this.metrics };
  }

  // 🔍 Get WhatsApp status
  async getWhatsAppStatus(): Promise<any> {
    return {
      connected: this.isConnected,
      status: this.metrics.connectionStatus,
      qrCodeGenerated: this.metrics.qrCodeGenerated,
      lastActivity: this.metrics.lastActivity,
      queuedMessages: this.messageQueue.length
    };
  }

  // 🔄 Get QR Code
  getQRCode(): string | null {
    return this.qrCode;
  }

  // 🔄 Disconnect
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
    this.isConnected = false;
    this.metrics.connectionStatus = 'disconnected';
    logger.info('📱 WhatsApp service disconnected');
  }

  // 🔄 Reconnect
  async reconnect(): Promise<void> {
    try {
      await this.disconnect();
      await this.initializeWhatsAppClient();
      logger.info('📱 WhatsApp service reconnected');
    } catch (error) {
      logger.error('Failed to reconnect WhatsApp service:', error);
      throw error;
    }
  }
}
