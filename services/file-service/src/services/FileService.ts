import { CacheService } from './CacheService';
import { logger } from '../utils/logger';

export interface FileData {
  id?: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  userId?: string;
  uploadedAt?: Date;
}

export class FileService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  async saveFile(fileData: FileData): Promise<FileData> {
    try {
      const fileId = this.generateId();
      const file = {
        ...fileData,
        id: fileId,
        uploadedAt: new Date()
      };

      // In real implementation, save to database
      // For now, we'll use cache
      await this.cacheService.set(`file:${fileId}`, file, 86400); // 24 hours
      await this.cacheService.set(`files:user:${fileData.userId}`, 
        await this.getFilesByUserId(fileData.userId || ''), 3600);

      logger.info('File saved', { fileId, userId: fileData.userId });
      return file;
    } catch (error) {
      logger.error('Error saving file:', error);
      throw error;
    }
  }

  async getFileById(id: string): Promise<FileData | null> {
    try {
      const cacheKey = `file:${id}`;
      const file = await this.cacheService.get<FileData>(cacheKey);
      
      if (file) {
        logger.debug(`File ${id} retrieved from cache`);
        return file;
      }

      // In real implementation, fetch from database
      logger.debug(`File ${id} not found`);
      return null;
    } catch (error) {
      logger.error(`Error fetching file ${id}:`, error);
      throw error;
    }
  }

  async getFilesByUserId(userId: string): Promise<FileData[]> {
    try {
      const cacheKey = `files:user:${userId}`;
      const files = await this.cacheService.get<FileData[]>(cacheKey);
      
      if (files) {
        logger.debug(`Files for user ${userId} retrieved from cache`);
        return files;
      }

      // In real implementation, fetch from database
      logger.debug(`No files found for user ${userId}`);
      return [];
    } catch (error) {
      logger.error(`Error fetching files for user ${userId}:`, error);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<boolean> {
    try {
      const file = await this.getFileById(id);
      if (!file) {
        return false;
      }

      // Remove from cache
      await this.cacheService.del(`file:${id}`);
      if (file.userId) {
        await this.cacheService.del(`files:user:${file.userId}`);
      }

      logger.info(`File ${id} deleted`);
      return true;
    } catch (error) {
      logger.error(`Error deleting file ${id}:`, error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
