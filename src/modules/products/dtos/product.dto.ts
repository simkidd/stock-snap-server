import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductInput {
  @ApiProperty({ example: 'SKU-GM-1KG' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    example: '8901030382910',
    description: 'Barcode for USB/Bluetooth laser scanner',
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'Golden Morn Cereal 1kg' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '1kg', required: false })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ example: 'Yellow', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ example: 'Pack', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Pieces per carton/pack (break-bulk)',
  })
  @IsOptional()
  @IsInt()
  piecesPerPack?: number;

  @ApiPropertyOptional({ type: [String], example: ['breakfast', 'cereal'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'brand-id' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    example: 'Nestle Golden Morn Maize & Soya Protein 1kg',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 3800,
    description: 'Cost price in Naira (₦)',
  })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiProperty({ example: 4500, description: 'Selling price in Naira (₦)' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  quantity: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  minimumQuantity: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Is item exempt from 7.5% VAT (e.g. drugs/raw food)',
  })
  @IsOptional()
  @IsBoolean()
  isTaxExempt?: boolean;

  @ApiProperty({
    example: 'category-id',
    description: 'Category or Sub-Category ID',
  })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'category-id',
    description: 'Legacy alias for categoryId',
  })
  @IsOptional()
  @IsString()
  productCategoryId?: string;

  @ApiPropertyOptional({ example: 'supplier-id', required: false })
  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class UpdateProductInput extends CreateProductInput {
  @ApiProperty({ example: 'product-id' })
  @IsString()
  id: string;
}

export class BarcodeSearchInput {
  @ApiProperty({ example: '8901030382910' })
  @IsString()
  barcode: string;
}

export class QueryProductDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search name, barcode, sku, or tag' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by product status' })
  @IsOptional()
  @IsString()
  status?: any;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
