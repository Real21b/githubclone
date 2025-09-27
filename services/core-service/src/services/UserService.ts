import { Context } from '../types/Context';
import { User } from '../entities/User';
import { CreateUserInput } from '../inputs/CreateUserInput';
import { UpdateUserInput } from '../inputs/UpdateUserInput';
import { logger } from '../utils/logger';

export class UserService {
  async findAll(ctx: Context): Promise<User[]> {
    try {
      const cacheKey = 'users:all';
      const cachedUsers = await ctx.cacheService.get<User[]>(cacheKey);
      
      if (cachedUsers) {
        logger.debug('Users retrieved from cache');
        return cachedUsers;
      }

      const result = await ctx.databaseService.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );

      const users = result.rows.map(this.mapRowToUser);
      
      // Cache for 30 minutes
      await ctx.cacheService.set(cacheKey, users, 1800);
      
      logger.debug('Users retrieved from database and cached');
      return users;
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  async findById(id: string, ctx: Context): Promise<User> {
    try {
      const cacheKey = `user:${id}`;
      const cachedUser = await ctx.cacheService.get<User>(cacheKey);
      
      if (cachedUser) {
        logger.debug(`User ${id} retrieved from cache`);
        return cachedUser;
      }

      const result = await ctx.databaseService.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = this.mapRowToUser(result.rows[0]);
      
      // Cache for 1 hour
      await ctx.cacheService.set(cacheKey, user, 3600);
      
      logger.debug(`User ${id} retrieved from database and cached`);
      return user;
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  async findByUsername(username: string, ctx: Context): Promise<User> {
    try {
      const cacheKey = `user:username:${username}`;
      const cachedUser = await ctx.cacheService.get<User>(cacheKey);
      
      if (cachedUser) {
        logger.debug(`User ${username} retrieved from cache`);
        return cachedUser;
      }

      const result = await ctx.databaseService.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = this.mapRowToUser(result.rows[0]);
      
      // Cache for 1 hour
      await ctx.cacheService.set(cacheKey, user, 3600);
      
      logger.debug(`User ${username} retrieved from database and cached`);
      return user;
    } catch (error) {
      logger.error(`Error fetching user by username ${username}:`, error);
      throw error;
    }
  }

  async create(input: CreateUserInput, ctx: Context): Promise<User> {
    try {
      const result = await ctx.databaseService.query(
        `INSERT INTO users (username, email, password, bio, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [input.username, input.email, input.password, input.bio]
      );

      const user = this.mapRowToUser(result.rows[0]);
      
      // Invalidate cache
      await ctx.cacheService.del('users:all');
      
      logger.info(`User created: ${user.id}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateUserInput, ctx: Context): Promise<User> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (input.username) {
        fields.push(`username = $${paramCount++}`);
        values.push(input.username);
      }
      if (input.email) {
        fields.push(`email = $${paramCount++}`);
        values.push(input.email);
      }
      if (input.bio !== undefined) {
        fields.push(`bio = $${paramCount++}`);
        values.push(input.bio);
      }
      if (input.avatar) {
        fields.push(`avatar = $${paramCount++}`);
        values.push(input.avatar);
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await ctx.databaseService.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = this.mapRowToUser(result.rows[0]);
      
      // Invalidate cache
      await ctx.cacheService.del(`user:${id}`);
      await ctx.cacheService.del(`user:username:${user.username}`);
      await ctx.cacheService.del('users:all');
      
      logger.info(`User updated: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string, ctx: Context): Promise<boolean> {
    try {
      const result = await ctx.databaseService.query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('User not found');
      }

      // Invalidate cache
      await ctx.cacheService.del(`user:${id}`);
      await ctx.cacheService.del('users:all');
      
      logger.info(`User deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      bio: row.bio,
      avatar: row.avatar,
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
