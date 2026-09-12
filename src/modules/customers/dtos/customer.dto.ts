import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCustomerInput {
  @ApiProperty({
    example: 'Chief Emeka Okoye',
    description: 'Customer Full Name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '08035551234',
    description: 'Phone number (unique customer lookup key)',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'emeka.okoye@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Old GRA, Port Harcourt' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Maximum allowed credit/debt limit in ₦',
  })
  @IsOptional()
  @IsNumber()
  debtLimit?: number;
}

export class UpdateCustomerInput extends CreateCustomerInput {
  @ApiProperty({ example: 'cust_cuid' })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class AdjustCreditOrDebtInput {
  @ApiProperty({ example: 'cust_cuid' })
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @ApiProperty({ example: 5000, description: 'Amount to adjust/repay in ₦' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'REPAY_DEBT',
    enum: ['REPAY_DEBT', 'ADD_STORE_CREDIT', 'DEDUCT_STORE_CREDIT'],
  })
  @IsNotEmpty()
  @IsString()
  action: 'REPAY_DEBT' | 'ADD_STORE_CREDIT' | 'DEDUCT_STORE_CREDIT';

  @ApiPropertyOptional({ example: 'Cash repayment of book debt' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class QueryCustomerDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search name, phone number, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter only customers with active debt' })
  @IsOptional()
  hasDebt?: boolean;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
