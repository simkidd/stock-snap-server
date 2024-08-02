import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductInput, UpdateProductInput } from '../dtos/product.dto';
import { Product, User } from '@prisma/client';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

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

  async updateProduct(input: UpdateProductInput): Promise<Product> {
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
          slug,
        },
      });

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
}
