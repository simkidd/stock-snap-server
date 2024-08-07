import { Body, Controller, Get, Post } from '@nestjs/common';
import { DiscountService } from '../services/discount.service';
import { Discount } from '@prisma/client';
import { CreateDiscountInput } from '../dtos/discount.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('discount')
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  // get all discounts
  @Public()
  @ApiOperation({ summary: 'Get all discounts' })
  @ApiResponse({ status: 200, description: 'Return all discounts' })
  @Get()
  getDiscounts(): Promise<Discount[]> {
    return this.discountService.getDiscounts();
  }

  // create a new discount
  @ApiOperation({ summary: 'Create a new discount' })
  @ApiResponse({
    status: 201,
    description: 'The discount has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @Post('/create')
  createDiscount(@Body() input: CreateDiscountInput): Promise<Discount> {
    return this.discountService.createDiscount(input);
  }
}
