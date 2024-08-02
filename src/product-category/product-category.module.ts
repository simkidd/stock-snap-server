import { Module } from '@nestjs/common';
import { ProductCategoryController } from './controllers/product-category.controller';
import { ProductCategoryService } from './services/product-category.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService, PrismaService],
})
export class ProductCategoryModule {}
