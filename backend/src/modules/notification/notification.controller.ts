import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { NotificationService, CreateNotificationDto, SendNotificationDto } from './notification.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * إرسال إشعار لمستخدم واحد
   */
  @Post('send')
  @Permissions('notifications.send')
  async sendNotification(
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationService.sendNotificationToUser(dto);
  }

  /**
   * إرسال إشعار جماعي
   */
  @Post('broadcast')
  @Permissions('notifications.broadcast')
  async broadcastNotification(
    @Body() dto: SendNotificationDto,
  ) {
    return this.notificationService.sendBulkNotification(dto);
  }

  /**
   * تسجيل اشتراك دفعي
   */
  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  async registerDevice(
    @Body() body: {
      deviceId: string;
      deviceName?: string;
      subscription: {
        endpoint: string;
        keys: {
          p256dh: string;
          auth: string;
        };
      };
      userId?: string;
    },
  ) {
    return this.notificationService.registerPushSubscription({
      deviceId: body.deviceId,
      deviceName: body.deviceName,
      endpoint: body.subscription.endpoint,
      keys: body.subscription.keys,
      userId: body.userId,
    });
  }

  /**
   * إلغاء اشتراك دفعي
   */
  @Post('unsubscribe/:subscriptionId')
  @Permissions('notifications.manage')
  @HttpCode(HttpStatus.OK)
  async unsubscribeDevice(
    @Param('subscriptionId') subscriptionId: string,
  ) {
    await this.notificationService.unregisterPushSubscription(subscriptionId);
    return { message: 'تم إلغاء الاشتراك بنجاح' };
  }

  /**
   * الحصول على مفتاح VAPID العام
   */
  @Get('vapid-public-key')
  async getVapidPublicKey() {
    // في الإنتاج، يجب الحصول على المفتاح من متغيرات البيئة
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BLXHQZ5Rd7KdUbFxqjBfhK7RHFjKzZs8wBzMq2YYpG5K4J8M4nT4K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
    };
  }

  /**
   * الحصول على إشعارات المستخدم
   */
  @Get('user')
  async getUserNotifications(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('category') category?: string,
  ) {
    const options = {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unreadOnly === 'true',
      category,
    };

    return this.notificationService.getUserNotifications(userId, options);
  }

  /**
   * تحديث حالة الإشعار كمقروء
   */
  @Put(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.notificationService.markNotificationAsRead(notificationId, userId);
    return { message: 'تم تحديث حالة الإشعار' };
  }

  /**
   * حذف إشعار
   */
  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.notificationService.deleteNotification(notificationId, userId);
    return { message: 'تم حذف الإشعار' };
  }

  /**
   * إحصائيات الإشعارات
   */
  @Get('stats')
  async getNotificationStats(
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationService.getNotificationStats(userId);
  }

  /**
   * إرسال إشعار ترحيب للمستخدم الجديد
   */
  @Post('welcome/:userId')
  @Permissions('notifications.send')
  async sendWelcomeNotification(
    @Param('userId') userId: string,
  ) {
    await this.notificationService.sendWelcomeNotification(userId);
    return { message: 'تم إرسال إشعار الترحيب' };
  }

  /**
   * إرسال تنبيه مخزون منخفض
   */
  @Post('alerts/low-stock')
  @Permissions('notifications.send')
  async sendLowStockAlert(
    @Body() body: {
      userId: string;
      productName: string;
      currentStock: number;
      minStock: number;
    },
  ) {
    await this.notificationService.sendLowStockAlert(
      body.userId,
      body.productName,
      body.currentStock,
      body.minStock,
    );
    return { message: 'تم إرسال تنبيه المخزون المنخفض' };
  }

  /**
   * إرسال تنبيه مبيعات عالية
   */
  @Post('alerts/high-sales')
  @Permissions('notifications.send')
  async sendHighSalesAlert(
    @Body() body: {
      userId: string;
      period: string;
      salesAmount: number;
      growth: number;
    },
  ) {
    await this.notificationService.sendHighSalesAlert(
      body.userId,
      body.period,
      body.salesAmount,
      body.growth,
    );
    return { message: 'تم إرسال تنبيه المبيعات العالية' };
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * إحصائيات عامة للإشعارات (للمدراء)
   */
  @Get('admin/stats')
  @Permissions('notifications.admin')
  async getAdminStats() {
    return this.notificationService.getNotificationStats();
  }

  /**
   * تنظيف الإشعارات القديمة
   */
  @Post('admin/cleanup')
  @Permissions('notifications.admin')
  async cleanupOldNotifications(
    @Query('days') days?: string,
  ) {
    const daysToKeep = days ? parseInt(days) : 30;
    const deletedCount = await this.notificationService.cleanupOldNotifications(daysToKeep);
    return { message: `تم حذف ${deletedCount} إشعار قديم` };
  }

  /**
   * إرسال إشعار اختباري
   */
  @Post('admin/test')
  @Permissions('notifications.admin')
  async sendTestNotification(
    @Body() body: { userId: string },
    @CurrentUser('id') senderId: string,
  ) {
    await this.notificationService.sendNotificationToUser({
      userId: body.userId,
      title: 'إشعار اختباري',
      body: `تم إرسال هذا الإشعار بواسطة ${senderId} للاختبار`,
      type: 'push',
      category: 'system',
      data: {
        test: true,
        senderId,
        timestamp: new Date().toISOString(),
      },
    });

    return { message: 'تم إرسال الإشعار الاختباري' };
  }
}