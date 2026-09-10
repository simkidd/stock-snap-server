import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Supplier, UserRole } from 'src/generated/prisma';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateSupplierInput, UpdateSupplierInput } from './dtos/supplier.dto';

@ApiTags('supplier')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Public()
  @ApiOperation({ summary: 'Get all Suppliers' })
  @Get()
  getAllSuppliers(): Promise<Supplier[]> {
    return this.supplierService.getAllSuppliers();
  }

  @Public()
  @ApiOperation({ summary: 'Get a Supplier by id' })
  @ApiResponse({ status: 200, description: 'Return a Supplier by id.' })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  @Get('/:id')
  getSupplierById(@Param('id') id: string): Promise<Supplier> {
    return this.supplierService.getSupplierById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Create a new Supplier' })
  @ApiResponse({
    status: 201,
    description: 'The Supplier has been successfully created.',
  })
  @Post('/create')
  create(@Body() input: CreateSupplierInput) {
    return this.supplierService.createSupplier(input);
  }

  @ApiOperation({ summary: 'Update an existing Supplier' })
  @ApiResponse({
    status: 200,
    description: 'The Supplier has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  @Put('/update/:id')
  updateSupplier(@Body() input: UpdateSupplierInput) {
    return this.supplierService.updateSupplier(input);
  }

  @ApiOperation({ summary: 'Delete a Supplier' })
  @ApiResponse({
    status: 200,
    description: 'The Supplier has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  @Delete('/delete/:id')
  deleteSupplier(@Param('id') id: string) {
    return this.supplierService.deleteSupplier(id);
  }
}
