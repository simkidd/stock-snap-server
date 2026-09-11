import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryInput {
  @ApiProperty({
    example: 'Drinks & Beverages',
    description: 'Main Category Name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

export class CreateSubCategoryInput {
  @ApiProperty({
    example: 'Soft Drinks & Sodas',
    description: 'Sub-Category Name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'category_cuid', description: 'Parent Category ID' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;
}

export class UpdateCategoryInput {
  @ApiProperty({ example: 'category_cuid' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ example: 'Updated Category Name' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
