import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Sales, UserRole } from 'src/generated/prisma';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateSaleInput, QuerySalesDto } from './dtos/sales.dto';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Public()
  @ApiOperation({ summary: 'Get all sales records with pagination & filters' })
  @ApiResponse({ status: 200, description: 'Return paginated sales.' })
  @Get()
  getAllSales(
    @CurrentUser() user: any,
    @Query() query: QuerySalesDto,
  ) {
    const tenantId = user?.tenantId;
    return this.salesService.getAllSales(tenantId, query);
  }

  @Public()
  @ApiOperation({
    summary: 'Get sales transaction ledger summary metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'KPI metrics for sales ledger.',
  })
  @Get('stats')
  getSalesStats(@CurrentUser() user: any) {
    return this.salesService.getSalesStats(user?.tenantId, user?.storeId);
  }

  @Public()
  @ApiOperation({
    summary: 'Get complete dashboard overview statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview metrics.',
  })
  @Get('dashboard/overview')
  getDashboardOverview(@CurrentUser() user: any) {
    return this.salesService.getDashboardOverview(user?.tenantId, user?.storeId);
  }

  @Public()
  @ApiOperation({
    summary: 'Get revenue analytics reports with period filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales analytics reports.',
  })
  @Get('analytics/reports')
  getSalesReports(
    @CurrentUser() user: any,
    @Query('period') period?: 'today' | 'week' | 'month',
  ) {
    return this.salesService.getSalesReports(user?.tenantId, user?.storeId, period || 'week');
  }

  @Public()
  @ApiOperation({
    summary: 'Get today summary of sales (Cash, Card, Transfer, Revenue in ₦)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily sales metrics for dashboard.',
  })
  @Get('dashboard/summary')
  getSalesSummary(@CurrentUser() user: any) {
    const tenantId = user?.tenantId;
    const storeId = user?.storeId;
    return this.salesService.getSalesSummary(tenantId, storeId);
  }

  @Public()
  @ApiOperation({
    summary: 'Get a sale by invoice number (e.g. for receipt reprint)',
  })
  @ApiResponse({ status: 200, description: 'Return a Sale by invoice number.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  @Get('invoice/:invoiceNo')
  async getSaleByInvoiceNo(@Param('invoiceNo') invoiceNo: string) {
    return this.salesService.getSaleByInvoiceNo(invoiceNo);
  }

  @Public()
  @ApiOperation({ summary: 'Get a single Sale by id' })
  @ApiResponse({ status: 200, description: 'Return a Sale by id.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  @Get('/:id')
  getSaleById(@Param('id') id: string): Promise<Sales> {
    return this.salesService.getSaleById(id);
  }

  @ApiBearerAuth('Authorization')
  @Roles(
    UserRole.ADMIN,
    UserRole.STORE_MANAGER,
    UserRole.CASHIER,
    UserRole.SALES_REP,
  )
  @ApiOperation({
    summary: 'Process POS Sale with Cash change calculation or Split Payments',
  })
  @ApiResponse({
    status: 201,
    description:
      'The Sale has been successfully processed and stock decremented.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or insufficient stock.',
  })
  @Post('/create')
  createSale(@Body() input: CreateSaleInput, @CurrentUser() user: any) {
    return this.salesService.createSale(
      input,
      user?.id,
      user?.tenantId,
      user?.storeId,
    );
  }
}
