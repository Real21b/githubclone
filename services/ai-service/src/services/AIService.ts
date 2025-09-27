import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { encoding_for_model } from 'tiktoken';
import moment from 'moment';
import { KafkaService } from './KafkaService';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as natural from 'natural';
import * as sentiment from 'sentiment';
import nlp from 'compromise';
import fs from 'fs';
import path from 'path';

export interface AIProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  priority: number;
  costPerToken: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface AIRequest {
  id: string;
  messages: AIMessage[];
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  functions?: any[];
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  id: string;
  content: string;
  provider: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  latency: number;
  timestamp: Date;
  finishReason: string;
  metadata?: Record<string, any>;
}

export interface AITask {
  id: string;
  type: 'chat' | 'complete' | 'generate' | 'analyze' | 'translate' | 'summarize' | 'extract' | 'classify' | 'sentiment';
  input: any;
  output?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: string;
  model: string;
  userId?: string;
  sessionId?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AIMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
  byProvider: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    latency: number;
    successRate: number;
  }>;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
    latency: number;
  }>;
  byType: Record<string, number>;
  lastActivity: string;
}

export class AIService {
  private kafkaService: KafkaService;
  private providers: Map<string, AIProvider> = new Map();
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private googleClient: GoogleGenerativeAI | null = null;
  private langchainClients: Map<string, any> = new Map();
  private metrics: AIMetrics;
  private requestHistory: AIRequest[] = [];
  private responseHistory: AIResponse[] = [];
  private taskQueue: AITask[] = [];
  private sentimentAnalyzer: any;

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      successRate: 0,
      byProvider: {},
      byModel: {},
      byType: {},
      lastActivity: ''
    };
    this.sentimentAnalyzer = new sentiment.Sentiment();
  }

  async start(): Promise<void> {
    try {
      // Initialize AI providers
      await this.initializeProviders();
      
      // Start Kafka consumer for AI notifications
      await this.kafkaService.startConsumer({
        groupId: 'ai-service-group',
        topics: ['ai-requests', 'ai-tasks'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleAIMessage.bind(this));

      logger.info('🤖 AI service started successfully');

    } catch (error) {
      logger.error('Failed to start AI service:', error);
      throw error;
    }
  }

  // 🔧 Initialize AI providers
  private async initializeProviders(): Promise<void> {
    try {
      // OpenAI Provider
      if (process.env.OPENAI_API_KEY) {
        const openaiProvider: AIProvider = {
          name: 'openai',
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096'),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
          enabled: true,
          priority: 1,
          costPerToken: 0.00003
        };

        this.providers.set('openai', openaiProvider);
        this.openaiClient = new OpenAI({ apiKey: openaiProvider.apiKey });
        
        // LangChain OpenAI
        this.langchainClients.set('openai', new ChatOpenAI({
          openAIApiKey: openaiProvider.apiKey,
          modelName: openaiProvider.model,
          temperature: openaiProvider.temperature,
          maxTokens: openaiProvider.maxTokens
        }));

        logger.info('🤖 OpenAI provider initialized');
      }

      // Anthropic Provider
      if (process.env.ANTHROPIC_API_KEY) {
        const anthropicProvider: AIProvider = {
          name: 'anthropic',
          type: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096'),
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
          enabled: true,
          priority: 2,
          costPerToken: 0.000015
        };

        this.providers.set('anthropic', anthropicProvider);
        this.anthropicClient = new Anthropic({ apiKey: anthropicProvider.apiKey });
        
        // LangChain Anthropic
        this.langchainClients.set('anthropic', new ChatAnthropic({
          anthropicApiKey: anthropicProvider.apiKey,
          modelName: anthropicProvider.model,
          temperature: anthropicProvider.temperature,
          maxTokens: anthropicProvider.maxTokens
        }));

        logger.info('🤖 Anthropic provider initialized');
      }

      // Google Provider
      if (process.env.GOOGLE_API_KEY) {
        const googleProvider: AIProvider = {
          name: 'google',
          type: 'google',
          apiKey: process.env.GOOGLE_API_KEY,
          model: process.env.GOOGLE_MODEL || 'gemini-pro',
          maxTokens: parseInt(process.env.GOOGLE_MAX_TOKENS || '4096'),
          temperature: parseFloat(process.env.GOOGLE_TEMPERATURE || '0.7'),
          enabled: true,
          priority: 3,
          costPerToken: 0.00001
        };

        this.providers.set('google', googleProvider);
        this.googleClient = new GoogleGenerativeAI(googleProvider.apiKey);
        
        // LangChain Google
        this.langchainClients.set('google', new ChatGoogleGenerativeAI({
          apiKey: googleProvider.apiKey,
          modelName: googleProvider.model,
          temperature: googleProvider.temperature,
          maxTokens: googleProvider.maxTokens
        }));

        logger.info('🤖 Google provider initialized');
      }

      if (this.providers.size === 0) {
        throw new Error('No AI providers configured');
      }

    } catch (error) {
      logger.error('Failed to initialize AI providers:', error);
      throw error;
    }
  }

  // 💬 Chat with AI
  async chat(request: Omit<AIRequest, 'id'>): Promise<AIResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      const aiRequest: AIRequest = {
        id: requestId,
        ...request
      };

      // Select best provider
      const provider = this.selectBestProvider(request.provider);
      if (!provider) {
        throw new Error('No available AI provider');
      }

      // Process request
      const response = await this.processRequest(aiRequest, provider);
      
      // Update metrics
      this.updateMetrics(aiRequest, response, Date.now() - startTime);
      
      // Store history
      this.requestHistory.push(aiRequest);
      this.responseHistory.push(response);

      logger.info(`🤖 AI chat completed`, {
        id: requestId,
        provider: provider.name,
        model: provider.model,
        tokens: response.usage.totalTokens,
        cost: response.cost,
        latency: response.latency
      });

      return response;

    } catch (error) {
      logger.error(`🤖 AI chat failed:`, error);
      throw error;
    }
  }

  // ✨ Complete text
  async complete(prompt: string, options: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    userId?: string;
  } = {}): Promise<AIResponse> {
    const request: Omit<AIRequest, 'id'> = {
      messages: [{ role: 'user', content: prompt }],
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      userId: options.userId
    };

    return await this.chat(request);
  }

  // 🎨 Generate content
  async generate(prompt: string, type: 'text' | 'code' | 'creative' | 'technical', options: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    userId?: string;
  } = {}): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(type);
    const enhancedPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

    const request: Omit<AIRequest, 'id'> = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      provider: options.provider,
      model: options.model,
      temperature: options.temperature || (type === 'creative' ? 0.9 : 0.7),
      maxTokens: options.maxTokens,
      userId: options.userId
    };

    return await this.chat(request);
  }

  // 📊 Analyze content
  async analyze(content: string, analysisType: 'sentiment' | 'entities' | 'topics' | 'summary' | 'keywords', options: {
    provider?: string;
    model?: string;
    userId?: string;
  } = {}): Promise<any> {
    const analysisPrompt = this.getAnalysisPrompt(analysisType);
    
    const request: Omit<AIRequest, 'id'> = {
      messages: [
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: content }
      ],
      provider: options.provider,
      model: options.model,
      userId: options.userId
    };

    const response = await this.chat(request);
    
    try {
      return JSON.parse(response.content);
    } catch {
      return { analysis: response.content, type: analysisType };
    }
  }

  // 🌍 Translate text
  async translate(text: string, targetLanguage: string, sourceLanguage?: string, options: {
    provider?: string;
    model?: string;
    userId?: string;
  } = {}): Promise<AIResponse> {
    const translatePrompt = `Translate the following text from ${sourceLanguage || 'auto-detect'} to ${targetLanguage}. Only return the translated text without any additional explanation:\n\n${text}`;

    const request: Omit<AIRequest, 'id'> = {
      messages: [{ role: 'user', content: translatePrompt }],
      provider: options.provider,
      model: options.model,
      userId: options.userId
    };

    return await this.chat(request);
  }

  // 📝 Summarize content
  async summarize(content: string, maxLength: number = 200, options: {
    provider?: string;
    model?: string;
    userId?: string;
  } = {}): Promise<AIResponse> {
    const summarizePrompt = `Summarize the following content in approximately ${maxLength} words. Focus on the main points and key information:\n\n${content}`;

    const request: Omit<AIRequest, 'id'> = {
      messages: [{ role: 'user', content: summarizePrompt }],
      provider: options.provider,
      model: options.model,
      userId: options.userId
    };

    return await this.chat(request);
  }

  // 🔍 Extract information
  async extract(content: string, extractionType: 'dates' | 'emails' | 'phones' | 'urls' | 'names' | 'custom', customPattern?: string, options: {
    provider?: string;
    model?: string;
    userId?: string;
  } = {}): Promise<any> {
    let extractPrompt: string;

    if (extractionType === 'custom' && customPattern) {
      extractPrompt = `Extract information matching this pattern: ${customPattern}\n\nFrom this content:\n\n${content}`;
    } else {
      extractPrompt = `Extract all ${extractionType} from the following content. Return the results as a JSON array:\n\n${content}`;
    }

    const request: Omit<AIRequest, 'id'> = {
      messages: [{ role: 'user', content: extractPrompt }],
      provider: options.provider,
      model: options.model,
      userId: options.userId
    };

    const response = await this.chat(request);
    
    try {
      return JSON.parse(response.content);
    } catch {
      return { extracted: response.content, type: extractionType };
    }
  }

  // 🏷️ Classify content
  async classify(content: string, categories: string[], options: {
    provider?: string;
    model?: string;
    userId?: string;
  } = {}): Promise<any> {
    const classifyPrompt = `Classify the following content into one of these categories: ${categories.join(', ')}. Return the result as JSON with the category and confidence score:\n\n${content}`;

    const request: Omit<AIRequest, 'id'> = {
      messages: [{ role: 'user', content: classifyPrompt }],
      provider: options.provider,
      model: options.model,
      userId: options.userId
    };

    const response = await this.chat(request);
    
    try {
      return JSON.parse(response.content);
    } catch {
      return { classification: response.content, categories };
    }
  }

  // 😊 Sentiment analysis
  async sentimentAnalysis(text: string): Promise<any> {
    try {
      // Use both AI and traditional sentiment analysis
      const aiResult = await this.analyze(text, 'sentiment');
      const traditionalResult = this.sentimentAnalyzer.analyze(text);
      
      return {
        ai: aiResult,
        traditional: {
          score: traditionalResult.score,
          comparative: traditionalResult.comparative,
          positive: traditionalResult.positive,
          negative: traditionalResult.negative,
          neutral: traditionalResult.neutral
        },
        combined: {
          score: (aiResult.score + traditionalResult.comparative) / 2,
          confidence: Math.abs(aiResult.score - traditionalResult.comparative) < 0.5 ? 'high' : 'medium'
        }
      };
    } catch (error) {
      // Fallback to traditional sentiment analysis
      const result = this.sentimentAnalyzer.analyze(text);
      return {
        traditional: result,
        ai: null,
        error: error.message
      };
    }
  }

  // 🔧 Process AI request
  private async processRequest(request: AIRequest, provider: AIProvider): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      let response: any;

      switch (provider.type) {
        case 'openai':
          response = await this.processOpenAIRequest(request, provider);
          break;
        case 'anthropic':
          response = await this.processAnthropicRequest(request, provider);
          break;
        case 'google':
          response = await this.processGoogleRequest(request, provider);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      const latency = Date.now() - startTime;

      return {
        id: uuidv4(),
        content: response.content,
        provider: provider.name,
        model: provider.model,
        usage: response.usage,
        cost: this.calculateCost(response.usage, provider),
        latency,
        timestamp: new Date(),
        finishReason: response.finishReason || 'stop',
        metadata: response.metadata
      };

    } catch (error) {
      logger.error(`Failed to process request with ${provider.name}:`, error);
      throw error;
    }
  }

  // 🔧 Process OpenAI request
  private async processOpenAIRequest(request: AIRequest, provider: AIProvider): Promise<any> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openaiClient.chat.completions.create({
      model: provider.model,
      messages: request.messages,
      temperature: request.temperature || provider.temperature,
      max_tokens: request.maxTokens || provider.maxTokens,
      stream: request.stream || false,
      functions: request.functions
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      finishReason: response.choices[0].finish_reason
    };
  }

  // 🔧 Process Anthropic request
  private async processAnthropicRequest(request: AIRequest, provider: AIProvider): Promise<any> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const systemMessage = request.messages.find(m => m.role === 'system');
    const userMessages = request.messages.filter(m => m.role !== 'system');

    const response = await this.anthropicClient.messages.create({
      model: provider.model,
      max_tokens: request.maxTokens || provider.maxTokens,
      temperature: request.temperature || provider.temperature,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    return {
      content: response.content[0].text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: response.stop_reason
    };
  }

  // 🔧 Process Google request
  private async processGoogleRequest(request: AIRequest, provider: AIProvider): Promise<any> {
    if (!this.googleClient) {
      throw new Error('Google client not initialized');
    }

    const model = this.googleClient.getGenerativeModel({ model: provider.model });
    const prompt = request.messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: request.temperature || provider.temperature,
        maxOutputTokens: request.maxTokens || provider.maxTokens
      }
    });

    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      usage: {
        promptTokens: 0, // Google doesn't provide token usage in free tier
        completionTokens: 0,
        totalTokens: 0
      },
      finishReason: 'stop'
    };
  }

  // 🎯 Select best provider
  private selectBestProvider(preferredProvider?: string): AIProvider | null {
    if (preferredProvider && this.providers.has(preferredProvider)) {
      const provider = this.providers.get(preferredProvider)!;
      if (provider.enabled) {
        return provider;
      }
    }

    // Select provider with highest priority
    const enabledProviders = Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);

    return enabledProviders[0] || null;
  }

  // 💰 Calculate cost
  private calculateCost(usage: any, provider: AIProvider): number {
    return (usage.totalTokens * provider.costPerToken);
  }

  // 📝 Get system prompt
  private getSystemPrompt(type: string): string {
    const prompts = {
      text: 'You are a helpful assistant that generates high-quality text content.',
      code: 'You are an expert programmer that writes clean, efficient, and well-documented code.',
      creative: 'You are a creative writer that produces engaging and imaginative content.',
      technical: 'You are a technical expert that provides accurate and detailed technical information.'
    };

    return prompts[type] || prompts.text;
  }

  // 📊 Get analysis prompt
  private getAnalysisPrompt(type: string): string {
    const prompts = {
      sentiment: 'Analyze the sentiment of the following text. Return a JSON object with score (-1 to 1), label (positive/negative/neutral), and confidence.',
      entities: 'Extract named entities from the following text. Return a JSON object with entities categorized by type.',
      topics: 'Identify the main topics in the following text. Return a JSON array of topics with relevance scores.',
      summary: 'Provide a concise summary of the following text. Return a JSON object with summary and key points.',
      keywords: 'Extract key keywords from the following text. Return a JSON array of keywords with importance scores.'
    };

    return prompts[type] || prompts.summary;
  }

  // 📈 Update metrics
  private updateMetrics(request: AIRequest, response: AIResponse, latency: number): void {
    this.metrics.totalRequests++;
    this.metrics.totalTokens += response.usage.totalTokens;
    this.metrics.totalCost += response.cost;
    this.metrics.lastActivity = new Date().toISOString();

    // Update by provider
    if (!this.metrics.byProvider[response.provider]) {
      this.metrics.byProvider[response.provider] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        latency: 0,
        successRate: 0
      };
    }

    const providerMetrics = this.metrics.byProvider[response.provider];
    providerMetrics.requests++;
    providerMetrics.tokens += response.usage.totalTokens;
    providerMetrics.cost += response.cost;
    providerMetrics.latency = (providerMetrics.latency + latency) / 2;

    // Update by model
    if (!this.metrics.byModel[response.model]) {
      this.metrics.byModel[response.model] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        latency: 0
      };
    }

    const modelMetrics = this.metrics.byModel[response.model];
    modelMetrics.requests++;
    modelMetrics.tokens += response.usage.totalTokens;
    modelMetrics.cost += response.cost;
    modelMetrics.latency = (modelMetrics.latency + latency) / 2;

    // Update average latency
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
  }

  // 📥 Handle Kafka AI messages
  private async handleAIMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`🤖 Processing AI notification`, {
        notificationId: message.notificationId,
        type: message.type,
        userId: message.userId
      });

      // Process AI request from other services
      if (message.type === 'ai-request') {
        await this.processExternalAIRequest(message);
      }

    } catch (error) {
      logger.error('🤖 Error processing AI message:', error);
    }
  }

  // 🔧 Process external AI request
  private async processExternalAIRequest(message: any): Promise<void> {
    try {
      const request: Omit<AIRequest, 'id'> = {
        messages: message.messages,
        provider: message.provider,
        model: message.model,
        userId: message.userId,
        sessionId: message.sessionId,
        metadata: message.metadata
      };

      const response = await this.chat(request);

      // Publish response back
      await this.kafkaService.publishMessage('ai-responses', {
        requestId: message.requestId,
        response: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to process external AI request:', error);
    }
  }

  // 📊 Get service metrics
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  // 🔍 Get AI status
  async getAIStatus(): Promise<any> {
    const status = {
      providers: Array.from(this.providers.values()).map(p => ({
        name: p.name,
        type: p.type,
        enabled: p.enabled,
        model: p.model,
        priority: p.priority
      })),
      totalRequests: this.metrics.totalRequests,
      totalCost: this.metrics.totalCost,
      lastActivity: this.metrics.lastActivity
    };

    return status;
  }

  // 🔄 Disconnect
  async disconnect(): Promise<void> {
    logger.info('🤖 AI service disconnected');
  }
}
