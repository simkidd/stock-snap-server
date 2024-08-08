import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SalesAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalSalesAmount(startDate: Date, endDate: Date): Promise<Decimal> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async getTotalSalesQuantity(startDate: Date, endDate: Date): Promise<number> {
    try {
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

      const result = sales.reduce(
        (total, sale) => total + sale.totalQuantity,
        0,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getSalesByCategory(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Decimal>> {
    try {
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
              productCategory: {
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
        const categoryName = item.product.productCategory.name;
        if (!salesByCategory[categoryName]) {
          salesByCategory[categoryName] = new Decimal(0);
        }
        salesByCategory[categoryName] = salesByCategory[categoryName].add(
          item.totalAmount,
        );
      });

      return salesByCategory;
    } catch (error) {
      throw error;
    }
  }

  async getSalesTrends(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day',
  ): Promise<Record<string, Decimal>> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async getTopSellingProducts(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<Record<string, Decimal>> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async getSalesBySalesperson(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Decimal>> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async getMonthlySalesOverview(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, Decimal>> {
    try {
      return this.getSalesTrends(startDate, endDate, 'month');
    } catch (error) {
      throw error;
    }
  }
}
