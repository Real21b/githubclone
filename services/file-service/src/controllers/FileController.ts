import { Request, Response } from 'express';
import { FileService } from '../services/FileService';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
  fileService: FileService;
  cacheService: any;
}

export class FileController {
  async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
        return;
      }

      const fileData = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        userId: req.user?.id
      };

      const savedFile = await req.fileService.saveFile(fileData);

      res.json({
        success: true,
        data: {
          id: savedFile.id,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          mimetype: savedFile.mimetype,
          size: savedFile.size,
          url: `/files/${savedFile.id}`,
          uploadedAt: savedFile.uploadedAt
        }
      });

      logger.info('File uploaded successfully', { 
        fileId: savedFile.id, 
        userId: req.user?.id,
        filename: req.file.originalname 
      });

    } catch (error) {
      logger.error('File upload failed:', error);
      res.status(500).json({
        success: false,
        error: 'File upload failed'
      });
    }
  }

  async getFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = await req.fileService.getFileById(id);

      if (!file) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      // Check if file exists on disk
      const filePath = path.join(__dirname, '../../uploads', file.filename);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: 'File not found on disk'
        });
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      logger.debug('File served', { fileId: id, filename: file.originalName });

    } catch (error) {
      logger.error('Error serving file:', error);
      res.status(500).json({
        success: false,
        error: 'Error serving file'
      });
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = await req.fileService.getFileById(id);

      if (!file) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      // Check if user owns the file
      if (file.userId !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      // Delete file from disk
      const filePath = path.join(__dirname, '../../uploads', file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete file record from database
      await req.fileService.deleteFile(id);

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

      logger.info('File deleted', { fileId: id, userId: req.user?.id });

    } catch (error) {
      logger.error('Error deleting file:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting file'
      });
    }
  }

  async getUserFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Check if user is requesting their own files
      if (userId !== req.user?.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied'
        });
        return;
      }

      const files = await req.fileService.getFilesByUserId(userId);

      res.json({
        success: true,
        data: files.map(file => ({
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          url: `/files/${file.id}`,
          uploadedAt: file.uploadedAt
        }))
      });

      logger.debug('User files retrieved', { userId, count: files.length });

    } catch (error) {
      logger.error('Error retrieving user files:', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving files'
      });
    }
  }
}
