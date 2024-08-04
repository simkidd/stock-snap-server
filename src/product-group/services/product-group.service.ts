import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProductGroupInput,
  UpdateProductGroupInput,
} from '../dtos/product-group.dto';
import { ProductGroup } from '@prisma/client';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class ProductGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(input: CreateProductGroupInput): Promise<ProductGroup> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingGroup = await this.prisma.productGroup.findFirst({
        where: { name },
      });
      if (existingGroup) {
        throw new BadRequestException(
          'product group with this name already exists',
        );
      }

      const slug = slugify(name);

      const group = await this.prisma.productGroup.create({
        data: {
          ...input,
          name,
          slug,
        },
      });

      return group;
    } catch (error) {
      throw error;
    }
  }

  async getAllGroup(): Promise<ProductGroup[]> {
    try {
      const allGroups = await this.prisma.productGroup.findMany();

      return allGroups;
    } catch (error) {
      throw error;
    }
  }

  async getGroupById(id: string): Promise<ProductGroup> {
    try {
      const group = await this.prisma.productGroup.findUnique({
        where: { id },
      });

      if (!group) {
        throw new NotFoundException(`Product group id not found`);
      }

      return group;
    } catch (error) {
      throw error;
    }
  }

  async updateGroup(input: UpdateProductGroupInput) {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const exitingGroup = await this.prisma.productGroup.findUnique({
        where: { id: input.id },
      });

      if (!exitingGroup) {
        throw new NotFoundException(`Product group ID not found`);
      }

      const slug = slugify(name);

      return await this.prisma.productGroup.update({
        where: { id: input.id },
        data: {
          ...input,
          name,
          slug,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteGroup(id: string): Promise<ProductGroup> {
    try {
      const group = await this.prisma.productGroup.findUnique({
        where: { id },
      });

      if (!group) {
        throw new NotFoundException(`Product group with ID not found`);
      }

      return await this.prisma.productGroup.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete product group with ID ${id}`,
      );
    }
  }
}
