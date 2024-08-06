import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { CreateProductInput, UpdateProductInput } from '../dtos/product.dto';
import { Product, User, UserRole } from '@prisma/client';
import { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('product')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Get all products
  @Public()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products.' })
  @Get()
  getAllProducts(): Promise<Product[]> {
    return this.productService.getAllProducts();
  }

  // Get a single product by ID
  @Public()
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return a product by id.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Get('/:id')
  getProductById(@Param('id') id: string): Promise<Product> {
    return this.productService.getProductById(id);
  }

  // Create a new product
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @Post('/create')
  createProduct(@Body() input: CreateProductInput, @Req() req: Request) {
    const user = req['user'] as User;
    return this.productService.createProduct(input, user.id);
  }

  // Update an existing product
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Put('/update/:id')
  updateProduct(
    @Body() input: UpdateProductInput,
    @Req() req: Request,
  ): Promise<Product> {
    const user = req['user'] as User;
    return this.productService.updateProduct(input, user.id);
  }

  // Delete a product
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Delete('/delete/:id')
  async deleteProduct(@Param('id') id: string): Promise<Product> {
    return this.productService.deleteProduct(id);
  }
}
