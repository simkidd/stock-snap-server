import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product, ProductStatusEnum } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/utils/helpers';
import {
  buildPaginationMeta,
  calculatePagination,
} from 'src/common/utils/paginate.util';
import {
  CreateProductInput,
  QueryProductDto,
  UpdateProductInput,
} from './dtos/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts(
    tenantId?: string,
    query?: QueryProductDto,
  ) {
    const { page, limit, skip } = calculatePagination(query);

    const where: Prisma.ProductWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      ...(query?.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query?.brandId ? { brandId: query.brandId } : {}),
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { barcode: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          images: true,
          category: true,
          brand: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: query?.sortOrder === 'asc' ? 'asc' : 'desc' },
      }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        category: true,
        brand: true,
        Supplier: true,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async getProductByBarcode(
    barcode: string,
    tenantId?: string,
  ): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: {
        barcode: barcode.trim(),
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        images: true,
        category: true,
        brand: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`No product found with barcode "${barcode}"`);
    }

    return product;
  }

  /**
   * Get products that are running low on stock or completely out of stock
   */
  async getLowStockAlerts(tenantId?: string) {
    const alerts = await this.prisma.product.findMany({
      where: {
        status: { in: [ProductStatusEnum.LOW, ProductStatusEnum.OUT] },
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        category: true,
        brand: true,
        Supplier: true,
      },
      orderBy: { quantity: 'asc' },
    });

    const outOfStock = alerts.filter((p) => p.status === ProductStatusEnum.OUT);
    const lowStock = alerts.filter((p) => p.status === ProductStatusEnum.LOW);

    return {
      totalAlerts: alerts.length,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      items: alerts,
    };
  }

  async searchProducts(query: string, tenantId?: string): Promise<Product[]> {
    const cleanQuery = query?.trim();
    if (!cleanQuery) {
      const result = await this.getAllProducts(tenantId, { limit: 50 });
      return result.data;
    }

    return this.prisma.product.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { barcode: { contains: cleanQuery, mode: 'insensitive' } },
          { sku: { contains: cleanQuery, mode: 'insensitive' } },
          { tags: { has: cleanQuery.toLowerCase() } },
        ],
      },
      include: {
        images: true,
        category: true,
        brand: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(
    input: CreateProductInput,
    userId: string,
    tenantId?: string,
  ): Promise<Product> {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      resolvedTenantId = user?.tenantId ?? undefined;
    }
    if (!resolvedTenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      resolvedTenantId = defaultTenant?.id;
    }

    const name = input.name.trim();
    const slug = slugify(name);

    const existingSku = await this.prisma.product.findFirst({
      where: { sku: input.sku, tenantId: resolvedTenantId },
    });
    if (existingSku) {
      throw new BadRequestException(
        `Product with SKU "${input.sku}" already exists`,
      );
    }

    let status: ProductStatusEnum = ProductStatusEnum.AVAILABLE;
    if (input.quantity === 0) {
      status = ProductStatusEnum.OUT;
    } else if (input.quantity <= input.minimumQuantity) {
      status = ProductStatusEnum.LOW;
    }

    const categoryId = input.categoryId || input.productCategoryId;
    const { productCategoryId: _productCategoryId, ...restInput } = input;

    const product = await this.prisma.product.create({
      data: {
        ...restInput,
        categoryId: categoryId,
        tenantId: resolvedTenantId,
        name,
        slug,
        status,
        addedById: userId,
        updatedById: userId,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    return product;
  }

  async updateProduct(
    input: UpdateProductInput,
    userId: string,
  ): Promise<Product> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: input.id },
    });
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    const name = input.name.trim();
    const slug = slugify(name);

    const categoryId = input.categoryId || input.productCategoryId;
    const { productCategoryId: _productCategoryId, ...restInput } = input;

    const product = await this.prisma.product.update({
      where: { id: input.id },
      data: {
        ...restInput,
        ...(categoryId ? { categoryId } : {}),
        name,
        slug,
        updatedById: userId,
      },
      include: {
        category: true,
        brand: true,
      },
    });

    await this.updateProductStatus(product);

    return product;
  }

  async deleteProduct(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  private async updateProductStatus(product: Product) {
    if (product.quantity === 0 && product.status !== ProductStatusEnum.OUT) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatusEnum.OUT },
      });
    } else if (
      product.quantity <= product.minimumQuantity &&
      product.status !== ProductStatusEnum.LOW
    ) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatusEnum.LOW },
      });
    } else if (
      product.quantity > product.minimumQuantity &&
      (product.status === ProductStatusEnum.LOW ||
        product.status === ProductStatusEnum.OUT)
    ) {
      await this.prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatusEnum.AVAILABLE },
      });
    }
  }

  /**
   * Get Product & Inventory KPI Summary Metrics
   */
  async getProductStats(tenantId?: string) {
    const where: Prisma.ProductWhereInput = {
      ...(tenantId ? { tenantId } : {}),
    };

    const products = await this.prisma.product.findMany({
      where,
      select: {
        price: true,
        costPrice: true,
        quantity: true,
        minimumQuantity: true,
        status: true,
      },
    });

    let totalValuation = 0;
    let totalCostValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const qty = Number(p.quantity || 0);
      totalValuation += Number(p.price || 0) * qty;
      totalCostValuation += Number(p.costPrice || 0) * qty;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= Number(p.minimumQuantity || 5)) {
        lowStockCount++;
      }
    }

    return {
      totalProducts: products.length,
      totalValuation,
      totalCostValuation,
      lowStockCount,
      outOfStockCount,
    };
  }

  /**
   * Get Stock Movement Audit Log KPI Summary Metrics
   */
  async getStockMovementStats(tenantId?: string) {
    const where: Prisma.StockMovementWhereInput = {
      ...(tenantId ? { tenantId } : {}),
    };

    const [total, purchases, sales, adjustments, returns] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.count({ where: { ...where, type: 'PURCHASE' } }),
      this.prisma.stockMovement.count({ where: { ...where, type: 'SALE' } }),
      this.prisma.stockMovement.count({ where: { ...where, type: 'ADJUSTMENT' } }),
      this.prisma.stockMovement.count({ where: { ...where, type: 'RETURN' } }),
    ]);

    return {
      totalMovements: total,
      purchaseCount: purchases,
      saleCount: sales,
      adjustmentCount: adjustments,
      returnCount: returns,
    };
  }
}
