import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class OpenShiftInput {
  @ApiProperty({ example: 'reg_cuid', description: 'Register ID' })
  @IsNotEmpty()
  @IsString()
  registerId: string;

  @ApiProperty({
    example: 10000,
    description: 'Starting cash float in drawer in ₦',
  })
  @IsNumber()
  @Min(0)
  openingFloat: number;

  @ApiPropertyOptional({ example: 'Shift started with ₦10k change' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CloseShiftInput {
  @ApiProperty({
    example: 'session_cuid',
    description: 'Active Register Session ID',
  })
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @ApiProperty({
    example: 45000,
    description: 'Physical cash counted at end of shift in ₦',
  })
  @IsNumber()
  @Min(0)
  closingCash: number;

  @ApiPropertyOptional({ example: 'Shift closed without issues' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateRegisterInput {
  @ApiProperty({ example: 'Counter 3', description: 'Register name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'REG-03', description: 'Register unique code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'store_cuid' })
  @IsOptional()
  @IsString()
  storeId?: string;
}
