import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { deleteImage, uploadImage } from 'src/utils/cloundinary';
import * as Cloudinary from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private readonly prismaService: PrismaService) {}

  private async upload(
    file: Express.Multer.File,
    options: Cloudinary.UploadApiOptions,
  ): Promise<{ publicId: string; imageUrl: string }> {
    try {
      const result = await uploadImage(file.path, options);
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
      folder: 'brands',
      transformation: [
        { width: 300, height: 300, crop: 'limit' },
        { quality: 'auto' },
        { format: 'jpg' },
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
      folder: 'avatars',
      transformation: [
        { width: 150, height: 150, crop: 'thumb', gravity: 'face' },
        { quality: 'auto' },
        { format: 'jpg' },
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
    if (files.length > 4) {
      throw new Error('Cannot upload more than 4 images.');
    }

    const imageUploadPromises = files.map((file) =>
      this.upload(file, {
        folder: 'products',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { format: 'jpg' },
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
        folder: 'products',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { format: 'jpg' },
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
    const productImage = await this.prismaService.productImage.findUnique({
      where: { id: imageId, productId },
    });
    if (productImage) {
      await this.delete(productImage.publicId);
      await this.prismaService.productImage.delete({
        where: { id: imageId },
      });
    } else {
      throw new NotFoundException(
        'Image not found or does not belong to the specified product.',
      );
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
