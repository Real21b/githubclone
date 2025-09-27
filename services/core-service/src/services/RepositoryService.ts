import { Context } from '../types/Context';
import { Repository } from '../entities/Repository';
import { CreateRepositoryInput } from '../inputs/CreateRepositoryInput';
import { UpdateRepositoryInput } from '../inputs/UpdateRepositoryInput';
import { logger } from '../utils/logger';

export class RepositoryService {
  async findAll(ctx: Context): Promise<Repository[]> {
    try {
      const cacheKey = 'repositories:all';
      const cachedRepos = await ctx.cacheService.get<Repository[]>(cacheKey);
      
      if (cachedRepos) {
        logger.debug('Repositories retrieved from cache');
        return cachedRepos;
      }

      const result = await ctx.databaseService.query(
        `SELECT r.*, u.username as owner_username, u.avatar as owner_avatar
         FROM repositories r
         JOIN users u ON r.owner_id = u.id
         ORDER BY r.created_at DESC`
      );

      const repositories = result.rows.map(this.mapRowToRepository);
      
      // Cache for 30 minutes
      await ctx.cacheService.set(cacheKey, repositories, 1800);
      
      logger.debug('Repositories retrieved from database and cached');
      return repositories;
    } catch (error) {
      logger.error('Error fetching repositories:', error);
      throw error;
    }
  }

