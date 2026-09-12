import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
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
    @Req() req: Request,
    @Query() query: QuerySalesDto,
  ) {
    const tenantId = req['user']?.tenantId;
    return this.salesService.getAllSales(tenantId, query);
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
  getSalesSummary(@Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    const storeId = req['user']?.storeId;
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
  createSale(@Body() input: CreateSaleInput, @Req() req: Request) {
    const user = req['user'];
    return this.salesService.createSale(
      input,
      user.id,
      user?.tenantId,
      user?.storeId,
    );
  }
}
