import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsDateString,
  IsDate,
} from 'class-validator';

export class CreateDiscountInput {
  @ApiProperty({
    description: 'The discount percentage (0 to 100)',
    example: 15,
  })
  @IsNumber()
  @Min(0, { message: 'Percentage must be at least 0%' })
  @Max(100, { message: 'Percentage can be at most 100%' })
  percentage: number;

  @ApiProperty({
    description: 'The start date of the discount',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({
    description: 'The end date of the discount',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDate()
  @IsNotEmpty()
  endDate: Date;
}
