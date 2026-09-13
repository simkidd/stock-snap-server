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
            include: { product: true, variant: true },
          },
          cashier: {
            select: { id: true, firstName: true, middleName: true, lastName: true, email: true },
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
          include: { product: true, variant: true },
        },
        cashier: {
          select: { id: true, firstName: true, middleName: true, lastName: true, email: true },
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
          include: { product: true, variant: true },
        },
        cashier: {
          select: { id: true, firstName: true, middleName: true, lastName: true, email: true },
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

    // 2. Process checkout within atomic database transaction with extended timeout (30s)
    return this.prisma.$transaction(
      async (tx) => {
        let subTotalAmount = new Decimal(0);
        let taxAmount = new Decimal(0);
        let totalQuantity = 0;
        const saleItemsToCreate = [];
        const stockMovementsToCreate = [];
        const productUpdates = [];
        const variantUpdates = [];

        // Batch fetch all required products and variants in parallel
        const productIds = input.items.map((i) => i.productId);
        const variantIds = input.items
          .map((i) => i.variantId)
          .filter(Boolean) as string[];

        const [products, variants] = await Promise.all([
          tx.product.findMany({
            where: { id: { in: productIds } },
          }),
          variantIds.length > 0
            ? tx.productVariant.findMany({
                where: { id: { in: variantIds } },
              })
            : [],
        ]);

        const productMap = new Map<string, (typeof products)[number]>();
        for (const p of products) {
          productMap.set(p.id, p);
        }
        const variantMap = new Map<string, (typeof variants)[number]>();
        for (const v of variants) {
          variantMap.set(v.id, v);
        }

        for (const item of input.items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new NotFoundException(
              `Product with ID ${item.productId} not found`,
            );
          }

          let unitPrice: Prisma.Decimal;
          let costPrice = product.costPrice;
          let description = product.name;

          if (item.variantId) {
            const variant = variantMap.get(item.variantId);
            if (!variant) {
              throw new NotFoundException(
                `Product variant with ID ${item.variantId} not found`,
              );
            }

            if (variant.quantity < item.quantity) {
              throw new BadRequestException(
                `Insufficient stock for "${product.name} (${variant.name})". Available: ${variant.quantity}, Requested: ${item.quantity}`,
              );
            }

            unitPrice =
              item.unitPrice !== undefined
                ? new Decimal(item.unitPrice)
                : new Decimal(variant.price);
            costPrice = variant.costPrice;
            description = `${product.name} - ${variant.name}`;

            // Decrement variant stock
            const newVariantQty = variant.quantity - item.quantity;
            variantUpdates.push(
              tx.productVariant.update({
                where: { id: variant.id },
                data: { quantity: newVariantQty },
              }),
            );
          } else {
            if (product.quantity < item.quantity) {
              throw new BadRequestException(
                `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
              );
            }

            unitPrice =
              item.unitPrice !== undefined
                ? new Decimal(item.unitPrice)
                : new Decimal(product.price);
          }

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
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitPrice,
            costPrice,
            totalAmount: itemTotal,
            description,
          });

          // Decrement parent product inventory
          const newQuantity = Math.max(0, product.quantity - item.quantity);
          let newStatus: ProductStatusEnum = ProductStatusEnum.AVAILABLE;
          if (newQuantity === 0) {
            newStatus = ProductStatusEnum.OUT;
          } else if (newQuantity <= product.minimumQuantity) {
            newStatus = ProductStatusEnum.LOW;
          }

          productUpdates.push(
            tx.product.update({
              where: { id: product.id },
              data: {
                quantity: newQuantity,
                status: newStatus,
              },
            }),
          );

          stockMovementsToCreate.push({
            tenantId: resolvedTenantId,
            storeId: resolvedStoreId,
            productId: product.id,
            variantId: item.variantId || null,
            userId: user.id,
            type: StockMovementType.SALE,
            quantityChange: -item.quantity,
            reason: `Sold via POS checkout`,
          });
        }

        // Execute inventory decrements in parallel
        await Promise.all([...productUpdates, ...variantUpdates]);

        // Record stock movements
        if (stockMovementsToCreate.length > 0) {
          await tx.stockMovement.createMany({
            data: stockMovementsToCreate,
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
          include: {
            saleItems: {
              include: {
                product: true,
                variant: true,
              },
            },
            customer: true,
            store: true,
            tenant: true,
            cashier: true,
            paymentTransactions: true,
          },
        });

        // 7. Record Payment Transactions (Single or Split)
        if (input.payments && input.payments.length > 0) {
          await tx.paymentTransaction.createMany({
            data: input.payments.map((payment) => ({
              tenantId: resolvedTenantId,
              saleId: sale.id,
              paymentMethod: payment.paymentMethod,
              amount: new Decimal(payment.amount),
              bankName: payment.bankName,
              transferReference: payment.transferReference,
              posTerminalName: payment.posTerminalName,
              posRrnNumber: payment.posRrnNumber,
              note: payment.note,
            })),
          });
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
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
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

  /**
   * Overall Sales Transaction Ledger KPI Stats
   */
  async getSalesStats(tenantId?: string, storeId?: string) {
    const where: Prisma.SalesWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(storeId ? { storeId } : {}),
    };

    const [aggregate, cashAggregate] = await Promise.all([
      this.prisma.sales.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.sales.aggregate({
        where: {
          ...where,
          paymentMethod: PaymentMethodEnum.CASH,
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const totalVolume = Number(aggregate._sum.totalAmount || 0);
    const totalTransactions = aggregate._count.id || 0;
    const cashVolume = Number(cashAggregate._sum.totalAmount || 0);
    const digitalVolume = totalVolume - cashVolume;
    const avgOrderValue =
      totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    return {
      totalVolume,
      totalTransactions,
      avgOrderValue,
      cashVolume,
      digitalVolume,
    };
  }

  /**
   * Dashboard Overview Summary KPI metrics
   */
  async getDashboardOverview(tenantId?: string, storeId?: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const salesWhere: Prisma.SalesWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(storeId ? { storeId } : {}),
    };

    const [
      allSalesAggregate,
      todaySalesAggregate,
      products,
      customersAggregate,
      recentSales,
      topSaleItems,
    ] = await Promise.all([
      this.prisma.sales.aggregate({
        where: salesWhere,
        _sum: { totalAmount: true, totalQuantity: true },
        _count: { id: true },
      }),
      this.prisma.sales.aggregate({
        where: {
          ...salesWhere,
          createdAt: { gte: todayStart },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      this.prisma.product.findMany({
        where: {
          ...(tenantId ? { tenantId } : {}),
        },
        select: { quantity: true, minimumQuantity: true },
      }),
      this.prisma.customer.aggregate({
        where: {
          ...(tenantId ? { tenantId } : {}),
        },
        _sum: { totalDebt: true, storeCreditBalance: true },
        _count: { id: true },
      }),
      this.prisma.sales.findMany({
        where: salesWhere,
        take: 100,
        select: { paymentMethod: true, totalAmount: true },
      }),
      this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: salesWhere,
        },
        _sum: {
          quantity: true,
          totalAmount: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 6,
      }),
    ]);

    const topProductIds = topSaleItems.map((i) => i.productId);
    const topProductsInfo =
      topProductIds.length > 0
        ? await this.prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              category: { select: { name: true } },
            },
          })
        : [];

    const topSellingProducts = topSaleItems.map((item) => {
      const p = topProductsInfo.find((prod) => prod.id === item.productId);
      return {
        productId: item.productId,
        name: p?.name || 'Unknown Item',
        sku: p?.sku || '',
        categoryName: p?.category?.name || 'General',
        price: Number(p?.price || 0),
        totalQuantity: Number(item._sum.quantity || 0),
        totalRevenue: Number(item._sum.totalAmount || 0),
      };
    });

    const lowStockCount = products.filter(
      (p) => Number(p.quantity) <= Number(p.minimumQuantity || 5),
    ).length;
    const outOfStockCount = products.filter(
      (p) => Number(p.quantity) <= 0,
    ).length;

    const paymentBreakdown: Record<string, number> = {
      CASH: 0,
      POS_CARD: 0,
      BANK_TRANSFER: 0,
      SPLIT: 0,
      STORE_CREDIT: 0,
    };

    for (const sale of recentSales) {
      const method = sale.paymentMethod || 'CASH';
      paymentBreakdown[method] =
        (paymentBreakdown[method] || 0) + Number(sale.totalAmount || 0);
    }

    return {
      totalRevenue: Number(allSalesAggregate._sum.totalAmount || 0),
      todayRevenue: Number(todaySalesAggregate._sum.totalAmount || 0),
      totalItemsSold: Number(allSalesAggregate._sum.totalQuantity || 0),
      totalTransactions: allSalesAggregate._count.id || 0,
      todayTransactions: todaySalesAggregate._count.id || 0,
      lowStockCount,
      outOfStockCount,
      totalCustomerDebt: Number(customersAggregate._sum.totalDebt || 0),
      totalStoreCredit: Number(customersAggregate._sum.storeCreditBalance || 0),
      totalCustomers: customersAggregate._count.id || 0,
      paymentBreakdown,
      topSellingProducts,
    };
  }

  /**
   * Sales & Revenue Analytics Reports breakdown by period
   */
  async getSalesReports(
    tenantId?: string,
    storeId?: string,
    period: 'today' | 'week' | 'month' = 'week',
  ) {
    const now = new Date();
    let startDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(now.getDate() - 30);
    }

    const salesWhere: Prisma.SalesWhereInput = {
      createdAt: { gte: startDate },
      ...(tenantId ? { tenantId } : {}),
      ...(storeId ? { storeId } : {}),
    };

    const sales = await this.prisma.sales.findMany({
      where: salesWhere,
      include: {
        cashier: {
          select: { id: true, firstName: true, middleName: true, lastName: true, email: true },
        },
      },
    });

    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const paymentBreakdown: Record<string, number> = {
      CASH: 0,
      POS_CARD: 0,
      BANK_TRANSFER: 0,
      SPLIT: 0,
      STORE_CREDIT: 0,
    };

    const cashierMap: Record<
      string,
      { cashierId: string; cashierName: string; totalSales: number; transactionCount: number }
    > = {};

    for (const sale of sales) {
      const amount = Number(sale.totalAmount || 0);
      grossSales += amount;
      totalDiscount += Number(sale.discountAmount || 0);
      totalTax += Number(sale.taxAmount || 0);

      const method = sale.paymentMethod || 'CASH';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + amount;

      if (sale.cashier) {
        const cId = sale.cashier.id;
        const cashierFullName = [sale.cashier.firstName, sale.cashier.middleName, sale.cashier.lastName]
          .filter(Boolean)
          .join(' ') || (sale.cashier as any).name || 'Counter Cashier';

        if (!cashierMap[cId]) {
          cashierMap[cId] = {
            cashierId: cId,
            cashierName: cashierFullName,
            totalSales: 0,
            transactionCount: 0,
          };
        }
        cashierMap[cId].totalSales += amount;
        cashierMap[cId].transactionCount += 1;
      }
    }

    const totalTransactions = sales.length;
    const avgOrderValue = totalTransactions > 0 ? grossSales / totalTransactions : 0;

    return {
      period,
      grossSales,
      totalDiscount,
      totalTax,
      avgOrderValue,
      totalTransactions,
      paymentBreakdown,
      cashierBreakdown: Object.values(cashierMap),
    };
  }
}
