import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';

export type PaymentGateway = 'stripe' | 'paypal' | 'tap' | 'local';

export interface PaymentRequest {
  invoiceId: string;
  invoiceType: 'sales' | 'purchase';
  amount: number;
  currency: string;
  gateway: string;
  method: string;
  description?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  supplierId?: string;
  branchId?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'pending' | 'failed';
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  redirectUrl?: string;
  qrCode?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refundId: string;
  status: 'success' | 'pending' | 'failed';
  refundAmount: number;
  gatewayRefundId?: string;
}

export interface WebhookData {
  gateway: string;
  eventType: string;
  transactionId: string;
  data: any;
  signature?: string;
}

export interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  refundedAmount: number;
  gatewayStats: Record<string, {
    transactions: number;
    amount: number;
    successRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    transactions: number;
    amount: number;
  }>;
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  discrepancies: number;
  totalAmount: number;
  gatewayAmount: number;
  difference: number;
  issues: Array<{
    transactionId: string;
    issue: string;
    amount: number;
  }>;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly paymentCacheKey = 'payment_transactions';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
  ) {}

  /**
   * معالجة دفعة جديدة
   */
  async processPayment(
    request: PaymentRequest,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<PaymentResponse> {
    try {
      this.logger.log(`معالجة دفعة جديدة: ${request.invoiceId} - ${request.amount} ${request.currency}`);

      // التحقق من صحة البيانات
      await this.validatePaymentRequest(request);

      // إنشاء معاملة في قاعدة البيانات
      const transaction = await this.createPaymentTransaction(request, userId, ipAddress, userAgent);

      // معالجة الدفع حسب البوابة
      const result = await this.processGatewayPayment(transaction, request);

      // تحديث حالة المعاملة
      await this.updateTransactionStatus(transaction.id, result.status, result.gatewayTransactionId, result.gatewayResponse);

      // تسجيل في سجل التدقيق
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
    } catch (error) {
      this.logger.error(`فشل في معالجة الدفعة: ${request.invoiceId}`, error);
      throw error;
    }
  }

  /**
   * معالجة استرداد
   */
  async processRefund(
    refundRequest: RefundRequest,
    userId: string,
  ): Promise<RefundResponse> {
    try {
      this.logger.log(`معالجة استرداد: ${refundRequest.transactionId} - ${refundRequest.amount}`);

      // العثور على المعاملة الأصلية
      const originalTransaction = await this.prisma.paymentTransaction.findUnique({
        where: { transactionId: refundRequest.transactionId },
      });

      if (!originalTransaction) {
        throw new Error(`المعاملة غير موجودة: ${refundRequest.transactionId}`);
      }

      if (originalTransaction.status !== 'completed') {
        throw new Error(`لا يمكن استرداد معاملة في حالة: ${originalTransaction.status}`);
      }

      // التحقق من مبلغ الاسترداد
      const totalRefunded = originalTransaction.refundAmount;
      const remainingAmount = Number(originalTransaction.amount) - Number(totalRefunded);

      if (refundRequest.amount > remainingAmount) {
        throw new Error(`مبلغ الاسترداد أكبر من المبلغ المتبقي: ${remainingAmount}`);
      }

      // معالجة الاسترداد حسب البوابة
      const refundResult = await this.processGatewayRefund(originalTransaction, refundRequest);

      // تحديث المعاملة بالاسترداد
      await this.prisma.paymentTransaction.update({
        where: { id: originalTransaction.id },
        data: {
          refundAmount: { increment: refundRequest.amount },
          refundReason: refundRequest.reason,
          refundMetadata: refundRequest.metadata as any,
          refundedAt: new Date(),
          status: refundRequest.amount >= Number(originalTransaction.amount) ? 'refunded' : 'partially_refunded',
        },
      });

      // تسجيل في سجل التدقيق
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
    } catch (error) {
      this.logger.error(`فشل في معالجة الاسترداد: ${refundRequest.transactionId}`, error);
      throw error;
    }
  }

  /**
   * معالجة webhook من البوابة
   */
  async processWebhook(webhookData: WebhookData): Promise<void> {
    try {
      this.logger.log(`معالجة webhook من ${webhookData.gateway}: ${webhookData.eventType}`);

      // التحقق من صحة الـ webhook
      await this.validateWebhookSignature(webhookData);

      // العثور على المعاملة
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

      // تحديث حالة المعاملة بناءً على البيانات
      await this.updateTransactionFromWebhook(transaction.id, webhookData);

      // معالجة الحدث حسب النوع
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
    } catch (error) {
      this.logger.error(`فشل في معالجة webhook: ${webhookData.transactionId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الدفع
   */
  async getPaymentStats(
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentStats> {
    try {
      const cacheKey = `payment_stats:${branchId || 'all'}:${startDate?.toISOString() || 'all'}:${endDate?.toISOString() || 'all'}`;

      const cachedStats = await this.cacheService.get<PaymentStats>(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const where: any = {};
      if (branchId) where.branchId = branchId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
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

      const stats: PaymentStats = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
        successfulTransactions: transactions.filter(t => t.status === 'completed').length,
        failedTransactions: transactions.filter(t => t.status === 'failed').length,
        pendingTransactions: transactions.filter(t => ['pending', 'processing'].includes(t.status)).length,
        refundedAmount: transactions.reduce((sum, t) => sum + Number(t.refundAmount), 0),
        gatewayStats: this.calculateGatewayStats(transactions),
        dailyStats: this.calculateDailyStats(transactions),
      };

      await this.cacheService.set(cacheKey, stats, { ttl: 1800 }); // 30 دقيقة

      return stats;
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الدفع', error);
      throw error;
    }
  }

  /**
   * تسوية المعاملات
   */
  async reconcileTransactions(
    gateway: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReconciliationResult> {
    try {
      this.logger.log(`بدء تسوية المعاملات لـ ${gateway} من ${startDate.toISOString()} إلى ${endDate.toISOString()}`);

      // جلب معاملات النظام
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

      // جلب معاملات البوابة (محاكاة - في الواقع يتم من API البوابة)
      const gatewayTransactions = await this.fetchGatewayTransactions(gateway, startDate, endDate);

      // مقارنة المعاملات
      const result = this.compareTransactions(systemTransactions, gatewayTransactions);

      // تسجيل نتائج التسوية
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
    } catch (error) {
      this.logger.error(`فشل في تسوية المعاملات لـ ${gateway}`, error);
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * التحقق من صحة طلب الدفع
   */
  private async validatePaymentRequest(request: PaymentRequest): Promise<void> {
    if (request.amount <= 0) {
      throw new Error('مبلغ الدفع يجب أن يكون أكبر من صفر');
    }

    if (!['sales', 'purchase'].includes(request.invoiceType)) {
      throw new Error('نوع الفاتورة غير صحيح');
    }

    // التحقق من وجود الفاتورة
    if (request.invoiceType === 'sales') {
      const invoice = await this.prisma.salesInvoice.findUnique({
        where: { id: request.invoiceId },
      });
      if (!invoice) {
        throw new Error('فاتورة المبيعات غير موجودة');
      }
    } else {
      const invoice = await this.prisma.purchaseInvoice.findUnique({
        where: { id: request.invoiceId },
      });
      if (!invoice) {
        throw new Error('فاتورة المشتريات غير موجودة');
      }
    }

    // التحقق من البوابة المدعومة
    const supportedGateways = ['stripe', 'paypal', 'tap', 'local'];
    if (!supportedGateways.includes(request.gateway)) {
      throw new Error(`البوابة غير مدعومة: ${request.gateway}`);
    }
  }

  /**
   * إنشاء معاملة دفع في قاعدة البيانات
   */
  private async createPaymentTransaction(
    request: PaymentRequest,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<any> {
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
        metadata: request.metadata as any,
        ipAddress,
        userAgent,
        processedBy: userId,
        processedAt: new Date(),
      },
    });
  }

  /**
   * معالجة الدفع حسب البوابة
   */
  private async processGatewayPayment(
    transaction: any,
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
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
    } catch (error) {
      this.logger.error(`فشل في معالجة الدفع للبوابة ${request.gateway}`, error);
      return {
        transactionId: transaction.transactionId,
        status: 'failed',
        gatewayResponse: { error: error.message },
      };
    }
  }

  /**
   * معالجة دفع Stripe
   */
  private async processStripePayment(transaction: any, request: PaymentRequest): Promise<PaymentResponse> {
    // محاكاة - في الواقع يتم استخدام Stripe SDK
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('مفتاح Stripe غير مكون');
    }

    // محاكاة استجابة ناجحة
    return {
      transactionId: transaction.transactionId,
      status: 'success',
      gatewayTransactionId: `stripe_${Date.now()}`,
      gatewayResponse: {
        id: `stripe_${Date.now()}`,
        amount: request.amount * 100, // Stripe يستخدم cents
        currency: request.currency.toLowerCase(),
        status: 'succeeded',
      },
    };
  }

  /**
   * معالجة دفع PayPal
   */
  private async processPayPalPayment(transaction: any, request: PaymentRequest): Promise<PaymentResponse> {
    // محاكاة - في الواقع يتم استخدام PayPal SDK
    const paypalClientId = this.configService.get('PAYPAL_CLIENT_ID');

    if (!paypalClientId) {
      throw new Error('معرف PayPal غير مكون');
    }

    // محاكاة استجابة ناجحة
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

  /**
   * معالجة دفع Tap
   */
  private async processTapPayment(transaction: any, request: PaymentRequest): Promise<PaymentResponse> {
    // محاكاة - في الواقع يتم استخدام Tap SDK
    const tapApiKey = this.configService.get('TAP_API_KEY');

    if (!tapApiKey) {
      throw new Error('مفتاح Tap API غير مكون');
    }

    // محاكاة استجابة ناجحة
    return {
      transactionId: transaction.transactionId,
      status: 'success',
      gatewayTransactionId: `tap_${Date.now()}`,
      gatewayResponse: {
        id: `tap_${Date.now()}`,
        amount: request.amount * 1000, // Tap يستخدم halalas
        currency: request.currency,
        status: 'CAPTURED',
      },
    };
  }

  /**
   * معالجة دفع محلي (نقدي أو تحويل بنكي)
   */
  private async processLocalPayment(transaction: any, request: PaymentRequest): Promise<PaymentResponse> {
    // للمدفوعات النقدية أو التحويلات البنكية
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

  /**
   * معالجة استرداد حسب البوابة
   */
  private async processGatewayRefund(
    transaction: any,
    refundRequest: RefundRequest,
  ): Promise<RefundResponse> {
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

  /**
   * استرداد Stripe
   */
  private async processStripeRefund(transaction: any, refundRequest: RefundRequest): Promise<RefundResponse> {
    // محاكاة استرداد Stripe
    return {
      refundId: `refund_stripe_${Date.now()}`,
      status: 'success',
      refundAmount: refundRequest.amount,
      gatewayRefundId: `stripe_refund_${Date.now()}`,
    };
  }

  /**
   * استرداد PayPal
   */
  private async processPayPalRefund(transaction: any, refundRequest: RefundRequest): Promise<RefundResponse> {
    // محاكاة استرداد PayPal
    return {
      refundId: `refund_paypal_${Date.now()}`,
      status: 'success',
      refundAmount: refundRequest.amount,
      gatewayRefundId: `paypal_refund_${Date.now()}`,
    };
  }

  /**
   * استرداد Tap
   */
  private async processTapRefund(transaction: any, refundRequest: RefundRequest): Promise<RefundResponse> {
    // محاكاة استرداد Tap
    return {
      refundId: `refund_tap_${Date.now()}`,
      status: 'success',
      refundAmount: refundRequest.amount,
      gatewayRefundId: `tap_refund_${Date.now()}`,
    };
  }

  /**
   * استرداد محلي
   */
  private async processLocalRefund(transaction: any, refundRequest: RefundRequest): Promise<RefundResponse> {
    // للاستردادات النقدية
    return {
      refundId: `refund_local_${Date.now()}`,
      status: 'success',
      refundAmount: refundRequest.amount,
      gatewayRefundId: `local_refund_${Date.now()}`,
    };
  }

  /**
   * التحقق من توقيع Webhook
   */
  private async validateWebhookSignature(webhookData: WebhookData): Promise<void> {
    // محاكاة التحقق من التوقيع
    // في الواقع يتم التحقق من HMAC أو توقيع رقمي
    if (!webhookData.signature) {
      throw new Error('توقيع Webhook مفقود');
    }
  }

  /**
   * تحديث معاملة من Webhook
   */
  private async updateTransactionFromWebhook(transactionId: string, webhookData: WebhookData): Promise<void> {
    const updateData: any = {
      gatewayResponse: webhookData.data as any,
    };

    // تحديث الحالة حسب نوع الحدث
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

  /**
   * معالجة نجاح الدفع
   */
  private async handlePaymentSuccess(transactionId: string, data: any): Promise<void> {
    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        gatewayResponse: data as any,
      },
    });

    this.logger.log(`تم تأكيد نجاح الدفع: ${transactionId}`);
  }

  /**
   * معالجة فشل الدفع
   */
  private async handlePaymentFailure(transactionId: string, data: any): Promise<void> {
    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        status: 'failed',
        gatewayResponse: data as any,
      },
    });

    this.logger.warn(`فشل في الدفع: ${transactionId}`);
  }

  /**
   * معالجة نجاح الاسترداد
   */
  private async handleRefundSuccess(transactionId: string, data: any): Promise<void> {
    // الاسترداد يتم معالجته في processRefund
    this.logger.log(`تم تأكيد نجاح الاسترداد: ${transactionId}`);
  }

  /**
   * معالجة إنشاء نزاع
   */
  private async handleDisputeCreated(transactionId: string, data: any): Promise<void> {
    // تسجيل النزاع في سجل التدقيق
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

  /**
   * تحديث حالة المعاملة
   */
  private async updateTransactionStatus(
    transactionId: string,
    status: string,
    gatewayTransactionId?: string,
    gatewayResponse?: any,
  ): Promise<void> {
    const updateData: any = { status };

    if (gatewayTransactionId) {
      updateData.externalId = gatewayTransactionId;
    }

    if (gatewayResponse) {
      updateData.gatewayResponse = gatewayResponse as any;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    await this.prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: updateData,
    });
  }

  /**
   * إنشاء معرف معاملة فريد
   */
  private generateTransactionId(gateway: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `txn_${gateway}_${timestamp}_${random}`;
  }

  /**
   * حساب إحصائيات البوابات
   */
  private calculateGatewayStats(transactions: any[]): Record<string, any> {
    const gatewayStats: Record<string, any> = {};

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

    // حساب معدل النجاح
    Object.keys(gatewayStats).forEach(gateway => {
      const gatewayTransactions = transactions.filter(t => t.gateway === gateway);
      const successful = gatewayTransactions.filter(t => t.status === 'completed').length;
      gatewayStats[gateway].successRate = gatewayTransactions.length > 0
        ? (successful / gatewayTransactions.length) * 100
        : 0;
    });

    return gatewayStats;
  }

  /**
   * حساب الإحصائيات اليومية
   */
  private calculateDailyStats(transactions: any[]): Array<any> {
    const dailyStats: Record<string, any> = {};

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

    return Object.values(dailyStats).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }

  /**
   * جلب معاملات البوابة (محاكاة)
   */
  private async fetchGatewayTransactions(
    gateway: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ transactionId: string; amount: number; status: string }>> {
    // في الواقع يتم جلب البيانات من API البوابة
    // هنا محاكاة للبيانات
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

  /**
   * مقارنة المعاملات للتسوية
   */
  private compareTransactions(
    systemTransactions: any[],
    gatewayTransactions: any[],
  ): ReconciliationResult {
    const matched = [];
    const unmatched = [];
    const discrepancies = [];

    let systemTotal = 0;
    let gatewayTotal = 0;

    // مقارنة المعاملات
    systemTransactions.forEach(systemTx => {
      const gatewayTx = gatewayTransactions.find(gt => gt.transactionId === systemTx.transactionId);

      if (gatewayTx) {
        (matched as any).push(systemTx);
        systemTotal += Number(systemTx.amount);
        gatewayTotal += Number(gatewayTx.amount);

        // فحص الاختلافات
        if (Number(systemTx.amount) !== Number(gatewayTx.amount)) {
          (discrepancies as any).push({
            transactionId: systemTx.transactionId,
            issue: 'مبلغ مختلف',
            amount: Number(systemTx.amount) - Number(gatewayTx.amount),
          });
        }
      } else {
        (unmatched as any).push(systemTx);
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
}
