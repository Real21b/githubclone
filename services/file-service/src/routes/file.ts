import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { FileController } from '../controllers/FileController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const fileController = new FileController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Routes
router.post('/upload', authMiddleware, upload.single('file'), fileController.uploadFile);
router.get('/:id', fileController.getFile);
router.delete('/:id', authMiddleware, fileController.deleteFile);
router.get('/user/:userId', authMiddleware, fileController.getUserFiles);

export { router as fileRoutes };
