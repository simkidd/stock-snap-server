import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { CustomerService } from './customer.service';
import { AdjustCreditOrDebtInput, CreateCustomerInput, UpdateCustomerInput } from './dtos/customer.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Public()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Return all customers.' })
  @Get()
  getAllCustomers(@Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.customerService.getAllCustomers(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Find customer by phone number (POS checkout lookup)' })
  @ApiResponse({ status: 200, description: 'Customer details returned.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @Get('phone/:phoneNumber')
  findByPhoneNumber(@Param('phoneNumber') phoneNumber: string, @Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.customerService.findByPhoneNumber(phoneNumber, tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer details returned.' })
  @Get(':id')
  getCustomerById(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }

  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully.' })
  @Post()
  createCustomer(@Body() input: CreateCustomerInput, @Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.customerService.createCustomer(input, tenantId);
  }

  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully.' })
  @Patch()
  updateCustomer(@Body() input: UpdateCustomerInput) {
    return this.customerService.updateCustomer(input);
  }

  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Repay debt or adjust store credit balance' })
  @ApiResponse({ status: 200, description: 'Balance adjusted.' })
  @Post('adjust-balance')
  adjustBalance(@Body() input: AdjustCreditOrDebtInput) {
    return this.customerService.adjustBalance(input);
  }
}
