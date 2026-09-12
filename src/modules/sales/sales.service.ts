import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
  Prisma,
  ProductStatusEnum,
  Sales,
  StockMovementType,
} from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateInvoiceNo } from 'src/utils/helpers';
import {
  buildPaginationMeta,
  calculatePagination,
} from 'src/common/utils/paginate.util';
import { CreateSaleInput, QuerySalesDto } from './dtos/sales.dto';

const { Decimal } = Prisma;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSales(tenantId?: string, query?: QuerySalesDto) {
    const { page, limit, skip } = calculatePagination(query);

    const where: Prisma.SalesWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(query?.cashierId ? { cashierId: query.cashierId } : {}),
      ...(query?.customerId ? { customerId: query.customerId } : {}),
      ...(query?.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
      ...(query?.startDate || query?.endDate
        ? {
            createdAt: {
              ...(query?.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query?.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
      ...(query?.search
        ? {
            OR: [
              { invoiceNo: { contains: query.search, mode: 'insensitive' } },
              { posNumber: { contains: query.search, mode: 'insensitive' } },
              { note: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.sales.count({ where }),
      this.prisma.sales.findMany({
        where,
        include: {
          saleItems: {
            include: { product: true },
          },
          cashier: {
            select: { id: true, name: true, email: true },
          },
          customer: true,
          discount: true,
          paymentTransactions: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: query?.sortOrder === 'asc' ? 'asc' : 'desc' },
      }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getSaleById(id: string): Promise<Sales> {
    const sale = await this.prisma.sales.findUnique({
      where: { id },
      include: {
        saleItems: {
          include: { product: true },
        },
        cashier: {
          select: { id: true, name: true, email: true },
        },
        customer: true,
        discount: true,
        paymentTransactions: true,
        store: true,
        tenant: true,
      },
    });
    if (!sale) {
      throw new NotFoundException('Sale record not found');
    }
    return sale;
  }

  async getSaleByInvoiceNo(invoiceNo: string): Promise<Sales> {
    const sale = await this.prisma.sales.findUnique({
      where: { invoiceNo },
      include: {
        saleItems: {
          include: { product: true },
        },
        cashier: {
          select: { id: true, name: true, email: true },
        },
        customer: true,
        discount: true,
        paymentTransactions: true,
        store: true,
        tenant: true,
      },
    });
    if (!sale) {
      throw new NotFoundException(`Invoice #${invoiceNo} not found`);
    }
    return sale;
  }

  /**
   * High-speed atomic POS checkout with split payments, change calculation, and stock decrement
   */
  async createSale(
    input: CreateSaleInput,
    userId: string,
    tenantId?: string,
    storeId?: string,
  ): Promise<Sales> {
    // 1. Resolve user, tenant, and store
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Cashier account not found');

    const resolvedTenantId =
      tenantId || user.tenantId || (await this.prisma.tenant.findFirst())?.id;
    if (!resolvedTenantId)
      throw new BadRequestException('Tenant not identified');

    const resolvedStoreId =
      storeId ||
      user.storeId ||
      (
        await this.prisma.store.findFirst({
          where: { tenantId: resolvedTenantId },
        })
      )?.id;

    // 2. Process checkout within atomic database transaction
    return this.prisma.$transaction(async (tx) => {
      let subTotalAmount = new Decimal(0);
      let taxAmount = new Decimal(0);
      let totalQuantity = 0;
      const saleItemsToCreate = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
          );
        }

        const unitPrice =
          item.unitPrice !== undefined
            ? new Decimal(item.unitPrice)
            : new Decimal(product.price);
        const itemTotal = unitPrice.mul(item.quantity);
        subTotalAmount = subTotalAmount.add(itemTotal);
        totalQuantity += item.quantity;

        // Calculate 7.5% Nigerian VAT on non-exempt products
        if (!product.isTaxExempt) {
          const itemTax = itemTotal.mul(0.075);
          taxAmount = taxAmount.add(itemTax);
        }

        saleItemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          costPrice: product.costPrice,
          totalAmount: itemTotal,
          description: product.name,
        });

        // Decrement product inventory
        const newQuantity = product.quantity - item.quantity;
        let newStatus: ProductStatusEnum = ProductStatusEnum.AVAILABLE;
        if (newQuantity === 0) {
          newStatus = ProductStatusEnum.OUT;
        } else if (newQuantity <= product.minimumQuantity) {
          newStatus = ProductStatusEnum.LOW;
        }

        await tx.product.update({
          where: { id: product.id },
          data: {
            quantity: newQuantity,
            status: newStatus,
          },
        });

        // Record stock movement audit log
        await tx.stockMovement.create({
          data: {
            tenantId: resolvedTenantId,
            storeId: resolvedStoreId,
            productId: product.id,
            userId: user.id,
            type: StockMovementType.SALE,
            quantityChange: -item.quantity,
            reason: `Sold via POS checkout`,
          },
        });
      }

      // 3. Discount calculation
      let discountAmount = new Decimal(0);
      let discountId: string | null = null;
      if (input.discountCode) {
        const discount = await tx.discount.findFirst({
          where: {
            code: input.discountCode.toUpperCase(),
            tenantId: resolvedTenantId,
          },
        });
        if (discount) {
          const now = new Date();
          if (now >= discount.startDate && now <= discount.endDate) {
            discountAmount = subTotalAmount.mul(discount.percentage).div(100);
            discountId = discount.id;
          }
        }
      }

      // Final Net Total in Naira (₦)
      const totalAmount = subTotalAmount.add(taxAmount).sub(discountAmount);

      // 4. Cash Tendered & Change Due Calculation
      let amountTenderedDecimal = new Decimal(input.amountTendered || 0);
      let changeDue = new Decimal(0);

      if (input.paymentMethod === PaymentMethodEnum.CASH) {
        if (amountTenderedDecimal.greaterThan(0)) {
          if (amountTenderedDecimal.lessThan(totalAmount)) {
            throw new BadRequestException(
              `Cash tendered (₦${amountTenderedDecimal}) is less than total payable (₦${totalAmount})`,
            );
          }
          changeDue = amountTenderedDecimal.sub(totalAmount);
        } else {
          amountTenderedDecimal = totalAmount;
          changeDue = new Decimal(0);
        }
      }

      // 5. Generate Invoice Number (e.g. INV-2026-XXXX)
      const invoiceNo = generateInvoiceNo();

      // 6. Create Sales Record
      const sale = await tx.sales.create({
        data: {
          invoiceNo,
          tenantId: resolvedTenantId,
          storeId: resolvedStoreId,
          registerSessionId: input.registerSessionId ?? null,
          cashierId: userId,
          customerId: input.customerId ?? null,
          subTotalAmount,
          taxAmount,
          discountAmount,
          totalAmount,
          totalQuantity,
          amountTendered: amountTenderedDecimal,
          changeDue,
          paymentMethod: input.paymentMethod,
          paymentStatus: PaymentStatusEnum.PAID,
          discountId,
          note: input.note,
          posNumber: input.posNumber || 'REG-01',
          saleItems: {
            create: saleItemsToCreate,
          },
        },
      });

      // 7. Record Payment Transactions (Single or Split)
      if (input.payments && input.payments.length > 0) {
        for (const payment of input.payments) {
          await tx.paymentTransaction.create({
            data: {
              tenantId: resolvedTenantId,
              saleId: sale.id,
              paymentMethod: payment.paymentMethod,
              amount: new Decimal(payment.amount),
              bankName: payment.bankName,
              transferReference: payment.transferReference,
              posTerminalName: payment.posTerminalName,
              posRrnNumber: payment.posRrnNumber,
              note: payment.note,
            },
          });
        }
      } else {
        // Create single payment transaction
        await tx.paymentTransaction.create({
          data: {
            tenantId: resolvedTenantId,
            saleId: sale.id,
            paymentMethod: input.paymentMethod,
            amount: totalAmount,
            note: `Full payment via ${input.paymentMethod}`,
          },
        });
      }

      // 8. Handle Customer Store Credit / Debt Ledger
      if (input.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
        });
        if (
          customer &&
          input.paymentMethod === PaymentMethodEnum.STORE_CREDIT
        ) {
          if (new Decimal(customer.storeCreditBalance).lessThan(totalAmount)) {
            throw new BadRequestException(
              `Customer has insufficient store credit balance.`,
            );
          }
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              storeCreditBalance: new Decimal(customer.storeCreditBalance).sub(
                totalAmount,
              ),
            },
          });
        }
      }

      return sale;
    });
  }

  /**
   * Daily & Shift Sales Metrics for Port Harcourt Retail Dashboard
   */
  async getSalesSummary(tenantId?: string, storeId?: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const salesToday = await this.prisma.sales.findMany({
      where: {
        createdAt: { gte: todayStart },
        ...(tenantId ? { tenantId } : {}),
        ...(storeId ? { storeId } : {}),
      },
      include: {
        paymentTransactions: true,
        saleItems: true,
      },
    });

    let totalRevenue = new Decimal(0);
    let totalCash = new Decimal(0);
    let totalCard = new Decimal(0);
    let totalTransfer = new Decimal(0);
    let totalVAT = new Decimal(0);
    let totalItemsSold = 0;

    for (const sale of salesToday) {
      totalRevenue = totalRevenue.add(sale.totalAmount);
      totalVAT = totalVAT.add(sale.taxAmount);
      totalItemsSold += sale.totalQuantity;

      for (const pt of sale.paymentTransactions) {
        if (pt.paymentMethod === PaymentMethodEnum.CASH) {
          totalCash = totalCash.add(pt.amount);
        } else if (pt.paymentMethod === PaymentMethodEnum.POS_CARD) {
          totalCard = totalCard.add(pt.amount);
        } else if (pt.paymentMethod === PaymentMethodEnum.BANK_TRANSFER) {
          totalTransfer = totalTransfer.add(pt.amount);
        }
      }
    }

    // Query live low stock and out of stock products for this store/tenant
    const stockAlerts = await this.prisma.product.findMany({
      where: {
        status: { in: [ProductStatusEnum.LOW, ProductStatusEnum.OUT] },
        ...(tenantId ? { tenantId } : {}),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        quantity: true,
        minimumQuantity: true,
        unit: true,
        status: true,
      },
      orderBy: { quantity: 'asc' },
    });

    const outOfStockCount = stockAlerts.filter(
      (p) => p.status === ProductStatusEnum.OUT,
    ).length;
    const lowStockCount = stockAlerts.filter(
      (p) => p.status === ProductStatusEnum.LOW,
    ).length;

    return {
      todayDate: todayStart.toISOString().split('T')[0],
      totalTransactions: salesToday.length,
      totalRevenue: Number(totalRevenue),
      totalCash: Number(totalCash),
      totalCard: Number(totalCard),
      totalTransfer: Number(totalTransfer),
      totalVAT: Number(totalVAT),
      totalItemsSold,
      currency: 'NGN',
      alerts: {
        totalAlerts: stockAlerts.length,
        outOfStockCount,
        lowStockCount,
        itemsNeedingReorder: stockAlerts,
      },
    };
  }
}
