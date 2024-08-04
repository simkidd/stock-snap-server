import { Module } from '@nestjs/common';
import { ProductGroupService } from './services/product-group.service';
import { ProductGroupController } from './controllers/product-group.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductGroupController],
  providers: [ProductGroupService, PrismaService],
})
export class ProductGroupModule {}
