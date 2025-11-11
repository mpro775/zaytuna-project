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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const payment_adapter_factory_1 = require("./adapters/payment-adapter.factory");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let PaymentController = class PaymentController {
    paymentService;
    adapterFactory;
    constructor(paymentService, adapterFactory) {
        this.paymentService = paymentService;
        this.adapterFactory = adapterFactory;
    }
    async processPayment(request) {
        return this.paymentService.processPayment(request, 'user_123', '127.0.0.1', 'Test Agent');
    }
    async processRefund(refundRequest) {
        return this.paymentService.processRefund(refundRequest, 'user_123');
    }
    async getTransaction(transactionId) {
        return {
            transactionId,
            status: 'unknown',
            message: 'سيتم تنفيذ استرجاع تفاصيل المعاملة قريباً',
        };
    }
    async getUserTransactions(page = 1, limit = 20, status) {
        return {
            transactions: [],
            pagination: {
                page: parseInt(page.toString()),
                limit: parseInt(limit.toString()),
                total: 0,
                totalPages: 0,
            },
            message: 'سيتم تنفيذ استرجاع معاملات المستخدم قريباً',
        };
    }
    async getPaymentStats(branchId, startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.paymentService.getPaymentStats(branchId, start, end);
    }
    async getAvailableGateways() {
        const gateways = this.adapterFactory.getAvailableGateways();
        const gatewayInfo = gateways.map(gateway => this.adapterFactory.getGatewayInfo(gateway));
        return {
            gateways: gatewayInfo,
            total: gateways.length,
        };
    }
    async getGatewayInfo(gateway) {
        const info = this.adapterFactory.getGatewayInfo(gateway);
        const isAvailable = this.adapterFactory.isGatewayAvailable(gateway);
        return {
            ...info,
            available: isAvailable,
        };
    }
    async createPaymentLink(request) {
        try {
            const adapter = this.adapterFactory.getAdapter(request.gateway);
            if (!adapter.createPaymentLink) {
                throw new Error(`البوابة ${request.gateway} لا تدعم إنشاء روابط الدفع`);
            }
            const link = await adapter.createPaymentLink(request);
            return {
                gateway: request.gateway,
                paymentLink: link,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            };
        }
        catch (error) {
            throw new Error(`فشل في إنشاء رابط الدفع: ${error.message}`);
        }
    }
    async createPaymentQR(request) {
        try {
            const adapter = this.adapterFactory.getAdapter(request.gateway);
            if (!adapter.createPaymentQR) {
                throw new Error(`البوابة ${request.gateway} لا تدعم إنشاء QR codes`);
            }
            const qrCode = await adapter.createPaymentQR(request);
            return {
                gateway: request.gateway,
                qrCode,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            };
        }
        catch (error) {
            throw new Error(`فشل في إنشاء QR code: ${error.message}`);
        }
    }
    async checkCurrencySupport(gateway, currency) {
        const isSupported = this.adapterFactory.isCurrencySupported(gateway, currency);
        return {
            gateway,
            currency: currency.toUpperCase(),
            supported: isSupported,
        };
    }
    async checkMethodSupport(gateway, method) {
        const isSupported = this.adapterFactory.isMethodSupported(gateway, method);
        return {
            gateway,
            method,
            supported: isSupported,
        };
    }
    async getGatewaysForCurrency(currency) {
        const gateways = this.adapterFactory.getGatewaysForCurrency(currency);
        const gatewayInfo = gateways.map(gateway => this.adapterFactory.getGatewayInfo(gateway));
        return {
            currency: currency.toUpperCase(),
            gateways: gatewayInfo,
            total: gateways.length,
        };
    }
    async getGatewaysForMethod(method) {
        const gateways = this.adapterFactory.getGatewaysForMethod(method);
        const gatewayInfo = gateways.map(gateway => this.adapterFactory.getGatewayInfo(gateway));
        return {
            method,
            gateways: gatewayInfo,
            total: gateways.length,
        };
    }
    async reconcileTransactions(body) {
        const startDate = new Date(body.startDate);
        const endDate = new Date(body.endDate);
        return this.paymentService.reconcileTransactions(body.gateway, startDate, endDate);
    }
    async getPaymentReport(gateway, status, startDate, endDate, format = 'json') {
        return {
            report: {
                gateway: gateway || 'all',
                status: status || 'all',
                period: {
                    start: startDate || 'all',
                    end: endDate || 'all',
                },
                format,
            },
            data: [],
            message: 'سيتم تنفيذ إنشاء تقرير الدفع قريباً',
        };
    }
    async getPaymentPerformance(gateway, period = 'day') {
        return {
            gateway: gateway || 'all',
            period,
            metrics: {
                totalTransactions: 0,
                successRate: 0,
                averageProcessingTime: 0,
                errorRate: 0,
            },
            trends: [],
            message: 'سيتم تنفيذ إحصائيات الأداء قريباً',
        };
    }
    async stripePaymentSuccess(paymentIntentId, status) {
        return {
            gateway: 'stripe',
            paymentIntentId,
            status,
            message: 'تم إكمال الدفع بنجاح',
            redirect: '/payment/success',
        };
    }
    async stripePaymentCancel(paymentIntentId) {
        return {
            gateway: 'stripe',
            paymentIntentId,
            status: 'cancelled',
            message: 'تم إلغاء الدفع',
            redirect: '/payment/cancelled',
        };
    }
    async paypalCallback(token, payerId) {
        return {
            gateway: 'paypal',
            token,
            payerId,
            message: 'تم استلام callback من PayPal',
            redirect: '/payment/processing',
        };
    }
    async tapCallback(tapId, reference) {
        return {
            gateway: 'tap',
            tapId,
            reference,
            message: 'تم استلام callback من Tap',
            redirect: '/payment/processing',
        };
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('process'),
    (0, permissions_decorator_1.Permissions)('payment.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)('refund'),
    (0, permissions_decorator_1.Permissions)('payment.refund'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "processRefund", null);
__decorate([
    (0, common_1.Get)('transaction/:transactionId'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Param)('transactionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getTransaction", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getUserTransactions", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentStats", null);
__decorate([
    (0, common_1.Get)('gateways'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getAvailableGateways", null);
__decorate([
    (0, common_1.Get)('gateways/:gateway'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Param)('gateway')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getGatewayInfo", null);
__decorate([
    (0, common_1.Post)('create-link'),
    (0, permissions_decorator_1.Permissions)('payment.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymentLink", null);
__decorate([
    (0, common_1.Post)('create-qr'),
    (0, permissions_decorator_1.Permissions)('payment.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymentQR", null);
__decorate([
    (0, common_1.Get)('gateways/:gateway/currency/:currency'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Param)('gateway')),
    __param(1, (0, common_1.Param)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "checkCurrencySupport", null);
__decorate([
    (0, common_1.Get)('gateways/:gateway/method/:method'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Param)('gateway')),
    __param(1, (0, common_1.Param)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "checkMethodSupport", null);
__decorate([
    (0, common_1.Get)('gateways/currency/:currency'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Param)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getGatewaysForCurrency", null);
__decorate([
    (0, common_1.Get)('gateways/method/:method'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Param)('method')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getGatewaysForMethod", null);
__decorate([
    (0, common_1.Post)('reconcile'),
    (0, permissions_decorator_1.Permissions)('payment.admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "reconcileTransactions", null);
__decorate([
    (0, common_1.Get)('reports/transactions'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Query)('gateway')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentReport", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, permissions_decorator_1.Permissions)('payment.read'),
    __param(0, (0, common_1.Query)('gateway')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getPaymentPerformance", null);
__decorate([
    (0, common_1.Get)('stripe/success'),
    __param(0, (0, common_1.Query)('payment_intent')),
    __param(1, (0, common_1.Query)('redirect_status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "stripePaymentSuccess", null);
__decorate([
    (0, common_1.Get)('stripe/cancel'),
    __param(0, (0, common_1.Query)('payment_intent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "stripePaymentCancel", null);
__decorate([
    (0, common_1.Get)('paypal/callback'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Query)('PayerID')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "paypalCallback", null);
__decorate([
    (0, common_1.Get)('tap/callback'),
    __param(0, (0, common_1.Query)('tap_id')),
    __param(1, (0, common_1.Query)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "tapCallback", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        payment_adapter_factory_1.PaymentAdapterFactory])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map