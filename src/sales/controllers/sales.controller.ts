import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { Sales, User, UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateSaleInput } from '../dtos/sales.dto';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Get all Sales
  @Public()
  @ApiOperation({ summary: 'Get all Sales' })
  @ApiResponse({ status: 200, description: 'Return all Sales.' })
  @Get()
  getAllSales(): Promise<Sales[]> {
    return this.salesService.getAllSales();
  }

  // Get a single Sale by ID
  @Public()
  @ApiOperation({ summary: 'Get a Sale by id' })
  @ApiResponse({ status: 200, description: 'Return a Sale by id.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  @Get('/:id')
  getSaleById(@Param('id') id: string): Promise<Sales> {
    return this.salesService.getSaleById(id);
  }

  // Get a single Sale by Invoice Number
  @Public()
  @ApiOperation({ summary: 'Get a Sale by invoice number' })
  @ApiResponse({ status: 200, description: 'Return a Sale by invoice number.' })
  @ApiResponse({ status: 404, description: 'Sale not found.' })
  @Get('invoice/:invoiceNo')
  async getSaleByInvoiceNo(@Param('invoiceNo') invoiceNo: string) {
    return this.salesService.getSaleByInvoiceNo(invoiceNo);
  }

  // Create a new Sale
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @ApiOperation({ summary: 'Create a new Sale' })
  @ApiResponse({
    status: 201,
    description: 'The Sale has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post('/create')
  createSale(@Body() input: CreateSaleInput, @Req() req: Request) {
    const user = req['user'] as User;
    return this.salesService.createSale(input, user.id);
  }
}
