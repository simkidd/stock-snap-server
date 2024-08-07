import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationCleanupService } from './services/notification-cleanup.service';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, NotificationCleanupService],
})
export class NotificationModule {}
