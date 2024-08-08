import { Module } from '@nestjs/common';
import { SalesController } from './controllers/sales.controller';
import { SalesService } from './services/sales.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/services/notification.service';
import { SalesAnalyticsService } from './services/sales-analytics.service';
import { SalesAnalyticsController } from './controllers/sales-analytics.controller';

@Module({
  controllers: [SalesController, SalesAnalyticsController],
  providers: [
    SalesService,
    PrismaService,
    NotificationService,
    SalesAnalyticsService,
  ],
})
export class SalesModule {}
