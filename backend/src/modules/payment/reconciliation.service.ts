import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentAdapterFactory, PaymentGateway } from './adapters/payment-adapter.factory';

export interface ReconciliationPeriod {
  startDate: Date;
  endDate: Date;
  gateway: PaymentGateway;
  branchId?: string;
}

export interface TransactionRecord {
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  processedAt: Date;
  fee?: number;
  metadata?: any;
}

export interface ReconciliationResult {
  period: ReconciliationPeriod;
  summary: {
    totalSystemTransactions: number;
    totalSystemAmount: number;
    totalGatewayTransactions: number;
    totalGatewayAmount: number;
    matchedTransactions: number;
    unmatchedSystemTransactions: number;
    unmatchedGatewayTransactions: number;
    discrepancies: number;
    totalDiscrepancyAmount: number;
  };
  matched: TransactionMatch[];
  unmatchedSystem: TransactionRecord[];
  unmatchedGateway: TransactionRecord[];
  discrepancies: DiscrepancyRecord[];
  processingTime: number;
  status: 'completed' | 'partial' | 'failed';
}

export interface TransactionMatch {
  systemTransaction: TransactionRecord;
  gatewayTransaction: TransactionRecord;
  matchType: 'exact' | 'amount_only' | 'id_partial';
  confidence: number; // 0-100
}

export interface DiscrepancyRecord {
  systemTransaction?: TransactionRecord;
  gatewayTransaction?: TransactionRecord;
  discrepancyType: 'amount_mismatch' | 'status_mismatch' | 'missing_in_system' | 'missing_in_gateway' | 'fee_mismatch';
  amountDifference: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

export interface ReconciliationReport {
  id: string;
  period: ReconciliationPeriod;
  result: ReconciliationResult;
  generatedAt: Date;
  generatedBy: string;
  approvedAt?: Date;
  approvedBy?: string;
  notes?: string;
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly adapterFactory: PaymentAdapterFactory,
  ) {}

