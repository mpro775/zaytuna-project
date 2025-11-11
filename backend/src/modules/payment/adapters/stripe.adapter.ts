import { BasePaymentAdapter, PaymentConfig } from './base-payment.adapter';
import { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../payment.service';

export class StripeAdapter extends BasePaymentAdapter {
  constructor(config: PaymentConfig) {
    super(config);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const amount = this.formatAmount(request.amount, 'stripe');
      const currency = this.formatCurrency(request.currency, 'stripe');

      // إنشاء Payment Intent
      const paymentIntent = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v1/payment_intents', {
          amount,
          currency,
          description: request.description,
          metadata: {
            invoice_id: request.invoiceId,
            invoice_type: request.invoiceType,
            ...request.metadata,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });
      });

      return {
        transactionId: request.invoiceId,
        status: this.normalizeStatus(paymentIntent.status, 'stripe'),
        gatewayTransactionId: paymentIntent.id,
        gatewayResponse: paymentIntent,
        ...(paymentIntent.next_action?.redirect_to_url && {
          redirectUrl: paymentIntent.next_action.redirect_to_url.url,
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
      // أولاً نحصل على Payment Intent ID من قاعدة البيانات أو من الـ transactionId
      // هنا نفترض أن transactionId هو Payment Intent ID
      const amount = this.formatAmount(refundRequest.amount, 'stripe');

      const refund = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v1/refunds', {
          payment_intent: transactionId,
          amount,
          reason: this.mapRefundReason(refundRequest.reason),
          metadata: refundRequest.metadata,
        });
      });

      return {
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'success' : 'pending',
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
      const paymentIntent = await this.makeRequest('GET', `/v1/payment_intents/${transactionId}`);
      return this.normalizeStatus(paymentIntent.status, 'stripe');
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
      data: event.data.object,
      created: new Date(event.created * 1000),
      signature,
    };
  }

  async cancelTransaction(transactionId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/v1/payment_intents/${transactionId}/cancel`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      return await this.makeRequest('GET', `/v1/payment_intents/${transactionId}`);
    } catch (error) {
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  async createPaymentLink(request: PaymentRequest): Promise<string> {
    try {
      const amount = this.formatAmount(request.amount, 'stripe');
      const currency = this.formatCurrency(request.currency, 'stripe');

      const paymentLink = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v1/payment_links', {
          line_items: [{
            price_data: {
              currency,
              product_data: {
                name: request.description || 'Payment',
              },
              unit_amount: amount,
            },
            quantity: 1,
          }],
          metadata: {
            invoice_id: request.invoiceId,
            invoice_type: request.invoiceType,
          },
        });
      });

      return paymentLink.url;
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }

  protected verifySignature(payload: any, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return true; // Skip verification if no secret configured
    }

    try {
      const crypto = require('crypto');
      const elements = signature.split(',');
      const signatureElements: Record<string, string> = {};

      elements.forEach(element => {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      });

      const timestamp = signatureElements['t'];
      const expectedSignature = signatureElements['v1'];

      const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
      const expected = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      return expected === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  protected createSignature(payload: any): string {
    // Stripe لا يتطلب توقيع للطلبات الصادرة
    return '';
  }

  private mapRefundReason(reason: string): string {
    const reasonMap: Record<string, string> = {
      'duplicate': 'duplicate',
      'fraudulent': 'fraudulent',
      'requested_by_customer': 'requested_by_customer',
    };

    return reasonMap[reason.toLowerCase()] || 'requested_by_customer';
  }
}
