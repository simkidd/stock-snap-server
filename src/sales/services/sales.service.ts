import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatusEnum, Sales } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleInput, SaleItemInput } from '../dtos/sales.dto';
import { generateInvoiceNo } from 'src/utils/helpers';
import { NotificationService } from 'src/notification/services/notification.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllSales(): Promise<Sales[]> {
    try {
      const sales = await this.prisma.sales.findMany();
      return sales;
    } catch (error) {
      throw error;
    }
  }

  async getSaleById(id: string): Promise<Sales> {
    try {
      const sale = await this.prisma.sales.findUnique({
        where: { id },
        include: {
          saleItems: true,
          cashier: {
            select: { id: true, name: true },
          },
          discount: true,
        },
      });
      if (!sale) {
        throw new NotFoundException('sale not found');
      }

      return sale;
    } catch (error) {
      throw error;
    }
  }

  async getSaleByInvoiceNo(invoiceNo: string): Promise<Sales> {
    try {
      const sale = await this.prisma.sales.findUnique({
        where: { invoiceNo },
        include: { saleItems: true, cashier: true, discount: true },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      return sale;
    } catch (error) {
      throw error;
    }
  }

  async createSale(input: CreateSaleInput, userId: string): Promise<Sales> {
    try {
      const saleItemsData = [];
      let grossTotal = new Decimal(0);
      let totalQuantity = 0;

      for (const item of input.items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient quantity for product: ${product.name}`,
          );
        }

        const unitPrice = new Decimal(product.price);
        const totalAmount = unitPrice.mul(item.quantity);
        grossTotal = grossTotal.add(totalAmount);
        totalQuantity += item.quantity;

        saleItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalAmount,
          description: product.description,
        });

        // Update product quantity and quantitySold
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            quantitySold: {
              increment: item.quantity,
            },
            status: await this.getUpdatedProductStatus(item.productId),
          },
        });
      }

      // Apply discount if available
      let discountAmount = new Decimal(0);
      let discountId = null;
      if (input.discountCode) {
        const discount = await this.prisma.discount.findUnique({
          where: { code: input.discountCode },
        });
        if (!discount) {
          throw new NotFoundException('Discount not found');
        }

        const now = new Date();
        if (now < discount.startDate) {
          throw new BadRequestException(
            `Discount cannot be applied yet. It starts on ${discount.startDate.toLocaleDateString()}.`,
          );
        }
        if (now > discount.endDate) {
          throw new BadRequestException(
            `Discount has expired. It was valid until ${discount.endDate.toLocaleDateString()}.`,
          );
        }

        const discountPercentage = new Decimal(discount.percentage).div(100);
        discountAmount = grossTotal.mul(discountPercentage);
        grossTotal = grossTotal.sub(discountAmount);
        discountId = discount.id;
      }

      // Create the sale record
      const sale = await this.prisma.sales.create({
        data: {
          invoiceNo: generateInvoiceNo(),
          totalAmount: grossTotal,
          grossTotal: grossTotal.add(discountAmount),
          cashierId: userId,
          discountId,
          paymentMethod: input.paymentMethod,
          totalQuantity,
          saleItems: {
            create: saleItemsData,
          },
        },
      });

      return sale;
    } catch (error) {
      throw error;
    }
  }

  private async getUpdatedProductStatus(
    productId: string,
  ): Promise<ProductStatusEnum> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (product.quantity === 0) {
      await this.notificationService.createNotification(
        `Product ${product.name} is out of stock.`,
        product.id,
      );
      return 'OUT';
    } else if (product.quantity < product.minimumQuantity) {
      await this.notificationService.createNotification(
        `Product ${product.name} is running low on stock.`,
        product.id,
      );
      return 'LOW';
    }
    return 'AVAILABLE';
  }
}
