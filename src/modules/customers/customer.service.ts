import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Customer, Prisma } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AdjustCreditOrDebtInput,
  CreateCustomerInput,
  UpdateCustomerInput,
} from './dtos/customer.dto';

const { Decimal } = Prisma;

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCustomers(tenantId?: string): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { name: 'asc' },
    });
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /**
   * Fast checkout phone number lookup
   */
  async findByPhoneNumber(
    phoneNumber: string,
    tenantId?: string,
  ): Promise<Customer> {
    const cleanPhone = phoneNumber.trim();
    const customer = await this.prisma.customer.findFirst({
      where: {
        phoneNumber: cleanPhone,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!customer)
      throw new NotFoundException(
        `No customer found with phone "${phoneNumber}"`,
      );
    return customer;
  }

  async createCustomer(
    input: CreateCustomerInput,
    tenantId?: string,
  ): Promise<Customer> {
    const resolvedTenantId =
      tenantId || (await this.prisma.tenant.findFirst())?.id;
    if (!resolvedTenantId) throw new BadRequestException('Tenant not found');

    const cleanPhone = input.phoneNumber.trim();
    const existing = await this.prisma.customer.findFirst({
      where: { phoneNumber: cleanPhone, tenantId: resolvedTenantId },
    });
    if (existing) {
      throw new ConflictException(
        `Customer with phone "${cleanPhone}" already exists`,
      );
    }

    return this.prisma.customer.create({
      data: {
        ...input,
        phoneNumber: cleanPhone,
        tenantId: resolvedTenantId,
        debtLimit: input.debtLimit
          ? new Decimal(input.debtLimit)
          : new Decimal(0),
      },
    });
  }

  async updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.id },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.customer.update({
      where: { id: input.id },
      data: {
        name: input.name,
        phoneNumber: input.phoneNumber.trim(),
        email: input.email,
        address: input.address,
        debtLimit: input.debtLimit
          ? new Decimal(input.debtLimit)
          : customer.debtLimit,
      },
    });
  }

  /**
   * Adjust debt repayment or store credit
   */
  async adjustBalance(input: AdjustCreditOrDebtInput): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const amountDecimal = new Decimal(input.amount);
    let newDebt = new Decimal(customer.totalDebt);
    let newCredit = new Decimal(customer.storeCreditBalance);

    if (input.action === 'REPAY_DEBT') {
      newDebt = newDebt.sub(amountDecimal);
      if (newDebt.isNegative()) newDebt = new Decimal(0);
    } else if (input.action === 'ADD_STORE_CREDIT') {
      newCredit = newCredit.add(amountDecimal);
    } else if (input.action === 'DEDUCT_STORE_CREDIT') {
      if (newCredit.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient store credit');
      }
      newCredit = newCredit.sub(amountDecimal);
    }

    return this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalDebt: newDebt,
        storeCreditBalance: newCredit,
      },
    });
  }
}
