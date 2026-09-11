import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCategoryInput,
  CreateSubCategoryInput,
  UpdateCategoryInput,
} from './dtos/category.dto';
import { Category } from 'src/generated/prisma';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all top-level categories with their subcategories nested
   */
  async getAllCategories(tenantId?: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        children: {
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: { products: true },
        },
        products: true,
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  /**
   * Create Main Category
   */
  async createCategory(
    input: CreateCategoryInput,
    tenantId?: string,
  ): Promise<Category> {
    const resolvedTenantId =
      tenantId || (await this.prisma.tenant.findFirst())?.id;
    if (!resolvedTenantId) throw new BadRequestException('Tenant not found');

    const name = input.name.trim();
    const slug = slugify(name);

    const existingCategory = await this.prisma.category.findFirst({
      where: { slug, tenantId: resolvedTenantId },
    });

    if (existingCategory) {
      throw new BadRequestException(`Category "${name}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        tenantId: resolvedTenantId,
        name,
        slug,
      },
      include: { children: true },
    });
  }

  /**
   * Create Sub-Category under a parent category
   */
  async createSubCategory(
    input: CreateSubCategoryInput,
    tenantId?: string,
  ): Promise<Category> {
    const resolvedTenantId =
      tenantId || (await this.prisma.tenant.findFirst())?.id;
    if (!resolvedTenantId) throw new BadRequestException('Tenant not found');

    const parent = await this.prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    const name = input.name.trim();
    const slug = slugify(name);

    const existing = await this.prisma.category.findFirst({
      where: { slug, tenantId: resolvedTenantId },
    });
    if (existing) {
      throw new BadRequestException(`Category "${name}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        tenantId: resolvedTenantId,
        name,
        slug,
        parentId: input.categoryId,
      },
    });
  }

  async updateCategory(input: UpdateCategoryInput): Promise<Category> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: input.id },
    });
    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    const name = input.name.trim();
    const slug = slugify(name);

    return this.prisma.category.update({
      where: { id: input.id },
      data: {
        name,
        slug,
      },
      include: { children: true },
    });
  }

  async deleteCategory(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async deleteSubCategory(id: string): Promise<Category> {
    const subCategory = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!subCategory) {
      throw new NotFoundException('Sub-category not found');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
