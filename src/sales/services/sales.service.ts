import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sales } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleInput } from '../dtos/sales.dto';
import { generateInvoiceNo } from 'src/utils/helpers';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

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
        include: { product: true, cashier: true, discount: true },
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
        include: { product: true, cashier: true, discount: true },
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
      const product = await this.prisma.product.findUnique({
        where: { id: input.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.quantity < input.quantity) {
        throw new BadRequestException('Insufficient product quantity');
      }

      const invoiceNo = generateInvoiceNo();

      // Calculate the total amount
      const unitPrice = new Decimal(product.price);
      const quantitySold = new Decimal(input.quantity);
      let totalAmount = unitPrice.mul(quantitySold);

      // Apply discount if available
      if (input.discountId) {
        const discount = await this.prisma.discount.findUnique({
          where: { id: input.discountId },
        });
        if (discount) {
          const discountPercentage = new Decimal(discount.percentage).div(100);
          const discountAmount = totalAmount.mul(discountPercentage);
          totalAmount = totalAmount.sub(discountAmount);
        }
      }

      // Create the sale record
      const sale = await this.prisma.sales.create({
        data: {
          ...input,
          cashierId: userId,
          totalAmount,
          unitPrice,
          invoiceNo,
        },
      });

      // Update product quantity and quantity sold
      await this.prisma.product.update({
        where: { id: input.productId },
        data: {
          quantity: {
            decrement: input.quantity,
          },
          quantitySold: {
            increment: input.quantity,
          },
        },
      });

      return sale;
    } catch (error) {
      throw error;
    }
  }
}
