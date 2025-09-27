import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import { logger } from '../utils/logger';

export interface ConsumerConfig {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private admin: Admin | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'ai-service',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      retry: {
        initialRetryTime: 300,
        retries: 8
      },
      connectionTimeout: 3000,
      requestTimeout: 25000
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
        retry: {
          retries: 3
        }
      });

      // Initialize admin client
      this.admin = this.kafka.admin();

      // Connect to Kafka
      await this.producer.connect();
      await this.admin.connect();

      this.isConnected = true;

      // Ensure topics exist
      await this.ensureTopicsExist();

      logger.info('🤖 AI Service Kafka initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Kafka for AI Service:', error);
      throw error;
    }
  }

  private async ensureTopicsExist(): Promise<void> {
    const topics = [
      'ai-requests',
      'ai-responses',
      'ai-tasks',
      'ai-events',
      'agent-requests',
      'agent-responses'
    ];

    try {
      const existingTopics = await this.admin!.listTopics();
      const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));

      if (topicsToCreate.length > 0) {
        await this.admin!.createTopics({
          topics: topicsToCreate.map(topic => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
            configEntries: [
              {
                name: 'retention.ms',
                value: '604800000' // 7 days
              },
              {
                name: 'compression.type',
                value: 'snappy'
              }
            ]
          })),
          waitForLeaders: true
        });

        logger.info(`🤖 Created Kafka topics: ${topicsToCreate.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error ensuring topics exist:', error);
    }
  }

  async startConsumer(config: ConsumerConfig): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }

    try {
      this.consumer = this.kafka.consumer({
        groupId: config.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576,
        retry: {
          retries: 5
        }
      });

      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: config.topics,
        fromBeginning: config.fromBeginning || false
      });

      logger.info(`🤖 AI Service consumer started for topics: ${config.topics.join(', ')}`);

    } catch (error) {
      logger.error('Failed to start consumer:', error);
      throw error;
    }
  }

  async consumeMessages(handler: (payload: any) => Promise<void>): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not started. Call startConsumer() first.');
    }

    try {
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            await handler({
              topic,
              partition,
              message
            });
          } catch (error) {
            logger.error('Error processing message:', {
              topic,
              partition,
              error: error.message
            });
          }
        }
      });
    } catch (error) {
      logger.error('Error in message consumption:', error);
      throw error;
    }
  }

  async publishMessage(topic: string, message: any): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not initialized');
    }

    try {
      await this.producer.send({
        topic,
        messages: [{
          key: message.id || Date.now().toString(),
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
          headers: {
            'content-type': 'application/json',
            'service': 'ai-service'
          }
        }]
      });

      logger.debug(`🤖 Message published to topic ${topic}:`, {
        messageId: message.id,
        topic
      });

    } catch (error) {
      logger.error('Failed to publish message:', error);
      throw error;
    }
  }

  async publishAIEvent(eventType: string, data: any): Promise<void> {
    const event = {
      id: data.id || Date.now().toString(),
      eventType,
      service: 'ai-service',
      timestamp: new Date().toISOString(),
      data
    };

    await this.publishMessage('ai-events', event);
  }

  async getHealthStatus(): Promise<any> {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          connected: false
        };
      }

      // Test producer connection
      if (this.producer) {
        await this.producer.send({
          topic: 'health-check',
          messages: [{
            key: 'health-check',
            value: JSON.stringify({
              service: 'ai-service',
              timestamp: new Date().toISOString()
            })
          }]
        });
      }

      return {
        status: 'connected',
        connected: true,
        producer: !!this.producer,
        consumer: !!this.consumer,
        admin: !!this.admin
      };

    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      if (this.producer) {
        await this.producer.disconnect();
      }
      if (this.admin) {
        await this.admin.disconnect();
      }

      this.isConnected = false;
      logger.info('🤖 AI Service Kafka disconnected');

    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
    }
  }
}
