import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodEnum } from 'src/generated/prisma';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemInput {
  @ApiProperty({
    description: 'ID of the product being sold',
    example: 'prod_cuid',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product being sold',
    example: 2,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Unit price override (optional)',
    example: 4500,
  })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Description or notes for item' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class PaymentTransactionInput {
  @ApiProperty({ enum: PaymentMethodEnum, example: PaymentMethodEnum.CASH })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ example: 10000, description: 'Amount paid via this tender' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: 'GTBank / OPay',
    description: 'Bank name for Bank Transfer',
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    example: 'SESSION-92830192',
    description: 'Session ID or Transfer Ref',
  })
  @IsOptional()
  @IsString()
  transferReference?: string;

  @ApiPropertyOptional({
    example: 'Moniepoint POS 1',
    description: 'POS Terminal Name',
  })
  @IsOptional()
  @IsString()
  posTerminalName?: string;

  @ApiPropertyOptional({
    example: '000982341',
    description: 'RRN Number from POS receipt',
  })
  @IsOptional()
  @IsString()
  posRrnNumber?: string;

  @ApiPropertyOptional({ description: 'Note for this payment' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateSaleInput {
  @ApiProperty({
    type: [SaleItemInput],
    description: 'List of items in the sale',
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  items: SaleItemInput[];

  @ApiProperty({
    enum: PaymentMethodEnum,
    example: PaymentMethodEnum.CASH,
    description: 'Primary payment method or SPLIT',
  })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Total Cash tendered by customer',
  })
  @IsOptional()
  @IsNumber()
  amountTendered?: number;

  @ApiPropertyOptional({
    type: [PaymentTransactionInput],
    description:
      'Split payment details (when paying via multiple methods like Cash + Transfer)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentTransactionInput)
  payments?: PaymentTransactionInput[];

  @ApiPropertyOptional({
    example: 'cust_cuid',
    description: 'Customer ID for loyalty/debt',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    example: 'session_cuid',
    description: 'Active Cashier Register Shift Session',
  })
  @IsOptional()
  @IsString()
  registerSessionId?: string;

  @ApiPropertyOptional({
    description: 'Discount code (e.g. PROMO10)',
    example: 'PROMO10',
  })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the sale' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Point of Sale number or desk ID',
    example: 'REG-01',
  })
  @IsOptional()
  @IsString()
  posNumber?: string;
}

export class SaleReceiptResponseDTO {
  sale: any;
  receiptHtml?: string;
  changeDue: number;
}

export class QuerySalesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by invoice number or note' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by cashier user ID' })
  @IsOptional()
  @IsString()
  cashierId?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ enum: PaymentMethodEnum, description: 'Filter by payment method' })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  @ApiPropertyOptional({ description: 'Start date ISO string (e.g. 2026-09-01)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date ISO string (e.g. 2026-09-30)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
