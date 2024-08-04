import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandInput, UpdateBrandInput } from '../dtos/brand.dto';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBrands(): Promise<Brand[]> {
    try {
      const brands = await this.prisma.brand.findMany();

      return brands;
    } catch (error) {
      throw error;
    }
  }

  async getBrandById(id: string): Promise<Brand> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id },
      });
      if (!brand) {
        throw new NotFoundException('Brand id not found');
      }

      return brand;
    } catch (error) {
      throw error;
    }
  }

  async createBrand(input: CreateBrandInput): Promise<Brand> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingBrand = await this.prisma.brand.findFirst({
        where: { name },
      });
      if (existingBrand) {
        throw new ConflictException('Brand with this name already exists');
      }

      const slug = slugify(name);

      const brand = await this.prisma.brand.create({
        data: {
          ...input,
          name,
          slug,
        },
      });

      return brand;
    } catch (error) {
      throw error;
    }
  }

  async updateBrand(input: UpdateBrandInput) {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingBrand = await this.prisma.brand.findUnique({
        where: { id: input.id },
      });
      if (!existingBrand) {
        throw new NotFoundException('brand id not found');
      }

      const slug = slugify(name);

      const brand = await this.prisma.brand.update({
        where: { id: input.id },
        data: {
          ...input,
          name,
          slug,
        },
      });

      return brand;
    } catch (error) {
      throw error;
    }
  }

  async deleteBrand(id: string): Promise<Brand> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id },
      });
      if (!brand) {
        throw new NotFoundException('brand id not found');
      }

      await this.prisma.brand.delete({
        where: { id },
      });

      return brand;
    } catch (error) {
      throw error;
    }
  }
}
