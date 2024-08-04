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
import { ProductCategoryService } from '../services/product-category.service';
import {
  CreateProductCatInput,
  UpdateProductCatInput,
} from '../dtos/product-category.dto';
import { Category, ProductCategory } from '@prisma/client';

@ApiTags('product category')
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  getAllCategories(): Promise<ProductCategory[]> {
    return this.categoryService.getAllProductCategories();
  }

  @ApiOperation({ summary: 'Get a category by id' })
  @ApiResponse({ status: 200, description: 'Return a category by id.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @Get('/:id')
  getCategoryById(@Param('id') id: string): Promise<ProductCategory> {
    return this.categoryService.getProductCategoryById(id);
  }

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
  })
  @Post('/create')
  create(@Body() input: CreateProductCatInput) {
    return this.categoryService.createProductCategory(input);
  }

  @ApiOperation({ summary: 'Update an existing category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'category not found.' })
  @Put('/update/:id')
  updateCategory(@Body() input: UpdateProductCatInput) {
    return this.categoryService.updateProductCategory(input);
  }

  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'category not found.' })
  @Delete('/delete/:id')
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteProductCategory(id);
  }
}
