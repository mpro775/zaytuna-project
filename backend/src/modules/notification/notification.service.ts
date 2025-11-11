import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface SendNotificationRequest {
  recipientId?: string;
  recipientType?: 'user' | 'customer' | 'supplier' | 'admin';
  recipientEmail?: string;
  recipientPhone?: string;
  title: string;
  message: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  module?: string;
  event?: string;
  referenceId?: string;
  referenceType?: string;
  templateName?: string;
  data?: Record<string, any>;
  scheduledAt?: Date;
  expiresAt?: Date;
  channels?: string[];
  branchId?: string;
}

export interface NotificationResponse {
  notificationId: string;
  status: 'queued' | 'sent' | 'failed';
  providerMessageId?: string;
  scheduledAt?: Date;
}

export interface NotificationStats {
  totalNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  pendingNotifications: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  notificationsByType: Record<string, number>;
  notificationsByModule: Record<string, number>;
  notificationsByPriority: Record<string, number>;
  dailyStats: Array<{
    date: string;
    sent: number;
    failed: number;
  }>;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * إرسال إشعار فوري
   */
  async sendNotification(
    request: SendNotificationRequest,
    sentBy?: string,
  ): Promise<NotificationResponse> {
    try {
      this.logger.log(`إرسال إشعار: ${request.title} - ${request.type}`);

      // التحقق من تفضيلات المستلم
      const canSend = await this.checkNotificationPreferences(request);
      if (!canSend) {
        this.logger.log(`تم تجاهل الإشعار بسبب تفضيلات المستلم: ${request.recipientId}`);
        return {
          notificationId: '',
          status: 'failed',
        };
      }

      // الحصول على بيانات المستلم إذا لم تكن محددة
      const recipientData = await this.getRecipientData(request);

      // إنشاء الإشعار في قاعدة البيانات
      const notification = await this.createNotification({
        ...request,
        ...recipientData,
        sentBy,
      });

      // إرسال الإشعار حسب النوع
      const result = await this.sendByType(notification);

      return {
        notificationId: notification.id,
        status: result.status,
        providerMessageId: result.providerMessageId,
        scheduledAt: request.scheduledAt,
      };
    } catch (error) {
      this.logger.error(`فشل في إرسال الإشعار: ${request.title}`, error);
      throw error;
    }
  }

  /**
   * إرسال إشعار باستخدام قالب
   */
  async sendTemplatedNotification(
    templateName: string,
    variables: TemplateVariables,
    recipientId: string,
    recipientType: 'user' | 'customer' | 'supplier' | 'admin' = 'user',
    sentBy?: string,
  ): Promise<NotificationResponse> {
    try {
      // الحصول على القالب
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { name: templateName, isActive: true },
      });

      if (!template) {
        throw new Error(`القالب غير موجود: ${templateName}`);
      }

      // معالجة محتوى القالب
      const processedContent = this.processTemplate(template.content, variables);
      const processedSubject = template.subject
        ? this.processTemplate(template.subject, variables)
        : undefined;
      const processedHtml = template.htmlContent
        ? this.processTemplate(template.htmlContent, variables)
        : undefined;

