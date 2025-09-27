import { Kafka, Producer, Consumer, EachMessagePayload, Admin } from 'kafkajs';
import { logger } from '../utils/logger';

export interface KafkaMessage {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
}

export interface KafkaConsumerConfig {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer | null = null;
  private admin: Admin;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 3000,
      requestTimeout: 25000,
      // Performance optimizations
      maxInFlightRequests: 1,
      idempotent: true,
      transactionalId: 'notification-service-transactional',
      // Compression
      compression: 'gzip',
      // Batch settings for better performance
      maxBytes: 1048576, // 1MB
      maxBytesPerPartition: 1048576,
      maxWaitTimeInMs: 5
    });

    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.admin = this.kafka.admin();
  }

  async initialize(): Promise<void> {
    try {
      // Connect producer
      await this.producer.connect();
      logger.info('Kafka producer connected successfully');

      // Connect admin
      await this.admin.connect();
      logger.info('Kafka admin connected successfully');

      // Create topics if they don't exist
      await this.createTopics();

      this.isConnected = true;
      logger.info('Kafka service initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Kafka service:', error);
      throw error;
    }
  }

  // 🚀 Create required topics
  private async createTopics(): Promise<void> {
    const topics = [
      {
        topic: 'notifications',
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'compression.type', value: 'lz4' }
        ]
      },
      {
        topic: 'user-events',
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '86400000' }, // 1 day
          { name: 'compression.type', value: 'lz4' }
        ]
      },
      {
        topic: 'repository-events',
        numPartitions: 3,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '86400000' }, // 1 day
          { name: 'compression.type', value: 'lz4' }
        ]
      },
      {
        topic: 'email-notifications',
        numPartitions: 2,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'compression.type', value: 'lz4' }
        ]
      },
      {
        topic: 'push-notifications',
        numPartitions: 2,
        replicationFactor: 1,
        configEntries: [
          { name: 'cleanup.policy', value: 'delete' },
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'compression.type', value: 'lz4' }
        ]
      }
    ];

    try {
      const existingTopics = await this.admin.listTopics();
      
      for (const topicConfig of topics) {
        if (!existingTopics.includes(topicConfig.topic)) {
          await this.admin.createTopics({
            topics: [topicConfig]
          });
          logger.info(`Topic created: ${topicConfig.topic}`);
        } else {
          logger.debug(`Topic already exists: ${topicConfig.topic}`);
        }
      }
    } catch (error) {
      logger.error('Error creating topics:', error);
      throw error;
    }
  }

  // 📤 Send message to Kafka
  async sendMessage(message: KafkaMessage): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service not connected');
    }

    try {
      await this.producer.send({
        topic: message.topic,
        messages: [{
          key: message.key,
          value: JSON.stringify(message.value),
          headers: message.headers,
          timestamp: Date.now().toString()
        }]
      });

      logger.debug(`Message sent to topic ${message.topic}`, { 
        key: message.key,
        messageId: message.value.id 
      });

    } catch (error) {
      logger.error(`Failed to send message to topic ${message.topic}:`, error);
      throw error;
    }
  }

  // 📥 Start consuming messages
  async startConsumer(config: KafkaConsumerConfig): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Kafka service not connected');
    }

    this.consumer = this.kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      minBytes: 1,
      maxBytes: 1048576,
      maxWaitTimeInMs: 5000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    await this.consumer.connect();
    logger.info(`Kafka consumer connected for group: ${config.groupId}`);

    // Subscribe to topics
    for (const topic of config.topics) {
      await this.consumer.subscribe({ 
        topic, 
        fromBeginning: config.fromBeginning || false 
      });
    }

    logger.info(`Subscribed to topics: ${config.topics.join(', ')}`);
  }

  // 🔄 Consume messages with callback
  async consumeMessages(
    callback: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not initialized');
    }

    await this.consumer.run({
      eachMessage: async (payload) => {
        try {
          const startTime = Date.now();
          
          // Parse message
          const message = {
            topic: payload.topic,
            partition: payload.partition,
            offset: payload.message.offset,
            key: payload.message.key?.toString(),
            value: JSON.parse(payload.message.value?.toString() || '{}'),
            headers: payload.message.headers,
            timestamp: payload.message.timestamp
          };

          logger.debug(`Processing message from topic ${payload.topic}`, {
            key: message.key,
            offset: message.offset
          });

          // Process message
          await callback(payload);

          const processingTime = Date.now() - startTime;
          logger.debug(`Message processed in ${processingTime}ms`, {
            topic: payload.topic,
            offset: message.offset
          });

        } catch (error) {
          logger.error(`Error processing message from topic ${payload.topic}:`, error);
          
          // In production, you might want to send failed messages to a dead letter queue
          // For now, we'll just log the error
        }
      }
    });
  }

  // 📊 Get Kafka health status
  async getHealthStatus(): Promise<any> {
    try {
      const metadata = await this.admin.fetchTopicMetadata();
      const topics = Object.keys(metadata.topics);
      
      return {
        connected: this.isConnected,
        topics: topics,
        producerConnected: this.producer !== null,
        consumerConnected: this.consumer !== null,
        adminConnected: this.admin !== null
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  // 📈 Get Kafka metrics
  async getMetrics(): Promise<any> {
    try {
      const metadata = await this.admin.fetchTopicMetadata();
      const topics = Object.keys(metadata.topics);
      
      // Get partition information
      const partitionInfo = [];
      for (const topic of topics) {
        const topicMetadata = metadata.topics[topic];
        partitionInfo.push({
          topic: topic,
          partitions: topicMetadata.partitions.length,
          replicas: topicMetadata.partitions[0]?.replicas?.length || 0
        });
      }

      return {
        topics: topics.length,
        partitions: partitionInfo.reduce((sum, info) => sum + info.partitions, 0),
        partitionInfo: partitionInfo,
        connected: this.isConnected
      };
    } catch (error) {
      logger.error('Error getting Kafka metrics:', error);
      return {
        error: error.message,
        connected: this.isConnected
      };
    }
  }

  // 🔄 Disconnect from Kafka
  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        logger.info('Kafka consumer disconnected');
      }

      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }

      if (this.admin) {
        await this.admin.disconnect();
        logger.info('Kafka admin disconnected');
      }

      this.isConnected = false;
      logger.info('Kafka service disconnected successfully');

    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
    }
  }
}
