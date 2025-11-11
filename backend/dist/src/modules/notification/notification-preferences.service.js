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
var NotificationPreferencesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferencesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let NotificationPreferencesService = NotificationPreferencesService_1 = class NotificationPreferencesService {
    prisma;
    auditService;
    logger = new common_1.Logger(NotificationPreferencesService_1.name);
    defaultPreferences = {
        'sale_created': {
            'email': { enabled: true, frequency: 'immediate', priority: 'high' },
            'sms': { enabled: false, frequency: 'immediate', priority: 'high' },
            'whatsapp': { enabled: false, frequency: 'immediate', priority: 'high' },
            'push': { enabled: true, frequency: 'immediate', priority: 'high' },
            'in_app': { enabled: true, frequency: 'immediate', priority: 'high' },
        },
        'payment_received': {
            'email': { enabled: true, frequency: 'immediate', priority: 'high' },
            'sms': { enabled: true, frequency: 'immediate', priority: 'high' },
            'whatsapp': { enabled: false, frequency: 'immediate', priority: 'high' },
            'push': { enabled: true, frequency: 'immediate', priority: 'high' },
            'in_app': { enabled: true, frequency: 'immediate', priority: 'high' },
        },
        'stock_low': {
            'email': { enabled: true, frequency: 'immediate', priority: 'urgent' },
            'sms': { enabled: false, frequency: 'immediate', priority: 'urgent' },
            'whatsapp': { enabled: false, frequency: 'immediate', priority: 'urgent' },
            'push': { enabled: true, frequency: 'immediate', priority: 'urgent' },
            'in_app': { enabled: true, frequency: 'immediate', priority: 'urgent' },
        },
        'stock_out': {
            'email': { enabled: true, frequency: 'immediate', priority: 'urgent' },
            'sms': { enabled: true, frequency: 'immediate', priority: 'urgent' },
            'whatsapp': { enabled: false, frequency: 'immediate', priority: 'urgent' },
            'push': { enabled: true, frequency: 'immediate', priority: 'urgent' },
            'in_app': { enabled: true, frequency: 'immediate', priority: 'urgent' },
        },
        'customer_birthday': {
            'email': { enabled: true, frequency: 'daily', priority: 'normal' },
            'sms': { enabled: false, frequency: 'daily', priority: 'normal' },
            'whatsapp': { enabled: true, frequency: 'daily', priority: 'normal' },
            'push': { enabled: false, frequency: 'daily', priority: 'normal' },
            'in_app': { enabled: true, frequency: 'daily', priority: 'normal' },
        },
        'loyalty_tier_upgraded': {
            'email': { enabled: true, frequency: 'immediate', priority: 'high' },
            'sms': { enabled: false, frequency: 'immediate', priority: 'high' },
            'whatsapp': { enabled: true, frequency: 'immediate', priority: 'high' },
            'push': { enabled: true, frequency: 'immediate', priority: 'high' },
            'in_app': { enabled: true, frequency: 'immediate', priority: 'high' },
        },
        'period_closed': {
            'email': { enabled: true, frequency: 'weekly', priority: 'normal' },
            'sms': { enabled: false, frequency: 'weekly', priority: 'normal' },
            'whatsapp': { enabled: false, frequency: 'weekly', priority: 'normal' },
            'push': { enabled: false, frequency: 'weekly', priority: 'normal' },
            'in_app': { enabled: true, frequency: 'weekly', priority: 'normal' },
        },
        'user_login_failed': {
            'email': { enabled: true, frequency: 'immediate', priority: 'urgent' },
            'sms': { enabled: false, frequency: 'immediate', priority: 'urgent' },
            'whatsapp': { enabled: false, frequency: 'immediate', priority: 'urgent' },
            'push': { enabled: false, frequency: 'immediate', priority: 'urgent' },
            'in_app': { enabled: true, frequency: 'immediate', priority: 'urgent' },
        },
    };
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getUserPreferences(userId) {
        try {
            const preferences = await this.prisma.notificationPreference.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            });
            if (preferences.length === 0) {
                return this.getDefaultPreferences();
            }
            return preferences.map(pref => ({
                notificationType: pref.notificationType,
                event: pref.event,
                enabled: pref.enabled,
                frequency: pref.frequency,
                quietHoursStart: pref.quietHoursStart || undefined,
                quietHoursEnd: pref.quietHoursEnd || undefined,
            }));
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على تفضيلات المستخدم: ${userId}`, error);
            return this.getDefaultPreferences();
        }
    }
    async updateUserPreferences(userId, preferences, updatedBy) {
        try {
            this.logger.log(`تحديث تفضيلات المستخدم: ${userId}`);
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
                        frequency: pref.frequency || 'immediate',
                        quietHoursStart: pref.quietHoursStart,
                        quietHoursEnd: pref.quietHoursEnd,
                    },
                });
            }
            await this.auditService.log({
                action: 'USER_PREFERENCES_UPDATED',
                entity: 'NotificationPreference',
                details: {
                    userId,
                    preferencesCount: preferences.length,
                    updatedBy,
                },
                module: 'notification',
                category: 'user_settings',
            });
            this.logger.log(`تم تحديث تفضيلات المستخدم بنجاح: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في تحديث تفضيلات المستخدم: ${userId}`, error);
            throw error;
        }
    }
    async resetUserPreferences(userId, resetBy) {
        try {
            this.logger.log(`إعادة تعيين تفضيلات المستخدم للافتراضية: ${userId}`);
            await this.prisma.notificationPreference.deleteMany({
                where: { userId },
            });
            await this.auditService.log({
                action: 'USER_PREFERENCES_RESET',
                entity: 'NotificationPreference',
                details: {
                    userId,
                    resetBy,
                },
                module: 'notification',
                category: 'user_settings',
            });
            this.logger.log(`تم إعادة تعيين تفضيلات المستخدم بنجاح: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في إعادة تعيين تفضيلات المستخدم: ${userId}`, error);
            throw error;
        }
    }
    getDefaultPreferences() {
        const preferences = [];
        for (const [event, eventPrefs] of Object.entries(this.defaultPreferences)) {
            for (const [type, pref] of Object.entries(eventPrefs)) {
                preferences.push({
                    notificationType: type,
                    event,
                    enabled: pref.enabled,
                    frequency: pref.frequency,
                });
            }
        }
        return preferences;
    }
    async canSendNotification(userId, notificationType, event) {
        try {
            const preference = await this.prisma.notificationPreference.findUnique({
                where: {
                    userId_notificationType_event: {
                        userId,
                        notificationType,
                        event,
                    },
                },
            });
            if (preference) {
                if (!preference.enabled) {
                    return false;
                }
                if (preference.quietHoursStart && preference.quietHoursEnd) {
                    if (this.isInQuietHours(preference.quietHoursStart, preference.quietHoursEnd)) {
                        return false;
                    }
                }
                return true;
            }
            const defaultPref = this.defaultPreferences[event]?.[notificationType];
            return defaultPref?.enabled || false;
        }
        catch (error) {
            this.logger.error(`فشل في التحقق من إمكانية إرسال الإشعار: ${userId}`, error);
            return false;
        }
    }
    async getPreferencesStats() {
        try {
            const [totalUsers, customPreferences, allPreferences,] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.notificationPreference.findMany(),
                this.prisma.notificationPreference.findMany({
                    select: {
                        notificationType: true,
                        event: true,
                        enabled: true,
                        quietHoursStart: true,
                    },
                }),
            ]);
            const usersWithCustomPreferences = new Set(customPreferences.map(p => p.userId)).size;
            const preferenceStats = {};
            allPreferences.forEach(pref => {
                const key = `${pref.notificationType}:${pref.event}`;
                if (!preferenceStats[key]) {
                    preferenceStats[key] = { enabled: 0, disabled: 0 };
                }
                if (pref.enabled) {
                    preferenceStats[key].enabled++;
                }
                else {
                    preferenceStats[key].disabled++;
                }
            });
            const mostPopularPreferences = Object.entries(preferenceStats)
                .map(([key, stats]) => {
                const [type, event] = key.split(':');
                return {
                    type,
                    event,
                    enabledCount: stats.enabled,
                    disabledCount: stats.disabled,
                };
            })
                .sort((a, b) => (b.enabledCount + b.disabledCount) - (a.enabledCount + a.disabledCount))
                .slice(0, 10);
            const quietHoursUsage = allPreferences.filter(pref => pref.quietHoursStart).length;
            return {
                totalUsers,
                usersWithCustomPreferences,
                mostPopularPreferences,
                quietHoursUsage,
            };
        }
        catch (error) {
            this.logger.error('فشل في حساب إحصائيات التفضيلات', error);
            return {
                totalUsers: 0,
                usersWithCustomPreferences: 0,
                mostPopularPreferences: [],
                quietHoursUsage: 0,
            };
        }
    }
    async exportUserPreferences(userId) {
        try {
            const preferences = await this.getUserPreferences(userId);
            return {
                userId,
                preferences,
                exportedAt: new Date(),
                version: '1.0',
            };
        }
        catch (error) {
            this.logger.error(`فشل في تصدير تفضيلات المستخدم: ${userId}`, error);
            throw error;
        }
    }
    async importUserPreferences(userId, preferencesData, importedBy) {
        try {
            if (!preferencesData.preferences || !Array.isArray(preferencesData.preferences)) {
                throw new Error('بيانات التفضيلات غير صحيحة');
            }
            await this.updateUserPreferences(userId, preferencesData.preferences, importedBy);
            await this.auditService.log({
                action: 'USER_PREFERENCES_IMPORTED',
                entity: 'NotificationPreference',
                details: {
                    userId,
                    preferencesCount: preferencesData.preferences.length,
                    importedBy,
                    version: preferencesData.version,
                },
                module: 'notification',
                category: 'user_settings',
            });
            this.logger.log(`تم استيراد تفضيلات المستخدم بنجاح: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في استيراد تفضيلات المستخدم: ${userId}`, error);
            throw error;
        }
    }
    async createDefaultPreferencesForUser(userId) {
        try {
            this.logger.log(`إنشاء تفضيلات افتراضية للمستخدم: ${userId}`);
            const defaultPrefs = this.getDefaultPreferences();
            for (const pref of defaultPrefs) {
                await this.prisma.notificationPreference.create({
                    data: {
                        userId,
                        notificationType: pref.notificationType,
                        event: pref.event,
                        enabled: pref.enabled,
                        frequency: pref.frequency || 'immediate',
                        quietHoursStart: pref.quietHoursStart,
                        quietHoursEnd: pref.quietHoursEnd,
                    },
                });
            }
            this.logger.log(`تم إنشاء التفضيلات الافتراضية بنجاح للمستخدم: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء التفضيلات الافتراضية للمستخدم: ${userId}`, error);
        }
    }
    async updateGlobalPreferences(updates, updatedBy) {
        try {
            this.logger.log('تحديث التفضيلات الافتراضية العامة');
            Object.assign(this.defaultPreferences, updates);
            await this.auditService.log({
                action: 'GLOBAL_PREFERENCES_UPDATED',
                entity: 'NotificationPreference',
                details: {
                    updates,
                    updatedBy,
                },
                module: 'notification',
                category: 'system_settings',
            });
            this.logger.log('تم تحديث التفضيلات الافتراضية العامة بنجاح');
        }
        catch (error) {
            this.logger.error('فشل في تحديث التفضيلات الافتراضية العامة', error);
            throw error;
        }
    }
    isInQuietHours(startTime, endTime) {
        try {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const startMinutes = this.timeToMinutes(startTime);
            const endMinutes = this.timeToMinutes(endTime);
            if (startMinutes <= endMinutes) {
                return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            }
            else {
                return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
            }
        }
        catch (error) {
            return false;
        }
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    getDefaultPreferences() {
        const preferences = [];
        for (const [event, eventPrefs] of Object.entries(this.defaultPreferences)) {
            for (const [type, pref] of Object.entries(eventPrefs)) {
                preferences.push({
                    notificationType: type,
                    event,
                    enabled: pref.enabled,
                    frequency: pref.frequency,
                });
            }
        }
        return preferences;
    }
};
exports.NotificationPreferencesService = NotificationPreferencesService;
exports.NotificationPreferencesService = NotificationPreferencesService = NotificationPreferencesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], NotificationPreferencesService);
//# sourceMappingURL=notification-preferences.service.js.map