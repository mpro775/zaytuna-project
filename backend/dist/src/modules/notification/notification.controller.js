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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const notification_service_1 = require("./notification.service");
const notification_template_service_1 = require("./notification-template.service");
const notification_preferences_service_1 = require("./notification-preferences.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let NotificationController = class NotificationController {
    notificationService;
    templateService;
    preferencesService;
    constructor(notificationService, templateService, preferencesService) {
        this.notificationService = notificationService;
        this.templateService = templateService;
        this.preferencesService = preferencesService;
    }
    async sendNotification(request, userId) {
        return this.notificationService.sendNotification(request, userId);
    }
    async sendTemplatedNotification(templateName, body, userId) {
        return this.notificationService.sendTemplatedNotification(templateName, body.variables, body.recipientId, body.recipientType, userId);
    }
    async sendBulkNotifications(body, userId) {
        return this.notificationService.sendBulkNotifications(body.notifications, userId);
    }
    async scheduleNotification(body, userId) {
        const scheduledAt = new Date(body.scheduledAt);
        return this.notificationService.scheduleNotification(body.notification, scheduledAt, userId);
    }
    async createTemplate(body, userId) {
        return this.templateService.createTemplate(body, userId);
    }
    async updateTemplate(templateId, body, userId) {
        return this.templateService.updateTemplate(templateId, body, userId);
    }
    async deleteTemplate(templateId, userId) {
        await this.templateService.deleteTemplate(templateId, userId);
        return { message: 'تم حذف القالب بنجاح' };
    }
    async getTemplate(templateId) {
        return this.templateService.getTemplate(templateId);
    }
    async searchTemplates(query) {
        return this.templateService.searchTemplates(query);
    }
    async getDefaultTemplate(event, type) {
        return this.templateService.getDefaultTemplate(event, type);
    }
    async getTemplateVariables(event, module) {
        return this.templateService.getTemplateVariables(event, module);
    }
    async previewTemplate(templateId, body) {
        return this.templateService.previewTemplate(templateId, body.variables);
    }
    async cloneTemplate(templateId, body, userId) {
        return this.templateService.cloneTemplate(templateId, body.newName, userId);
    }
    async getAvailableEvents() {
        return this.templateService.getAvailableEvents();
    }
    async getUserPreferences(userId) {
        return this.preferencesService.getUserPreferences(userId);
    }
    async updateUserPreferences(userId, body, updatedBy) {
        await this.preferencesService.updateUserPreferences(userId, body.preferences, updatedBy);
        return { message: 'تم تحديث التفضيلات بنجاح' };
    }
    async resetUserPreferences(userId, resetBy) {
        await this.preferencesService.resetUserPreferences(userId, resetBy);
        return { message: 'تم إعادة تعيين التفضيلات للافتراضية' };
    }
    async getDefaultPreferences() {
        return this.preferencesService.getDefaultPreferences();
    }
    async getPreferencesStats() {
        return this.preferencesService.getPreferencesStats();
    }
    async exportUserPreferences(userId) {
        return this.preferencesService.exportUserPreferences(userId);
    }
    async importUserPreferences(userId, body, importedBy) {
        await this.preferencesService.importUserPreferences(userId, body, importedBy);
        return { message: 'تم استيراد التفضيلات بنجاح' };
    }
    async getNotificationStats(branchId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.notificationService.getNotificationStats(branchId, start, end);
    }
    async getNotificationReport(branchId, startDate, endDate, type, status, format = 'json') {
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
    async createDefaultTemplates() {
        await this.templateService.createDefaultTemplates();
        return { message: 'تم إنشاء القوالب الافتراضية بنجاح' };
    }
    async createDefaultPreferencesForUser(userId) {
        await this.preferencesService.createDefaultPreferencesForUser(userId);
        return { message: 'تم إنشاء التفضيلات الافتراضية للمستخدم' };
    }
    async updateGlobalPreferences(updates, updatedBy) {
        await this.preferencesService.updateGlobalPreferences(updates, updatedBy);
        return { message: 'تم تحديث التفضيلات الافتراضية العامة' };
    }
    async getProvidersInfo() {
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
    async testNotification(body) {
        const testMessage = body.message || `رسالة اختبار من نظام الإشعارات - ${new Date().toISOString()}`;
        const request = {
            title: 'اختبار النظام',
            message: testMessage,
            type: body.type,
            recipientId: body.recipient,
            recipientType: 'admin',
        };
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
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)('send'),
    (0, permissions_decorator_1.Permissions)('notifications.send'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('send-template/:templateName'),
    (0, permissions_decorator_1.Permissions)('notifications.send'),
    __param(0, (0, common_1.Param)('templateName')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendTemplatedNotification", null);
__decorate([
    (0, common_1.Post)('send-bulk'),
    (0, permissions_decorator_1.Permissions)('notifications.send_bulk'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendBulkNotifications", null);
__decorate([
    (0, common_1.Post)('schedule'),
    (0, permissions_decorator_1.Permissions)('notifications.schedule'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "scheduleNotification", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:templateId'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.update'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:templateId'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.delete'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('templates/:templateId'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.read'),
    __param(0, (0, common_1.Param)('templateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "searchTemplates", null);
__decorate([
    (0, common_1.Get)('templates/default/:event/:type'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.read'),
    __param(0, (0, common_1.Param)('event')),
    __param(1, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getDefaultTemplate", null);
__decorate([
    (0, common_1.Get)('templates/variables/:event/:module'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.read'),
    __param(0, (0, common_1.Param)('event')),
    __param(1, (0, common_1.Param)('module')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getTemplateVariables", null);
__decorate([
    (0, common_1.Post)('templates/:templateId/preview'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.read'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "previewTemplate", null);
__decorate([
    (0, common_1.Post)('templates/:templateId/clone'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.create'),
    __param(0, (0, common_1.Param)('templateId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "cloneTemplate", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, permissions_decorator_1.Permissions)('notifications.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getAvailableEvents", null);
__decorate([
    (0, common_1.Get)('preferences/:userId'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.read'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getUserPreferences", null);
__decorate([
    (0, common_1.Put)('preferences/:userId'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.update'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('updatedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateUserPreferences", null);
__decorate([
    (0, common_1.Post)('preferences/:userId/reset'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.update'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('resetBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "resetUserPreferences", null);
__decorate([
    (0, common_1.Get)('preferences/default'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getDefaultPreferences", null);
__decorate([
    (0, common_1.Get)('preferences/stats'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getPreferencesStats", null);
__decorate([
    (0, common_1.Get)('preferences/:userId/export'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.read'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "exportUserPreferences", null);
__decorate([
    (0, common_1.Post)('preferences/:userId/import'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.update'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Query)('importedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "importUserPreferences", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('notifications.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotificationStats", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, permissions_decorator_1.Permissions)('notifications.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotificationReport", null);
__decorate([
    (0, common_1.Post)('templates/default/create'),
    (0, permissions_decorator_1.Permissions)('notifications.templates.create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createDefaultTemplates", null);
__decorate([
    (0, common_1.Post)('preferences/:userId/default'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.update'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createDefaultPreferencesForUser", null);
__decorate([
    (0, common_1.Put)('preferences/global'),
    (0, permissions_decorator_1.Permissions)('notifications.preferences.update'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('updatedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateGlobalPreferences", null);
__decorate([
    (0, common_1.Get)('providers/info'),
    (0, permissions_decorator_1.Permissions)('notifications.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getProvidersInfo", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, permissions_decorator_1.Permissions)('notifications.send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "testNotification", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService,
        notification_template_service_1.NotificationTemplateService,
        notification_preferences_service_1.NotificationPreferencesService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map