  /**
   * تشغيل عملية التسوية
   */
  async reconcileTransactions(
    period: ReconciliationPeriod,
    options: {
      autoResolveThreshold?: number; // الحد الأقصى للفرق المسموح به
      includeFees?: boolean;
      generateReport?: boolean;
    } = {},
  ): Promise<ReconciliationResult> {
    const startTime = Date.now();

    try {
      this.logger.log(`بدء تسوية المعاملات لـ ${period.gateway} من ${period.startDate.toISOString()} إلى ${period.endDate.toISOString()}`);

      // جلب معاملات النظام
      const systemTransactions = await this.getSystemTransactions(period);

      // جلب معاملات البوابة
      const gatewayTransactions = await this.getGatewayTransactions(period);

      // مطابقة المعاملات
      const { matched, unmatchedSystem, unmatchedGateway, discrepancies } =
        this.matchTransactions(systemTransactions, gatewayTransactions, options);

      // حساب الملخص
      const summary = this.calculateSummary(systemTransactions, gatewayTransactions, matched, discrepancies);

      const result: ReconciliationResult = {
        period,
        summary,
        matched,
        unmatchedSystem,
        unmatchedGateway,
        discrepancies,
        processingTime: Date.now() - startTime,
        status: discrepancies.length === 0 ? 'completed' : 'partial',
      };

      // إنشاء تقرير إذا طُلب ذلك
      if (options.generateReport) {
        await this.generateReconciliationReport(result);
      }

      // تسجيل في سجل التدقيق
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
    } catch (error) {
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

  /**
   * حل اختلاف يدوياً
   */
  async resolveDiscrepancy(
    discrepancyId: string,
    resolution: {
      action: 'accept' | 'adjust_system' | 'adjust_gateway' | 'ignore';
      notes?: string;
      adjustedAmount?: number;
    },
    resolvedBy: string,
  ): Promise<void> {
    try {
      // TODO: تنفيذ حل الاختلافات
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
    } catch (error) {
      this.logger.error(`فشل في حل الاختلاف ${discrepancyId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على تقارير التسوية
   */
  async getReconciliationReports(
    gateway?: PaymentGateway,
    startDate?: Date,
    endDate?: Date,
    status?: 'completed' | 'partial' | 'failed',
  ): Promise<ReconciliationReport[]> {
    try {
      // TODO: تنفيذ استرجاع تقارير التسوية من قاعدة البيانات
      return [];
    } catch (error) {
      this.logger.error('فشل في استرجاع تقارير التسوية', error);
      return [];
    }
  }

  /**
   * تشغيل تسوية تلقائية دورية
   */
  async runScheduledReconciliation(
    gateway: PaymentGateway,
    daysBack: number = 1,
  ): Promise<ReconciliationResult> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    const period: ReconciliationPeriod = {
      startDate,
      endDate,
      gateway,
    };

    return this.reconcileTransactions(period, {
      autoResolveThreshold: 0.01, // 1% tolerance
      includeFees: true,
      generateReport: true,
    });
  }

  /**
   * إحصائيات التسوية
   */
  async getReconciliationStats(
    gateway?: PaymentGateway,
    period?: { start: Date; end: Date },
  ): Promise<{
    totalReconciliations: number;
    successfulReconciliations: number;
    failedReconciliations: number;
    totalDiscrepancies: number;
    resolvedDiscrepancies: number;
    averageProcessingTime: number;
    discrepancyRate: number;
  }> {
    try {
      // TODO: تنفيذ حساب إحصائيات التسوية
      return {
        totalReconciliations: 0,
        successfulReconciliations: 0,
        failedReconciliations: 0,
        totalDiscrepancies: 0,
        resolvedDiscrepancies: 0,
        averageProcessingTime: 0,
        discrepancyRate: 0,
      };
    } catch (error) {
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

  // ========== PRIVATE METHODS ==========

  /**
   * جلب معاملات النظام
   */
  private async getSystemTransactions(period: ReconciliationPeriod): Promise<TransactionRecord[]> {
    const where: any = {
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

  /**
   * جلب معاملات البوابة
   */
  private async getGatewayTransactions(period: ReconciliationPeriod): Promise<TransactionRecord[]> {
    try {
      // في الواقع، هنا يتم استدعاء API البوابة لجلب المعاملات
      // للآن نرجع بيانات وهمية للاختبار

      // محاكاة استدعاء API البوابة
      const mockGatewayTransactions: TransactionRecord[] = [
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
    } catch (error) {
      this.logger.error(`فشل في جلب معاملات البوابة ${period.gateway}`, error);
      return [];
    }
  }

  /**
   * مطابقة المعاملات
   */
  private matchTransactions(
    systemTransactions: TransactionRecord[],
    gatewayTransactions: TransactionRecord[],
    options?: any,
  ): any {
    const matched: TransactionMatch[] = [];
    const unmatchedSystem = [...systemTransactions];
    const unmatchedGateway = [...gatewayTransactions];
    const discrepancies: DiscrepancyRecord[] = [];

    // محاولة المطابقة الدقيقة أولاً (بالمعرف)
    for (let i = unmatchedSystem.length - 1; i >= 0; i--) {
      const systemTx = unmatchedSystem[i];

      const gatewayIndex = unmatchedGateway.findIndex(
        gatewayTx => gatewayTx.transactionId === systemTx.transactionId
      );

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

    // محاولة المطابقة بالمبلغ والتاريخ
    for (let i = unmatchedSystem.length - 1; i >= 0; i--) {
      const systemTx = unmatchedSystem[i];

      const gatewayIndex = unmatchedGateway.findIndex(gatewayTx => {
        const amountMatch = Math.abs(gatewayTx.amount - systemTx.amount) <= (options.autoResolveThreshold || 0);
        const dateMatch = Math.abs(gatewayTx.processedAt.getTime() - systemTx.processedAt.getTime()) <= 24 * 60 * 60 * 1000; // يوم واحد

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

    // إنشاء سجلات الاختلافات
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

  /**
   * حساب ملخص التسوية
   */
  private calculateSummary(
    systemTransactions: TransactionRecord[],
    gatewayTransactions: TransactionRecord[],
    matched: TransactionMatch[],
    discrepancies: DiscrepancyRecord[],
  ): ReconciliationResult['summary'] {
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

  /**
   * إنشاء تقرير التسوية
   */
  private async generateReconciliationReport(result: ReconciliationResult): Promise<void> {
    try {
      const report: ReconciliationReport = {
        id: `recon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        period: result.period,
        result,
        generatedAt: new Date(),
        generatedBy: 'system',
      };

      // TODO: حفظ التقرير في قاعدة البيانات

      this.logger.log(`تم إنشاء تقرير التسوية: ${report.id}`);
    } catch (error) {
      this.logger.error('فشل في إنشاء تقرير التسوية', error);
    }
  }
}
