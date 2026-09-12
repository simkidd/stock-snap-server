import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDiscountInput } from './dtos/discount.dto';
import { Discount } from 'src/generated/prisma';
import { generateRandomCode } from 'src/utils/helpers';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async getDiscounts(tenantId?: string): Promise<Discount[]> {
    return this.prisma.discount.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDiscount(
    input: CreateDiscountInput,
    tenantId?: string,
  ): Promise<Discount> {
    if (input.startDate >= input.endDate) {
      throw new BadRequestException('End date must be after start date.');
    }

    const resolvedTenantId =
      tenantId || (await this.prisma.tenant.findFirst())?.id;
    const discountCode = await this.generateUniqueCode(resolvedTenantId);

    return this.prisma.discount.create({
      data: {
        ...input,
        tenantId: resolvedTenantId,
        code: discountCode,
      },
    });
  }

  private async generateUniqueCode(tenantId?: string): Promise<string> {
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = generateRandomCode().toUpperCase();

      const existingDiscount = await this.prisma.discount.findFirst({
        where: { code, ...(tenantId ? { tenantId } : {}) },
      });

      if (!existingDiscount) {
        isUnique = true;
      }
    }

    return code;
  }

  /**
   * Get Discount & Promo Campaigns KPI Summary Metrics
   */
  async getDiscountStats(tenantId?: string) {
    const now = new Date();
    const where = tenantId ? { tenantId } : {};

    const discounts = await this.prisma.discount.findMany({
      where,
      select: {
        percentage: true,
        startDate: true,
        endDate: true,
      },
    });

    let activeDiscounts = 0;
    let totalPercentage = 0;

    for (const d of discounts) {
      totalPercentage += Number(d.percentage || 0);
      if (d.startDate <= now && d.endDate >= now) {
        activeDiscounts++;
      }
    }

    const avgDiscountPercentage =
      discounts.length > 0 ? totalPercentage / discounts.length : 0;

    return {
      totalDiscounts: discounts.length,
      activeDiscounts,
      avgDiscountPercentage,
    };
  }
}
