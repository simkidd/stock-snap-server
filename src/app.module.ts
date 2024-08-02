import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ProductModule } from './product/product.module';
import { ProductCategoryModule } from './product-category/product-category.module';
import { SalesModule } from './sales/sales.module';
import { DiscountModule } from './discount/discount.module';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ProductGroupModule } from './product-group/product-group.module';
import { ProductImageModule } from './product-image/product-image.module';

@Module({
  imports: [
    ProductModule,
    ProductCategoryModule,
    SalesModule,
    DiscountModule,
    UserModule,
    OrderModule,
    AuthModule,
    CategoryModule,
    ProductGroupModule,
    ProductImageModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
