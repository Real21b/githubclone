import { KafkaService } from './KafkaService';
import { logger } from './logger';

export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  metadata: {
    timestamp: string;
    source: string;
    correlationId?: string;
    causationId?: string;
  };
}

export interface EventHandler<T = any> {
  handle(event: DomainEvent): Promise<void>;
}

export class EventBus {
  private static instance: EventBus;
  private kafkaService: KafkaService;
  private handlers: Map<string, EventHandler[]> = new Map();
  private topics: Set<string> = new Set();

  private constructor() {
    this.kafkaService = new KafkaService();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async initialize(): Promise<void> {
    await this.kafkaService.initialize();
    
    // Subscribe to all registered topics
    const topics = Array.from(this.topics);
    if (topics.length > 0) {
      await this.kafkaService.startConsumer({
        groupId: 'event-bus-group',
        topics,
        fromBeginning: false
      });

      await this.kafkaService.consumeMessages(this.handleMessage.bind(this));
    }
  }

  // 📤 Publish event
  async publish(event: DomainEvent): Promise<void> {
    const topic = this.getTopicName(event.aggregateType);
    
    await this.kafkaService.sendMessage({
      topic,
      key: event.aggregateId,
      value: event
    });

    logger.info(`Event published: ${event.type}`, {
      eventId: event.id,
      aggregateId: event.aggregateId,
      topic
    });
  }

  // 📥 Subscribe to event type
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    // Add topic to set for Kafka subscription
    const topic = this.getTopicNameFromEventType(eventType);
    this.topics.add(topic);

    logger.info(`Handler registered for event: ${eventType}`);
  }

  // 🔄 Handle incoming messages
  private async handleMessage(payload: any): Promise<void> {
    try {
      const event: DomainEvent = JSON.parse(payload.message.value?.toString() || '{}');
      
      const handlers = this.handlers.get(event.type) || [];
      
      // Execute all handlers for this event type
      const promises = handlers.map(handler => 
        handler.handle(event).catch(error => {
          logger.error(`Error handling event ${event.type}:`, error);
        })
      );

      await Promise.allSettled(promises);

      logger.debug(`Event processed: ${event.type}`, {
        eventId: event.id,
        handlersCount: handlers.length
      });

    } catch (error) {
      logger.error('Error processing event message:', error);
    }
  }

  // 🎯 Get topic name from aggregate type
  private getTopicName(aggregateType: string): string {
    return `${aggregateType.toLowerCase()}-events`;
  }

  // 🎯 Get topic name from event type
  private getTopicNameFromEventType(eventType: string): string {
    const aggregateType = eventType.split('.')[0];
    return `${aggregateType.toLowerCase()}-events`;
  }

  // 📊 Get event bus metrics
  getMetrics(): any {
    return {
      registeredEventTypes: this.handlers.size,
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      topics: Array.from(this.topics),
      handlers: Object.fromEntries(
        Array.from(this.handlers.entries()).map(([eventType, handlers]) => [
          eventType,
          handlers.length
        ])
      )
    };
  }
}
