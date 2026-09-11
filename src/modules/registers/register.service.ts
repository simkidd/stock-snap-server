import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentMethodEnum,
  Prisma,
  Register,
  RegisterSession,
  SessionStatusEnum,
} from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CloseShiftInput,
  CreateRegisterInput,
  OpenShiftInput,
} from './dtos/register.dto';

const { Decimal } = Prisma;

@Injectable()
export class RegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllRegisters(tenantId?: string): Promise<Register[]> {
    return this.prisma.register.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        store: true,
        sessions: {
          where: { status: SessionStatusEnum.OPEN },
          include: {
            cashier: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async createRegister(
    input: CreateRegisterInput,
    userId: string,
    tenantId?: string,
  ): Promise<Register> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const resolvedTenantId =
      tenantId || user?.tenantId || (await this.prisma.tenant.findFirst())?.id;
    if (!resolvedTenantId) throw new BadRequestException('Tenant not found');

    const resolvedStoreId =
      input.storeId ||
      user?.storeId ||
      (
        await this.prisma.store.findFirst({
          where: { tenantId: resolvedTenantId },
        })
      )?.id;
    if (!resolvedStoreId) throw new BadRequestException('Store not found');

    return this.prisma.register.create({
      data: {
        tenantId: resolvedTenantId,
        storeId: resolvedStoreId,
        name: input.name,
        code: input.code,
      },
    });
  }

  /**
   * Cashier opens shift with initial opening cash float
   */
  async openShift(
    input: OpenShiftInput,
    cashierId: string,
    tenantId?: string,
  ): Promise<RegisterSession> {
    const register = await this.prisma.register.findUnique({
      where: { id: input.registerId },
    });
    if (!register) throw new NotFoundException('Register not found');

    // Check if there is already an active open shift on this register
    const activeShift = await this.prisma.registerSession.findFirst({
      where: {
        registerId: input.registerId,
        status: SessionStatusEnum.OPEN,
      },
    });
    if (activeShift) {
      throw new BadRequestException(
        'An active shift is already open on this register. Please close it first.',
      );
    }

    const resolvedTenantId = tenantId || register.tenantId;

    return this.prisma.registerSession.create({
      data: {
        tenantId: resolvedTenantId,
        registerId: input.registerId,
        cashierId,
        openingFloat: new Decimal(input.openingFloat),
        status: SessionStatusEnum.OPEN,
        note: input.note,
      },
      include: {
        register: true,
        cashier: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Get active shift for cashier or register
   */
  async getActiveShift(registerId: string) {
    const session = await this.prisma.registerSession.findFirst({
      where: { registerId, status: SessionStatusEnum.OPEN },
      include: {
        cashier: { select: { id: true, name: true } },
        register: true,
        sales: {
          include: { paymentTransactions: true },
        },
      },
    });
    if (!session) return null;

    let totalCashSales = new Decimal(0);
    let totalCardSales = new Decimal(0);
    let totalTransferSales = new Decimal(0);
    let totalRevenue = new Decimal(0);

    for (const sale of session.sales) {
      totalRevenue = totalRevenue.add(sale.totalAmount);
      for (const pt of sale.paymentTransactions) {
        if (pt.paymentMethod === PaymentMethodEnum.CASH) {
          totalCashSales = totalCashSales.add(pt.amount);
        } else if (pt.paymentMethod === PaymentMethodEnum.POS_CARD) {
          totalCardSales = totalCardSales.add(pt.amount);
        } else if (pt.paymentMethod === PaymentMethodEnum.BANK_TRANSFER) {
          totalTransferSales = totalTransferSales.add(pt.amount);
        }
      }
    }

    const expectedCash = new Decimal(session.openingFloat).add(totalCashSales);

    return {
      session,
      metrics: {
        openingFloat: Number(session.openingFloat),
        totalCashSales: Number(totalCashSales),
        totalCardSales: Number(totalCardSales),
        totalTransferSales: Number(totalTransferSales),
        totalRevenue: Number(totalRevenue),
        expectedCashInDrawer: Number(expectedCash),
        salesCount: session.sales.length,
      },
    };
  }

  /**
   * Cashier closes shift / End-of-Day Z-Report with physical cash count & variance
   */
  async closeShift(input: CloseShiftInput): Promise<any> {
    const session = await this.prisma.registerSession.findUnique({
      where: { id: input.sessionId },
      include: {
        sales: {
          include: { paymentTransactions: true },
        },
        cashier: { select: { id: true, name: true } },
        register: true,
      },
    });
    if (!session) throw new NotFoundException('Shift session not found');
    if (session.status === SessionStatusEnum.CLOSED) {
      throw new BadRequestException('This shift session is already closed');
    }

    let totalCashSales = new Decimal(0);
    let totalCardSales = new Decimal(0);
    let totalTransferSales = new Decimal(0);
    let totalRevenue = new Decimal(0);

    for (const sale of session.sales) {
      totalRevenue = totalRevenue.add(sale.totalAmount);
      for (const pt of sale.paymentTransactions) {
        if (pt.paymentMethod === PaymentMethodEnum.CASH) {
          totalCashSales = totalCashSales.add(pt.amount);
        } else if (pt.paymentMethod === PaymentMethodEnum.POS_CARD) {
          totalCardSales = totalCardSales.add(pt.amount);
        } else if (pt.paymentMethod === PaymentMethodEnum.BANK_TRANSFER) {
          totalTransferSales = totalTransferSales.add(pt.amount);
        }
      }
    }

    const openingFloat = new Decimal(session.openingFloat);
    const expectedCash = openingFloat.add(totalCashSales);
    const closingCash = new Decimal(input.closingCash);
    const difference = closingCash.sub(expectedCash); // Positive = Overage, Negative = Shortage

    const updatedSession = await this.prisma.registerSession.update({
      where: { id: session.id },
      data: {
        closingCash,
        expectedCash,
        difference,
        status: SessionStatusEnum.CLOSED,
        closedAt: new Date(),
        note: input.note
          ? `${session.note ? session.note + ' | ' : ''}${input.note}`
          : session.note,
      },
    });

    return {
      zReport: {
        sessionId: session.id,
        register: session.register.name,
        cashier: session.cashier.name,
        openedAt: session.openedAt,
        closedAt: updatedSession.closedAt,
        openingFloat: Number(openingFloat),
        totalCashSales: Number(totalCashSales),
        totalCardSales: Number(totalCardSales),
        totalTransferSales: Number(totalTransferSales),
        totalRevenue: Number(totalRevenue),
        expectedCashInDrawer: Number(expectedCash),
        actualCashCounted: Number(closingCash),
        variance: Number(difference),
        varianceStatus: difference.isZero()
          ? 'BALANCED'
          : difference.isPositive()
            ? 'OVERAGE'
            : 'SHORTAGE',
        currency: 'NGN',
        currencySymbol: '₦',
      },
    };
  }
}
