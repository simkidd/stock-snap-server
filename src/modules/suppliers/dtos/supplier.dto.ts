import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateSupplierInput {
  @ApiProperty({ example: 'Supplier Name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Supplier phone number' })
  @IsString()
  contactPhone: string;

  @ApiProperty({ example: 'Supplier contact address' })
  @IsString()
  contactAddress: string;
}

export class UpdateSupplierInput extends CreateSupplierInput {
  @ApiProperty({ example: 'supplier-id' })
  @IsString()
  id: string;
}
