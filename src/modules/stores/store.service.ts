import { Injectable, NotFoundException } from '@nestjs/common';
import { Store, Tenant } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantInfo(tenantId?: string): Promise<Tenant | null> {
    if (tenantId) {
      return this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { stores: { include: { registers: true } } },
      });
    }
    return this.prisma.tenant.findFirst({
      include: { stores: { include: { registers: true } } },
    });
  }

  async getAllStores(tenantId?: string): Promise<Store[]> {
    return this.prisma.store.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        registers: true,
        tenant: true,
      },
    });
  }

  async getStoreById(id: string): Promise<Store> {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { registers: true, tenant: true },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
