import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { seedData } from '../lib/data';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    try {
      await this.prisma.user.createMany({
        data: seedData.users,
        skipDuplicates: true,
      });
      await this.prisma.category.createMany({
        data: seedData.categories,
        skipDuplicates: true,
      });
      await this.prisma.productCategory.createMany({
        data: seedData.productCategories,
        skipDuplicates: true,
      });
      await this.prisma.brand.createMany({
        data: seedData.brands,
        skipDuplicates: true,
      });
      await this.prisma.productGroup.createMany({
        data: seedData.productGroups,
        skipDuplicates: true,
      });

      await this.prisma.product.createMany({
        data: seedData.products,
        skipDuplicates: true,
      });

      await this.prisma.productImage.createMany({
        data: seedData.productImages,
        skipDuplicates: true,
      });

      await this.prisma.sales.createMany({
        data: seedData.sales,
        skipDuplicates: true,
      });

      await this.prisma.saleItem.createMany({
        data: seedData.saleItems,
        skipDuplicates: true,
      });

      await this.prisma.discount.createMany({
        data: seedData.discounts,
        skipDuplicates: true,
      });

      await this.prisma.supplier.createMany({
        data: seedData.suppliers,
        skipDuplicates: true,
      });

      await this.prisma.order.createMany({
        data: seedData.orders,
        skipDuplicates: true,
      });
      await this.prisma.orderProduct.createMany({
        data: seedData.orderProducts,
        skipDuplicates: true,
      });
      await this.prisma.notification.createMany({
        data: seedData.notifications,
        skipDuplicates: true,
      });
      
    } catch (error) {
      console.error('Seeding failed:', error);
    }
  }
}
