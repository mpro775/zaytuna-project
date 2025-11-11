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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_adapter_factory_1 = require("./adapters/payment-adapter.factory");
let WebhookController = WebhookController_1 = class WebhookController {
    paymentService;
    adapterFactory;
    logger = new common_1.Logger(WebhookController_1.name);
    constructor(paymentService, adapterFactory) {
        this.paymentService = paymentService;
        this.adapterFactory = adapterFactory;
    }
    async stripeWebhook(payload, signature) {
        try {
            this.logger.log('Received Stripe webhook');
            await this.paymentService.processWebhook({
                gateway: 'stripe',
                eventType: payload.type,
                transactionId: payload.data?.object?.id || payload.data?.object?.payment_intent,
                data: payload,
                signature,
            });
            return { received: true };
        }
        catch (error) {
            this.logger.error('Stripe webhook processing failed', error);
            throw error;
        }
    }
    async paypalWebhook(payload, transmissionId, transmissionTime, certUrl, signature) {
        try {
            this.logger.log('Received PayPal webhook');
            await this.paymentService.processWebhook({
                gateway: 'paypal',
                eventType: payload.event_type,
                transactionId: payload.resource?.id || payload.resource?.purchase_units?.[0]?.reference_id,
                data: payload,
                signature,
            });
            return { received: true };
        }
        catch (error) {
            this.logger.error('PayPal webhook processing failed', error);
            throw error;
        }
    }
    async tapWebhook(payload, signature) {
        try {
            this.logger.log('Received Tap webhook');
            await this.paymentService.processWebhook({
                gateway: 'tap',
                eventType: payload.type,
                transactionId: payload.data?.id || payload.data?.reference?.transaction,
                data: payload,
                signature,
            });
            return { received: true };
        }
        catch (error) {
            this.logger.error('Tap webhook processing failed', error);
            throw error;
        }
    }
    async genericWebhook(payload, headers, gateway) {
        try {
            this.logger.log(`Received ${gateway} webhook`);
            let transactionId;
            let eventType;
            switch (gateway) {
                case 'stripe':
                    transactionId = payload.data?.object?.id || payload.data?.object?.payment_intent;
                    eventType = payload.type;
                    break;
                case 'paypal':
                    transactionId = payload.resource?.id;
                    eventType = payload.event_type;
                    break;
                case 'tap':
                    transactionId = payload.data?.id;
                    eventType = payload.type;
                    break;
                default:
                    transactionId = payload.id || payload.transaction_id;
                    eventType = payload.event || payload.type || 'unknown';
            }
            await this.paymentService.processWebhook({
                gateway: gateway,
                eventType,
                transactionId,
                data: payload,
                signature: headers['signature'] || headers['stripe-signature'] || headers['x-tap-signature'],
            });
            return { received: true };
        }
        catch (error) {
            this.logger.error(`${gateway} webhook processing failed`, error);
            throw error;
        }
    }
    async testWebhook(payload, gateway) {
        try {
            this.logger.log(`Test webhook received for ${gateway}`);
            if (process.env.NODE_ENV !== 'production') {
                await this.paymentService.processWebhook({
                    gateway: gateway,
                    eventType: payload.event || payload.type || 'test',
                    transactionId: payload.transactionId || payload.id || 'test_transaction',
                    data: payload,
                });
            }
            return {
                received: true,
                gateway,
                mode: 'test',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Test webhook failed for ${gateway}`, error);
            throw error;
        }
    }
    async healthCheck(gateway) {
        try {
            const isAvailable = this.adapterFactory.isGatewayAvailable(gateway);
            return {
                gateway,
                status: 'healthy',
                available: isAvailable,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                gateway,
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "stripeWebhook", null);
__decorate([
    (0, common_1.Post)('paypal'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('paypal-transmission-id')),
    __param(2, (0, common_1.Headers)('paypal-transmission-time')),
    __param(3, (0, common_1.Headers)('paypal-cert-url')),
    __param(4, (0, common_1.Headers)('paypal-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "paypalWebhook", null);
__decorate([
    (0, common_1.Post)('tap'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-tap-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "tapWebhook", null);
__decorate([
    (0, common_1.Post)(':gateway'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)()),
    __param(2, (0, common_1.Param)('gateway')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "genericWebhook", null);
__decorate([
    (0, common_1.Post)('test/:gateway'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('gateway')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "testWebhook", null);
__decorate([
    (0, common_1.Post)('health/:gateway'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('gateway')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "healthCheck", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('payment/webhooks'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        payment_adapter_factory_1.PaymentAdapterFactory])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map