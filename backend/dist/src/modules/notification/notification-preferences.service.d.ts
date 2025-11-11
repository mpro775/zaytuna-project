import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';
export interface UserNotificationPreferences {
    userId: string;
    preferences: NotificationPreference[];
}
export interface NotificationPreference {
    notificationType: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
    event: string;
    enabled: boolean;
    frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
    quietHoursStart?: string;
    quietHoursEnd?: string;
}
export interface DefaultPreferences {
    [event: string]: {
        [type: string]: {
            enabled: boolean;
            frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
            priority: 'low' | 'normal' | 'high' | 'urgent';
        };
    };
}
export declare class NotificationPreferencesService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    private readonly defaultPreferences;
    constructor(prisma: PrismaService, auditService: AuditService);
    getUserPreferences(userId: string): Promise<NotificationPreference[]>;
    updateUserPreferences(userId: string, preferences: NotificationPreference[], updatedBy?: string): Promise<void>;
    resetUserPreferences(userId: string, resetBy?: string): Promise<void>;
    canSendNotification(userId: string, notificationType: string, event: string): Promise<boolean>;
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
    importUserPreferences(userId: string, preferencesData: any, importedBy?: string): Promise<void>;
    createDefaultPreferencesForUser(userId: string): Promise<void>;
    updateGlobalPreferences(updates: Partial<DefaultPreferences>, updatedBy?: string): Promise<void>;
    private isInQuietHours;
    private timeToMinutes;
}
