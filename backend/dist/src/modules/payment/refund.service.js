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
var RefundService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const payment_adapter_factory_1 = require("./adapters/payment-adapter.factory");
const payment_security_service_1 = require("./payment-security.service");
let RefundService = RefundService_1 = class RefundService {
    prisma;
    auditService;
    adapterFactory;
    securityService;
    logger = new common_1.Logger(RefundService_1.name);
    refundPolicy = {
        maxRefundDays: 30,
        minRefundAmount: 1,
        maxRefundAmount: 10000,
        allowPartialRefunds: true,
        requireApproval: false,
        approvalThreshold: 1000,
        supportedReasons: [
            'customer_request',
            'defective_product',
            'wrong_item',
            'duplicate_charge',
            'fraudulent',
            'expired_product',
            'size_issue',
            'color_issue',
            'quality_issue',
            'late_delivery',
            'other',
        ],
    };
    constructor(prisma, auditService, adapterFactory, securityService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.adapterFactory = adapterFactory;
        this.securityService = securityService;
    }
    async processRefund(refundRequest, userId) {
        try {
            this.logger.log(`معالجة طلب استرداد: ${refundRequest.transactionId} - ${refundRequest.amount}`);
            await this.validateRefundRequest(refundRequest);
            const originalTransaction = await this.prisma.paymentTransaction.findUnique({
                where: { transactionId: refundRequest.transactionId },
            });
            if (!originalTransaction) {
                throw new Error(`المعاملة غير موجودة: ${refundRequest.transactionId}`);
            }
            await this.checkRefundEligibility(originalTransaction, refundRequest);
            const refundRecord = await this.createRefundRecord(originalTransaction, refundRequest, userId);
            const refundResult = await this.processGatewayRefund(originalTransaction, refundRequest);
            await this.updateRefundRecord(refundRecord.id, refundResult);
            await this.updateOriginalTransaction(originalTransaction.id, refundRequest.amount);
            await this.auditService.log({
                action: 'PAYMENT_REFUND',
                entity: 'PaymentTransaction',
                entityId: originalTransaction.id,
                details: {
                    refundAmount: refundRequest.amount,
                    reason: refundRequest.reason,
                    gateway: originalTransaction.gateway,
                    originalAmount: Number(originalTransaction.amount),
                },
                oldValues: { refundAmount: Number(originalTransaction.refundAmount) },
                newValues: { refundAmount: Number(originalTransaction.refundAmount) + refundRequest.amount },
                module: 'payment',
                category: 'financial',
            });
            const remainingAmount = Number(originalTransaction.amount) - Number(originalTransaction.refundAmount) - refundRequest.amount;
            return {
                refundId: refundRecord.id,
                status: refundResult.status,
                refundAmount: refundRequest.amount,
                remainingAmount: Math.max(0, remainingAmount),
                gatewayRefundId: refundResult.gatewayRefundId,
                processedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`فشل في معالجة الاسترداد: ${refundRequest.transactionId}`, error);
            throw error;
        }
    }
    getRefundPolicy() {
        return { ...this.refundPolicy };
    }
    async updateRefundPolicy(policy) {
        try {
            Object.assign(this.refundPolicy, policy);
            await this.auditService.log({
                action: 'REFUND_POLICY_UPDATE',
                entity: 'RefundPolicy',
                entityId: 'global_refund_policy',
                details: policy,
                module: 'payment',
                category: 'configuration',
            });
            return { ...this.refundPolicy };
        }
        catch (error) {
            this.logger.error('فشل في تحديث سياسة الاسترداد', error);
            throw error;
        }
    }
    async getRefundStats(branchId, startDate, endDate) {
        try {
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
            const transactionsWithRefunds = await this.prisma.paymentTransaction.findMany({
                where: {
                    ...where,
                    refundAmount: { gt: 0 },
                },
                select: {
                    amount: true,
                    refundAmount: true,
                    refundReason: true,
                    status: true,
                    createdAt: true,
                    processedAt: true,
                },
            });
            const totalSalesResult = await this.prisma.paymentTransaction.aggregate({
                where: {
                    ...where,
                    status: 'completed',
                },
                _sum: {
                    amount: true,
                },
            });
            const totalSales = Number(totalSalesResult._sum.amount || 0);
            const totalRefunds = transactionsWithRefunds.reduce((sum, t) => sum + Number(t.refundAmount), 0);
            const commonReasons = {};
            transactionsWithRefunds.forEach(transaction => {
                if (transaction.refundReason) {
                    commonReasons[transaction.refundReason] = (commonReasons[transaction.refundReason] || 0) + 1;
                }
            });
            const completedRefunds = transactionsWithRefunds.filter(t => t.processedAt);
            const averageProcessingTime = completedRefunds.length > 0
                ? completedRefunds.reduce((sum, t) => sum + (t.processedAt.getTime() - t.createdAt.getTime()), 0) / completedRefunds.length
                : 0;
            return {
                totalRefunds: transactionsWithRefunds.length,
                totalRefundAmount: totalRefunds,
                successfulRefunds: transactionsWithRefunds.filter(t => t.status === 'refunded' || t.status === 'partially_refunded').length,
                failedRefunds: 0,
                pendingRefunds: 0,
                averageProcessingTime,
                refundRate: totalSales > 0 ? (totalRefunds / totalSales) * 100 : 0,
                commonReasons,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الاسترداد', error);
            throw error;
        }
    }
    async cancelRefund(refundId, userId) {
        try {
            this.logger.log(`إلغاء الاسترداد: ${refundId}`);
            await this.auditService.log({
                action: 'REFUND_CANCELLED',
                entity: 'RefundRecord',
                entityId: refundId,
                details: { cancelledBy: userId },
                module: 'payment',
                category: 'financial',
            });
        }
        catch (error) {
            this.logger.error(`فشل في إلغاء الاسترداد: ${refundId}`, error);
            throw error;
        }
    }
    async approveRefund(refundId, approverId) {
        try {
            this.logger.log(`الموافقة على الاسترداد: ${refundId}`);
            await this.auditService.log({
                action: 'REFUND_APPROVED',
                entity: 'RefundRecord',
                entityId: refundId,
                details: { approvedBy: approverId },
                module: 'payment',
                category: 'financial',
            });
        }
        catch (error) {
            this.logger.error(`فشل في الموافقة على الاسترداد: ${refundId}`, error);
            throw error;
        }
    }
    async getRefundReport(branchId, startDate, endDate, format = 'json') {
        try {
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
            const refunds = await this.prisma.paymentTransaction.findMany({
                where: {
                    ...where,
                    refundAmount: { gt: 0 },
                },
                select: {
                    id: true,
                    transactionId: true,
                    invoiceId: true,
                    invoiceType: true,
                    gateway: true,
                    amount: true,
                    refundAmount: true,
                    refundReason: true,
                    status: true,
                    createdAt: true,
                    refundedAt: true,
                    processedBy: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            if (format === 'csv') {
                return this.convertToCSV(refunds);
            }
            return {
                refunds,
                summary: await this.getRefundStats(branchId, startDate, endDate),
                generatedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error('فشل في إنشاء تقرير الاستردادات', error);
            throw error;
        }
    }
    async validateRefundRequest(request) {
        if (request.amount <= 0) {
            throw new Error('مبلغ الاسترداد يجب أن يكون أكبر من صفر');
        }
        if (request.amount < this.refundPolicy.minRefundAmount) {
            throw new Error(`مبلغ الاسترداد أقل من الحد الأدنى: ${this.refundPolicy.minRefundAmount}`);
        }
        if (request.amount > this.refundPolicy.maxRefundAmount) {
            throw new Error(`مبلغ الاسترداد أكبر من الحد الأقصى: ${this.refundPolicy.maxRefundAmount}`);
        }
        if (!this.refundPolicy.supportedReasons.includes(request.reason)) {
            throw new Error(`سبب الاسترداد غير مدعوم: ${request.reason}`);
        }
    }
    async checkRefundEligibility(transaction, refundRequest) {
        if (!['completed', 'partially_refunded'].includes(transaction.status)) {
            throw new Error(`لا يمكن استرداد معاملة في حالة: ${transaction.status}`);
        }
        const transactionDate = new Date(transaction.createdAt);
        const daysSinceTransaction = (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceTransaction > this.refundPolicy.maxRefundDays) {
            throw new Error(`تجاوز المهلة المسموحة للاسترداد: ${this.refundPolicy.maxRefundDays} يوم`);
        }
        const totalRefunded = Number(transaction.refundAmount);
        const remainingAmount = Number(transaction.amount) - totalRefunded;
        if (refundRequest.amount > remainingAmount) {
            throw new Error(`مبلغ الاسترداد أكبر من المبلغ المتاح: ${remainingAmount}`);
        }
        if (!this.refundPolicy.allowPartialRefunds && refundRequest.amount < Number(transaction.amount)) {
            throw new Error('الاسترداد الجزئي غير مسموح');
        }
        if (this.refundPolicy.requireApproval && refundRequest.amount >= this.refundPolicy.approvalThreshold) {
            throw new Error('هذا الاسترداد يتطلب موافقة إدارية');
        }
    }
    async createRefundRecord(transaction, refundRequest, userId) {
        return {
            id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transactionId: transaction.id,
            amount: refundRequest.amount,
            reason: refundRequest.reason,
            metadata: refundRequest.metadata,
            requestedBy: userId,
            status: 'pending',
            createdAt: new Date(),
        };
    }
    async processGatewayRefund(transaction, refundRequest) {
        try {
            const adapter = this.adapterFactory.getAdapter(transaction.gateway);
            const refundResult = await adapter.processRefund(transaction.transactionId, refundRequest);
            return refundResult;
        }
        catch (error) {
            this.logger.error(`فشل في معالجة الاسترداد للبوابة ${transaction.gateway}`, error);
            return {
                status: 'failed',
                gatewayRefundId: null,
            };
        }
    }
    async updateRefundRecord(refundId, refundResult) {
        this.logger.log(`تحديث سجل الاسترداد ${refundId}: ${refundResult.status}`);
    }
    async updateOriginalTransaction(transactionId, refundAmount) {
        await this.prisma.paymentTransaction.update({
            where: { id: transactionId },
            data: {
                refundAmount: { increment: refundAmount },
                refundedAt: new Date(),
            },
        });
    }
    convertToCSV(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return String(value || '');
            });
            csvRows.push(values.join(','));
        });
        return csvRows.join('\n');
    }
};
exports.RefundService = RefundService;
exports.RefundService = RefundService = RefundService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        payment_adapter_factory_1.PaymentAdapterFactory,
        payment_security_service_1.PaymentSecurityService])
], RefundService);
//# sourceMappingURL=refund.service.js.map