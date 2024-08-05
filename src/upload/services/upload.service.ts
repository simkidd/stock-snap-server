import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as Cloudinary from 'cloudinary';
import { deleteImage, uploadImage } from 'src/utils/cloudinary';

@Injectable()
export class UploadService {
  constructor(private readonly prismaService: PrismaService) {}

  private async upload(
    file: Express.Multer.File,
    options: Cloudinary.UploadApiOptions,
  ): Promise<{ publicId: string; imageUrl: string }> {
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
  ): Promise<void> {
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
  }

  async uploadUserAvatar(
    file: Express.Multer.File,
    userId: string,
  ): Promise<void> {
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
  }

  async uploadProductImages(
    files: Express.Multer.File[],
    productId: string,
  ): Promise<void> {
    // Check the number of files to be uploaded
    if (files.length > 4) {
      throw new Error('Cannot upload more than 4 images at a time.');
    }

    // Get the current number of images for the product
    const existingImagesCount = await this.prismaService.productImage.count({
      where: { productId },
    });

    // Check if the total number of images exceeds the limit
    if (existingImagesCount + files.length > 6) {
      throw new Error('Total number of images cannot exceed 6.');
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
  }

  async updateProductImages(
    files: Express.Multer.File[],
    productId: string,
  ): Promise<void> {
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

    const existingImages = await this.prismaService.productImage.findMany({
      where: { productId },
    });

    const deleteImagePromises = existingImages.map((img) =>
      this.delete(img.publicId),
    );
    await Promise.all(deleteImagePromises);

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
  }

  async deleteBrandImage(brandId: string): Promise<void> {
    const brand = await this.prismaService.brand.findUnique({
      where: { id: brandId },
    });
    if (brand && brand.publicId) {
      await this.delete(brand.publicId);
      await this.prismaService.brand.update({
        where: { id: brandId },
        data: { imageUrl: null, publicId: null },
      });
    }
  }

  async deleteUserAvatar(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (user && user.avatarId) {
      await this.delete(user.avatarId);
      await this.prismaService.user.update({
        where: { id: userId },
        data: { avatar: null, avatarId: null },
      });
    }
  }

  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    // Step 1: Fetch the product image record
    const productImage = await this.prismaService.productImage.findUnique({
      where: { id: imageId },
    });

    if (!productImage) {
      throw new NotFoundException('Product image not found.');
    }

    // Check if the image exists and belongs to the correct product
    if (!productImage || productImage.productId !== productId) {
      throw new NotFoundException(
        'Product image not found or does not belong to the specified product.',
      );
    }

    // Step 2: Delete from Cloudinary
    try {
      await this.delete(productImage.publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }

    // Step 3: Delete from Prisma
    try {
      await this.prismaService.productImage.delete({
        where: { id: imageId },
      });
    } catch (error) {
      console.error('Error deleting image from Prisma:', error);
      throw new Error('Failed to delete image from Prisma');
    }
  }

  // Method to set a specific image as the main image for a product
  async setMainProductImage(productId: string, imageId: string): Promise<void> {
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
  }
}
