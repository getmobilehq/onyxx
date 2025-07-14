import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

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

export default cloudinary;