      // إرسال الإشعار
      return this.sendNotification({
        recipientId,
        recipientType,
        title: processedSubject || template.name,
        message: processedContent,
        type: template.type as any,
        priority: template.priority as any,
        module: template.module,
        event: template.event,
        templateName,
        data: variables,
      }, sentBy);
    } catch (error) {
      this.logger.error(`فشل في إرسال إشعار بالقالب: ${templateName}`, error);
      throw error;
    }
  }

  /**
   * إرسال إشعار جماعي
   */
  async sendBulkNotifications(
    requests: SendNotificationRequest[],
    sentBy?: string,
  ): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    for (const request of requests) {
      try {
        const result = await this.sendNotification(request, sentBy);
        results.push(result);

        // انتظار قصير بين الإرسالات لتجنب الحظر
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`فشل في إرسال إشعار جماعي`, error);
        results.push({
          notificationId: '',
          status: 'failed',
        });
      }
    }

    return results;
  }

  /**
   * جدولة إشعار لوقت لاحق
   */
  async scheduleNotification(
    request: SendNotificationRequest,
    scheduledAt: Date,
    sentBy?: string,
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      ...request,
      scheduledAt,
    }, sentBy);
  }

  /**
   * إلغاء إشعار مجدول
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });

      this.logger.log(`تم إلغاء الإشعار المجدول: ${notificationId}`);
    } catch (error) {
      this.logger.error(`فشل في إلغاء الإشعار المجدول: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الإشعارات
   */
  async getNotificationStats(
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<NotificationStats> {
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        select: {
          status: true,
          type: true,
          module: true,
          priority: true,
          createdAt: true,
          sentAt: true,
          deliveredAt: true,
          failedAt: true,
        },
      });

      const stats: NotificationStats = {
        totalNotifications: notifications.length,
        sentNotifications: notifications.filter(n => n.status === 'sent').length,
        failedNotifications: notifications.filter(n => n.status === 'failed').length,
        pendingNotifications: notifications.filter(n => ['pending', 'queued'].includes(n.status)).length,
        deliveryRate: 0,
        averageDeliveryTime: 0,
        notificationsByType: this.groupBy(notifications, 'type'),
        notificationsByModule: this.groupBy(notifications, 'module'),
        notificationsByPriority: this.groupBy(notifications, 'priority'),
        dailyStats: this.calculateDailyStats(notifications),
      };

      // حساب معدل التسليم
      if (stats.sentNotifications > 0) {
        stats.deliveryRate = (stats.sentNotifications / stats.totalNotifications) * 100;
      }

      // حساب متوسط وقت التسليم
      const deliveredNotifications = notifications.filter(n => n.sentAt && n.deliveredAt);
      if (deliveredNotifications.length > 0) {
        const totalDeliveryTime = deliveredNotifications.reduce((sum, n) => {
          return sum + (n.deliveredAt!.getTime() - n.sentAt!.getTime());
        }, 0);
        stats.averageDeliveryTime = totalDeliveryTime / deliveredNotifications.length;
      }

      return stats;
    } catch (error) {
      this.logger.error('فشل في حساب إحصائيات الإشعارات', error);
      throw error;
    }
  }

  /**
   * إعادة إرسال إشعار فاشل
   */
  async retryFailedNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const notification = await this.prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new Error(`الإشعار غير موجود: ${notificationId}`);
      }

      if (notification.status !== 'failed') {
        throw new Error(`الإشعار غير فاشل: ${notification.status}`);
      }

      if (notification.retryCount >= notification.maxRetries) {
        throw new Error(`تم تجاوز الحد الأقصى للمحاولات: ${notification.maxRetries}`);
      }

      // تحديث عدد المحاولات
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          retryCount: { increment: 1 },
          status: 'pending',
          updatedAt: new Date(),
        },
      });

      // إعادة إرسال الإشعار
      const result = await this.sendByType(notification);

      return {
        notificationId,
        status: result.status,
        providerMessageId: result.providerMessageId,
      };
    } catch (error) {
      this.logger.error(`فشل في إعادة إرسال الإشعار: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * تحديث تفضيلات الإشعارات لمستخدم
   */
  async updateUserPreferences(
    userId: string,
    preferences: Array<{
      notificationType: string;
      event: string;
      enabled: boolean;
      frequency?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    }>,
  ): Promise<void> {
    try {
      for (const pref of preferences) {
        await this.prisma.notificationPreference.upsert({
          where: {
            userId_notificationType_event: {
              userId,
              notificationType: pref.notificationType,
              event: pref.event,
            },
          },
          update: {
            enabled: pref.enabled,
            frequency: pref.frequency,
            quietHoursStart: pref.quietHoursStart,
            quietHoursEnd: pref.quietHoursEnd,
            updatedAt: new Date(),
          },
          create: {
            userId,
            notificationType: pref.notificationType,
            event: pref.event,
            enabled: pref.enabled,
            frequency: pref.frequency,
            quietHoursStart: pref.quietHoursStart,
            quietHoursEnd: pref.quietHoursEnd,
          },
        });
      }

      this.logger.log(`تم تحديث تفضيلات الإشعارات للمستخدم: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في تحديث تفضيلات الإشعارات: ${userId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على تفضيلات الإشعارات لمستخدم
   */
  async getUserPreferences(userId: string): Promise<any[]> {
    try {
      return await this.prisma.notificationPreference.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`فشل في الحصول على تفضيلات الإشعارات: ${userId}`, error);
      return [];
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التحقق من تفضيلات الإشعارات
   */
  private async checkNotificationPreferences(request: SendNotificationRequest): Promise<boolean> {
    if (!request.recipientId || request.recipientType !== 'user') {
      return true; // لا توجد تفضيلات للعملاء أو الموردين أو الإدارة
    }

    try {
      const preference = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_notificationType_event: {
            userId: request.recipientId,
            notificationType: request.type,
            event: request.event || 'general',
          },
        },
      });

      if (!preference) {
        return true; // الافتراضي: مفعل
      }

      if (!preference.enabled) {
        return false;
      }

      // التحقق من ساعات الهدوء
      if (preference.quietHoursStart && preference.quietHoursEnd) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this.timeToMinutes(preference.quietHoursStart);
        const endTime = this.timeToMinutes(preference.quietHoursEnd);

        if (currentTime >= startTime && currentTime <= endTime) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.warn(`فشل في التحقق من تفضيلات الإشعارات`, error);
      return true; // في حالة الخطأ، نرسل الإشعار
    }
  }

  /**
   * الحصول على بيانات المستلم
   */
  private async getRecipientData(request: SendNotificationRequest): Promise<{
    recipientEmail?: string;
    recipientPhone?: string;
  }> {
    if (!request.recipientId || !request.recipientType) {
      return {};
    }

    try {
      switch (request.recipientType) {
        case 'user':
          const user = await this.prisma.user.findUnique({
            where: { id: request.recipientId },
            select: { email: true, phone: true },
          });
          return {
            recipientEmail: user?.email,
            recipientPhone: user?.phone || undefined,
          };

        case 'customer':
          const customer = await this.prisma.customer.findUnique({
            where: { id: request.recipientId },
            select: { email: true, phone: true },
          });
          return {
            recipientEmail: customer?.email || undefined,
            recipientPhone: customer?.phone || undefined,
          };

        case 'supplier':
          const supplier = await this.prisma.supplier.findUnique({
            where: { id: request.recipientId },
            select: { email: true, phone: true },
          });
          return {
            recipientEmail: supplier?.email || undefined,
            recipientPhone: supplier?.phone || undefined,
          };

        default:
          return {};
      }
    } catch (error) {
      this.logger.warn(`فشل في الحصول على بيانات المستلم: ${request.recipientId}`, error);
      return {};
    }
  }

  /**
   * إنشاء الإشعار في قاعدة البيانات
   */
  private async createNotification(request: SendNotificationRequest & { sentBy?: string }): Promise<any> {
    return this.prisma.notification.create({
      data: {
        title: request.title,
        message: request.message,
        type: request.type,
        recipientId: request.recipientId,
        recipientType: request.recipientType || 'user',
        recipientEmail: request.recipientEmail,
        recipientPhone: request.recipientPhone,
        priority: request.priority || 'normal',
        module: request.module,
        event: request.event,
        referenceId: request.referenceId,
        referenceType: request.referenceType,
        templateId: request.templateName ? await this.getTemplateId(request.templateName) : null,
        data: request.data as any,
        scheduledAt: request.scheduledAt,
        expiresAt: request.expiresAt,
        sentBy: request.sentBy,
        branchId: request.branchId,
        status: request.scheduledAt ? 'pending' : 'queued',
      },
    });
  }

  /**
   * إرسال الإشعار حسب النوع
   */
  private async sendByType(notification: any): Promise<{
    status: 'sent' | 'failed';
    providerMessageId?: string;
  }> {
    try {
      // تحديث حالة الإشعار إلى جاري الإرسال
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'pending' },
      });

      switch (notification.type) {
        case 'email':
          return this.sendEmail(notification);
        case 'sms':
          return this.sendSMS(notification);
        case 'whatsapp':
          return this.sendWhatsApp(notification);
        case 'push':
          return this.sendPush(notification);
        case 'in_app':
          return this.sendInApp(notification);
        default:
          throw new Error(`نوع الإشعار غير مدعوم: ${notification.type}`);
      }
    } catch (error) {
      // تحديث حالة الإشعار إلى فاشل
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          failedAt: new Date(),
          lastError: error.message,
        },
      });

      return { status: 'failed' };
    }
  }

  /**
   * إرسال إيميل
   */
  private async sendEmail(notification: any): Promise<{
    status: 'sent' | 'failed';
    providerMessageId?: string;
  }> {
    try {
      // محاكاة إرسال إيميل - في الواقع يتم استخدام SendGrid أو خدمة أخرى
      const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');

      if (!sendgridApiKey) {
        throw new Error('مفتاح SendGrid غير مكون');
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      // تحديث حالة الإشعار
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          provider: 'sendgrid',
          providerMessageId: `sg_${Date.now()}`,
          sentAt: new Date(),
        },
      });

      return {
        status: 'sent',
        providerMessageId: `sg_${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * إرسال SMS
   */
  private async sendSMS(notification: any): Promise<{
    status: 'sent' | 'failed';
    providerMessageId?: string;
  }> {
    try {
      // محاكاة إرسال SMS - في الواقع يتم استخدام Twilio أو خدمة أخرى
      const twilioAccountSid = this.configService.get('TWILIO_ACCOUNT_SID');

      if (!twilioAccountSid) {
        throw new Error('معرف Twilio غير مكون');
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      // تحديث حالة الإشعار
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          provider: 'twilio',
          providerMessageId: `sm_${Date.now()}`,
          sentAt: new Date(),
        },
      });

      return {
        status: 'sent',
        providerMessageId: `sm_${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * إرسال WhatsApp
   */
  private async sendWhatsApp(notification: any): Promise<{
    status: 'sent' | 'failed';
    providerMessageId?: string;
  }> {
    try {
      // محاكاة إرسال WhatsApp - في الواقع يتم استخدام WhatsApp Business API
      const whatsappToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');

      if (!whatsappToken) {
        throw new Error('رمز WhatsApp غير مكون');
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      // تحديث حالة الإشعار
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          provider: 'whatsapp_business',
          providerMessageId: `wa_${Date.now()}`,
          sentAt: new Date(),
        },
      });

      return {
        status: 'sent',
        providerMessageId: `wa_${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * إرسال دفع
   */
  private async sendPush(notification: any): Promise<{
    status: 'sent' | 'failed';
    providerMessageId?: string;
  }> {
    try {
      // محاكاة إرسال دفع - في الواقع يتم استخدام Firebase أو خدمة أخرى
      const firebaseKey = this.configService.get('FIREBASE_SERVER_KEY');

      if (!firebaseKey) {
        throw new Error('مفتاح Firebase غير مكون');
      }

      // محاكاة الإرسال
      await new Promise(resolve => setTimeout(resolve, 100));

      // تحديث حالة الإشعار
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          provider: 'firebase',
          providerMessageId: `fcm_${Date.now()}`,
          sentAt: new Date(),
        },
      });

      return {
        status: 'sent',
        providerMessageId: `fcm_${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * إرسال إشعار داخل التطبيق
   */
  private async sendInApp(notification: any): Promise<{
    status: 'sent' | 'failed';
    providerMessageId?: string;
  }> {
    try {
      // للإشعارات داخل التطبيق، فقط نحتاج لتحديث الحالة
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'delivered',
          sentAt: new Date(),
          deliveredAt: new Date(),
        },
      });

      return { status: 'sent' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * الحصول على معرف القالب
   */
  private async getTemplateId(templateName: string): Promise<string | null> {
    try {
      const template = await this.prisma.notificationTemplate.findUnique({
        where: { name: templateName },
        select: { id: true },
      });
      return template?.id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * معالجة محتوى القالب
   */
  private processTemplate(template: string, variables: TemplateVariables): string {
    let processed = template;

    // استبدال المتغيرات
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }

  /**
   * تحويل الوقت إلى دقائق
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * تجميع البيانات حسب حقل معين
   */
  private groupBy(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * حساب الإحصائيات اليومية
   */
  private calculateDailyStats(notifications: any[]): Array<{
    date: string;
    sent: number;
    failed: number;
  }> {
    const dailyStats: Record<string, { sent: number; failed: number }> = {};

    notifications.forEach(notification => {
      const date = notification.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { sent: 0, failed: 0 };
      }

      if (notification.status === 'sent') {
        dailyStats[date].sent++;
      } else if (notification.status === 'failed') {
        dailyStats[date].failed++;
      }
    });

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}
