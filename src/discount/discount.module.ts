import { Module } from '@nestjs/common';
import { DiscountController } from './controllers/discount.controller';
import { DiscountService } from './services/discount.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DiscountController],
  providers: [DiscountService, PrismaService],
})
export class DiscountModule {}
