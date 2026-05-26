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

  unreadCount(userId?: string) {
    return this.prisma.notification
      .count({
        where: { readAt: null, ...(userId ? { recipientId: userId } : {}) },
      })
      .then((count) => ({ count }));
  }

  create(dto: any) {
    return this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type ?? 'in_app',
        recipientId: dto.recipientId,
        recipientType: dto.recipientType ?? 'user',
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        status: 'sent',
        sentAt: new Date(),
        priority: dto.priority ?? 'normal',
        module: dto.module,
        event: dto.event,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        data: dto.data,
        sentBy: dto.sentBy,
        branchId: dto.branchId,
      },
    });
  }

  async markRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId?: string) {
    const result = await this.prisma.notification.updateMany({
      where: { readAt: null, ...(userId ? { recipientId: userId } : {}) },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async delete(id: string) {
    await this.markRead(id);
    await this.prisma.notification.delete({ where: { id } });
    return { id, deleted: true };
  }

  getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ notificationType: 'asc' }, { event: 'asc' }],
    });
  }

  async updatePreferences(userId: string, preferences: any[]) {
    const saved: any[] = [];
    for (const preference of preferences) {
      saved.push(
        await this.prisma.notificationPreference.upsert({
          where: {
            userId_notificationType_event: {
              userId,
              notificationType: preference.notificationType ?? 'in_app',
              event: preference.event,
            },
          },
          update: {
            enabled: preference.enabled,
            frequency: preference.frequency ?? 'immediate',
            quietHoursStart: preference.quietHoursStart,
            quietHoursEnd: preference.quietHoursEnd,
          },
          create: {
            userId,
            notificationType: preference.notificationType ?? 'in_app',
            event: preference.event,
            enabled: preference.enabled ?? true,
            frequency: preference.frequency ?? 'immediate',
            quietHoursStart: preference.quietHoursStart,
            quietHoursEnd: preference.quietHoursEnd,
          },
        }),
      );
    }
    return saved;
  }
}
