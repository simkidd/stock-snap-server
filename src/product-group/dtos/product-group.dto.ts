import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProductGroupInput {
  @ApiProperty({ example: 'product group Name' })
  @IsString()
  name: string;
}

export class UpdateProductGroupInput extends CreateProductGroupInput {
  @ApiProperty({ example: 'product group id' })
  @IsString()
  id: string;
}
