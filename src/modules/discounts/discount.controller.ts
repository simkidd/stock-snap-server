import { Body, Controller, Get, Post } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { Discount } from 'src/generated/prisma';
import { CreateDiscountInput } from './dtos/discount.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
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
  getDiscounts(@CurrentUser() user: any): Promise<Discount[]> {
    return this.discountService.getDiscounts(user?.tenantId);
  }

  // get discount stats
  @Public()
  @ApiOperation({ summary: 'Get discount campaign KPI metrics' })
  @ApiResponse({ status: 200, description: 'Return discount statistics' })
  @Get('stats')
  getDiscountStats(@CurrentUser() user: any) {
    return this.discountService.getDiscountStats(user?.tenantId);
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
