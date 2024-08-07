import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/services/notification.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, PrismaService, NotificationService],
})
export class ProductModule {}
