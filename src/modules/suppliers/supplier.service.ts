import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/utils/helpers';
import { CreateSupplierInput, UpdateSupplierInput } from './dtos/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSuppliers(tenantId?: string): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { name: 'asc' },
    });
  }

  async getSupplierById(id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async createSupplier(
    input: CreateSupplierInput,
    tenantId?: string,
  ): Promise<Supplier> {
    const resolvedTenantId =
      tenantId || (await this.prisma.tenant.findFirst())?.id;
    const name = input.name.trim();
    const slug = slugify(name);

    const existing = await this.prisma.supplier.findFirst({
      where: { slug, tenantId: resolvedTenantId },
    });
    if (existing) {
      throw new ConflictException('Supplier with this name already exists');
    }

    return this.prisma.supplier.create({
      data: {
        ...input,
        tenantId: resolvedTenantId,
        name,
        slug,
      },
    });
  }

  async updateSupplier(input: UpdateSupplierInput) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new NotFoundException('Supplier not found');
    }

    const name = input.name.trim();
    const slug = slugify(name);

    return this.prisma.supplier.update({
      where: { id: input.id },
      data: {
        ...input,
        name,
        slug,
      },
    });
  }

  async deleteSupplier(id: string): Promise<Supplier> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
