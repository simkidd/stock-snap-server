import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Category, UserRole } from 'src/generated/prisma';
import {
  CreateCategoryInput,
  CreateSubCategoryInput,
  UpdateCategoryInput,
} from './dtos/category.dto';
import { CategoryService } from './category.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @ApiOperation({ summary: 'Get all categories with their sub-categories nested' })
  @ApiResponse({ status: 200, description: 'Return all categories with nested subcategories.' })
  @Get()
  getAllCategories(@Req() req: Request): Promise<Category[]> {
    const tenantId = req['user']?.tenantId;
    return this.categoryService.getAllCategories(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Return a category by ID.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @Get(':id')
  getCategoryById(@Param('id') id: string): Promise<Category> {
    return this.categoryService.getCategoryById(id);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Create a main category' })
  @ApiResponse({ status: 201, description: 'Main category created successfully.' })
  @Post()
  createCategory(
    @Body() input: CreateCategoryInput,
    @Req() req: Request,
  ): Promise<Category> {
    const tenantId = req['user']?.tenantId;
    return this.categoryService.createCategory(input, tenantId);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Create a sub-category under a parent category' })
  @ApiResponse({ status: 201, description: 'Sub-category created successfully.' })
  @Post('sub')
  createSubCategory(
    @Body() input: CreateSubCategoryInput,
    @Req() req: Request,
  ): Promise<Category> {
    const tenantId = req['user']?.tenantId;
    return this.categoryService.createSubCategory(input, tenantId);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully.' })
  @Patch()
  updateCategory(@Body() input: UpdateCategoryInput): Promise<Category> {
    return this.categoryService.updateCategory(input);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully.' })
  @Delete(':id')
  deleteCategory(@Param('id') id: string): Promise<Category> {
    return this.categoryService.deleteCategory(id);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Delete a sub-category' })
  @ApiResponse({ status: 200, description: 'Sub-category deleted successfully.' })
  @Delete('sub/:id')
  deleteSubCategory(@Param('id') id: string): Promise<Category> {
    return this.categoryService.deleteSubCategory(id);
  }
}
