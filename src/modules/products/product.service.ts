import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product, ProductStatusEnum } from 'src/generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { slugify } from 'src/utils/helpers';
import { CreateProductInput, UpdateProductInput } from './dtos/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts(tenantId?: string): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        images: true,
        category: true,
        brand: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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
    if (!cleanQuery) return this.getAllProducts(tenantId);

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
    const { productCategoryId, ...restInput } = input;

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
    const { productCategoryId, ...restInput } = input;

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
}
