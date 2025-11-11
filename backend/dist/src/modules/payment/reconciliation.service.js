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
var ReconciliationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const payment_adapter_factory_1 = require("./adapters/payment-adapter.factory");
let ReconciliationService = ReconciliationService_1 = class ReconciliationService {
    prisma;
    auditService;
    adapterFactory;
    logger = new common_1.Logger(ReconciliationService_1.name);
    constructor(prisma, auditService, adapterFactory) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.adapterFactory = adapterFactory;
    }
    async reconcileTransactions(period, options = {}) {
        const startTime = Date.now();
        try {
            this.logger.log(`بدء تسوية المعاملات لـ ${period.gateway} من ${period.startDate.toISOString()} إلى ${period.endDate.toISOString()}`);
            const systemTransactions = await this.getSystemTransactions(period);
            const gatewayTransactions = await this.getGatewayTransactions(period);
            const { matched, unmatchedSystem, unmatchedGateway, discrepancies } = this.matchTransactions(systemTransactions, gatewayTransactions, options);
            const summary = this.calculateSummary(systemTransactions, gatewayTransactions, matched, discrepancies);
            const result = {
                period,
                summary,
                matched,
                unmatchedSystem,
                unmatchedGateway,
                discrepancies,
                processingTime: Date.now() - startTime,
                status: discrepancies.length === 0 ? 'completed' : 'partial',
            };
            if (options.generateReport) {
                await this.generateReconciliationReport(result);
            }
            await this.auditService.log({
                action: 'PAYMENT_RECONCILIATION_COMPLETED',
                entity: 'ReconciliationResult',
                entityId: `reconciliation_${period.gateway}_${period.startDate.getTime()}`,
                details: {
                    gateway: period.gateway,
                    period: {
                        start: period.startDate.toISOString(),
                        end: period.endDate.toISOString(),
                    },
                    summary: result.summary,
                    matchedCount: matched.length,
                    discrepanciesCount: discrepancies.length,
                },
                module: 'payment',
                category: 'financial',
            });
            this.logger.log(`تمت التسوية بنجاح: ${matched.length} مطابقة، ${discrepancies.length} اختلاف`);
            return result;
        }
        catch (error) {
            this.logger.error(`فشل في تسوية المعاملات لـ ${period.gateway}`, error);
            return {
                period,
                summary: {
                    totalSystemTransactions: 0,
                    totalSystemAmount: 0,
                    totalGatewayTransactions: 0,
                    totalGatewayAmount: 0,
                    matchedTransactions: 0,
                    unmatchedSystemTransactions: 0,
                    unmatchedGatewayTransactions: 0,
                    discrepancies: 0,
                    totalDiscrepancyAmount: 0,
                },
                matched: [],
                unmatchedSystem: [],
                unmatchedGateway: [],
                discrepancies: [],
                processingTime: Date.now() - startTime,
                status: 'failed',
            };
        }
    }
    async resolveDiscrepancy(discrepancyId, resolution, resolvedBy) {
        try {
            this.logger.log(`حل الاختلاف ${discrepancyId}: ${resolution.action}`);
            await this.auditService.log({
                action: 'RECONCILIATION_DISCREPANCY_RESOLVED',
                entity: 'DiscrepancyRecord',
                entityId: discrepancyId,
                details: {
                    resolution: resolution.action,
                    notes: resolution.notes,
                    adjustedAmount: resolution.adjustedAmount,
                    resolvedBy,
                },
                module: 'payment',
                category: 'financial',
            });
        }
        catch (error) {
            this.logger.error(`فشل في حل الاختلاف ${discrepancyId}`, error);
            throw error;
        }
    }
    async getReconciliationReports(gateway, startDate, endDate, status) {
        try {
            return [];
        }
        catch (error) {
            this.logger.error('فشل في استرجاع تقارير التسوية', error);
            return [];
        }
    }
    async runScheduledReconciliation(gateway, daysBack = 1) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysBack);
        const period = {
            startDate,
            endDate,
            gateway,
        };
        return this.reconcileTransactions(period, {
            autoResolveThreshold: 0.01,
            includeFees: true,
            generateReport: true,
        });
    }
    async getReconciliationStats(gateway, period) {
        try {
            return {
                totalReconciliations: 0,
                successfulReconciliations: 0,
                failedReconciliations: 0,
                totalDiscrepancies: 0,
                resolvedDiscrepancies: 0,
                averageProcessingTime: 0,
                discrepancyRate: 0,
            };
        }
        catch (error) {
            this.logger.error('فشل في حساب إحصائيات التسوية', error);
            return {
                totalReconciliations: 0,
                successfulReconciliations: 0,
                failedReconciliations: 0,
                totalDiscrepancies: 0,
                resolvedDiscrepancies: 0,
                averageProcessingTime: 0,
                discrepancyRate: 0,
            };
        }
    }
    async getSystemTransactions(period) {
        const where = {
            gateway: period.gateway,
            status: { in: ['completed', 'refunded', 'partially_refunded'] },
            createdAt: {
                gte: period.startDate,
                lte: period.endDate,
            },
        };
        if (period.branchId) {
            where.branchId = period.branchId;
        }
        const transactions = await this.prisma.paymentTransaction.findMany({
            where,
            select: {
                transactionId: true,
                amount: true,
                currency: true,
                status: true,
                fee: true,
                createdAt: true,
                processedAt: true,
                gatewayResponse: true,
            },
        });
        return transactions.map(t => ({
            transactionId: t.transactionId,
            amount: Number(t.amount),
            currency: t.currency,
            status: t.status,
            processedAt: t.processedAt || t.createdAt,
            fee: Number(t.fee || 0),
            metadata: t.gatewayResponse,
        }));
    }
    async getGatewayTransactions(period) {
        try {
            const mockGatewayTransactions = [
                {
                    transactionId: `gateway_${period.gateway}_1`,
                    amount: 100.00,
                    currency: 'SAR',
                    status: 'completed',
                    processedAt: new Date(),
                },
                {
                    transactionId: `gateway_${period.gateway}_2`,
                    amount: 250.00,
                    currency: 'SAR',
                    status: 'completed',
                    processedAt: new Date(),
                },
            ];
            return mockGatewayTransactions;
        }
        catch (error) {
            this.logger.error(`فشل في جلب معاملات البوابة ${period.gateway}`, error);
            return [];
        }
    }
    matchTransactions(systemTransactions, gatewayTransactions, options) {
        const matched = [];
        const unmatchedSystem = [...systemTransactions];
        const unmatchedGateway = [...gatewayTransactions];
        const discrepancies = [];
        for (let i = unmatchedSystem.length - 1; i >= 0; i--) {
            const systemTx = unmatchedSystem[i];
            const gatewayIndex = unmatchedGateway.findIndex(gatewayTx => gatewayTx.transactionId === systemTx.transactionId);
            if (gatewayIndex !== -1) {
                const gatewayTx = unmatchedGateway[gatewayIndex];
                matched.push({
                    systemTransaction: systemTx,
                    gatewayTransaction: gatewayTx,
                    matchType: 'exact',
                    confidence: 100,
                });
                unmatchedSystem.splice(i, 1);
                unmatchedGateway.splice(gatewayIndex, 1);
            }
        }
        for (let i = unmatchedSystem.length - 1; i >= 0; i--) {
            const systemTx = unmatchedSystem[i];
            const gatewayIndex = unmatchedGateway.findIndex(gatewayTx => {
                const amountMatch = Math.abs(gatewayTx.amount - systemTx.amount) <= (options.autoResolveThreshold || 0);
                const dateMatch = Math.abs(gatewayTx.processedAt.getTime() - systemTx.processedAt.getTime()) <= 24 * 60 * 60 * 1000;
                return amountMatch && dateMatch;
            });
            if (gatewayIndex !== -1) {
                const gatewayTx = unmatchedGateway[gatewayIndex];
                matched.push({
                    systemTransaction: systemTx,
                    gatewayTransaction: gatewayTx,
                    matchType: 'amount_only',
                    confidence: 80,
                });
                unmatchedSystem.splice(i, 1);
                unmatchedGateway.splice(gatewayIndex, 1);
            }
        }
        unmatchedSystem.forEach(systemTx => {
            discrepancies.push({
                systemTransaction: systemTx,
                discrepancyType: 'missing_in_gateway',
                amountDifference: systemTx.amount,
                description: `المعاملة موجودة في النظام ولكن غير موجودة في البوابة`,
                severity: 'high',
                suggestedAction: 'التحقق من حالة المعاملة في البوابة',
            });
        });
        unmatchedGateway.forEach(gatewayTx => {
            discrepancies.push({
                gatewayTransaction: gatewayTx,
                discrepancyType: 'missing_in_system',
                amountDifference: gatewayTx.amount,
                description: `المعاملة موجودة في البوابة ولكن غير موجودة في النظام`,
                severity: 'high',
                suggestedAction: 'التحقق من تسجيل المعاملة في النظام',
            });
        });
        return {
            matched,
            unmatchedSystem,
            unmatchedGateway,
            discrepancies,
        };
    }
    calculateSummary(systemTransactions, gatewayTransactions, matched, discrepancies) {
        const totalSystemAmount = systemTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalGatewayAmount = gatewayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalDiscrepancyAmount = discrepancies.reduce((sum, d) => sum + Math.abs(d.amountDifference), 0);
        return {
            totalSystemTransactions: systemTransactions.length,
            totalSystemAmount,
            totalGatewayTransactions: gatewayTransactions.length,
            totalGatewayAmount,
            matchedTransactions: matched.length,
            unmatchedSystemTransactions: systemTransactions.length - matched.length,
            unmatchedGatewayTransactions: gatewayTransactions.length - matched.length,
            discrepancies: discrepancies.length,
            totalDiscrepancyAmount,
        };
    }
    async generateReconciliationReport(result) {
        try {
            const report = {
                id: `recon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                period: result.period,
                result,
                generatedAt: new Date(),
                generatedBy: 'system',
            };
            this.logger.log(`تم إنشاء تقرير التسوية: ${report.id}`);
        }
        catch (error) {
            this.logger.error('فشل في إنشاء تقرير التسوية', error);
        }
    }
};
exports.ReconciliationService = ReconciliationService;
exports.ReconciliationService = ReconciliationService = ReconciliationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        payment_adapter_factory_1.PaymentAdapterFactory])
], ReconciliationService);
//# sourceMappingURL=reconciliation.service.js.map