import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '@prisma/client';
import { NotificationService } from 'src/notification/services/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/utils/helpers';
import { CreateProductInput, UpdateProductInput } from '../dtos/product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllProducts(): Promise<Product[]> {
    try {
      const products = await this.prisma.product.findMany();

      return products;
    } catch (error) {
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!product) {
        throw new NotFoundException('Product id not found');
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  async createProduct(
    input: CreateProductInput,
    userId: string,
  ): Promise<Product> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingProduct = await this.prisma.product.findFirst({
        where: { name, productCategoryId: input.productCategoryId },
      });

      if (existingProduct) {
        throw new BadRequestException(
          'Product with this name already exists in the category',
        );
      }

      const slug = slugify(name);

      const product = await this.prisma.product.create({
        data: {
          ...input,
          name,
          slug,
          addedById: userId,
          updatedById: userId,
        },
      });

      return product;
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(
    input: UpdateProductInput,
    userId: string,
  ): Promise<Product> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingProduct = await this.prisma.product.findUnique({
        where: { id: input.id },
      });
      if (!existingProduct) {
        throw new NotFoundException('Product id not found');
      }

      const slug = slugify(name);

      const product = await this.prisma.product.update({
        where: { id: input.id },
        data: {
          ...input,
          name,
          slug,
          updatedById: userId,
        },
      });

      await this.updateProductStatus(product);

      return product;
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<Product> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException('Product id not found');
      }

      await this.prisma.product.delete({
        where: { id },
      });

      return product;
    } catch (error) {
      throw error;
    }
  }

  private async updateProductStatus(product: Product) {
    if (product.quantity === 0 && product.status !== 'OUT') {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: 'OUT' },
      });
      await this.notificationService.createNotification(
        `Product ${product.name} is out of stock.`,
        product.id,
      );
    } else if (
      product.quantity < product.minimumQuantity &&
      product.status !== 'LOW'
    ) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: 'LOW' },
      });
      await this.notificationService.createNotification(
        `Product ${product.name} is running low on stock.`,
        product.id,
      );
    } else if (
      product.quantity > product.minimumQuantity &&
      (product.status === 'LOW' || product.status === 'OUT')
    ) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: 'AVAILABLE' },
      });
      await this.notificationService.createNotification(
        `Product ${product.name} is back in stock and available.`,
        product.id,
      );
    }
  }
}
