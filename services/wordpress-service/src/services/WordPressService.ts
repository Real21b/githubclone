import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { parseString } from 'xml2js';
import moment from 'moment';
import { KafkaService } from './KafkaService';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import FormData from 'form-data';

export interface WordPressPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'private' | 'pending';
  author: number;
  categories: number[];
  tags: number[];
  featured_media: number;
  date: string;
  modified: string;
  slug: string;
  link: string;
  meta: Record<string, any>;
}

export interface WordPressMedia {
  id: number;
  title: string;
  description: string;
  caption: string;
  alt_text: string;
  media_type: 'image' | 'video' | 'audio' | 'document';
  mime_type: string;
  source_url: string;
  date: string;
  author: number;
  file: Buffer;
  filename: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  parent: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface WordPressUser {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  url: string;
  description: string;
  link: string;
  avatar_urls: Record<string, string>;
  roles: string[];
  capabilities: Record<string, boolean>;
  extra_capabilities: Record<string, boolean>;
  registered_date: string;
}

export interface WordPressMetrics {
  totalPosts: number;
  totalMedia: number;
  totalCategories: number;
  totalTags: number;
  totalUsers: number;
  byStatus: Record<string, number>;
  byAuthor: Record<string, number>;
  averageProcessingTime: number;
  wordpressStatus: 'connected' | 'disconnected' | 'error';
  lastSync: string;
}

export class WordPressService {
  private kafkaService: KafkaService;
  private wpClient: AxiosInstance;
  private metrics: WordPressMetrics;
  private processingTimes: number[] = [];

  constructor(kafkaService: KafkaService) {
    this.kafkaService = kafkaService;
    this.metrics = {
      totalPosts: 0,
      totalMedia: 0,
      totalCategories: 0,
      totalTags: 0,
      totalUsers: 0,
      byStatus: {},
      byAuthor: {},
      averageProcessingTime: 0,
      wordpressStatus: 'disconnected',
      lastSync: ''
    };
  }

  async start(): Promise<void> {
    try {
      // Initialize WordPress client
      await this.initializeWordPressClient();
      
      // Start Kafka consumer for WordPress notifications
      await this.kafkaService.startConsumer({
        groupId: 'wordpress-service-group',
        topics: ['wordpress-notifications', 'content-sync'],
        fromBeginning: false
      });

      // Start consuming messages
      await this.kafkaService.consumeMessages(this.handleWordPressMessage.bind(this));

      logger.info('🌐 WordPress service started successfully');

    } catch (error) {
      logger.error('Failed to start WordPress service:', error);
      throw error;
    }
  }

  // 🔧 Initialize WordPress client
  private async initializeWordPressClient(): Promise<void> {
    try {
      const baseURL = process.env.WORDPRESS_URL || 'http://localhost:8080';
      const username = process.env.WORDPRESS_USERNAME;
      const password = process.env.WORDPRESS_PASSWORD;

      if (!username || !password) {
        throw new Error('WordPress credentials not provided');
      }

      // Create basic auth token
      const auth = Buffer.from(`${username}:${password}`).toString('base64');

      this.wpClient = axios.create({
        baseURL: `${baseURL}/wp-json/wp/v2`,
        timeout: 30000,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GitHub-Clone-WordPress-Service/1.0'
        }
      });

      // Test connection
      await this.wpClient.get('/posts?per_page=1');
      this.metrics.wordpressStatus = 'connected';
      
      logger.info('🌐 WordPress client initialized successfully');

    } catch (error) {
      this.metrics.wordpressStatus = 'error';
      logger.error('Failed to initialize WordPress client:', error);
      throw error;
    }
  }

  // 📝 Create WordPress post
  async createPost(postData: Omit<WordPressPost, 'id' | 'date' | 'modified' | 'link'>): Promise<WordPressPost> {
    const startTime = Date.now();

    try {
      const response = await this.wpClient.post('/posts', {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        status: postData.status || 'draft',
        author: postData.author,
        categories: postData.categories || [],
        tags: postData.tags || [],
        featured_media: postData.featured_media || 0,
        meta: postData.meta || {}
      });

      const post = response.data;
      this.updateMetrics('post', Date.now() - startTime);

      logger.info(`🌐 WordPress post created successfully`, {
        id: post.id,
        title: post.title.rendered,
        status: post.status
      });

      return post;

    } catch (error) {
      logger.error('Failed to create WordPress post:', error);
      throw error;
    }
  }

