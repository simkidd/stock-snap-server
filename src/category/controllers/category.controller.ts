import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { CreateCategoryInput, UpdateCategoryInput } from '../dtos/category.dto';
import { CategoryService } from '../services/category.service';

@ApiTags('category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  getAllCategories(): Promise<Category[]> {
    return this.categoryService.getAllCategories();
  }

  @ApiOperation({ summary: 'Get a category by id' })
  @ApiResponse({ status: 200, description: 'Return a category by id.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @Get('/:id')
  getCategoryById(@Param('id') id: string): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
  })
  @Post('/create')
  create(@Body() input: CreateCategoryInput) {
    return this.categoryService.createCategory(input);
  }

  @ApiOperation({ summary: 'Update an existing category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'category not found.' })
  @Put('/update/:id')
  updateCategory(@Body() input: UpdateCategoryInput) {
    return this.categoryService.updateCategory(input);
  }

  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'category not found.' })
  @Delete('/delete/:id')
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
