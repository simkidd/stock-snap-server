import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSaleInput {
  @IsString()
  @IsNotEmpty()
  productId: string;

  // @IsString()
  // @IsNotEmpty()
  // invoiceNo: string;

  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  discountId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  posNumber?: string;
}
