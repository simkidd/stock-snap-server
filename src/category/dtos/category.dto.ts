import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryInput {
  @ApiProperty({ example: 'Category Name' })
  @IsString()
  name: string;
}

export class UpdateCategoryInput extends CreateCategoryInput {
  @ApiProperty({ example: 'category-id' })
  @IsString()
  id: string;
}
