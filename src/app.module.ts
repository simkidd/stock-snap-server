import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { BrandModule } from './modules/brands/brand.module';
import { CategoryModule } from './modules/categories/category.module';
import { CustomerModule } from './modules/customers/customer.module';
import { DiscountModule } from './modules/discounts/discount.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './modules/products/product.module';
import { RegisterModule } from './modules/registers/register.module';
import { SalesModule } from './modules/sales/sales.module';
import { StoreModule } from './modules/stores/store.module';
import { SupplierModule } from './modules/suppliers/supplier.module';
import { UploadModule } from './modules/uploads/upload.module';
import { UserModule } from './modules/users/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, // Max 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50, // Max 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 150, // Max 150 requests per minute
      },
    ]),
    PrismaModule,
    ProductModule,
    CategoryModule,
    SalesModule,
    RegisterModule,
    CustomerModule,
    StoreModule,
    DiscountModule,
    UserModule,
    AuthModule,
    BrandModule,
    SupplierModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
