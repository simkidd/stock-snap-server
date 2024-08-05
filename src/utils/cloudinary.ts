import * as Cloudinary from 'cloudinary';
import { config } from './config';

export const cloudinary = Cloudinary.v2;

const options: Cloudinary.ConfigOptions = {
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_KEY,
  api_secret: config.CLOUDINARY_SECRET,
};

cloudinary.config(options);

// Function to upload an image
export const uploadImage = (
  file: Express.Multer.File,
  options?: Cloudinary.UploadApiOptions,
): Promise<Cloudinary.UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    uploadStream.end(file.buffer);
  });
};

// Function to delete an image
export const deleteImage = async (
  publicId: string,
): Promise<Cloudinary.DeleteApiResponse> => {
  return cloudinary.uploader.destroy(publicId);
};
