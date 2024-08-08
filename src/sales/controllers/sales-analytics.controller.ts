import { Controller, Get, Param, Query } from '@nestjs/common';
import { SalesAnalyticsService } from '../services/sales-analytics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('analytics')
@Controller('analytics')
export class SalesAnalyticsController {
  constructor(private readonly salesAnalyticsService: SalesAnalyticsService) {}

  @Public()
  @Get('/total-amount')
  @ApiOperation({ summary: 'Get total sales amount' })
  @ApiResponse({
    status: 200,
    description: 'Total sales amount returned',
    type: String,
    schema: {
      example: '1500.00',
    },
  })
  async getTotalSalesAmount(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.salesAnalyticsService.getTotalSalesAmount(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Public()
  @Get('/total-quantity')
  @ApiOperation({ summary: 'Get total sales quantity' })
  @ApiResponse({
    status: 200,
    description: 'Total sales quantity returned',
    type: Number,
    schema: {
      example: 250,
    },
  })
  getTotalSalesQuantity(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.salesAnalyticsService.getTotalSalesQuantity(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Public()
  @Get('/sales-by-category')
  @ApiOperation({ summary: 'Get sales amount by category' })
  @ApiResponse({
    status: 200,
    description: 'Sales by category returned',
    type: Object,
    schema: {
      example: {
        Electronics: '5000.00',
        Furniture: '3000.00',
      },
    },
  })
  getSalesByCategory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.salesAnalyticsService.getSalesByCategory(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Public()
  @Get('/sales-trends')
  @ApiOperation({ summary: 'Get sales trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Sales trends returned',
    type: Object,
    schema: {
      example: {
        '2024-08-01': '500.00',
        '2024-08-02': '600.00',
      },
    },
  })
  async getSalesTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.salesAnalyticsService.getSalesTrends(
      new Date(startDate),
      new Date(endDate),
      interval,
    );
  }

  @Public()
  @Get('/top-selling-products')
  @ApiOperation({ summary: 'Get top-selling products' })
  @ApiResponse({
    status: 200,
    description: 'Top-selling products returned',
    type: Object,
    schema: {
      example: [
        {
          productId: 'product-1',
          name: 'Product 1',
          totalAmount: '1500.00',
        },
        {
          productId: 'product-2',
          name: 'Product 2',
          totalAmount: '1200.00',
        },
      ],
    },
  })
  async getTopSellingProducts(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.salesAnalyticsService.getTopSellingProducts(
      new Date(startDate),
      new Date(endDate),
      limit,
    );
  }

  @Public()
  @Get('/sales-by-salesperson')
  @ApiOperation({ summary: 'Get sales amount by salesperson' })
  @ApiResponse({
    status: 200,
    description: 'Sales by salesperson returned',
    type: Object,
    schema: {
      example: {
        'salesperson-1': '5000.00',
        'salesperson-2': '3000.00',
      },
    },
  })
  async getSalesBySalesperson(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.salesAnalyticsService.getSalesBySalesperson(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Public()
  @Get('/monthly-sales-overview')
  @ApiOperation({ summary: 'Get monthly sales overview' })
  @ApiResponse({
    status: 200,
    description: 'Monthly sales overview returned',
    type: Object,
    schema: {
      example: {
        '2024-01': '15000.00',
        '2024-02': '20000.00',
      },
    },
  })
  async getMonthlySalesOverview(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.salesAnalyticsService.getMonthlySalesOverview(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
