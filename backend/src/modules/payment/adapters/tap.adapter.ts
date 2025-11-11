import { BasePaymentAdapter, PaymentConfig } from './base-payment.adapter';
import { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../payment.service';

export class TapAdapter extends BasePaymentAdapter {
  constructor(config: PaymentConfig) {
    super(config);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const amount = this.formatAmount(request.amount, 'tap');
      const currency = this.formatCurrency(request.currency, 'tap');

      // إنشاء معاملة Tap
      const charge = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v2/charges', {
          amount,
          currency,
          description: request.description,
          reference: {
            transaction: request.invoiceId,
            order: request.invoiceId,
          },
          metadata: {
            invoice_type: request.invoiceType,
            ...request.metadata,
          },
          source: {
            type: request.method === 'card' ? 'card' : 'wallet',
          },
          redirect: {
            url: `${process.env.APP_URL}/payment/tap/callback`,
          },
        });
      });

      return {
        transactionId: request.invoiceId,
        status: this.normalizeStatus(charge.status, 'tap'),
        gatewayTransactionId: charge.id,
        gatewayResponse: charge,
        ...(charge.transaction?.url && {
          redirectUrl: charge.transaction.url,
        }),
        ...(charge.qr_code && {
          qrCode: charge.qr_code,
        }),
      };
    } catch (error) {
      return {
        transactionId: request.invoiceId,
        status: 'failed',
        gatewayResponse: { error: error.message },
      };
    }
  }

  async processRefund(transactionId: string, refundRequest: RefundRequest): Promise<RefundResponse> {
    try {
      const refund = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v2/refunds', {
          charge_id: transactionId,
          amount: refundRequest.amount,
          currency: 'SAR', // يجب تحديث حسب العملة الفعلية
          reason: refundRequest.reason,
          metadata: refundRequest.metadata,
        });
      });

      return {
        refundId: refund.id,
        status: refund.status === 'REFUNDED' ? 'success' : 'pending',
        refundAmount: refundRequest.amount,
        gatewayRefundId: refund.id,
      };
    } catch (error) {
      return {
        refundId: `refund_failed_${Date.now()}`,
        status: 'failed',
        refundAmount: 0,
      };
    }
  }

  async checkTransactionStatus(transactionId: string): Promise<string> {
    try {
      const charge = await this.makeRequest('GET', `/v2/charges/${transactionId}`);
      return this.normalizeStatus(charge.status, 'tap');
    } catch (error) {
      return 'unknown';
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<any> {
    if (signature && !this.verifySignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const event = payload;

    return {
      id: event.id,
      type: event.type,
      data: event.data,
      created: new Date(event.created * 1000),
      signature,
    };
  }

  async cancelTransaction(transactionId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/v2/charges/${transactionId}/cancel`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      return await this.makeRequest('GET', `/v2/charges/${transactionId}`);
    } catch (error) {
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  async createPaymentQR(request: PaymentRequest): Promise<string> {
    try {
      const amount = this.formatAmount(request.amount, 'tap');
      const currency = this.formatCurrency(request.currency, 'tap');

      const qrCharge = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v2/charges', {
          amount,
          currency,
          description: request.description,
          reference: {
            transaction: request.invoiceId,
            order: request.invoiceId,
          },
          source: {
            type: 'CARD_NOT_PRESENT',
          },
          metadata: {
            invoice_type: request.invoiceType,
            qr_payment: true,
            ...request.metadata,
          },
        });
      });

      return qrCharge.qr_code || '';
    } catch (error) {
      throw new Error(`Failed to create QR code: ${error.message}`);
    }
  }

  protected verifySignature(payload: any, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return true; // Skip verification if no secret configured
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(JSON.stringify(payload), 'utf8')
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  protected createSignature(payload: any): string {
    // Tap لا يتطلب توقيع للطلبات الصادرة
    return '';
  }
}
