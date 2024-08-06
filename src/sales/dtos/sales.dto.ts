import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSaleInput {
  @ApiProperty({ description: 'ID of the product being sold' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantity of the product being sold' })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

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
