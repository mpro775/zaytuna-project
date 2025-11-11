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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    cacheService;
    configService;
    auditService;
    logger = new common_1.Logger(PaymentService_1.name);
    paymentCacheKey = 'payment_transactions';
    constructor(prisma, cacheService, configService, auditService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.configService = configService;
        this.auditService = auditService;
    }
    async processPayment(request, userId, ipAddress, userAgent) {
        try {
            this.logger.log(`معالجة دفعة جديدة: ${request.invoiceId} - ${request.amount} ${request.currency}`);
            await this.validatePaymentRequest(request);
            const transaction = await this.createPaymentTransaction(request, userId, ipAddress, userAgent);
            const result = await this.processGatewayPayment(transaction, request);
            await this.updateTransactionStatus(transaction.id, result.status, result.gatewayTransactionId, result.gatewayResponse);
            await this.auditService.log({
                action: 'PAYMENT_PROCESS',
                entity: 'PaymentTransaction',
                entityId: transaction.id,
                details: {
                    gateway: request.gateway,
                    method: request.method,
                    amount: request.amount,
                    currency: request.currency,
                    invoiceId: request.invoiceId,
                },
                newValues: {
                    status: result.status,
                    gatewayTransactionId: result.gatewayTransactionId,
                },
                module: 'payment',
                category: 'financial',
            });
            return result;
        }
        catch (error) {
            this.logger.error(`فشل في معالجة الدفعة: ${request.invoiceId}`, error);
            throw error;
        }
    }
    async processRefund(refundRequest, userId) {
        try {
            this.logger.log(`معالجة استرداد: ${refundRequest.transactionId} - ${refundRequest.amount}`);
            const originalTransaction = await this.prisma.paymentTransaction.findUnique({
                where: { transactionId: refundRequest.transactionId },
            });
            if (!originalTransaction) {
                throw new Error(`المعاملة غير موجودة: ${refundRequest.transactionId}`);
            }
            if (originalTransaction.status !== 'completed') {
                throw new Error(`لا يمكن استرداد معاملة في حالة: ${originalTransaction.status}`);
            }
            const totalRefunded = originalTransaction.refundAmount;
            const remainingAmount = Number(originalTransaction.amount) - Number(totalRefunded);
            if (refundRequest.amount > remainingAmount) {
                throw new Error(`مبلغ الاسترداد أكبر من المبلغ المتبقي: ${remainingAmount}`);
            }
            const refundResult = await this.processGatewayRefund(originalTransaction, refundRequest);
            await this.prisma.paymentTransaction.update({
                where: { id: originalTransaction.id },
                data: {
                    refundAmount: { increment: refundRequest.amount },
                    refundReason: refundRequest.reason,
                    refundMetadata: refundRequest.metadata,
                    refundedAt: new Date(),
                    status: refundRequest.amount >= Number(originalTransaction.amount) ? 'refunded' : 'partially_refunded',
                },
            });
            await this.auditService.log({
                action: 'PAYMENT_REFUND',
                entity: 'PaymentTransaction',
                entityId: originalTransaction.id,
                details: {
                    amount: refundRequest.amount,
                    reason: refundRequest.reason,
                    originalTransactionId: refundRequest.transactionId,
                },
                oldValues: { refundAmount: totalRefunded },
                newValues: { refundAmount: Number(totalRefunded) + refundRequest.amount },
                module: 'payment',
                category: 'financial',
            });
            return refundResult;
        }
        catch (error) {
            this.logger.error(`فشل في معالجة الاسترداد: ${refundRequest.transactionId}`, error);
            throw error;
        }
    }
    async processWebhook(webhookData) {
        try {
            this.logger.log(`معالجة webhook من ${webhookData.gateway}: ${webhookData.eventType}`);
            await this.validateWebhookSignature(webhookData);
            const transaction = await this.prisma.paymentTransaction.findFirst({
                where: {
                    transactionId: webhookData.transactionId,
                    gateway: webhookData.gateway,
                },
            });
            if (!transaction) {
                this.logger.warn(`معاملة غير موجودة لـ webhook: ${webhookData.transactionId}`);
                return;
            }
            await this.updateTransactionFromWebhook(transaction.id, webhookData);
            switch (webhookData.eventType) {
                case 'payment.succeeded':
                    await this.handlePaymentSuccess(transaction.id, webhookData.data);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailure(transaction.id, webhookData.data);
                    break;
                case 'refund.succeeded':
                    await this.handleRefundSuccess(transaction.id, webhookData.data);
                    break;
                case 'dispute.created':
                    await this.handleDisputeCreated(transaction.id, webhookData.data);
                    break;
            }
            this.logger.log(`تم معالجة webhook بنجاح: ${webhookData.transactionId}`);
        }
        catch (error) {
            this.logger.error(`فشل في معالجة webhook: ${webhookData.transactionId}`, error);
            throw error;
        }
    }
    async getPaymentStats(branchId, startDate, endDate) {
        try {
            const cacheKey = `payment_stats:${branchId || 'all'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;
            const cachedStats = await this.cacheService.get(cacheKey);
            if (cachedStats) {
                return cachedStats;
            }
            const where = {};
            if (branchId)
                where.branchId = branchId;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate)
                    where.createdAt.gte = startDate;
                if (endDate)
                    where.createdAt.lte = endDate;
            }
            const transactions = await this.prisma.paymentTransaction.findMany({
                where,
                select: {
                    status: true,
                    amount: true,
                    refundAmount: true,
                    gateway: true,
                    createdAt: true,
                },
            });
            const stats = {
                totalTransactions: transactions.length,
                totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
                successfulTransactions: transactions.filter(t => t.status === 'completed').length,
                failedTransactions: transactions.filter(t => t.status === 'failed').length,
                pendingTransactions: transactions.filter(t => ['pending', 'processing'].includes(t.status)).length,
                refundedAmount: transactions.reduce((sum, t) => sum + Number(t.refundAmount), 0),
                gatewayStats: this.calculateGatewayStats(transactions),
                dailyStats: this.calculateDailyStats(transactions),
            };
            await this.cacheService.set(cacheKey, stats, { ttl: 1800 });
            return stats;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الدفع', error);
            throw error;
        }
    }
    async reconcileTransactions(gateway, startDate, endDate) {
        try {
            this.logger.log(`بدء تسوية المعاملات لـ ${gateway} من ${startDate.toISOString()} إلى ${endDate.toISOString()}`);
            const systemTransactions = await this.prisma.paymentTransaction.findMany({
                where: {
                    gateway,
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    status: 'completed',
                },
                select: {
                    transactionId: true,
                    amount: true,
                    fee: true,
                    gatewayResponse: true,
                },
            });
            const gatewayTransactions = await this.fetchGatewayTransactions(gateway, startDate, endDate);
            const result = this.compareTransactions(systemTransactions, gatewayTransactions);
            await this.auditService.log({
                action: 'PAYMENT_RECONCILIATION',
                entity: 'PaymentTransaction',
                entityId: `reconciliation_${gateway}_${startDate.getTime()}`,
                details: {
                    gateway,
                    period: { startDate, endDate },
                    result,
                },
                module: 'payment',
                category: 'financial',
            });
            return result;
        }
        catch (error) {
            this.logger.error(`فشل في تسوية المعاملات لـ ${gateway}`, error);
            throw error;
        }
    }
    async validatePaymentRequest(request) {
        if (request.amount <= 0) {
            throw new Error('مبلغ الدفع يجب أن يكون أكبر من صفر');
        }
        if (!['sales', 'purchase'].includes(request.invoiceType)) {
            throw new Error('نوع الفاتورة غير صحيح');
        }
        if (request.invoiceType === 'sales') {
            const invoice = await this.prisma.salesInvoice.findUnique({
                where: { id: request.invoiceId },
            });
            if (!invoice) {
                throw new Error('فاتورة المبيعات غير موجودة');
            }
        }
        else {
            const invoice = await this.prisma.purchaseInvoice.findUnique({
                where: { id: request.invoiceId },
            });
            if (!invoice) {
                throw new Error('فاتورة المشتريات غير موجودة');
            }
        }
        const supportedGateways = ['stripe', 'paypal', 'tap', 'local'];
        if (!supportedGateways.includes(request.gateway)) {
            throw new Error(`البوابة غير مدعومة: ${request.gateway}`);
        }
    }
    async createPaymentTransaction(request, userId, ipAddress, userAgent) {
        return this.prisma.paymentTransaction.create({
            data: {
                transactionId: this.generateTransactionId(request.gateway),
                invoiceId: request.invoiceId,
                invoiceType: request.invoiceType,
                branchId: request.branchId,
                customerId: request.customerId,
                supplierId: request.supplierId,
                gateway: request.gateway,
                method: request.method,
                currency: request.currency,
                amount: request.amount,
                description: request.description,
                metadata: request.metadata,
                ipAddress,
                userAgent,
                processedBy: userId,
                processedAt: new Date(),
            },
        });
    }
    async processGatewayPayment(transaction, request) {
        try {
            switch (request.gateway) {
                case 'stripe':
                    return this.processStripePayment(transaction, request);
                case 'paypal':
                    return this.processPayPalPayment(transaction, request);
                case 'tap':
                    return this.processTapPayment(transaction, request);
                case 'local':
                    return this.processLocalPayment(transaction, request);
                default:
                    throw new Error(`البوابة غير مدعومة: ${request.gateway}`);
            }
        }
        catch (error) {
            this.logger.error(`فشل في معالجة الدفع للبوابة ${request.gateway}`, error);
            return {
                transactionId: transaction.transactionId,
                status: 'failed',
                gatewayResponse: { error: error.message },
            };
        }
    }
    async processStripePayment(transaction, request) {
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('مفتاح Stripe غير مكون');
        }
        return {
            transactionId: transaction.transactionId,
            status: 'success',
            gatewayTransactionId: `stripe_${Date.now()}`,
            gatewayResponse: {
                id: `stripe_${Date.now()}`,
                amount: request.amount * 100,
                currency: request.currency.toLowerCase(),
                status: 'succeeded',
            },
        };
    }
    async processPayPalPayment(transaction, request) {
        const paypalClientId = this.configService.get('PAYPAL_CLIENT_ID');
        if (!paypalClientId) {
            throw new Error('معرف PayPal غير مكون');
        }
        return {
            transactionId: transaction.transactionId,
            status: 'success',
            gatewayTransactionId: `paypal_${Date.now()}`,
            gatewayResponse: {
                id: `paypal_${Date.now()}`,
                amount: request.amount,
                currency: request.currency,
                status: 'COMPLETED',
            },
        };
    }
    async processTapPayment(transaction, request) {
        const tapApiKey = this.configService.get('TAP_API_KEY');
        if (!tapApiKey) {
            throw new Error('مفتاح Tap API غير مكون');
        }
        return {
            transactionId: transaction.transactionId,
            status: 'success',
            gatewayTransactionId: `tap_${Date.now()}`,
            gatewayResponse: {
                id: `tap_${Date.now()}`,
                amount: request.amount * 1000,
                currency: request.currency,
                status: 'CAPTURED',
            },
        };
    }
    async processLocalPayment(transaction, request) {
        return {
            transactionId: transaction.transactionId,
            status: 'success',
            gatewayTransactionId: `local_${Date.now()}`,
            gatewayResponse: {
                method: request.method,
                processed_by: 'cashier',
                timestamp: new Date().toISOString(),
            },
        };
    }
    async processGatewayRefund(transaction, refundRequest) {
        switch (transaction.gateway) {
            case 'stripe':
                return this.processStripeRefund(transaction, refundRequest);
            case 'paypal':
                return this.processPayPalRefund(transaction, refundRequest);
            case 'tap':
                return this.processTapRefund(transaction, refundRequest);
            case 'local':
                return this.processLocalRefund(transaction, refundRequest);
            default:
                throw new Error(`البوابة غير مدعومة للاسترداد: ${transaction.gateway}`);
        }
    }
    async processStripeRefund(transaction, refundRequest) {
        return {
            refundId: `refund_stripe_${Date.now()}`,
            status: 'success',
            refundAmount: refundRequest.amount,
            gatewayRefundId: `stripe_refund_${Date.now()}`,
        };
    }
    async processPayPalRefund(transaction, refundRequest) {
        return {
            refundId: `refund_paypal_${Date.now()}`,
            status: 'success',
            refundAmount: refundRequest.amount,
            gatewayRefundId: `paypal_refund_${Date.now()}`,
        };
    }
    async processTapRefund(transaction, refundRequest) {
        return {
            refundId: `refund_tap_${Date.now()}`,
            status: 'success',
            refundAmount: refundRequest.amount,
            gatewayRefundId: `tap_refund_${Date.now()}`,
        };
    }
    async processLocalRefund(transaction, refundRequest) {
        return {
            refundId: `refund_local_${Date.now()}`,
            status: 'success',
            refundAmount: refundRequest.amount,
            gatewayRefundId: `local_refund_${Date.now()}`,
        };
    }
    async validateWebhookSignature(webhookData) {
        if (!webhookData.signature) {
            throw new Error('توقيع Webhook مفقود');
        }
    }
    async updateTransactionFromWebhook(transactionId, webhookData) {
        const updateData = {
            gatewayResponse: webhookData.data,
        };
        switch (webhookData.eventType) {
            case 'payment.succeeded':
                updateData.status = 'completed';
                updateData.completedAt = new Date();
                break;
            case 'payment.failed':
                updateData.status = 'failed';
                break;
            case 'refund.succeeded':
                updateData.status = 'refunded';
                updateData.refundedAt = new Date();
                break;
        }
        await this.prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: updateData,
        });
    }
    async handlePaymentSuccess(transactionId, data) {
        await this.prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: {
                status: 'completed',
                completedAt: new Date(),
                gatewayResponse: data,
            },
        });
        this.logger.log(`تم تأكيد نجاح الدفع: ${transactionId}`);
    }
    async handlePaymentFailure(transactionId, data) {
        await this.prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: {
                status: 'failed',
                gatewayResponse: data,
            },
        });
        this.logger.warn(`فشل في الدفع: ${transactionId}`);
    }
    async handleRefundSuccess(transactionId, data) {
        this.logger.log(`تم تأكيد نجاح الاسترداد: ${transactionId}`);
    }
    async handleDisputeCreated(transactionId, data) {
        await this.auditService.log({
            action: 'PAYMENT_DISPUTE',
            entity: 'PaymentTransaction',
            entityId: transactionId,
            details: data,
            module: 'payment',
            category: 'financial',
        });
        this.logger.warn(`تم إنشاء نزاع للمعاملة: ${transactionId}`);
    }
    async updateTransactionStatus(transactionId, status, gatewayTransactionId, gatewayResponse) {
        const updateData = { status };
        if (gatewayTransactionId) {
            updateData.externalId = gatewayTransactionId;
        }
        if (gatewayResponse) {
            updateData.gatewayResponse = gatewayResponse;
        }
        if (status === 'completed') {
            updateData.completedAt = new Date();
        }
        await this.prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: updateData,
        });
    }
    generateTransactionId(gateway) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `txn_${gateway}_${timestamp}_${random}`;
    }
    calculateGatewayStats(transactions) {
        const gatewayStats = {};
        transactions.forEach(transaction => {
            const gateway = transaction.gateway;
            if (!gatewayStats[gateway]) {
                gatewayStats[gateway] = {
                    transactions: 0,
                    amount: 0,
                    successRate: 0,
                };
            }
            gatewayStats[gateway].transactions++;
            gatewayStats[gateway].amount += Number(transaction.amount);
        });
        Object.keys(gatewayStats).forEach(gateway => {
            const gatewayTransactions = transactions.filter(t => t.gateway === gateway);
            const successful = gatewayTransactions.filter(t => t.status === 'completed').length;
            gatewayStats[gateway].successRate = gatewayTransactions.length > 0
                ? (successful / gatewayTransactions.length) * 100
                : 0;
        });
        return gatewayStats;
    }
    calculateDailyStats(transactions) {
        const dailyStats = {};
        transactions.forEach(transaction => {
            const date = transaction.createdAt.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    transactions: 0,
                    amount: 0,
                };
            }
            dailyStats[date].transactions++;
            dailyStats[date].amount += Number(transaction.amount);
        });
        return Object.values(dailyStats).sort((a, b) => b.date.localeCompare(a.date));
    }
    async fetchGatewayTransactions(gateway, startDate, endDate) {
        return [
            {
                transactionId: `gateway_${gateway}_1`,
                amount: 100.00,
                status: 'completed',
            },
            {
                transactionId: `gateway_${gateway}_2`,
                amount: 200.00,
                status: 'completed',
            },
        ];
    }
    compareTransactions(systemTransactions, gatewayTransactions) {
        const matched = [];
        const unmatched = [];
        const discrepancies = [];
        let systemTotal = 0;
        let gatewayTotal = 0;
        systemTransactions.forEach(systemTx => {
            const gatewayTx = gatewayTransactions.find(gt => gt.transactionId === systemTx.transactionId);
            if (gatewayTx) {
                matched.push(systemTx);
                systemTotal += Number(systemTx.amount);
                gatewayTotal += Number(gatewayTx.amount);
                if (Number(systemTx.amount) !== Number(gatewayTx.amount)) {
                    discrepancies.push({
                        transactionId: systemTx.transactionId,
                        issue: 'مبلغ مختلف',
                        amount: Number(systemTx.amount) - Number(gatewayTx.amount),
                    });
                }
            }
            else {
                unmatched.push(systemTx);
                systemTotal += Number(systemTx.amount);
            }
        });
        return {
            matched: matched.length,
            unmatched: unmatched.length,
            discrepancies: discrepancies.length,
            totalAmount: systemTotal,
            gatewayAmount: gatewayTotal,
            difference: systemTotal - gatewayTotal,
            issues: discrepancies,
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => audit_service_1.AuditService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map