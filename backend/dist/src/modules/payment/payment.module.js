"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_controller_1 = require("./payment.controller");
const webhook_controller_1 = require("./webhook.controller");
const payment_adapter_factory_1 = require("./adapters/payment-adapter.factory");
const payment_security_service_1 = require("./payment-security.service");
const refund_service_1 = require("./refund.service");
const reconciliation_service_1 = require("./reconciliation.service");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const audit_module_1 = require("../audit/audit.module");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [payment_controller_1.PaymentController, webhook_controller_1.WebhookController],
        providers: [
            payment_service_1.PaymentService,
            payment_adapter_factory_1.PaymentAdapterFactory,
            payment_security_service_1.PaymentSecurityService,
            refund_service_1.RefundService,
            reconciliation_service_1.ReconciliationService,
            prisma_service_1.PrismaService,
            cache_service_1.CacheService,
        ],
        exports: [
            payment_service_1.PaymentService,
            payment_adapter_factory_1.PaymentAdapterFactory,
            payment_security_service_1.PaymentSecurityService,
            refund_service_1.RefundService,
            reconciliation_service_1.ReconciliationService,
        ],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map