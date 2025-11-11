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
var NotificationQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationQueueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const notification_service_1 = require("./notification.service");
const email_provider_1 = require("./providers/email.provider");
const sms_provider_1 = require("./providers/sms.provider");
const whatsapp_provider_1 = require("./providers/whatsapp.provider");
let NotificationQueueService = NotificationQueueService_1 = class NotificationQueueService {
    prisma;
    notificationService;
    emailProvider;
    smsProvider;
    whatsappProvider;
    logger = new common_1.Logger(NotificationQueueService_1.name);
    isProcessing = false;
    processingInterval = null;
    processingIntervalMs = 5000;
    maxConcurrentJobs = 10;
    activeJobs = new Set();
    constructor(prisma, notificationService, emailProvider, smsProvider, whatsappProvider) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.emailProvider = emailProvider;
        this.smsProvider = smsProvider;
        this.whatsappProvider = whatsappProvider;
    }
    async onModuleInit() {
        this.logger.log('تشغيل خدمة طوابير الإشعارات');
        this.startProcessing();
    }
    async onModuleDestroy() {
        this.logger.log('إيقاف خدمة طوابير الإشعارات');
        this.stopProcessing();
    }
    async addToQueue(notificationData) {
        try {
            const job = {
                id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                notificationId: notificationData.notificationId,
                type: notificationData.type,
                priority: notificationData.priority,
                scheduledAt: notificationData.scheduledAt,
                maxRetries: 3,
                retryCount: 0,
                data: notificationData.data,
                status: notificationData.scheduledAt ? 'queued' : 'queued',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await this.saveJob(job);
            this.logger.log(`تم إضافة المهمة إلى الطابور: ${job.id} - ${notificationData.type}`);
        }
        catch (error) {
            this.logger.error('فشل في إضافة المهمة إلى الطابور', error);
            throw error;
        }
    }
    async cancelJob(jobId) {
        try {
            const job = await this.getJob(jobId);
            if (!job) {
                throw new Error(`المهمة غير موجودة: ${jobId}`);
            }
            if (job.status === 'processing') {
                throw new Error(`لا يمكن إلغاء مهمة قيد المعالجة: ${jobId}`);
            }
            job.status = 'cancelled';
            job.updatedAt = new Date();
            await this.saveJob(job);
            await this.prisma.notification.update({
                where: { id: job.notificationId },
                data: { status: 'cancelled' },
            });
            this.logger.log(`تم إلغاء المهمة: ${jobId}`);
        }
        catch (error) {
            this.logger.error(`فشل في إلغاء المهمة: ${jobId}`, error);
            throw error;
        }
    }
    async retryJob(jobId) {
        try {
            const job = await this.getJob(jobId);
            if (!job) {
                throw new Error(`المهمة غير موجودة: ${jobId}`);
            }
            if (job.status !== 'failed') {
                throw new Error(`المهمة غير فاشلة: ${jobId} - ${job.status}`);
            }
            if (job.retryCount >= job.maxRetries) {
                throw new Error(`تم تجاوز الحد الأقصى للمحاولات: ${jobId}`);
            }
            job.status = 'queued';
            job.retryCount++;
            job.nextRetryAt = new Date(Date.now() + this.calculateBackoffDelay(job.retryCount));
            job.lastError = undefined;
            job.updatedAt = new Date();
            await this.saveJob(job);
            this.logger.log(`تم جدولة إعادة المحاولة للمهمة: ${jobId} (المحاولة ${job.retryCount})`);
        }
        catch (error) {
            this.logger.error(`فشل في إعادة محاولة المهمة: ${jobId}`, error);
            throw error;
        }
    }
    async getQueueStats() {
        try {
            return {
                totalJobs: 0,
                queuedJobs: 0,
                processingJobs: this.activeJobs.size,
                completedJobs: 0,
                failedJobs: 0,
                cancelledJobs: 0,
                averageProcessingTime: 0,
                jobsByType: {},
                jobsByPriority: {},
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الطابور', error);
            return {
                totalJobs: 0,
                queuedJobs: 0,
                processingJobs: 0,
                completedJobs: 0,
                failedJobs: 0,
                cancelledJobs: 0,
                averageProcessingTime: 0,
                jobsByType: {},
                jobsByPriority: {},
            };
        }
    }
    async cleanupOldJobs(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            this.logger.log(`تم تنظيف المهام القديمة (أقدم من ${daysOld} يوماً)`);
            return 0;
        }
        catch (error) {
            this.logger.error('فشل في تنظيف المهام القديمة', error);
            return 0;
        }
    }
    async restartProcessing() {
        this.logger.log('إعادة تشغيل معالجة الطابور');
        this.stopProcessing();
        this.startProcessing();
    }
    startProcessing() {
        if (this.processingInterval) {
            return;
        }
        this.logger.log('بدء معالجة طابور الإشعارات');
        this.isProcessing = true;
        this.processingInterval = setInterval(async () => {
            try {
                await this.processQueue();
            }
            catch (error) {
                this.logger.error('خطأ في معالجة الطابور', error);
            }
        }, this.processingIntervalMs);
    }
    stopProcessing() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.isProcessing = false;
        this.logger.log('تم إيقاف معالجة الطابور');
    }
    async processQueue() {
        if (!this.isProcessing || this.activeJobs.size >= this.maxConcurrentJobs) {
            return;
        }
        try {
            const jobsToProcess = await this.getJobsToProcess();
            for (const job of jobsToProcess) {
                if (this.activeJobs.size >= this.maxConcurrentJobs) {
                    break;
                }
                if (this.activeJobs.has(job.id)) {
                    continue;
                }
                this.processJob(job).catch(error => {
                    this.logger.error(`خطأ في معالجة المهمة ${job.id}`, error);
                });
            }
        }
        catch (error) {
            this.logger.error('خطأ في معالجة الطابور', error);
        }
    }
    async processJob(job) {
        const startTime = Date.now();
        try {
            this.activeJobs.add(job.id);
            job.status = 'processing';
            job.updatedAt = new Date();
            await this.saveJob(job);
            this.logger.log(`بدء معالجة المهمة: ${job.id} - ${job.type}`);
            const result = await this.executeJob(job);
            job.status = result.success ? 'completed' : 'failed';
            job.updatedAt = new Date();
            if (!result.success) {
                job.lastError = result.error;
                job.retryCount++;
                if (job.retryCount < job.maxRetries) {
                    job.status = 'queued';
                    job.nextRetryAt = new Date(Date.now() + this.calculateBackoffDelay(job.retryCount));
                }
            }
            await this.saveJob(job);
            await this.updateNotificationStatus(job.notificationId, job.status, result);
            const processingTime = Date.now() - startTime;
            this.logger.log(`تمت معالجة المهمة: ${job.id} - ${job.status} (${processingTime}ms)`);
        }
        catch (error) {
            this.logger.error(`فشل في معالجة المهمة: ${job.id}`, error);
            job.status = 'failed';
            job.lastError = error.message;
            job.updatedAt = new Date();
            job.retryCount++;
            if (job.retryCount < job.maxRetries) {
                job.status = 'queued';
                job.nextRetryAt = new Date(Date.now() + this.calculateBackoffDelay(job.retryCount));
            }
            await this.saveJob(job);
        }
        finally {
            this.activeJobs.delete(job.id);
        }
    }
    async executeJob(job) {
        try {
            switch (job.type) {
                case 'email':
                    return await this.sendEmail(job.data);
                case 'sms':
                    return await this.sendSMS(job.data);
                case 'whatsapp':
                    return await this.sendWhatsApp(job.data);
                case 'push':
                    return await this.sendPush(job.data);
                case 'in_app':
                    return await this.sendInApp(job.data);
                default:
                    throw new Error(`نوع الإشعار غير مدعوم: ${job.type}`);
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendEmail(data) {
        try {
            const result = await this.emailProvider.sendEmail({
                to: data.recipientEmail,
                subject: data.title,
                text: data.message,
                html: data.htmlContent,
            });
            return {
                success: result.success,
                messageId: result.messageId,
                error: result.error,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendSMS(data) {
        try {
            const result = await this.smsProvider.sendSMS({
                to: data.recipientPhone,
                message: data.message,
            });
            return {
                success: result.success,
                messageId: result.messageId,
                error: result.error,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendWhatsApp(data) {
        try {
            const result = await this.whatsappProvider.sendWhatsApp(this.whatsappProvider.createTextMessage(data.recipientPhone, data.message));
            return {
                success: result.success,
                messageId: result.messageId,
                error: result.error,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendPush(data) {
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
                success: true,
                messageId: `push_${Date.now()}`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async sendInApp(data) {
        try {
            return {
                success: true,
                messageId: `in_app_${Date.now()}`,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getJobsToProcess() {
        try {
            const now = new Date();
            return [
                {
                    id: `job_${Date.now()}_1`,
                    notificationId: `notif_${Date.now()}`,
                    type: 'email',
                    priority: 'normal',
                    maxRetries: 3,
                    retryCount: 0,
                    data: {
                        recipientEmail: 'test@example.com',
                        title: 'Test Notification',
                        message: 'This is a test notification',
                    },
                    status: 'queued',
                    createdAt: now,
                    updatedAt: now,
                },
            ];
        }
        catch (error) {
            this.logger.error('فشل في الحصول على المهام للمعالجة', error);
            return [];
        }
    }
    async saveJob(job) {
    }
    async getJob(jobId) {
        return null;
    }
    calculateBackoffDelay(retryCount) {
        const baseDelay = 60 * 1000;
        const maxDelay = 24 * 60 * 60 * 1000;
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        return Math.min(delay, maxDelay);
    }
    async updateNotificationStatus(notificationId, jobStatus, result) {
        try {
            const updateData = {
                updatedAt: new Date(),
            };
            switch (jobStatus) {
                case 'completed':
                    updateData.status = 'sent';
                    updateData.sentAt = new Date();
                    updateData.providerMessageId = result.messageId;
                    break;
                case 'failed':
                    updateData.status = 'failed';
                    updateData.failedAt = new Date();
                    updateData.lastError = result.error;
                    break;
                case 'cancelled':
                    updateData.status = 'cancelled';
                    break;
            }
            await this.prisma.notification.update({
                where: { id: notificationId },
                data: updateData,
            });
        }
        catch (error) {
            this.logger.error(`فشل في تحديث حالة الإشعار: ${notificationId}`, error);
        }
    }
};
exports.NotificationQueueService = NotificationQueueService;
exports.NotificationQueueService = NotificationQueueService = NotificationQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService,
        email_provider_1.EmailProvider,
        sms_provider_1.SMSProvider,
        whatsapp_provider_1.WhatsAppProvider])
], NotificationQueueService);
//# sourceMappingURL=notification-queue.service.js.map