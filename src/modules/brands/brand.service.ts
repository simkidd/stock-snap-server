import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brand } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandInput, UpdateBrandInput } from './dtos/brand.dto';
import { slugify } from 'src/utils/helpers';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBrands(tenantId?: string): Promise<Brand[]> {
    return this.prisma.brand.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { name: 'asc' },
    });
  }

  async getBrandById(id: string): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async createBrand(input: CreateBrandInput, tenantId?: string): Promise<Brand> {
    const resolvedTenantId = tenantId || (await this.prisma.tenant.findFirst())?.id;
    const name = input.name.trim();
    const slug = slugify(name);

    const existingBrand = await this.prisma.brand.findFirst({
      where: { slug, tenantId: resolvedTenantId },
    });
    if (existingBrand) {
      throw new ConflictException('Brand with this name already exists');
    }

    return this.prisma.brand.create({
      data: {
        ...input,
        tenantId: resolvedTenantId as string,
        name,
        slug,
      },
    });
  }

  async updateBrand(input: UpdateBrandInput) {
    const existingBrand = await this.prisma.brand.findUnique({
      where: { id: input.id },
    });
    if (!existingBrand) {
      throw new NotFoundException('Brand not found');
    }

    const name = input.name.trim();
    const slug = slugify(name);

    return this.prisma.brand.update({
      where: { id: input.id },
      data: {
        ...input,
        name,
        slug,
      },
    });
  }

  async deleteBrand(id: string): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return this.prisma.brand.delete({
      where: { id },
    });
  }
}
