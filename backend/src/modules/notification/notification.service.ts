import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { UserService } from '../user/user.service';
import webpush from 'web-push';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  body: string;
  type?: 'push' | 'email' | 'sms' | 'in_app';
  category?: string;
  data?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface SendNotificationDto {
  userIds: string[];
  title: string;
  body: string;
  type?: 'push' | 'email' | 'sms' | 'in_app';
  category?: string;
  data?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: Date;
  sendImmediately?: boolean;
}

export interface PushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceId?: string;
  deviceName?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private userService: UserService,
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush(): void {
    // إعداد VAPID keys (في الإنتاج يجب وضعها في environment variables)
    const vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BLXHQZ5Rd7KdUbFxqjBfhK7RHFjKzZs8wBzMq2YYpG5K4J8M4nT4K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-key-here',
    };

    webpush.setVapidDetails(
      'mailto:' + (process.env.NOTIFICATION_EMAIL || 'notifications@zaytuna.com'),
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    this.logger.log('Web Push initialized with VAPID keys');
  }

  // إنشاء إشعار جديد
  async createNotification(dto: CreateNotificationDto): Promise<NotificationDocument> {
    try {
      const notification = new this.notificationModel({
        ...dto,
        userId: dto.userId,
        type: dto.type || 'in_app',
        category: dto.category || 'system',
      });

      const savedNotification = await notification.save();
      this.logger.log(`Notification created: ${savedNotification._id}`);

      return savedNotification;
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  // إرسال إشعار لمستخدم واحد
  async sendNotificationToUser(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.createNotification(dto);

    // إرسال الإشعار حسب النوع
    if (dto.type === 'push') {
      await this.sendPushNotification(notification);
    }

    return notification;
  }

  // إرسال إشعار جماعي
  async sendBulkNotification(dto: SendNotificationDto): Promise<{
    sent: number;
    failed: number;
    notifications: NotificationDocument[];
  }> {
    const notifications: NotificationDocument[] = [];
    let sent = 0;
    let failed = 0;

    for (const userId of dto.userIds) {
      try {
        const notification = await this.sendNotificationToUser({
          ...dto,
          userId,
        });
        notifications.push(notification);
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send notification to user ${userId}:`, error);
        failed++;
      }
    }

    this.logger.log(`Bulk notification sent: ${sent} successful, ${failed} failed`);

    return { sent, failed, notifications };
  }

  // إرسال إشعار دفعي
  private async sendPushNotification(notification: NotificationDocument): Promise<void> {
    try {
      // الحصول على اشتراكات المستخدم النشطة
      const subscriptions = await this.getUserPushSubscriptions(notification.userId.toString());

      if (subscriptions.length === 0) {
        this.logger.warn(`No push subscriptions found for user ${notification.userId}`);
        return;
      }

      const payload = {
        title: notification.title,
        body: notification.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: {
          notificationId: notification._id.toString(),
          actionUrl: notification.actionUrl,
          ...notification.data,
        },
        actions: [
          {
            action: 'view',
            title: 'عرض',
            icon: '/icons/icon-96x96.png'
          },
          {
            action: 'dismiss',
            title: 'تجاهل'
          }
        ],
        timestamp: notification.createdAt?.getTime() || Date.now(),
        tag: `notification-${notification._id}`,
      };

      // إرسال لجميع الأجهزة المشتركة
      const sendPromises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
          this.logger.log(`Push notification sent to device ${subscription.deviceId}`);
        } catch (error: any) {
          this.logger.error(`Failed to send push notification to device ${subscription.deviceId}:`, error);

          // إزالة الاشتراك غير الصالح
          if (error.statusCode === 410 || error.statusCode === 400) {
            await this.removePushSubscription(subscription._id.toString());
          }
        }
      });

      await Promise.allSettled(sendPromises);

      // تحديث حالة الإشعار
      await this.notificationModel.findByIdAndUpdate(notification._id, {
        sentAt: new Date(),
      });

    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      throw error;
    }
  }

  // تسجيل اشتراك دفعي جديد
  async registerPushSubscription(subscriptionData: PushSubscriptionDto): Promise<{ subscriptionId: string }> {
    try {
      // التحقق من وجود اشتراك مكرر
      const existingSubscription = await this.notificationModel.findOne({
        'data.endpoint': subscriptionData.endpoint,
        'data.deviceId': subscriptionData.deviceId,
        type: 'subscription',
      });

      if (existingSubscription) {
        // تحديث الاشتراك الموجود
        await this.notificationModel.findByIdAndUpdate(existingSubscription._id, {
          data: {
            ...subscriptionData,
            lastUpdated: new Date(),
          },
        });

        return { subscriptionId: existingSubscription._id.toString() };
      }

      // إنشاء اشتراك جديد
      const subscription = await this.notificationModel.create({
        userId: subscriptionData.userId,
        title: 'Push Subscription',
        body: `Device: ${subscriptionData.deviceName || 'Unknown'}`,
        type: 'subscription',
        category: 'system',
        data: {
          ...subscriptionData,
          registeredAt: new Date(),
        },
        isActive: true,
      });

      this.logger.log(`Push subscription registered: ${subscription._id}`);

      return { subscriptionId: subscription._id.toString() };
    } catch (error) {
      this.logger.error('Failed to register push subscription:', error);
      throw error;
    }
  }

  // إلغاء اشتراك دفعي
  async unregisterPushSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.notificationModel.findByIdAndUpdate(subscriptionId, {
        isActive: false,
        data: {
          ...((await this.notificationModel.findById(subscriptionId))?.data || {}),
          unregisteredAt: new Date(),
        },
      });

      this.logger.log(`Push subscription unregistered: ${subscriptionId}`);
    } catch (error) {
      this.logger.error('Failed to unregister push subscription:', error);
      throw error;
    }
  }

  // الحصول على اشتراكات المستخدم النشطة
  private async getUserPushSubscriptions(userId: string): Promise<any[]> {
    try {
      const subscriptions = await this.notificationModel.find({
        userId,
        type: 'subscription',
        isActive: true,
      });

      return subscriptions.map(sub => ({
        _id: sub._id,
        endpoint: sub.data.endpoint,
        keys: sub.data.keys,
        deviceId: sub.data.deviceId,
      }));
    } catch (error) {
      this.logger.error('Failed to get user push subscriptions:', error);
      return [];
    }
  }

  // إزالة اشتراك غير صالح
  private async removePushSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.notificationModel.findByIdAndUpdate(subscriptionId, {
        isActive: false,
        data: {
          ...((await this.notificationModel.findById(subscriptionId))?.data || {}),
          removedAt: new Date(),
          removalReason: 'invalid_subscription',
        },
      });

      this.logger.log(`Invalid push subscription removed: ${subscriptionId}`);
    } catch (error) {
      this.logger.error('Failed to remove invalid push subscription:', error);
    }
  }

  // الحصول على إشعارات المستخدم
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      category?: string;
    } = {}
  ): Promise<{
    notifications: NotificationDocument[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, category } = options;

      const filter: any = { userId, isActive: true };
      if (unreadOnly) filter.read = false;
      if (category) filter.category = category;

      const notifications = await this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await this.notificationModel.countDocuments(filter);
      const unreadCount = await this.notificationModel.countDocuments({
        userId,
        read: false,
        isActive: true
      });

      return { notifications, total, unreadCount };
    } catch (error) {
      this.logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  // تحديث حالة الإشعار
  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notification = await this.notificationModel.findOne({
        _id: notificationId,
        userId,
        isActive: true,
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
      }
    } catch (error) {
      this.logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // حذف إشعار
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const result = await this.notificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        { isActive: false },
        { new: true }
      );

      if (!result) {
        throw new NotFoundException('Notification not found');
      }

      this.logger.log(`Notification deleted: ${notificationId}`);
    } catch (error) {
      this.logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // إحصائيات الإشعارات
  async getNotificationStats(userId?: string): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      const matchStage: any = { isActive: true };
      if (userId) matchStage.userId = userId;

      const stats = await this.notificationModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
            },
            categories: {
              $push: {
                category: '$category',
                read: '$read'
              }
            },
            types: {
              $push: {
                type: '$type',
                read: '$read'
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          total: 0,
          unread: 0,
          byCategory: {},
          byType: {}
        };
      }

      const result = stats[0];

      // تجميع الإحصائيات حسب الفئة والنوع
      const byCategory: Record<string, number> = {};
      const byType: Record<string, number> = {};

      result.categories.forEach((item: any) => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      });

      result.types.forEach((item: any) => {
        byType[item.type] = (byType[item.type] || 0) + 1;
      });

      return {
        total: result.total,
        unread: result.unread,
        byCategory,
        byType,
      };
    } catch (error) {
      this.logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  // تنظيف الإشعارات القديمة
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.notificationModel.updateMany(
        {
          createdAt: { $lt: cutoffDate },
          read: true,
          type: { $ne: 'subscription' } // عدم حذف الاشتراكات
        },
        { isActive: false }
      );

      this.logger.log(`Cleaned up ${result.modifiedCount} old notifications`);
      return result.modifiedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }

  // إرسال إشعار ترحيب للمستخدم الجديد
  async sendWelcomeNotification(userId: string): Promise<void> {
    await this.sendNotificationToUser({
      userId,
      title: 'مرحباً بك في زيتونة SaaS',
      body: 'شكراً لانضمامك! استكشف جميع الميزات المتاحة في لوحة التحكم.',
      type: 'in_app',
      category: 'system',
      actionUrl: '/dashboard',
      data: {
        welcome: true,
        features: ['inventory', 'sales', 'reports']
      }
    });
  }

  // إرسال إشعار تحذير للمخزون المنخفض
  async sendLowStockAlert(userId: string, productName: string, currentStock: number, minStock: number): Promise<void> {
    await this.sendNotificationToUser({
      userId,
      title: 'تنبيه: مخزون منخفض',
      body: `المنتج "${productName}" وصل لمستوى مخزون منخفض (${currentStock}). الحد الأدنى: ${minStock}`,
      type: 'push',
      category: 'inventory',
      actionUrl: '/inventory',
      data: {
        productName,
        currentStock,
        minStock,
        alertType: 'low_stock'
      }
    });
  }

  // إرسال إشعار مبيعات عالية
  async sendHighSalesAlert(userId: string, period: string, salesAmount: number, growth: number): Promise<void> {
    await this.sendNotificationToUser({
      userId,
      title: 'تميز في المبيعات! 🎉',
      body: `مبيعات ${period} بلغت ${salesAmount.toLocaleString('ar-SA')} ريال (${growth > 0 ? '+' : ''}${growth.toFixed(1)}%)`,
      type: 'push',
      category: 'sales',
      actionUrl: '/reports',
      data: {
        period,
        salesAmount,
        growth,
        alertType: 'high_sales'
      }
    });
  }
}