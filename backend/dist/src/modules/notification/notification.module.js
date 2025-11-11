"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const notification_controller_1 = require("./notification.controller");
const notification_service_1 = require("./notification.service");
const notification_template_service_1 = require("./notification-template.service");
const notification_preferences_service_1 = require("./notification-preferences.service");
const notification_queue_service_1 = require("./notification-queue.service");
const email_provider_1 = require("./providers/email.provider");
const sms_provider_1 = require("./providers/sms.provider");
const whatsapp_provider_1 = require("./providers/whatsapp.provider");
const prisma_service_1 = require("../../shared/database/prisma.service");
const audit_module_1 = require("../audit/audit.module");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [notification_controller_1.NotificationController],
        providers: [
            notification_service_1.NotificationService,
            notification_template_service_1.NotificationTemplateService,
            notification_preferences_service_1.NotificationPreferencesService,
            notification_queue_service_1.NotificationQueueService,
            email_provider_1.EmailProvider,
            sms_provider_1.SMSProvider,
            whatsapp_provider_1.WhatsAppProvider,
            prisma_service_1.PrismaService,
        ],
        exports: [
            notification_service_1.NotificationService,
            notification_template_service_1.NotificationTemplateService,
            notification_preferences_service_1.NotificationPreferencesService,
            notification_queue_service_1.NotificationQueueService,
        ],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map