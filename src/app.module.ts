import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BrandModule } from './brand/brand.module';
import { CategoryModule } from './category/category.module';
import { DiscountModule } from './discount/discount.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { PrismaService } from './prisma/prisma.service';
import { ProductCategoryModule } from './product-category/product-category.module';
import { ProductGroupModule } from './product-group/product-group.module';
import { ProductModule } from './product/product.module';
import { SalesModule } from './sales/sales.module';
import { SupplierModule } from './supplier/supplier.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';

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
    BrandModule,
    SupplierModule,
    UploadModule,
    NotificationModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
