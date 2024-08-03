import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductInput {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Product Name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Large', required: false })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ example: 'Red', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiryDate?: Date;

  @ApiProperty({ example: 'Pack', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ type: [String], example: ['tag1', 'tag2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'brand-id' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty({ example: 'Product description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 99.99 })
  @IsDecimal()
  price: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  quantity: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  minimumQuantity: number;

  @ApiProperty({ example: 'category-id' })
  @IsString()
  productCategoryId: string;

  @ApiProperty({ example: 'supplier-id', required: false })
  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class UpdateProductInput extends CreateProductInput {
  @ApiProperty({ example: 'product-id' })
  @IsString()
  id: string;
}
