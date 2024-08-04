import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductGroup } from '@prisma/client';
import {
  CreateProductGroupInput,
  UpdateProductGroupInput,
} from '../dtos/product-group.dto';
import { ProductGroupService } from '../services/product-group.service';

@ApiTags('product group')
@Controller('product-groups')
export class ProductGroupController {
  constructor(private readonly productGroupService: ProductGroupService) {}

  // Create a new product group
  @ApiOperation({ summary: 'Create a new product group' })
  @ApiResponse({
    status: 201,
    description: 'The product group has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post('/create')
  createGroup(@Body() input: CreateProductGroupInput): Promise<ProductGroup> {
    return this.productGroupService.createGroup(input);
  }

  // Get all product groups
  @ApiOperation({ summary: 'Get all product groups' })
  @ApiResponse({
    status: 200,
    description: 'Return all product groups.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Get()
  getAllGroup(): Promise<ProductGroup[]> {
    return this.productGroupService.getAllGroup();
  }

  // Get a single product group by ID
  @ApiOperation({ summary: 'Get a product group by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a product group by ID.',
  })
  @ApiResponse({ status: 404, description: 'Product group not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Get('/:id')
  getGroupById(@Param('id') id: string) {
    return this.productGroupService.getGroupById(id);
  }

  // Update a product group by ID
  @ApiOperation({ summary: 'Update a product group by ID' })
  @ApiResponse({
    status: 200,
    description: 'The product group has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Product group not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Put('/update/:id')
  updateGroup(@Body() input: UpdateProductGroupInput) {
    return this.productGroupService.updateGroup(input);
  }

  // Delete a product group by ID
  @ApiOperation({ summary: 'Delete a product group by ID' })
  @ApiResponse({
    status: 200,
    description: 'The product group has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Product group not found.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Delete('/delete/:id')
  deleteGroup(@Param('id') id: string) {
    return this.productGroupService.deleteGroup(id);
  }
}
