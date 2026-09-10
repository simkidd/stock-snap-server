import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesAnalyticsController } from './sales-analytics.controller';
import { SalesAnalyticsService } from './sales-analytics.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SalesController, SalesAnalyticsController],
  providers: [SalesService, SalesAnalyticsService, PrismaService],
  exports: [SalesService, SalesAnalyticsService],
})
export class SalesModule {}
