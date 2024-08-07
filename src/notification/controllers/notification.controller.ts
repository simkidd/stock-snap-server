import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { ApiTags } from '@nestjs/swagger';
import { Notification } from '@prisma/client';

@ApiTags('notification')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(): Promise<Notification[]> {
    return await this.notificationService.getNotifications();
  }

  @Patch('/:id/read')
  async markAsRead(@Param('id') id: string): Promise<Notification> {
    return await this.notificationService.markAsRead(id);
  }
}
