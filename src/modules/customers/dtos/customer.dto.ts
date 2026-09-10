import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerInput {
  @ApiProperty({ example: 'Chief Emeka Okoye', description: 'Customer Full Name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '08035551234', description: 'Phone number (unique customer lookup key)' })
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

  @ApiPropertyOptional({ example: 50000, description: 'Maximum allowed credit/debt limit in ₦' })
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

  @ApiProperty({ example: 'REPAY_DEBT', enum: ['REPAY_DEBT', 'ADD_STORE_CREDIT', 'DEDUCT_STORE_CREDIT'] })
  @IsNotEmpty()
  @IsString()
  action: 'REPAY_DEBT' | 'ADD_STORE_CREDIT' | 'DEDUCT_STORE_CREDIT';

  @ApiPropertyOptional({ example: 'Cash repayment of book debt' })
  @IsOptional()
  @IsString()
  note?: string;
}
