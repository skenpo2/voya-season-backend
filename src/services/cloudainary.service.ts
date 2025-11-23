import cloudinary from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS } from '../config/constants';
import streamifier from 'streamifier';

interface UploadResult {
  secure_url: string;
  public_id: string;
}

export class CloudinaryService {
  /**
   * Upload single image to Cloudinary
   */
  static async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'voya-cars',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(
              new ApiError(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Failed to upload image to Cloudinary'
              )
            );
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(
    files: Express.Multer.File[]
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadImage(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to upload images'
      );
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract public_id from URL
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      const publicId = `${folder}/${fileName}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Don't throw error if deletion fails (image might not exist)
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  static async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map((url) => this.deleteImage(url));
    await Promise.all(deletePromises);
  }
}
