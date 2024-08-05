import * as Cloudinary from 'cloudinary';
import { config } from './config';
import * as fs from 'fs';
import * as util from 'util';

const unlinkFile = util.promisify(fs.unlink);

export const cloudinary = Cloudinary.v2;

const options: Cloudinary.ConfigOptions = {
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_KEY,
  api_secret: config.CLOUDINARY_SECRET,
};

cloudinary.config(options);

// Function to upload an image
export const uploadImage = async (
  filePath: string,
  options?: Cloudinary.UploadApiOptions,
): Promise<Cloudinary.UploadApiResponse> => {
  const result = await cloudinary.uploader.upload(filePath, options);
  await unlinkFile(filePath); // Clean up the uploaded file
  return result;
};

// Function to delete an image
export const deleteImage = async (
  publicId: string,
): Promise<Cloudinary.DeleteApiResponse> => {
  return cloudinary.uploader.destroy(publicId);
};
