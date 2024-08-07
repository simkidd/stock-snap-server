import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

class SaleItemInput {
  @ApiProperty({ description: 'ID of the product being sold' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity of the product being sold' })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiProperty({ description: 'Unit price of the product' })
  @IsNotEmpty()
  @IsString()
  unitPrice: string; // Using string to accommodate Decimal type conversion

  @ApiProperty({ description: 'Total amount for this sale item' })
  @IsNotEmpty()
  @IsString()
  totalAmount: string; // Using string to accommodate Decimal type conversion

  @ApiProperty({ description: 'Description of the product' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSaleInput {
  @ApiProperty({ description: 'List of items in the sale' })
  @IsNotEmpty()
  @IsArray()
  items: SaleItemInput[];

  @ApiProperty({ description: 'Payment method used for the sale' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'ID of the discount applied to the sale, if any',
  })
  @IsOptional()
  @IsString()
  discountId?: string;

  @ApiProperty({ description: 'Additional notes for the sale' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ description: 'Point of Sale number where the sale was made' })
  @IsOptional()
  @IsString()
  posNumber?: string;
}
