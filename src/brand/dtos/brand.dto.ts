import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBrandInput {
  @ApiProperty({ example: 'Brand Name' })
  @IsString()
  name: string;
}

export class UpdateBrandInput extends CreateBrandInput {
  @ApiProperty({ example: 'brand-id' })
  @IsString()
  id: string;
}
