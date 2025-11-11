import { NotificationService, SendNotificationRequest } from './notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferencesService, NotificationPreference } from './notification-preferences.service';
export declare class NotificationController {
    private readonly notificationService;
    private readonly templateService;
    private readonly preferencesService;
    constructor(notificationService: NotificationService, templateService: NotificationTemplateService, preferencesService: NotificationPreferencesService);
    sendNotification(request: SendNotificationRequest, userId?: string): Promise<import("./notification.service").NotificationResponse>;
    sendTemplatedNotification(templateName: string, body: {
        recipientId: string;
        recipientType?: 'user' | 'customer' | 'supplier' | 'admin';
        variables: Record<string, any>;
    }, userId?: string): Promise<import("./notification.service").NotificationResponse>;
    sendBulkNotifications(body: {
        notifications: SendNotificationRequest[];
    }, userId?: string): Promise<import("./notification.service").NotificationResponse[]>;
    scheduleNotification(body: {
        notification: SendNotificationRequest;
        scheduledAt: string;
    }, userId?: string): Promise<import("./notification.service").NotificationResponse>;
    createTemplate(body: any, userId?: string): Promise<any>;
    updateTemplate(templateId: string, body: any, userId?: string): Promise<any>;
    deleteTemplate(templateId: string, userId?: string): Promise<{
        message: string;
    }>;
    getTemplate(templateId: string): Promise<any>;
    searchTemplates(query: any): Promise<{
        templates: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getDefaultTemplate(event: string, type: string): Promise<any>;
    getTemplateVariables(event: string, module: string): Promise<Record<string, any>>;
    previewTemplate(templateId: string, body: {
        variables: Record<string, any>;
    }): Promise<{
        subject?: string;
        content: string;
        htmlContent?: string;
    }>;
    cloneTemplate(templateId: string, body: {
        newName: string;
    }, userId?: string): Promise<any>;
    getAvailableEvents(): Promise<{
        event: string;
        module: string;
        description: string;
    }[]>;
    getUserPreferences(userId: string): Promise<NotificationPreference[]>;
    updateUserPreferences(userId: string, body: {
        preferences: NotificationPreference[];
    }, updatedBy?: string): Promise<{
        message: string;
    }>;
    resetUserPreferences(userId: string, resetBy?: string): Promise<{
        message: string;
    }>;
    getDefaultPreferences(): Promise<NotificationPreference[]>;
    getPreferencesStats(): Promise<{
        totalUsers: number;
        usersWithCustomPreferences: number;
        mostPopularPreferences: Array<{
            type: string;
            event: string;
            enabledCount: number;
            disabledCount: number;
        }>;
        quietHoursUsage: number;
    }>;
    exportUserPreferences(userId: string): Promise<any>;
    importUserPreferences(userId: string, body: any, importedBy?: string): Promise<{
        message: string;
    }>;
    getNotificationStats(branchId?: string, startDate?: string, endDate?: string): Promise<import("./notification.service").NotificationStats>;
    getNotificationReport(branchId?: string, startDate?: string, endDate?: string, type?: string, status?: string, format?: 'json' | 'csv'): Promise<{
        report: {
            branchId: string | undefined;
            dateRange: {
                startDate: string | undefined;
                endDate: string | undefined;
            };
            filters: {
                type: string | undefined;
                status: string | undefined;
            };
            format: "json" | "csv";
        };
        data: never[];
        message: string;
    }>;
    createDefaultTemplates(): Promise<{
        message: string;
    }>;
    createDefaultPreferencesForUser(userId: string): Promise<{
        message: string;
    }>;
    updateGlobalPreferences(updates: any, updatedBy?: string): Promise<{
        message: string;
    }>;
    getProvidersInfo(): Promise<{
        email: {
            providers: string[];
            current: string;
        };
        sms: {
            providers: string[];
            current: string;
        };
        whatsapp: {
            providers: string[];
            current: string;
        };
    }>;
    testNotification(body: {
        type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
        recipient: string;
        message?: string;
    }): Promise<import("./notification.service").NotificationResponse>;
}
