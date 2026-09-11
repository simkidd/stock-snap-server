import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

const { Decimal } = Prisma;
type Decimal = Prisma.Decimal;

@Injectable()
export class SalesAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalSalesAmount(startDate: Date, endDate: Date): Promise<Decimal> {
    const sales = await this.prisma.sales.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
      },
    });

    const result = sales.reduce(
      (total, sale) => total.add(sale.totalAmount),
      new Decimal(0),
    );

    return result;
  }

  async getTotalSalesQuantity(startDate: Date, endDate: Date): Promise<number> {
    const sales = await this.prisma.sales.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalQuantity: true,
      },
    });

    const result = sales.reduce((total, sale) => total + sale.totalQuantity, 0);

    return result;
  }

  async getSalesByCategory(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Decimal>> {
    const sales = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        product: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
            price: true,
            quantity: true,
          },
        },
        totalAmount: true,
      },
    });

    const salesByCategory: Record<string, Decimal> = {};

    sales.forEach((item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      if (!salesByCategory[categoryName]) {
        salesByCategory[categoryName] = new Decimal(0);
      }
      salesByCategory[categoryName] = salesByCategory[categoryName].add(
        item.totalAmount,
      );
    });

    return salesByCategory;
  }

  async getSalesTrends(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day',
  ): Promise<Record<string, Decimal>> {
    const sales = await this.prisma.sales.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    const trends: Record<string, Decimal> = {};

    sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      let key: string;

      if (interval === 'day') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      } else if (interval === 'week') {
        const weekNumber = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-W${weekNumber}`;
      } else {
        // 'month'
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      if (!trends[key]) {
        trends[key] = new Decimal(0);
      }

      trends[key] = trends[key].add(sale.totalAmount);
    });

    return trends;
  }

  async getTopSellingProducts(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<Record<string, Decimal>> {
    const sales = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      select: {
        product: {
          select: {
            name: true,
          },
        },
        totalAmount: true,
      },
    });

    const productSales: Record<string, Decimal> = {};

    sales.forEach((item) => {
      const productName = item.product.name;
      if (!productSales[productName]) {
        productSales[productName] = new Decimal(0);
      }
      productSales[productName] = productSales[productName].add(
        item.totalAmount,
      );
    });

    const sortedProducts = Object.entries(productSales)
      .sort((a, b) => b[1].toNumber() - a[1].toNumber())
      .slice(0, limit);

    return Object.fromEntries(sortedProducts);
  }

  async getSalesBySalesperson(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Decimal>> {
    const sales = await this.prisma.sales.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        cashier: {
          select: {
            name: true,
          },
        },
        totalAmount: true,
      },
    });

    const salesBySalesperson: Record<string, Decimal> = {};

    sales.forEach((sale) => {
      const salespersonName = sale.cashier.name;
      if (!salesBySalesperson[salespersonName]) {
        salesBySalesperson[salespersonName] = new Decimal(0);
      }
      salesBySalesperson[salespersonName] = salesBySalesperson[
        salespersonName
      ].add(sale.totalAmount);
    });

    return salesBySalesperson;
  }

  async getMonthlySalesOverview(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Decimal>> {
    return this.getSalesTrends(startDate, endDate, 'month');
  }
}
