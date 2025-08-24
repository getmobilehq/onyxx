import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Validate required environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('❌ CLOUDINARY_CLOUD_NAME environment variable is not set');
}
if (!process.env.CLOUDINARY_API_KEY) {
  console.error('❌ CLOUDINARY_API_KEY environment variable is not set');
}
if (!process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ CLOUDINARY_API_SECRET environment variable is not set');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - Image buffer from multer
 * @param folder - Cloudinary folder to organize uploads
 * @param public_id - Optional custom public ID
 * @returns Promise with upload result
 */
export const uploadImageToCloudinary = async (
  buffer: Buffer,
  folder: string = 'onyx/buildings',
  public_id?: string
): Promise<CloudinaryUploadResult> => {
  try {
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not properly configured. Missing environment variables.');
      return {
        success: false,
        error: 'Image upload service not configured. Please contact support.',
      };
    }
    return new Promise((resolve) => {
      const uploadOptions: any = {
        folder,
        resource_type: 'image',
        format: 'jpg', // Convert all images to JPG for consistency
        quality: 'auto:good', // Automatic quality optimization
        width: 1200, // Max width for building images
        height: 800, // Max height for building images
        crop: 'limit', // Don't upscale, only downscale if needed
        ...(public_id && { public_id }),
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            resolve({
              success: false,
              error: error.message || 'Failed to upload image',
            });
          } else if (result) {
            resolve({
              success: true,
              url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            resolve({
              success: false,
              error: 'Unknown upload error',
            });
          }
        }
      ).end(buffer);
    });
  } catch (error: any) {
    console.error('Cloudinary service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
};

/**
 * Delete an image from Cloudinary
 * @param public_id - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export const deleteImageFromCloudinary = async (
  public_id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok') {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `Failed to delete image: ${result.result}` 
      };
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image',
    };
  }
};

/**
 * Generate optimized URL for an existing Cloudinary image
 * @param public_id - The public ID of the image
 * @param width - Desired width
 * @param height - Desired height
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  public_id: string,
  width: number = 800,
  height: number = 600
): string => {
  return cloudinary.url(public_id, {
    width,
    height,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto', // Automatic format selection (WebP, AVIF, etc.)
    secure: true,
  });
};

/**
 * Clean and validate Cloudinary URL to fix HTML entity encoding issues
 * @param url - The potentially encoded URL
 * @returns Clean Cloudinary URL
 */
export const cleanCloudinaryUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  try {
    let cleanUrl = url;
    
    // Decode HTML entities (&#x2F; -> /)
    cleanUrl = cleanUrl
      .replace(/&#x2F;/g, '/')
      .replace(/&#x3A;/g, ':')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    // Remove any incorrect domain prefix and extract the Cloudinary URL
    if (cleanUrl.includes('res.cloudinary.com')) {
      const cloudinaryMatch = cleanUrl.match(/(https?:\/\/res\.cloudinary\.com\/[^"'\s]+)/);
      if (cloudinaryMatch) {
        cleanUrl = cloudinaryMatch[1];
      }
    }
    
    // Validate that it's a proper Cloudinary URL
    if (!cleanUrl.startsWith('https://res.cloudinary.com/')) {
      console.warn('⚠️ URL does not appear to be a valid Cloudinary URL:', cleanUrl);
    }
    
    return cleanUrl;
  } catch (error) {
    console.error('❌ Error cleaning Cloudinary URL:', error);
    return url; // Return original URL if cleaning fails
  }
};

export default cloudinary;