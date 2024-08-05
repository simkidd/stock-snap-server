import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as Cloudinary from 'cloudinary';
import { deleteImage, uploadImage } from 'src/utils/cloudinary';
import {
  CloudinaryUploadResponse,
  ImageUploadResponse,
} from '../dtos/image.dto';

@Injectable()
export class UploadService {
  constructor(private readonly prismaService: PrismaService) {}

  private async upload(
    file: Express.Multer.File,
    options: Cloudinary.UploadApiOptions,
  ): Promise<CloudinaryUploadResponse> {
    try {
      const result = await uploadImage(file, options);
      return {
        publicId: result.public_id,
        imageUrl: result.secure_url,
      };
    } catch (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  private async delete(publicId: string): Promise<void> {
    try {
      await deleteImage(publicId);
    } catch (error) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  async uploadBrandImage(
    file: Express.Multer.File,
    brandId: string,
  ): Promise<ImageUploadResponse> {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new BadRequestException('File size exceeds the 2MB limit');
      }

      const brand = await this.prismaService.brand.findUnique({
        where: { id: brandId },
      });
      if (!brand) {
        throw new NotFoundException('brand not found');
      }

      if (brand.publicId) {
        await this.delete(brand.publicId);
      }

      const { publicId, imageUrl } = await this.upload(file, {
        folder: 'stock_snap/brands',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' },
        ],
      });

      await this.prismaService.brand.update({
        where: { id: brandId },
        data: { imageUrl, publicId },
      });

      return { message: 'Brand image uploaded successfully' };
    } catch (error) {
      throw error;
    }
  }

  async uploadUserAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<ImageUploadResponse> {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new BadRequestException('File size exceeds the 2MB limit');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete the existing avatar if it exists
      if (user.avatarId) {
        await this.delete(user.avatarId);
      }

      const { publicId, imageUrl } = await this.upload(file, {
        folder: 'stock_snap/avatars',
        transformation: [
          { width: 500, height: 500, crop: 'thumb', gravity: 'face' },
          { quality: 'auto' },
          { format: 'auto' },
        ],
      });

      await this.prismaService.user.update({
        where: { id: userId },
        data: { avatar: imageUrl, avatarId: publicId },
      });

      return { message: 'User avatar uploaded successfully' };
    } catch (error) {
      throw error;
    }
  }

  async uploadProductImages(
    files: Express.Multer.File[],
    productId: string,
  ): Promise<ImageUploadResponse> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Files are required');
      }

      if (files.length > 4) {
        throw new BadRequestException(
          'Cannot upload more than 4 images at a time',
        );
      }

      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          throw new BadRequestException('File size exceeds the 2MB limit');
        }
      }

      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Get the current number of images for the product
      const existingImagesCount = await this.prismaService.productImage.count({
        where: { productId: product.id },
      });

      // Check if the total number of images exceeds the limit
      if (existingImagesCount + files.length > 6) {
        throw new BadRequestException(
          'Total number of images cannot exceed 6.',
        );
      }

      const imageUploadPromises = files.map((file) =>
        this.upload(file, {
          folder: 'stock_snap/products',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' },
          ],
        }),
      );
      const images = await Promise.all(imageUploadPromises);

      await this.prismaService.product.update({
        where: { id: productId },
        data: {
          images: {
            create: images.map((img) => ({
              publicId: img.publicId,
              imageUrl: img.imageUrl,
            })),
          },
        },
      });

      return { message: 'Product images uploaded successfully' };
    } catch (error) {
      throw error;
    }
  }

  async updateProductImages(
    files: Express.Multer.File[],
    productId: string,
  ): Promise<ImageUploadResponse> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Files are required');
      }

      if (files.length > 4) {
        throw new BadRequestException(
          'Cannot upload more than 4 images at a time',
        );
      }
      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) {
          throw new BadRequestException('File size exceeds the 2MB limit');
        }
      }

      // Upload new images
      const imageUploadPromises = files.map((file) =>
        this.upload(file, {
          folder: 'stock_snap/products',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' },
          ],
        }),
      );
      const images = await Promise.all(imageUploadPromises);

      // Get existing images
      const existingImages = await this.prismaService.productImage.findMany({
        where: { productId },
      });

      // Delete old images from Cloudinary
      const deleteImagePromises = existingImages.map((img) =>
        this.delete(img.publicId),
      );
      await Promise.all(deleteImagePromises);

      // Update database with new images
      await this.prismaService.product.update({
        where: { id: productId },
        data: {
          images: {
            deleteMany: {},
            create: images.map((img) => ({
              publicId: img.publicId,
              imageUrl: img.imageUrl,
            })),
          },
        },
      });

      return { message: 'Product images updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  async deleteBrandImage(brandId: string): Promise<ImageUploadResponse> {
    try {
      const brand = await this.prismaService.brand.findUnique({
        where: { id: brandId },
      });
      if (!brand) {
        throw new NotFoundException('Brand id not found');
      }

      await this.delete(brand.publicId);
      await this.prismaService.brand.update({
        where: { id: brandId },
        data: { imageUrl: null, publicId: null },
      });

      return { message: 'Brand image deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async deleteUserAvatar(userId: string): Promise<ImageUploadResponse> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User id not found');
      }

      await this.delete(user.avatarId);
      await this.prismaService.user.update({
        where: { id: userId },
        data: { avatar: null, avatarId: null },
      });

      return { message: 'User avatar deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async deleteProductImage(
    productId: string,
    imageId: string,
  ): Promise<ImageUploadResponse> {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      const productImage = await this.prismaService.productImage.findUnique({
        where: { id: imageId },
      });

      if (!productImage) {
        throw new BadRequestException('Product image not found');
      }

      await this.delete(productImage.publicId);

      await this.prismaService.productImage.delete({
        where: { id: imageId },
      });

      return { message: 'Product image deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Method to set a specific image as the main image for a product
  async setMainProductImage(
    productId: string,
    imageId: string,
  ): Promise<ImageUploadResponse> {
    try {
      // Set all images for the product to not main
      await this.prismaService.productImage.updateMany({
        where: { productId },
        data: { isMain: false },
      });

      // Set the specified image as the main image
      await this.prismaService.productImage.update({
        where: { id: imageId },
        data: { isMain: true },
      });

      return { message: 'Image set as main successfully' };
    } catch (error) {
      throw error;
    }
  }
}
