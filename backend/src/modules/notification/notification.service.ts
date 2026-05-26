import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId?: string) {
    return this.prisma.notification.findMany({
      where: userId ? { recipientId: userId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId?: string) {
    const result = await this.prisma.notification.updateMany({
      where: { readAt: null, ...(userId ? { recipientId: userId } : {}) },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
