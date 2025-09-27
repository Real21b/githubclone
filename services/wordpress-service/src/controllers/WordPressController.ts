import { Request, Response } from 'express';
import { WordPressService } from '../services/WordPressService';
import { logger } from '../utils/logger';
import Joi from 'joi';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Validation schemas
const createPostSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).required(),
  excerpt: Joi.string().max(500).optional(),
  status: Joi.string().valid('publish', 'draft', 'private', 'pending').default('draft'),
  author: Joi.number().integer().positive().default(1),
  categories: Joi.array().items(Joi.number().integer().positive()).optional(),
  tags: Joi.array().items(Joi.number().integer().positive()).optional(),
  featured_media: Joi.number().integer().positive().optional(),
  meta: Joi.object().optional()
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  content: Joi.string().min(1).optional(),
  excerpt: Joi.string().max(500).optional(),
  status: Joi.string().valid('publish', 'draft', 'private', 'pending').optional(),
  categories: Joi.array().items(Joi.number().integer().positive()).optional(),
  tags: Joi.array().items(Joi.number().integer().positive()).optional(),
  featured_media: Joi.number().integer().positive().optional(),
  meta: Joi.object().optional()
});

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional(),
  parent: Joi.number().integer().positive().optional()
});

const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(500).optional()
});

const syncContentSchema = Joi.object({
  type: Joi.string().valid('repository', 'issue', 'pull_request', 'user').required(),
  data: Joi.object().required(),
  action: Joi.string().valid('create', 'update', 'delete').required()
});

export class WordPressController {
  constructor(private wordpressService: WordPressService) {}

  async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = createPostSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const post = await this.wordpressService.createPost(value);

