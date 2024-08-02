import { IsDecimal, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProductInput {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  expiryDate?: Date;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  tags?: string[];

  @IsString()
  brand: string;

  @IsString()
  description: string;

  @IsDecimal()
  price: number;

  @IsInt()
  quantity: number;

  @IsInt()
  quantitySold: number;

  @IsInt()
  minimumQuantity: number;

  @IsString()
  productCategoryId: string;

  @IsString()
  addedById: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class UpdateProductInput extends CreateProductInput {}
