import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import { PaymentSecurityService } from './payment-security.service';

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refundId: string;
  status: 'success' | 'pending' | 'failed' | 'partial';
  refundAmount: number;
  remainingAmount: number;
  gatewayRefundId?: string;
  processedAt: Date;
}

export interface RefundPolicy {
  maxRefundDays: number; // أيام
  minRefundAmount: number;
  maxRefundAmount: number;
  allowPartialRefunds: boolean;
  requireApproval: boolean;
  approvalThreshold: number;
  supportedReasons: string[];
}

export interface RefundStats {
  totalRefunds: number;
  totalRefundAmount: number;
  successfulRefunds: number;
  failedRefunds: number;
  pendingRefunds: number;
  averageProcessingTime: number;
  refundRate: number; // نسبة الاسترداد من إجمالي المبيعات
  commonReasons: Record<string, number>;
}

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);
  private readonly refundPolicy: RefundPolicy = {
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly adapterFactory: PaymentAdapterFactory,
    private readonly securityService: PaymentSecurityService,
  ) {}

  /**
   * معالجة طلب استرداد
   */
  async processRefund(
    refundRequest: RefundRequest,
    userId: string,
  ): Promise<RefundResponse> {
    try {
      this.logger.log(`معالجة طلب استرداد: ${refundRequest.transactionId} - ${refundRequest.amount}`);

      // التحقق من صحة الطلب
      await this.validateRefundRequest(refundRequest);

      // العثور على المعاملة الأصلية
      const originalTransaction = await this.prisma.paymentTransaction.findUnique({
        where: { transactionId: refundRequest.transactionId },
      });

      if (!originalTransaction) {
        throw new Error(`المعاملة غير موجودة: ${refundRequest.transactionId}`);
      }

      // التحقق من إمكانية الاسترداد
      await this.checkRefundEligibility(originalTransaction, refundRequest);

      // إنشاء سجل الاسترداد في قاعدة البيانات
      const refundRecord = await this.createRefundRecord(originalTransaction, refundRequest, userId);

      // معالجة الاسترداد حسب البوابة
      const refundResult = await this.processGatewayRefund(originalTransaction, refundRequest);

      // تحديث سجل الاسترداد
      await this.updateRefundRecord(refundRecord.id, refundResult);

      // تحديث المعاملة الأصلية
      await this.updateOriginalTransaction(originalTransaction.id, refundRequest.amount);

      // تسجيل في سجل التدقيق
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
    } catch (error) {
      this.logger.error(`فشل في معالجة الاسترداد: ${refundRequest.transactionId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على سياسة الاسترداد
   */
  getRefundPolicy(): RefundPolicy {
    return { ...this.refundPolicy };
  }

  /**
   * تحديث سياسة الاسترداد
   */
  async updateRefundPolicy(policy: Partial<RefundPolicy>): Promise<RefundPolicy> {
    try {
      Object.assign(this.refundPolicy, policy);

      // تسجيل في سجل التدقيق
      await this.auditService.log({
        action: 'REFUND_POLICY_UPDATE',
        entity: 'RefundPolicy',
        entityId: 'global_refund_policy',
        details: policy,
        module: 'payment',
        category: 'configuration',
      });

      return { ...this.refundPolicy };
    } catch (error) {
      this.logger.error('فشل في تحديث سياسة الاسترداد', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الاسترداد
   */
  async getRefundStats(
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RefundStats> {
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // جلب المعاملات التي تحتوي على استردادات
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

      // حساب إجمالي المبيعات لنفس الفترة
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

      // حساب أسباب الاسترداد
      const commonReasons: Record<string, number> = {};
      transactionsWithRefunds.forEach(transaction => {
        if (transaction.refundReason) {
          commonReasons[transaction.refundReason] = (commonReasons[transaction.refundReason] || 0) + 1;
        }
      });

      // حساب متوسط وقت المعالجة
      const completedRefunds = transactionsWithRefunds.filter(t => t.processedAt);
      const averageProcessingTime = completedRefunds.length > 0
        ? completedRefunds.reduce((sum, t) =>
            sum + (t.processedAt!.getTime() - t.createdAt.getTime()), 0) / completedRefunds.length
        : 0;

      return {
        totalRefunds: transactionsWithRefunds.length,
        totalRefundAmount: totalRefunds,
        successfulRefunds: transactionsWithRefunds.filter(t => t.status === 'refunded' || t.status === 'partially_refunded').length,
        failedRefunds: 0, // TODO: implement failed refunds tracking
        pendingRefunds: 0, // TODO: implement pending refunds tracking
        averageProcessingTime,
        refundRate: totalSales > 0 ? (totalRefunds / totalSales) * 100 : 0,
        commonReasons,
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الاسترداد', error);
      throw error;
    }
  }

  /**
   * إلغاء استرداد معلق
   */
  async cancelRefund(refundId: string, userId: string): Promise<void> {
    try {
      // TODO: تنفيذ إلغاء الاسترداد المعلق
      this.logger.log(`إلغاء الاسترداد: ${refundId}`);

      await this.auditService.log({
        action: 'REFUND_CANCELLED',
        entity: 'RefundRecord',
        entityId: refundId,
        details: { cancelledBy: userId },
        module: 'payment',
        category: 'financial',
      });
    } catch (error) {
      this.logger.error(`فشل في إلغاء الاسترداد: ${refundId}`, error);
      throw error;
    }
  }

  /**
   * الموافقة على استرداد كبير
   */
  async approveRefund(refundId: string, approverId: string): Promise<void> {
    try {
      // TODO: تنفيذ الموافقة على الاسترداد
      this.logger.log(`الموافقة على الاسترداد: ${refundId}`);

      await this.auditService.log({
        action: 'REFUND_APPROVED',
        entity: 'RefundRecord',
        entityId: refundId,
        details: { approvedBy: approverId },
        module: 'payment',
        category: 'financial',
      });
    } catch (error) {
      this.logger.error(`فشل في الموافقة على الاسترداد: ${refundId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على تقرير الاستردادات
   */
  async getRefundReport(
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
    format: 'json' | 'csv' = 'json',
  ): Promise<any> {
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
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
    } catch (error) {
      this.logger.error('فشل في إنشاء تقرير الاستردادات', error);
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التحقق من صحة طلب الاسترداد
   */
  private async validateRefundRequest(request: RefundRequest): Promise<void> {
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

  /**
   * التحقق من إمكانية الاسترداد
   */
  private async checkRefundEligibility(
    transaction: any,
    refundRequest: RefundRequest,
  ): Promise<void> {
    // التحقق من حالة المعاملة
    if (!['completed', 'partially_refunded'].includes(transaction.status)) {
      throw new Error(`لا يمكن استرداد معاملة في حالة: ${transaction.status}`);
    }

    // التحقق من الوقت المسموح للاسترداد
    const transactionDate = new Date(transaction.createdAt);
    const daysSinceTransaction = (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceTransaction > this.refundPolicy.maxRefundDays) {
      throw new Error(`تجاوز المهلة المسموحة للاسترداد: ${this.refundPolicy.maxRefundDays} يوم`);
    }

    // التحقق من المبلغ المتاح للاسترداد
    const totalRefunded = Number(transaction.refundAmount);
    const remainingAmount = Number(transaction.amount) - totalRefunded;

    if (refundRequest.amount > remainingAmount) {
      throw new Error(`مبلغ الاسترداد أكبر من المبلغ المتاح: ${remainingAmount}`);
    }

    // التحقق من الاسترداد الجزئي
    if (!this.refundPolicy.allowPartialRefunds && refundRequest.amount < Number(transaction.amount)) {
      throw new Error('الاسترداد الجزئي غير مسموح');
    }

    // التحقق من الحاجة للموافقة
    if (this.refundPolicy.requireApproval && refundRequest.amount >= this.refundPolicy.approvalThreshold) {
      // TODO: التحقق من وجود موافقة
      throw new Error('هذا الاسترداد يتطلب موافقة إدارية');
    }
  }

  /**
   * إنشاء سجل الاسترداد
   */
  private async createRefundRecord(
    transaction: any,
    refundRequest: RefundRequest,
    userId: string,
  ): Promise<any> {
    // TODO: إنشاء جدول منفصل للاستردادات إذا لزم الأمر
    // للآن نستخدم حقل refund في المعاملة
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

  /**
   * معالجة الاسترداد حسب البوابة
   */
  private async processGatewayRefund(
    transaction: any,
    refundRequest: RefundRequest,
  ): Promise<any> {
    try {
      const adapter = this.adapterFactory.getAdapter(transaction.gateway);

      const refundResult = await adapter.processRefund(
        transaction.transactionId,
        refundRequest,
      );

      return refundResult;
    } catch (error) {
      this.logger.error(`فشل في معالجة الاسترداد للبوابة ${transaction.gateway}`, error);
      return {
        status: 'failed',
        gatewayRefundId: null,
      };
    }
  }

  /**
   * تحديث سجل الاسترداد
   */
  private async updateRefundRecord(refundId: string, refundResult: any): Promise<void> {
    // TODO: تحديث سجل الاسترداد في قاعدة البيانات
    this.logger.log(`تحديث سجل الاسترداد ${refundId}: ${refundResult.status}`);
  }

  /**
   * تحديث المعاملة الأصلية
   */
  private async updateOriginalTransaction(
    transactionId: string,
    refundAmount: number,
  ): Promise<void> {
    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        refundAmount: { increment: refundAmount },
        refundedAt: new Date(),
      },
    });
  }

  /**
   * تحويل البيانات إلى CSV
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // إضافة الرؤوس
    csvRows.push(headers.join(','));

    // إضافة البيانات
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // إذا كان القيمة تحتوي على فاصلة أو اقتباس، نضعها بين اقتباسات
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value || '');
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }
}
