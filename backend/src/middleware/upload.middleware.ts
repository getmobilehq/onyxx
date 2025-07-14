import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
  } else {
    cb(new Error('Only image files are allowed.'));
  }
};

// Configure multer with options
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files at once
  },
});

// Middleware for single image upload
export const uploadSingleImage = upload.single('image');

// Middleware for multiple image uploads
export const uploadMultipleImages = upload.array('images', 5);

// Error handling middleware for multer errors
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 5 files.',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name for file upload.',
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
        });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload error.',
    });
  }

  next();
};

// Validate uploaded file middleware
export const validateUploadedFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided.',
    });
  }

  // Additional validation can be added here
  next();
};

export default upload;