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
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import type { SendNotificationRequest } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferencesService, NotificationPreference } from './notification-preferences.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly templateService: NotificationTemplateService,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  // ========== إرسال الإشعارات ==========

  /**
   * إرسال إشعار فوري
   */
  @Post('send')
  @Permissions('notifications.send')
  async sendNotification(
    @Body() request: SendNotificationRequest,
    @Query('userId') userId?: string,
  ) {
    return this.notificationService.sendNotification(request, userId);
  }

  /**
   * إرسال إشعار باستخدام قالب
   */
  @Post('send-template/:templateName')
  @Permissions('notifications.send')
  async sendTemplatedNotification(
    @Param('templateName') templateName: string,
    @Body() body: {
      recipientId: string;
      recipientType?: 'user' | 'customer' | 'supplier' | 'admin';
      variables: Record<string, any>;
    },
    @Query('userId') userId?: string,
  ) {
    return this.notificationService.sendTemplatedNotification(
      templateName,
      body.variables,
      body.recipientId,
      body.recipientType,
      userId,
    );
  }

  /**
   * إرسال إشعارات جماعية
   */
  @Post('send-bulk')
  @Permissions('notifications.send_bulk')
  async sendBulkNotifications(
    @Body() body: {
      notifications: SendNotificationRequest[];
    },
    @Query('userId') userId?: string,
  ) {
    return this.notificationService.sendBulkNotifications(body.notifications, userId);
  }

  /**
   * جدولة إشعار لوقت لاحق
   */
  @Post('schedule')
  @Permissions('notifications.schedule')
  async scheduleNotification(
    @Body() body: {
      notification: SendNotificationRequest;
      scheduledAt: string;
    },
    @Query('userId') userId?: string,
  ) {
    const scheduledAt = new Date(body.scheduledAt);
    return this.notificationService.scheduleNotification(body.notification, scheduledAt, userId);
  }

  // ========== إدارة القوالب ==========

  /**
   * إنشاء قالب إشعار جديد
   */
  @Post('templates')
  @Permissions('notifications.templates.create')
  async createTemplate(
    @Body() body: any,
    @Query('userId') userId?: string,
  ) {
    return this.templateService.createTemplate(body, userId);
  }

  /**
   * تحديث قالب إشعار
   */
  @Put('templates/:templateId')
  @Permissions('notifications.templates.update')
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() body: any,
    @Query('userId') userId?: string,
  ) {
    return this.templateService.updateTemplate(templateId, body, userId);
  }

  /**
   * حذف قالب إشعار
   */
  @Delete('templates/:templateId')
  @Permissions('notifications.templates.delete')
  async deleteTemplate(
    @Param('templateId') templateId: string,
    @Query('userId') userId?: string,
  ) {
    await this.templateService.deleteTemplate(templateId, userId);
    return { message: 'تم حذف القالب بنجاح' };
  }

  /**
   * الحصول على قالب إشعار
   */
  @Get('templates/:templateId')
  @Permissions('notifications.templates.read')
  async getTemplate(@Param('templateId') templateId: string) {
    return this.templateService.getTemplate(templateId);
  }

  /**
   * البحث في قوالب الإشعارات
   */
  @Get('templates')
  @Permissions('notifications.templates.read')
  async searchTemplates(@Query() query: any) {
    return this.templateService.searchTemplates(query);
  }

  /**
   * الحصول على القالب الافتراضي لحدث معين
   */
  @Get('templates/default/:event/:type')
  @Permissions('notifications.templates.read')
  async getDefaultTemplate(
    @Param('event') event: string,
    @Param('type') type: string,
  ) {
    return this.templateService.getDefaultTemplate(event, type);
  }

  /**
   * الحصول على المتغيرات المتاحة لقالب
   */
  @Get('templates/variables/:event/:module')
  @Permissions('notifications.templates.read')
  async getTemplateVariables(
    @Param('event') event: string,
    @Param('module') module: string,
  ) {
    return this.templateService.getTemplateVariables(event, module);
  }

  /**
   * معاينة قالب مع متغيرات
   */
  @Post('templates/:templateId/preview')
  @Permissions('notifications.templates.read')
  async previewTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { variables: Record<string, any> },
  ) {
    return this.templateService.previewTemplate(templateId, body.variables);
  }

  /**
   * استنساخ قالب
   */
  @Post('templates/:templateId/clone')
  @Permissions('notifications.templates.create')
  async cloneTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { newName: string },
    @Query('userId') userId?: string,
  ) {
    return this.templateService.cloneTemplate(templateId, body.newName, userId);
  }

  /**
   * الحصول على قائمة الأحداث المتاحة
   */
  @Get('events')
  @Permissions('notifications.read')
  async getAvailableEvents() {
    return this.templateService.getAvailableEvents();
  }

  // ========== تفضيلات الإشعارات ==========

  /**
   * الحصول على تفضيلات المستخدم
   */
  @Get('preferences/:userId')
  @Permissions('notifications.preferences.read')
  async getUserPreferences(@Param('userId') userId: string) {
    return this.preferencesService.getUserPreferences(userId);
  }

  /**
   * تحديث تفضيلات المستخدم
   */
  @Put('preferences/:userId')
  @Permissions('notifications.preferences.update')
  async updateUserPreferences(
    @Param('userId') userId: string,
    @Body() body: { preferences: NotificationPreference[] },
    @Query('updatedBy') updatedBy?: string,
  ) {
    await this.preferencesService.updateUserPreferences(userId, body.preferences, updatedBy);
    return { message: 'تم تحديث التفضيلات بنجاح' };
  }

  /**
   * إعادة تعيين تفضيلات المستخدم للافتراضية
   */
  @Post('preferences/:userId/reset')
  @Permissions('notifications.preferences.update')
  async resetUserPreferences(
    @Param('userId') userId: string,
    @Query('resetBy') resetBy?: string,
  ) {
    await this.preferencesService.resetUserPreferences(userId, resetBy);
    return { message: 'تم إعادة تعيين التفضيلات للافتراضية' };
  }

  /**
   * الحصول على التفضيلات الافتراضية
   */
  @Get('preferences/default')
  @Permissions('notifications.preferences.read')
  async getDefaultPreferences() {
    return this.preferencesService.getDefaultPreferences();
  }

  /**
   * إحصائيات تفضيلات الإشعارات
   */
  @Get('preferences/stats')
  @Permissions('notifications.preferences.read')
  async getPreferencesStats() {
    return this.preferencesService.getPreferencesStats();
  }

  /**
   * تصدير تفضيلات المستخدم
   */
  @Get('preferences/:userId/export')
  @Permissions('notifications.preferences.read')
  async exportUserPreferences(@Param('userId') userId: string) {
    return this.preferencesService.exportUserPreferences(userId);
  }

  /**
   * استيراد تفضيلات المستخدم
   */
  @Post('preferences/:userId/import')
  @Permissions('notifications.preferences.update')
  async importUserPreferences(
    @Param('userId') userId: string,
    @Body() body: any,
    @Query('importedBy') importedBy?: string,
  ) {
    await this.preferencesService.importUserPreferences(userId, body, importedBy);
    return { message: 'تم استيراد التفضيلات بنجاح' };
  }

  // ========== إحصائيات وتقارير ==========

  /**
   * إحصائيات الإشعارات
   */
  @Get('stats')
  @Permissions('notifications.read')
  async getNotificationStats(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.notificationService.getNotificationStats(branchId, start, end);
  }

  /**
   * إنشاء تقرير الإشعارات
   */
  @Get('reports')
  @Permissions('notifications.read')
  async getNotificationReport(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    // TODO: تنفيذ إنشاء التقرير
    return {
      report: {
        branchId,
        dateRange: { startDate, endDate },
        filters: { type, status },
        format,
      },
      data: [],
      message: 'سيتم تنفيذ إنشاء تقرير الإشعارات قريباً',
    };
  }

  // ========== إدارة النظام ==========

  /**
   * إنشاء القوالب الافتراضية
   */
  @Post('templates/default/create')
  @Permissions('notifications.templates.create')
  async createDefaultTemplates() {
    await this.templateService.createDefaultTemplates();
    return { message: 'تم إنشاء القوالب الافتراضية بنجاح' };
  }

  /**
   * إنشاء تفضيلات افتراضية لمستخدم جديد
   */
  @Post('preferences/:userId/default')
  @Permissions('notifications.preferences.update')
  async createDefaultPreferencesForUser(@Param('userId') userId: string) {
    await this.preferencesService.createDefaultPreferencesForUser(userId);
    return { message: 'تم إنشاء التفضيلات الافتراضية للمستخدم' };
  }

  /**
   * تحديث التفضيلات الافتراضية العامة
   */
  @Put('preferences/global')
  @Permissions('notifications.preferences.update')
  async updateGlobalPreferences(
    @Body() updates: any,
    @Query('updatedBy') updatedBy?: string,
  ) {
    await this.preferencesService.updateGlobalPreferences(updates, updatedBy);
    return { message: 'تم تحديث التفضيلات الافتراضية العامة' };
  }

  // ========== معلومات النظام ==========

  /**
   * معلومات مزودي الخدمة
   */
  @Get('providers/info')
  @Permissions('notifications.read')
  async getProvidersInfo() {
    // TODO: إرجاع معلومات جميع المزودين
    return {
      email: {
        providers: ['sendgrid', 'mailgun', 'ses', 'smtp'],
        current: 'sendgrid',
      },
      sms: {
        providers: ['twilio', 'aws_sns', 'messagebird', 'nexmo', 'local'],
        current: 'twilio',
      },
      whatsapp: {
        providers: ['whatsapp_business', '360dialog', 'twilio', 'local'],
        current: 'whatsapp_business',
      },
    };
  }

  /**
   * اختبار إرسال إشعار
   */
  @Post('test')
  @Permissions('notifications.send')
  async testNotification(
    @Body() body: {
      type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
      recipient: string;
      message?: string;
    },
  ) {
    const testMessage = body.message || `رسالة اختبار من نظام الإشعارات - ${new Date().toISOString()}`;

    const request: SendNotificationRequest = {
      title: 'اختبار النظام',
      message: testMessage,
      type: body.type,
      recipientId: body.recipient,
      recipientType: 'admin',
    };

    // إضافة المعلومات حسب النوع
    switch (body.type) {
      case 'email':
        request.recipientEmail = body.recipient;
        break;
      case 'sms':
      case 'whatsapp':
        request.recipientPhone = body.recipient;
        break;
    }

    return this.notificationService.sendNotification(request, 'system');
  }
}
