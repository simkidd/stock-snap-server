import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Product, User, UserRole } from 'src/generated/prisma';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateProductInput, UpdateProductInput } from './dtos/product.dto';
import { ProductService } from './product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @ApiOperation({ summary: 'Get all products (optionally scoped to tenant)' })
  @ApiResponse({ status: 200, description: 'Return all products.' })
  @Get()
  getAllProducts(@Req() req: Request): Promise<Product[]> {
    const tenantId = req['user']?.tenantId;
    return this.productService.getAllProducts(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Instant Barcode Scanner Lookup for POS' })
  @ApiResponse({ status: 200, description: 'Return scanned product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @Get('barcode/:barcode')
  getProductByBarcode(
    @Param('barcode') barcode: string,
    @Req() req: Request,
  ): Promise<Product> {
    const tenantId = req['user']?.tenantId;
    return this.productService.getProductByBarcode(barcode, tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Get live Low Stock and Out of Stock alerts for dashboard' })
  @ApiResponse({ status: 200, description: 'Return low stock & out of stock products.' })
  @Get('alerts/low-stock')
  getLowStockAlerts(@Req() req: Request) {
    const tenantId = req['user']?.tenantId;
    return this.productService.getLowStockAlerts(tenantId);
  }

  @Public()
  @ApiOperation({ summary: 'Search products by name, barcode, sku, or tag' })
  @ApiResponse({ status: 200, description: 'Return matching products.' })
  @Get('search')
  searchProducts(
    @Query('q') q: string,
    @Req() req: Request,
  ): Promise<Product[]> {
    const tenantId = req['user']?.tenantId;
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
  @ApiOperation({ summary: 'Create a new product with barcode and Naira pricing' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @Post('/create')
  createProduct(
    @Body() input: CreateProductInput,
    @Req() req: Request,
  ): Promise<Product> {
    const user = req['user'] as User;
    return this.productService.createProduct(input, user.id, user.tenantId ?? undefined);
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.INVENTORY_CONTROLLER)
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @Patch('/update')
  updateProduct(
    @Body() input: UpdateProductInput,
    @Req() req: Request,
  ): Promise<Product> {
    const user = req['user'] as User;
    return this.productService.updateProduct(input, user.id);
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
