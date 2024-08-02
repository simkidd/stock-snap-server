import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProductCatInput {
  @ApiProperty({ example: 'product Category Name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Category id' })
  @IsString()
  categoryId: string;
}

export class UpdateProductCatInput extends CreateProductCatInput {
  @ApiProperty({ example: 'prod-category-id' })
  @IsString()
  id: string;
}