import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryInput, UpdateCategoryInput } from '../dtos/category.dto';
import { Category } from '@prisma/client';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany();

      return categories;
    } catch (error) {
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<Category> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: { productCategories: true },
      });
      if (!category) {
        throw new NotFoundException('Category id not found');
      }

      return category;
    } catch (error) {
      throw error;
    }
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingCategory = await this.prisma.category.findFirst({
        where: { name },
      });

      if (existingCategory) {
        throw new BadRequestException('Category with this name already exists');
      }

      const slug = slugify(name);

      const category = await this.prisma.category.create({
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

  async updateCategory(input: UpdateCategoryInput) {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingCategory = await this.prisma.category.findUnique({
        where: { id: input.id },
      });
      if (!existingCategory) {
        throw new NotFoundException('category id not found');
      }

      const slug = slugify(name);

      const category = await this.prisma.category.update({
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

  async deleteCategory(id: string): Promise<Category> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
      });
      if (!category) {
        throw new NotFoundException('Category id not found');
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
