import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductCategory } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProductCatInput,
  UpdateProductCatInput,
} from '../dtos/product-category.dto';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProductCategories(): Promise<ProductCategory[]> {
    try {
      const categories = await this.prisma.productCategory.findMany();

      return categories;
    } catch (error) {
      throw error;
    }
  }

  async getProductCategoryById(id: string): Promise<ProductCategory> {
    try {
      const category = await this.prisma.productCategory.findUnique({
        where: { id },
        include: { products: true },
      });
      if (!category) {
        throw new NotFoundException('product category id not found');
      }

      return category;
    } catch (error) {
      throw error;
    }
  }

  async createProductCategory(
    input: CreateProductCatInput,
  ): Promise<ProductCategory> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingCategory = await this.prisma.productCategory.findFirst({
        where: { name, categoryId: input.categoryId },
      });

      if (existingCategory) {
        throw new BadRequestException(
          'product Category with this name already exists',
        );
      }

      const slug = slugify(name);

      const category = await this.prisma.productCategory.create({
        data: {
          ...input,
          name,
          slug,
        },
      });

      return category;
    } catch (error) {
      throw error;
    }
  }

  async updateProductCategory(input: UpdateProductCatInput) {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingCategory = await this.prisma.productCategory.findUnique({
        where: { id: input.id },
      });
      if (!existingCategory) {
        throw new NotFoundException('Product category id not found');
      }

      const slug = slugify(name);

      const category = await this.prisma.productCategory.update({
        where: { id: input.id },
        data: {
          ...input,
          name,
          slug,
        },
      });

      return category;
    } catch (error) {
      throw error;
    }
  }

  async deleteProductCategory(id: string): Promise<ProductCategory> {
    try {
      const category = await this.prisma.productCategory.findUnique({
        where: { id },
      });
      if (!category) {
        throw new NotFoundException('product category id not found');
      }

      await this.prisma.category.delete({
        where: { id },
      });

      return category;
    } catch (error) {
      throw error;
    }
  }
}
