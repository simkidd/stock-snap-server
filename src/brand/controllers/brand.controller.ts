import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { BrandService } from '../services/brand.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Brand, UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateBrandInput, UpdateBrandInput } from '../dtos/brand.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('brand')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Public()
  @ApiOperation({ summary: 'Get all brands' })
  @Get()
  getAllBrands(): Promise<Brand[]> {
    return this.brandService.getAllBrands();
  }

  @Public()
  @ApiOperation({ summary: 'Get a brand by id' })
  @ApiResponse({ status: 200, description: 'Return a brand by id.' })
  @ApiResponse({ status: 404, description: 'brand not found.' })
  @Get('/:id')
  getbrandById(@Param('id') id: string): Promise<Brand> {
    return this.brandService.getBrandById(id);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({
    status: 201,
    description: 'The brand has been successfully created.',
  })
  @Post('/create')
  create(@Body() input: CreateBrandInput) {
    return this.brandService.createBrand(input);
  }

  @ApiOperation({ summary: 'Update an existing brand' })
  @ApiResponse({
    status: 200,
    description: 'The brand has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'brand not found.' })
  @Put('/update/:id')
  updatebrand(@Body() input: UpdateBrandInput) {
    return this.brandService.updateBrand(input);
  }

  @ApiOperation({ summary: 'Delete a brand' })
  @ApiResponse({
    status: 200,
    description: 'The brand has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'brand not found.' })
  @Delete('/delete/:id')
  deletebrand(@Param('id') id: string) {
    return this.brandService.deleteBrand(id);
  }
}
