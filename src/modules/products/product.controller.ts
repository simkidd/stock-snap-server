import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Product, User, UserRole } from 'src/generated/prisma';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  CreateProductInput,
  QueryProductDto,
  UpdateProductInput,
} from './dtos/product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @ApiOperation({ summary: 'Get all products with pagination & search' })
  @ApiResponse({ status: 200, description: 'Return paginated products.' })
  @Get()
  getAllProducts(
    @CurrentUser() user: any,
    @Query() query: QueryProductDto,
  ) {
    const tenantId = user?.tenantId;
    return this.productService.getAllProducts(tenantId, query);
  }

  @Public()
  @ApiOperation({ summary: 'Get product inventory KPI metrics' })
  @ApiResponse({ status: 200, description: 'Return product catalog stats.' })
  @Get('stats')
  getProductStats(@CurrentUser() user: any) {
    return this.productService.getProductStats(user?.tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get stock movement audit KPI metrics' })
  @ApiResponse({ status: 200, description: 'Return stock movement stats.' })
  @Get('movements/stats')
  getStockMovementStats(@CurrentUser() user: any) {
    return this.productService.getStockMovementStats(user?.tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Instant Barcode Scanner Lookup for POS' })
  @ApiResponse({ status: 200, description: 'Return scanned product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Get('barcode/:barcode')
  getProductByBarcode(
    @Param('barcode') barcode: string,
    @CurrentUser() user: any,
  ): Promise<Product> {
    const tenantId = user?.tenantId;
    return this.productService.getProductByBarcode(barcode, tenantId);
  }

  @Public()
  @ApiOperation({
    summary: 'Get live Low Stock and Out of Stock alerts for dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Return low stock & out of stock products.',
  })
  @Get('alerts/low-stock')
  getLowStockAlerts(@CurrentUser() user: any) {
    const tenantId = user?.tenantId;
    return this.productService.getLowStockAlerts(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Search products by name, barcode, sku, or tag' })
  @ApiResponse({ status: 200, description: 'Return matching products.' })
  @Get('search')
  searchProducts(
    @Query('q') q: string,
    @CurrentUser() user: any,
  ): Promise<Product[]> {
    const tenantId = user?.tenantId;
    return this.productService.searchProducts(q, tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, description: 'Return a product by ID.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Get(':id')
  getProductById(@Param('id') id: string): Promise<Product> {
    return this.productService.getProductById(id);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({
    summary: 'Create a new product with barcode and Naira pricing',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @Post('/create')
  createProduct(
    @Body() input: CreateProductInput,
    @CurrentUser() user: any,
  ): Promise<Product> {
    return this.productService.createProduct(
      input,
      user?.id,
      user?.tenantId ?? undefined,
    );
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @Patch('/update')
  updateProduct(
    @Body() input: UpdateProductInput,
    @CurrentUser() user: any,
  ): Promise<Product> {
    return this.productService.updateProduct(input, user?.id);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @Delete('/delete/:id')
  deleteProduct(@Param('id') id: string): Promise<Product> {
    return this.productService.deleteProduct(id);
  }
}