      logger.info('🌐 WordPress post created via API', {
        id: post.id,
        title: post.title,
        status: post.status,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: post
      });

    } catch (error) {
      logger.error('🌐 Failed to create WordPress post via API:', error);
      res.status(500).json({
        error: 'Failed to create post',
        message: error.message
      });
    }
  }

  async getPosts(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        per_page: parseInt(req.query.per_page as string) || 10,
        status: req.query.status as string,
        author: req.query.author ? parseInt(req.query.author as string) : undefined,
        categories: req.query.categories ? (req.query.categories as string).split(',').map(Number) : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',').map(Number) : undefined,
        search: req.query.search as string
      };

      const result = await this.wordpressService.getPosts(options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress posts:', error);
      res.status(500).json({
        error: 'Failed to get posts',
        message: error.message
      });
    }
  }

  async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      if (isNaN(postId)) {
        res.status(400).json({
          error: 'Invalid post ID'
        });
        return;
      }

      const post = await this.wordpressService.getPost(postId);

      res.json({
        success: true,
        data: post
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress post:', error);
      res.status(500).json({
        error: 'Failed to get post',
        message: error.message
      });
    }
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      if (isNaN(postId)) {
        res.status(400).json({
          error: 'Invalid post ID'
        });
        return;
      }

      // Validate request
      const { error, value } = updatePostSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const post = await this.wordpressService.updatePost(postId, value);

      logger.info('🌐 WordPress post updated via API', {
        id: postId,
        title: post.title.rendered
      });

      res.json({
        success: true,
        data: post
      });

    } catch (error) {
      logger.error('🌐 Failed to update WordPress post:', error);
      res.status(500).json({
        error: 'Failed to update post',
        message: error.message
      });
    }
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const postId = parseInt(id);

      if (isNaN(postId)) {
        res.status(400).json({
          error: 'Invalid post ID'
        });
        return;
      }

      const success = await this.wordpressService.deletePost(postId);

      if (success) {
        logger.info('🌐 WordPress post deleted via API', { id: postId });
        res.json({
          success: true,
          message: 'Post deleted successfully'
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete post'
        });
      }

    } catch (error) {
      logger.error('🌐 Failed to delete WordPress post:', error);
      res.status(500).json({
        error: 'Failed to delete post',
        message: error.message
      });
    }
  }

  async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          error: 'No files uploaded'
        });
        return;
      }

      const results = [];

      for (const file of req.files) {
        const media = await this.wordpressService.uploadMedia(
          file.buffer,
          file.originalname,
          {
            title: req.body.title,
            description: req.body.description,
            caption: req.body.caption,
            alt_text: req.body.alt_text
          }
        );
        results.push(media);
      }

      logger.info('🌐 WordPress media uploaded via API', {
        count: results.length,
        files: results.map(r => r.id)
      });

      res.status(201).json({
        success: true,
        data: results
      });

    } catch (error) {
      logger.error('🌐 Failed to upload WordPress media:', error);
      res.status(500).json({
        error: 'Failed to upload media',
        message: error.message
      });
    }
  }

  async getMedia(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        per_page: parseInt(req.query.per_page as string) || 10,
        media_type: req.query.media_type as string,
        mime_type: req.query.mime_type as string
      };

      const result = await this.wordpressService.getMedia(options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress media:', error);
      res.status(500).json({
        error: 'Failed to get media',
        message: error.message
      });
    }
  }

  async getMediaItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({
          error: 'Invalid media ID'
        });
        return;
      }

      // This would need to be implemented in the service
      res.status(501).json({
        error: 'Not implemented yet'
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress media item:', error);
      res.status(500).json({
        error: 'Failed to get media item',
        message: error.message
      });
    }
  }

  async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mediaId = parseInt(id);

      if (isNaN(mediaId)) {
        res.status(400).json({
          error: 'Invalid media ID'
        });
        return;
      }

      // This would need to be implemented in the service
      res.status(501).json({
        error: 'Not implemented yet'
      });

    } catch (error) {
      logger.error('🌐 Failed to delete WordPress media:', error);
      res.status(500).json({
        error: 'Failed to delete media',
        message: error.message
      });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.wordpressService.getCategories();

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress categories:', error);
      res.status(500).json({
        error: 'Failed to get categories',
        message: error.message
      });
    }
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = createCategorySchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const category = await this.wordpressService.createCategory(value);

      logger.info('🌐 WordPress category created via API', {
        id: category.id,
        name: category.name
      });

      res.status(201).json({
        success: true,
        data: category
      });

    } catch (error) {
      logger.error('🌐 Failed to create WordPress category:', error);
      res.status(500).json({
        error: 'Failed to create category',
        message: error.message
      });
    }
  }

  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await this.wordpressService.getTags();

      res.json({
        success: true,
        data: tags
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress tags:', error);
      res.status(500).json({
        error: 'Failed to get tags',
        message: error.message
      });
    }
  }

  async createTag(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = createTagSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      const tag = await this.wordpressService.createTag(value);

      logger.info('🌐 WordPress tag created via API', {
        id: tag.id,
        name: tag.name
      });

      res.status(201).json({
        success: true,
        data: tag
      });

    } catch (error) {
      logger.error('🌐 Failed to create WordPress tag:', error);
      res.status(500).json({
        error: 'Failed to create tag',
        message: error.message
      });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        page: parseInt(req.query.page as string) || 1,
        per_page: parseInt(req.query.per_page as string) || 10,
        roles: req.query.roles ? (req.query.roles as string).split(',') : undefined
      };

      const result = await this.wordpressService.getUsers(options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress users:', error);
      res.status(500).json({
        error: 'Failed to get users',
        message: error.message
      });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({
          error: 'Invalid user ID'
        });
        return;
      }

      const user = await this.wordpressService.getUser(userId);

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error('🌐 Failed to get WordPress user:', error);
      res.status(500).json({
        error: 'Failed to get user',
        message: error.message
      });
    }
  }

  async syncContent(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const { error, value } = syncContentSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
        return;
      }

      await this.wordpressService.syncContent(value);

      logger.info('🌐 WordPress content sync via API', {
        type: value.type,
        action: value.action
      });

      res.json({
        success: true,
        message: 'Content sync initiated'
      });

    } catch (error) {
      logger.error('🌐 Failed to sync WordPress content:', error);
      res.status(500).json({
        error: 'Failed to sync content',
        message: error.message
      });
    }
  }

  async exportContent(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        type: req.query.type as string || 'all',
        format: req.query.format as string || 'json',
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string
      };

      const exportData = await this.wordpressService.exportContent(options);

      logger.info('🌐 WordPress content exported via API', {
        type: options.type,
        format: options.format
      });

      res.json({
        success: true,
        data: exportData
      });

    } catch (error) {
      logger.error('🌐 Failed to export WordPress content:', error);
      res.status(500).json({
        error: 'Failed to export content',
        message: error.message
      });
    }
  }
}
