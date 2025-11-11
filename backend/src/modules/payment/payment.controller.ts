import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import type { PaymentRequest, RefundRequest, PaymentGateway } from './payment.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly adapterFactory: PaymentAdapterFactory,
  ) {}

  /**
   * إنشاء دفعة جديدة
   */
  @Post('process')
  @Permissions('payment.create')
  async processPayment(
    @Body() request: PaymentRequest,
  ) {
    // TODO: Get user from JWT token
    return this.paymentService.processPayment(request, 'user_123', '127.0.0.1', 'Test Agent');
  }

  /**
   * معالجة استرداد
   */
  @Post('refund')
  @Permissions('payment.refund')
  async processRefund(
    @Body() refundRequest: RefundRequest,
  ) {
    // TODO: Get user from JWT token
    return this.paymentService.processRefund(refundRequest, 'user_123');
  }

  /**
   * الحصول على تفاصيل معاملة
   */
  @Get('transaction/:transactionId')
  @Permissions('payment.read')
  async getTransaction(@Param('transactionId') transactionId: string) {
    // TODO: تنفيذ استرجاع المعاملة من قاعدة البيانات
    return {
      transactionId,
      status: 'unknown',
      message: 'سيتم تنفيذ استرجاع تفاصيل المعاملة قريباً',
    };
  }

  /**
   * الحصول على معاملات المستخدم
   */
  @Get('transactions')
  @Permissions('payment.read')
  async getUserTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    // TODO: تنفيذ استرجاع معاملات المستخدم
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

  /**
   * إحصائيات الدفع
   */
  @Get('stats')
  @Permissions('payment.read')
  async getPaymentStats(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.paymentService.getPaymentStats(branchId, start, end);
  }

  /**
   * قائمة البوابات المتاحة
   */
  @Get('gateways')
  @Permissions('payment.read')
  async getAvailableGateways() {
    const gateways = this.adapterFactory.getAvailableGateways();
    const gatewayInfo = gateways.map(gateway => this.adapterFactory.getGatewayInfo(gateway));

    return {
      gateways: gatewayInfo,
      total: gateways.length,
    };
  }

  /**
   * معلومات بوابة محددة
   */
  @Get('gateways/:gateway')
  @Permissions('payment.read')
  async getGatewayInfo(@Param('gateway') gateway: PaymentGateway) {
    const info = this.adapterFactory.getGatewayInfo(gateway);
    const isAvailable = this.adapterFactory.isGatewayAvailable(gateway);

    return {
      ...info,
      available: isAvailable,
    };
  }

  /**
   * إنشاء رابط دفع (للبوابات التي تدعم ذلك)
   */
  @Post('create-link')
  @Permissions('payment.create')
  async createPaymentLink(
    @Body() request: PaymentRequest,
  ) {
    try {
      const adapter = this.adapterFactory.getAdapter(request.gateway as any);

      if (!adapter.createPaymentLink) {
        throw new Error(`البوابة ${request.gateway} لا تدعم إنشاء روابط الدفع`);
      }

      const link = await adapter.createPaymentLink(request);

      return {
        gateway: request.gateway,
        paymentLink: link,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 ساعة
      };
    } catch (error) {
      throw new Error(`فشل في إنشاء رابط الدفع: ${error.message}`);
    }
  }

  /**
   * إنشاء QR code للدفع (للبوابات التي تدعم ذلك)
   */
  @Post('create-qr')
  @Permissions('payment.create')
  async createPaymentQR(
    @Body() request: PaymentRequest,
  ) {
    try {
      const adapter = this.adapterFactory.getAdapter(request.gateway as any);

      if (!adapter.createPaymentQR) {
        throw new Error(`البوابة ${request.gateway} لا تدعم إنشاء QR codes`);
      }

      const qrCode = await adapter.createPaymentQR(request);

      return {
        gateway: request.gateway,
        qrCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 دقيقة
      };
    } catch (error) {
      throw new Error(`فشل في إنشاء QR code: ${error.message}`);
    }
  }

  /**
   * التحقق من دعم العملة بواسطة البوابة
   */
  @Get('gateways/:gateway/currency/:currency')
  @Permissions('payment.read')
  async checkCurrencySupport(
    @Param('gateway') gateway: PaymentGateway,
    @Param('currency') currency: string,
  ) {
    const isSupported = this.adapterFactory.isCurrencySupported(gateway, currency);

    return {
      gateway,
      currency: currency.toUpperCase(),
      supported: isSupported,
    };
  }

  /**
   * التحقق من دعم طريقة الدفع بواسطة البوابة
   */
  @Get('gateways/:gateway/method/:method')
  @Permissions('payment.read')
  async checkMethodSupport(
    @Param('gateway') gateway: PaymentGateway,
    @Param('method') method: string,
  ) {
    const isSupported = this.adapterFactory.isMethodSupported(gateway, method);

    return {
      gateway,
      method,
      supported: isSupported,
    };
  }

  /**
   * الحصول على البوابات المتاحة لعملة محددة
   */
  @Get('gateways/currency/:currency')
  @Permissions('payment.read')
  async getGatewaysForCurrency(@Param('currency') currency: string) {
    const gateways = this.adapterFactory.getGatewaysForCurrency(currency);
    const gatewayInfo = gateways.map(gateway => this.adapterFactory.getGatewayInfo(gateway));

    return {
      currency: currency.toUpperCase(),
      gateways: gatewayInfo,
      total: gateways.length,
    };
  }

  /**
   * الحصول على البوابات المتاحة لطريقة دفع محددة
   */
  @Get('gateways/method/:method')
  @Permissions('payment.read')
  async getGatewaysForMethod(@Param('method') method: string) {
    const gateways = this.adapterFactory.getGatewaysForMethod(method);
    const gatewayInfo = gateways.map(gateway => this.adapterFactory.getGatewayInfo(gateway));

    return {
      method,
      gateways: gatewayInfo,
      total: gateways.length,
    };
  }

  /**
   * تسوية المعاملات
   */
  @Post('reconcile')
  @Permissions('payment.admin')
  async reconcileTransactions(
    @Body() body: {
      gateway: PaymentGateway;
      startDate: string;
      endDate: string;
    },
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    return this.paymentService.reconcileTransactions(body.gateway, startDate, endDate);
  }

  /**
   * إنشاء تقرير دفع
   */
  @Get('reports/transactions')
  @Permissions('payment.read')
  async getPaymentReport(
    @Query('gateway') gateway?: PaymentGateway,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    // TODO: تنفيذ إنشاء تقرير الدفع
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

  /**
   * إحصائيات الأداء
   */
  @Get('performance')
  @Permissions('payment.read')
  async getPaymentPerformance(
    @Query('gateway') gateway?: PaymentGateway,
    @Query('period') period: 'hour' | 'day' | 'week' | 'month' = 'day',
  ) {
    // TODO: تنفيذ إحصائيات الأداء
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

  // ========== CALLBACK ENDPOINTS ==========

  /**
   * Callback من Stripe للدفع الناجح
   */
  @Get('stripe/success')
  async stripePaymentSuccess(
    @Query('payment_intent') paymentIntentId: string,
    @Query('redirect_status') status: string,
  ) {
    return {
      gateway: 'stripe',
      paymentIntentId,
      status,
      message: 'تم إكمال الدفع بنجاح',
      redirect: '/payment/success',
    };
  }

  /**
   * Callback من Stripe لإلغاء الدفع
   */
  @Get('stripe/cancel')
  async stripePaymentCancel(@Query('payment_intent') paymentIntentId: string) {
    return {
      gateway: 'stripe',
      paymentIntentId,
      status: 'cancelled',
      message: 'تم إلغاء الدفع',
      redirect: '/payment/cancelled',
    };
  }

  /**
   * Callback من PayPal
   */
  @Get('paypal/callback')
  async paypalCallback(
    @Query('token') token: string,
    @Query('PayerID') payerId: string,
  ) {
    return {
      gateway: 'paypal',
      token,
      payerId,
      message: 'تم استلام callback من PayPal',
      redirect: '/payment/processing',
    };
  }

  /**
   * Callback من Tap
   */
  @Get('tap/callback')
  async tapCallback(
    @Query('tap_id') tapId: string,
    @Query('reference') reference: string,
  ) {
    return {
      gateway: 'tap',
      tapId,
      reference,
      message: 'تم استلام callback من Tap',
      redirect: '/payment/processing',
    };
  }
}
