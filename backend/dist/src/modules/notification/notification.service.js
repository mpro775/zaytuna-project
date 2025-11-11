"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const config_1 = require("@nestjs/config");
let NotificationService = NotificationService_1 = class NotificationService {
    prisma;
    configService;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async sendNotification(request, sentBy) {
        try {
            this.logger.log(`إرسال إشعار: ${request.title} - ${request.type}`);
            const canSend = await this.checkNotificationPreferences(request);
            if (!canSend) {
                this.logger.log(`تم تجاهل الإشعار بسبب تفضيلات المستلم: ${request.recipientId}`);
                return {
                    notificationId: '',
                    status: 'failed',
                };
            }
            const recipientData = await this.getRecipientData(request);
            const notification = await this.createNotification({
                ...request,
                ...recipientData,
                sentBy,
            });
            const result = await this.sendByType(notification);
            return {
                notificationId: notification.id,
                status: result.status,
                providerMessageId: result.providerMessageId,
                scheduledAt: request.scheduledAt,
            };
        }
        catch (error) {
            this.logger.error(`فشل في إرسال الإشعار: ${request.title}`, error);
            throw error;
        }
    }
    async sendTemplatedNotification(templateName, variables, recipientId, recipientType = 'user', sentBy) {
        try {
            const template = await this.prisma.notificationTemplate.findUnique({
                where: { name: templateName, isActive: true },
            });
            if (!template) {
                throw new Error(`القالب غير موجود: ${templateName}`);
            }
            const processedContent = this.processTemplate(template.content, variables);
            const processedSubject = template.subject
                ? this.processTemplate(template.subject, variables)
                : undefined;
            const processedHtml = template.htmlContent
                ? this.processTemplate(template.htmlContent, variables)
                : undefined;
            return this.sendNotification({
                recipientId,
                recipientType,
                title: processedSubject || template.name,
                message: processedContent,
                type: template.type,
                priority: template.priority,
                module: template.module,
                event: template.event,
                templateName,
                data: variables,
            }, sentBy);
        }
        catch (error) {
            this.logger.error(`فشل في إرسال إشعار بالقالب: ${templateName}`, error);
            throw error;
        }
    }
    async sendBulkNotifications(requests, sentBy) {
        const results = [];
        for (const request of requests) {
            try {
                const result = await this.sendNotification(request, sentBy);
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                this.logger.error(`فشل في إرسال إشعار جماعي`, error);
                results.push({
                    notificationId: '',
                    status: 'failed',
                });
            }
        }
        return results;
    }
    async scheduleNotification(request, scheduledAt, sentBy) {
        return this.sendNotification({
            ...request,
            scheduledAt,
        }, sentBy);
    }
    async cancelScheduledNotification(notificationId) {
        try {
            await this.prisma.notification.update({
                where: { id: notificationId },
                data: {
                    status: 'cancelled',
                    updatedAt: new Date(),
                },
            });
            this.logger.log(`تم إلغاء الإشعار المجدول: ${notificationId}`);
        }
        catch (error) {
            this.logger.error(`فشل في إلغاء الإشعار المجدول: ${notificationId}`, error);
            throw error;
        }
    }
    async getNotificationStats(branchId, startDate, endDate) {
        try {
            const where = {};
            if (branchId)
                where.branchId = branchId;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
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
            const stats = {
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
            if (stats.sentNotifications > 0) {
                stats.deliveryRate = (stats.sentNotifications / stats.totalNotifications) * 100;
            }
            const deliveredNotifications = notifications.filter(n => n.sentAt && n.deliveredAt);
            if (deliveredNotifications.length > 0) {
                const totalDeliveryTime = deliveredNotifications.reduce((sum, n) => {
                    return sum + (n.deliveredAt.getTime() - n.sentAt.getTime());
                }, 0);
                stats.averageDeliveryTime = totalDeliveryTime / deliveredNotifications.length;
            }
            return stats;
        }
        catch (error) {
            this.logger.error('فشل في حساب إحصائيات الإشعارات', error);
            throw error;
        }
    }
    async retryFailedNotification(notificationId) {
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
            await this.prisma.notification.update({
                where: { id: notificationId },
                data: {
                    retryCount: { increment: 1 },
                    status: 'pending',
                    updatedAt: new Date(),
                },
            });
            const result = await this.sendByType(notification);
            return {
                notificationId,
                status: result.status,
                providerMessageId: result.providerMessageId,
            };
        }
        catch (error) {
            this.logger.error(`فشل في إعادة إرسال الإشعار: ${notificationId}`, error);
            throw error;
        }
    }
    async updateUserPreferences(userId, preferences) {
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
        }
        catch (error) {
            this.logger.error(`فشل في تحديث تفضيلات الإشعارات: ${userId}`, error);
            throw error;
        }
    }
    async getUserPreferences(userId) {
        try {
            return await this.prisma.notificationPreference.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على تفضيلات الإشعارات: ${userId}`, error);
            return [];
        }
    }
    async checkNotificationPreferences(request) {
        if (!request.recipientId || request.recipientType !== 'user') {
            return true;
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
                return true;
            }
            if (!preference.enabled) {
                return false;
            }
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
        }
        catch (error) {
            this.logger.warn(`فشل في التحقق من تفضيلات الإشعارات`, error);
            return true;
        }
    }
    async getRecipientData(request) {
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
                        recipientPhone: user?.phone,
                    };
                case 'customer':
                    const customer = await this.prisma.customer.findUnique({
                        where: { id: request.recipientId },
                        select: { email: true, phone: true },
                    });
                    return {
                        recipientEmail: customer?.email,
                        recipientPhone: customer?.phone,
                    };
                case 'supplier':
                    const supplier = await this.prisma.supplier.findUnique({
                        where: { id: request.recipientId },
                        select: { email: true, phone: true },
                    });
                    return {
                        recipientEmail: supplier?.email,
                        recipientPhone: supplier?.phone,
                    };
                default:
                    return {};
            }
        }
        catch (error) {
            this.logger.warn(`فشل في الحصول على بيانات المستلم: ${request.recipientId}`, error);
            return {};
        }
    }
    async createNotification(request) {
        return this.prisma.notification.create({
            data: {
                title: request.title,
                message: request.message,
                type: request.type,
                recipientId: request.recipientId,
                recipientType: request.recipientType,
                recipientEmail: request.recipientEmail,
                recipientPhone: request.recipientPhone,
                priority: request.priority || 'normal',
                module: request.module,
                event: request.event,
                referenceId: request.referenceId,
                referenceType: request.referenceType,
                templateId: request.templateName ? await this.getTemplateId(request.templateName) : null,
                data: request.data,
                scheduledAt: request.scheduledAt,
                expiresAt: request.expiresAt,
                sentBy: request.sentBy,
                branchId: request.branchId,
                status: request.scheduledAt ? 'pending' : 'queued',
            },
        });
    }
    async sendByType(notification) {
        try {
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
        }
        catch (error) {
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
    async sendEmail(notification) {
        try {
            const sendgridApiKey = this.configService.get('SENDGRID_API_KEY');
            if (!sendgridApiKey) {
                throw new Error('مفتاح SendGrid غير مكون');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
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
        }
        catch (error) {
            throw error;
        }
    }
    async sendSMS(notification) {
        try {
            const twilioAccountSid = this.configService.get('TWILIO_ACCOUNT_SID');
            if (!twilioAccountSid) {
                throw new Error('معرف Twilio غير مكون');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
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
        }
        catch (error) {
            throw error;
        }
    }
    async sendWhatsApp(notification) {
        try {
            const whatsappToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
            if (!whatsappToken) {
                throw new Error('رمز WhatsApp غير مكون');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
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
        }
        catch (error) {
            throw error;
        }
    }
    async sendPush(notification) {
        try {
            const firebaseKey = this.configService.get('FIREBASE_SERVER_KEY');
            if (!firebaseKey) {
                throw new Error('مفتاح Firebase غير مكون');
            }
            await new Promise(resolve => setTimeout(resolve, 100));
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
        }
        catch (error) {
            throw error;
        }
    }
    async sendInApp(notification) {
        try {
            await this.prisma.notification.update({
                where: { id: notification.id },
                data: {
                    status: 'delivered',
                    sentAt: new Date(),
                    deliveredAt: new Date(),
                },
            });
            return { status: 'sent' };
        }
        catch (error) {
            throw error;
        }
    }
    async getTemplateId(templateName) {
        try {
            const template = await this.prisma.notificationTemplate.findUnique({
                where: { name: templateName },
                select: { id: true },
            });
            return template?.id || null;
        }
        catch (error) {
            return null;
        }
    }
    processTemplate(template, variables) {
        let processed = template;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            processed = processed.replace(regex, String(value));
        }
        return processed;
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    groupBy(items, field) {
        return items.reduce((acc, item) => {
            const key = item[field] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    calculateDailyStats(notifications) {
        const dailyStats = {};
        notifications.forEach(notification => {
            const date = notification.createdAt.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { sent: 0, failed: 0 };
            }
            if (notification.status === 'sent') {
                dailyStats[date].sent++;
            }
            else if (notification.status === 'failed') {
                dailyStats[date].failed++;
            }
        });
        return Object.entries(dailyStats)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => b.date.localeCompare(a.date));
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map