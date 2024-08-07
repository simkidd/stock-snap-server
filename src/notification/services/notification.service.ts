import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(): Promise<Notification[]> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { read: false },
        orderBy: { createdAt: 'desc' },
      });

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id },
      });
      if (!notification) {
        throw new NotFoundException('notification id not found');
      }

      await this.prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }
}
