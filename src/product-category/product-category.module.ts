import { Module } from '@nestjs/common';
import { ProductCategoryController } from './controllers/product-category.controller';
import { ProductCategoryService } from './services/product-category.service';

@Module({
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService]
})
export class ProductCategoryModule {}
