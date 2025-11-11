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
export declare class NotificationService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendNotification(request: SendNotificationRequest, sentBy?: string): Promise<NotificationResponse>;
    sendTemplatedNotification(templateName: string, variables: TemplateVariables, recipientId: string, recipientType?: 'user' | 'customer' | 'supplier' | 'admin', sentBy?: string): Promise<NotificationResponse>;
    sendBulkNotifications(requests: SendNotificationRequest[], sentBy?: string): Promise<NotificationResponse[]>;
    scheduleNotification(request: SendNotificationRequest, scheduledAt: Date, sentBy?: string): Promise<NotificationResponse>;
    cancelScheduledNotification(notificationId: string): Promise<void>;
    getNotificationStats(branchId?: string, startDate?: Date, endDate?: Date): Promise<NotificationStats>;
    retryFailedNotification(notificationId: string): Promise<NotificationResponse>;
    updateUserPreferences(userId: string, preferences: Array<{
        notificationType: string;
        event: string;
        enabled: boolean;
        frequency?: string;
        quietHoursStart?: string;
        quietHoursEnd?: string;
    }>): Promise<void>;
    getUserPreferences(userId: string): Promise<any[]>;
    private checkNotificationPreferences;
    private getRecipientData;
    private createNotification;
    private sendByType;
    private sendEmail;
    private sendSMS;
    private sendWhatsApp;
    private sendPush;
    private sendInApp;
    private getTemplateId;
    private processTemplate;
    private timeToMinutes;
    private groupBy;
    private calculateDailyStats;
}
