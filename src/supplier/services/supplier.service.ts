import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/utils/helpers';
import { CreateSupplierInput, UpdateSupplierInput } from '../dtos/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const suppliers = await this.prisma.supplier.findMany();

      return suppliers;
    } catch (error) {
      throw error;
    }
  }

  async getSupplierById(id: string): Promise<Supplier> {
    try {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id },
        include: { products: true, orders: true },
      });
      if (!supplier) {
        throw new NotFoundException('supplier id not found');
      }

      return supplier;
    } catch (error) {
      throw error;
    }
  }

  async createSupplier(input: CreateSupplierInput): Promise<Supplier> {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingsupplier = await this.prisma.supplier.findFirst({
        where: { name },
      });
      if (existingsupplier) {
        throw new ConflictException('supplier with this name already exists');
      }

      const slug = slugify(name);

      const supplier = await this.prisma.supplier.create({
        data: {
          ...input,
          name,
          slug,
        },
      });

      return supplier;
    } catch (error) {
      throw error;
    }
  }

  async updateSupplier(input: UpdateSupplierInput) {
    try {
      const name = input.name.toLowerCase().trim().replace(/\s+$/, '');
      const existingsupplier = await this.prisma.supplier.findUnique({
        where: { id: input.id },
      });
      if (!existingsupplier) {
        throw new NotFoundException('supplier id not found');
      }

      const slug = slugify(name);

      const supplier = await this.prisma.supplier.update({
        where: { id: input.id },
        data: {
          ...input,
          name,
          slug,
        },
      });

      return supplier;
    } catch (error) {
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<Supplier> {
    try {
      const supplier = await this.prisma.supplier.findUnique({
        where: { id },
      });
      if (!supplier) {
        throw new NotFoundException('supplier id not found');
      }

      await this.prisma.supplier.delete({
        where: { id },
      });

      return supplier;
    } catch (error) {
      throw error;
    }
  }
}