  // 📖 Get WordPress posts
  async getPosts(options: {
    page?: number;
    per_page?: number;
    status?: string;
    author?: number;
    categories?: number[];
    tags?: number[];
    search?: string;
  } = {}): Promise<{ posts: WordPressPost[]; total: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.status) params.append('status', options.status);
      if (options.author) params.append('author', options.author.toString());
      if (options.categories) params.append('categories', options.categories.join(','));
      if (options.tags) params.append('tags', options.tags.join(','));
      if (options.search) params.append('search', options.search);

      const response = await this.wpClient.get(`/posts?${params.toString()}`);
      
      return {
        posts: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0')
      };

    } catch (error) {
      logger.error('Failed to get WordPress posts:', error);
      throw error;
    }
  }

  // 📖 Get single WordPress post
  async getPost(id: number): Promise<WordPressPost> {
    try {
      const response = await this.wpClient.get(`/posts/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get WordPress post ${id}:`, error);
      throw error;
    }
  }

  // ✏️ Update WordPress post
  async updatePost(id: number, postData: Partial<WordPressPost>): Promise<WordPressPost> {
    try {
      const response = await this.wpClient.put(`/posts/${id}`, postData);
      
      logger.info(`🌐 WordPress post updated successfully`, {
        id: id,
        title: response.data.title.rendered
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to update WordPress post ${id}:`, error);
      throw error;
    }
  }

  // 🗑️ Delete WordPress post
  async deletePost(id: number): Promise<boolean> {
    try {
      await this.wpClient.delete(`/posts/${id}?force=true`);
      
      logger.info(`🌐 WordPress post deleted successfully`, { id });
      return true;
    } catch (error) {
      logger.error(`Failed to delete WordPress post ${id}:`, error);
      throw error;
    }
  }

  // 📁 Upload media to WordPress
  async uploadMedia(file: Buffer, filename: string, options: {
    title?: string;
    description?: string;
    caption?: string;
    alt_text?: string;
  } = {}): Promise<WordPressMedia> {
    try {
      // Optimize image if it's an image
      let processedFile = file;
      if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        processedFile = await sharp(file)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      }

      const formData = new FormData();
      formData.append('file', processedFile, filename);
      if (options.title) formData.append('title', options.title);
      if (options.description) formData.append('description', options.description);
      if (options.caption) formData.append('caption', options.caption);
      if (options.alt_text) formData.append('alt_text', options.alt_text);

      const response = await this.wpClient.post('/media', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      logger.info(`🌐 WordPress media uploaded successfully`, {
        id: response.data.id,
        filename: filename,
        url: response.data.source_url
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to upload WordPress media:', error);
      throw error;
    }
  }

  // 📁 Get WordPress media
  async getMedia(options: {
    page?: number;
    per_page?: number;
    media_type?: string;
    mime_type?: string;
  } = {}): Promise<{ media: WordPressMedia[]; total: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.media_type) params.append('media_type', options.media_type);
      if (options.mime_type) params.append('mime_type', options.mime_type);

      const response = await this.wpClient.get(`/media?${params.toString()}`);
      
      return {
        media: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0')
      };
    } catch (error) {
      logger.error('Failed to get WordPress media:', error);
      throw error;
    }
  }

  // 🏷️ Get WordPress categories
  async getCategories(): Promise<WordPressCategory[]> {
    try {
      const response = await this.wpClient.get('/categories?per_page=100');
      return response.data;
    } catch (error) {
      logger.error('Failed to get WordPress categories:', error);
      throw error;
    }
  }

  // 🏷️ Create WordPress category
  async createCategory(categoryData: {
    name: string;
    description?: string;
    parent?: number;
  }): Promise<WordPressCategory> {
    try {
      const response = await this.wpClient.post('/categories', categoryData);
      
      logger.info(`🌐 WordPress category created successfully`, {
        id: response.data.id,
        name: response.data.name
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create WordPress category:', error);
      throw error;
    }
  }

  // 🏷️ Get WordPress tags
  async getTags(): Promise<WordPressTag[]> {
    try {
      const response = await this.wpClient.get('/tags?per_page=100');
      return response.data;
    } catch (error) {
      logger.error('Failed to get WordPress tags:', error);
      throw error;
    }
  }

  // 🏷️ Create WordPress tag
  async createTag(tagData: {
    name: string;
    description?: string;
  }): Promise<WordPressTag> {
    try {
      const response = await this.wpClient.post('/tags', tagData);
      
      logger.info(`🌐 WordPress tag created successfully`, {
        id: response.data.id,
        name: response.data.name
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create WordPress tag:', error);
      throw error;
    }
  }

  // 👥 Get WordPress users
  async getUsers(options: {
    page?: number;
    per_page?: number;
    roles?: string[];
  } = {}): Promise<{ users: WordPressUser[]; total: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.roles) params.append('roles', options.roles.join(','));

      const response = await this.wpClient.get(`/users?${params.toString()}`);
      
      return {
        users: response.data,
        total: parseInt(response.headers['x-wp-total'] || '0'),
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0')
      };
    } catch (error) {
      logger.error('Failed to get WordPress users:', error);
      throw error;
    }
  }

  // 👤 Get single WordPress user
  async getUser(id: number): Promise<WordPressUser> {
    try {
      const response = await this.wpClient.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get WordPress user ${id}:`, error);
      throw error;
    }
  }

  // 🔄 Sync content from GitHub Clone to WordPress
  async syncContent(syncData: {
    type: 'repository' | 'issue' | 'pull_request' | 'user';
    data: any;
    action: 'create' | 'update' | 'delete';
  }): Promise<void> {
    try {
      logger.info(`🌐 Syncing content to WordPress`, {
        type: syncData.type,
        action: syncData.action
      });

      switch (syncData.type) {
        case 'repository':
          await this.syncRepository(syncData.data, syncData.action);
          break;
        case 'issue':
          await this.syncIssue(syncData.data, syncData.action);
          break;
        case 'pull_request':
          await this.syncPullRequest(syncData.data, syncData.action);
          break;
        case 'user':
          await this.syncUser(syncData.data, syncData.action);
          break;
      }

      this.metrics.lastSync = new Date().toISOString();

    } catch (error) {
      logger.error('Failed to sync content to WordPress:', error);
      throw error;
    }
  }

  // 🔄 Sync repository to WordPress post
  private async syncRepository(repo: any, action: string): Promise<void> {
    const title = `${repo.name} - ${repo.description || 'Repository'}`;
    const content = `
      <h2>Repository Information</h2>
      <p><strong>Name:</strong> ${repo.name}</p>
      <p><strong>Description:</strong> ${repo.description || 'No description'}</p>
      <p><strong>Language:</strong> ${repo.language || 'Unknown'}</p>
      <p><strong>Stars:</strong> ${repo.stargazers_count || 0}</p>
      <p><strong>Forks:</strong> ${repo.forks_count || 0}</p>
      <p><strong>URL:</strong> <a href="${repo.html_url}">${repo.html_url}</a></p>
      ${repo.readme ? `<h3>README</h3><pre>${repo.readme}</pre>` : ''}
    `;

    if (action === 'create' || action === 'update') {
      await this.createPost({
        title,
        content,
        excerpt: repo.description || 'Repository from GitHub Clone',
        status: 'publish',
        author: 1, // Default author
        categories: [],
        tags: [],
        meta: {
          github_repo_id: repo.id,
          github_url: repo.html_url,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count
        }
      });
    }
  }

  // 🔄 Sync issue to WordPress post
  private async syncIssue(issue: any, action: string): Promise<void> {
    const title = `Issue: ${issue.title}`;
    const content = `
      <h2>Issue Details</h2>
      <p><strong>Title:</strong> ${issue.title}</p>
      <p><strong>State:</strong> ${issue.state}</p>
      <p><strong>Created:</strong> ${issue.created_at}</p>
      <p><strong>Author:</strong> ${issue.user.login}</p>
      <p><strong>URL:</strong> <a href="${issue.html_url}">${issue.html_url}</a></p>
      <h3>Description</h3>
      <div>${issue.body || 'No description'}</div>
    `;

    if (action === 'create' || action === 'update') {
      await this.createPost({
        title,
        content,
        excerpt: issue.title,
        status: 'publish',
        author: 1,
        categories: [],
        tags: [],
        meta: {
          github_issue_id: issue.id,
          github_url: issue.html_url,
          issue_number: issue.number,
          state: issue.state
        }
      });
    }
  }

  // 🔄 Sync pull request to WordPress post
  private async syncPullRequest(pr: any, action: string): Promise<void> {
    const title = `Pull Request: ${pr.title}`;
    const content = `
      <h2>Pull Request Details</h2>
      <p><strong>Title:</strong> ${pr.title}</p>
      <p><strong>State:</strong> ${pr.state}</p>
      <p><strong>Created:</strong> ${pr.created_at}</p>
      <p><strong>Author:</strong> ${pr.user.login}</p>
      <p><strong>URL:</strong> <a href="${pr.html_url}">${pr.html_url}</a></p>
      <h3>Description</h3>
      <div>${pr.body || 'No description'}</div>
    `;

    if (action === 'create' || action === 'update') {
      await this.createPost({
        title,
        content,
        excerpt: pr.title,
        status: 'publish',
        author: 1,
        categories: [],
        tags: [],
        meta: {
          github_pr_id: pr.id,
          github_url: pr.html_url,
          pr_number: pr.number,
          state: pr.state
        }
      });
    }
  }

  // 🔄 Sync user to WordPress user
  private async syncUser(user: any, action: string): Promise<void> {
    // WordPress user sync would require additional permissions
    // For now, we'll just log the sync attempt
    logger.info(`🌐 User sync requested`, {
      username: user.login,
      action: action
    });
  }

  // 📤 Export WordPress content
  async exportContent(options: {
    type?: 'posts' | 'media' | 'all';
    format?: 'json' | 'xml';
    date_from?: string;
    date_to?: string;
  } = {}): Promise<any> {
    try {
      const exportData: any = {
        export_date: new Date().toISOString(),
        type: options.type || 'all',
        format: options.format || 'json'
      };

      if (options.type === 'posts' || options.type === 'all') {
        const posts = await this.getPosts({ per_page: 100 });
        exportData.posts = posts.posts;
      }

      if (options.type === 'media' || options.type === 'all') {
        const media = await this.getMedia({ per_page: 100 });
        exportData.media = media.media;
      }

      logger.info(`🌐 WordPress content exported successfully`, {
        type: options.type,
        format: options.format
      });

      return exportData;
    } catch (error) {
      logger.error('Failed to export WordPress content:', error);
      throw error;
    }
  }

  // 📥 Handle Kafka WordPress messages
  private async handleWordPressMessage(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}');
      
      logger.info(`🌐 Processing WordPress notification`, {
        notificationId: message.notificationId,
        type: message.type,
        action: message.action
      });

      // Process sync request
      if (message.type === 'content-sync') {
        await this.syncContent({
          type: message.contentType,
          data: message.data,
          action: message.action
        });
      }

    } catch (error) {
      logger.error('🌐 Error processing WordPress message:', error);
    }
  }

  // 📈 Update metrics
  private updateMetrics(type: string, processingTime: number): void {
    switch (type) {
      case 'post':
        this.metrics.totalPosts++;
        break;
      case 'media':
        this.metrics.totalMedia++;
        break;
      case 'category':
        this.metrics.totalCategories++;
        break;
      case 'tag':
        this.metrics.totalTags++;
        break;
      case 'user':
        this.metrics.totalUsers++;
        break;
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
  getMetrics(): WordPressMetrics {
    return { ...this.metrics };
  }

  // 🔍 Get WordPress status
  async getWordPressStatus(): Promise<any> {
    try {
      if (this.wpClient) {
        await this.wpClient.get('/posts?per_page=1');
        return {
          connected: true,
          status: this.metrics.wordpressStatus,
          url: process.env.WORDPRESS_URL
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
    logger.info('🌐 WordPress service disconnected');
  }
}