  async findById(id: string, ctx: Context): Promise<Repository> {
    try {
      const cacheKey = `repository:${id}`;
      const cachedRepo = await ctx.cacheService.get<Repository>(cacheKey);
      
      if (cachedRepo) {
        logger.debug(`Repository ${id} retrieved from cache`);
        return cachedRepo;
      }

      const result = await ctx.databaseService.query(
        `SELECT r.*, u.username as owner_username, u.avatar as owner_avatar
         FROM repositories r
         JOIN users u ON r.owner_id = u.id
         WHERE r.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Repository not found');
      }

      const repository = this.mapRowToRepository(result.rows[0]);
      
      // Cache for 1 hour
      await ctx.cacheService.set(cacheKey, repository, 3600);
      
      logger.debug(`Repository ${id} retrieved from database and cached`);
      return repository;
    } catch (error) {
      logger.error(`Error fetching repository ${id}:`, error);
      throw error;
    }
  }

  async findByOwner(ownerId: string, ctx: Context): Promise<Repository[]> {
    try {
      const cacheKey = `repositories:owner:${ownerId}`;
      const cachedRepos = await ctx.cacheService.get<Repository[]>(cacheKey);
      
      if (cachedRepos) {
        logger.debug(`Repositories for owner ${ownerId} retrieved from cache`);
        return cachedRepos;
      }

      const result = await ctx.databaseService.query(
        `SELECT r.*, u.username as owner_username, u.avatar as owner_avatar
         FROM repositories r
         JOIN users u ON r.owner_id = u.id
         WHERE r.owner_id = $1
         ORDER BY r.created_at DESC`,
        [ownerId]
      );

      const repositories = result.rows.map(this.mapRowToRepository);
      
      // Cache for 30 minutes
      await ctx.cacheService.set(cacheKey, repositories, 1800);
      
      logger.debug(`Repositories for owner ${ownerId} retrieved from database and cached`);
      return repositories;
    } catch (error) {
      logger.error(`Error fetching repositories for owner ${ownerId}:`, error);
      throw error;
    }
  }

  async create(input: CreateRepositoryInput, ctx: Context): Promise<Repository> {
    try {
      const result = await ctx.databaseService.query(
        `INSERT INTO repositories (name, description, is_private, language, default_branch, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [input.name, input.description, input.isPrivate, input.language, input.defaultBranch, input.ownerId]
      );

      const repository = this.mapRowToRepository(result.rows[0]);
      
      // Invalidate cache
      await ctx.cacheService.del('repositories:all');
      await ctx.cacheService.del(`repositories:owner:${input.ownerId}`);
      
      logger.info(`Repository created: ${repository.id}`);
      return repository;
    } catch (error) {
      logger.error('Error creating repository:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateRepositoryInput, ctx: Context): Promise<Repository> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (input.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(input.name);
      }
      if (input.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(input.description);
      }
      if (input.isPrivate !== undefined) {
        fields.push(`is_private = $${paramCount++}`);
        values.push(input.isPrivate);
      }
      if (input.language) {
        fields.push(`language = $${paramCount++}`);
        values.push(input.language);
      }
      if (input.defaultBranch) {
        fields.push(`default_branch = $${paramCount++}`);
        values.push(input.defaultBranch);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await ctx.databaseService.query(
        `UPDATE repositories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Repository not found');
      }

      const repository = this.mapRowToRepository(result.rows[0]);
      
      // Invalidate cache
      await ctx.cacheService.del(`repository:${id}`);
      await ctx.cacheService.del('repositories:all');
      await ctx.cacheService.del(`repositories:owner:${repository.owner.id}`);
      
      logger.info(`Repository updated: ${id}`);
      return repository;
    } catch (error) {
      logger.error(`Error updating repository ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string, ctx: Context): Promise<boolean> {
    try {
      const result = await ctx.databaseService.query(
        'DELETE FROM repositories WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('Repository not found');
      }

      // Invalidate cache
      await ctx.cacheService.del(`repository:${id}`);
      await ctx.cacheService.del('repositories:all');
      
      logger.info(`Repository deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting repository ${id}:`, error);
      throw error;
    }
  }

  async star(id: string, ctx: Context): Promise<Repository> {
    try {
      const result = await ctx.databaseService.query(
        'UPDATE repositories SET stars_count = stars_count + 1 WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Repository not found');
      }

      const repository = this.mapRowToRepository(result.rows[0]);
      
      // Invalidate cache
      await ctx.cacheService.del(`repository:${id}`);
      await ctx.cacheService.del('repositories:all');
      
      logger.info(`Repository starred: ${id}`);
      return repository;
    } catch (error) {
      logger.error(`Error starring repository ${id}:`, error);
      throw error;
    }
  }

  async fork(id: string, newOwnerId: string, ctx: Context): Promise<Repository> {
    try {
      // Get original repository
      const originalResult = await ctx.databaseService.query(
        'SELECT * FROM repositories WHERE id = $1',
        [id]
      );

      if (originalResult.rows.length === 0) {
        throw new Error('Repository not found');
      }

      const original = originalResult.rows[0];

      // Create fork
      const forkResult = await ctx.databaseService.query(
        `INSERT INTO repositories (name, description, is_private, language, default_branch, owner_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [original.name, original.description, original.is_private, original.language, original.default_branch, newOwnerId]
      );

      // Update original repository forks count
      await ctx.databaseService.query(
        'UPDATE repositories SET forks_count = forks_count + 1 WHERE id = $1',
        [id]
      );

      const forkedRepository = this.mapRowToRepository(forkResult.rows[0]);
      
      // Invalidate cache
      await ctx.cacheService.del(`repository:${id}`);
      await ctx.cacheService.del('repositories:all');
      await ctx.cacheService.del(`repositories:owner:${newOwnerId}`);
      
      logger.info(`Repository forked: ${id} -> ${forkedRepository.id}`);
      return forkedRepository;
    } catch (error) {
      logger.error(`Error forking repository ${id}:`, error);
      throw error;
    }
  }

  private mapRowToRepository(row: any): Repository {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isPrivate: row.is_private,
      starsCount: row.stars_count || 0,
      forksCount: row.forks_count || 0,
      watchersCount: row.watchers_count || 0,
      language: row.language,
      defaultBranch: row.default_branch,
      owner: {
        id: row.owner_id,
        username: row.owner_username,
        avatar: row.owner_avatar,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
