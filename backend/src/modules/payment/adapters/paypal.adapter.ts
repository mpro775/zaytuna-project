import { BasePaymentAdapter, PaymentConfig } from './base-payment.adapter';
import { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../payment.service';

export class PayPalAdapter extends BasePaymentAdapter {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(config: PaymentConfig) {
    super(config);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      await this.ensureAccessToken();

      const currency = this.formatCurrency(request.currency, 'paypal');

      // إنشاء طلب دفع
      const order = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', '/v2/checkout/orders', {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: request.invoiceId,
            amount: {
              currency_code: currency,
              value: request.amount.toFixed(2),
            },
            description: request.description,
          }],
          application_context: {
            return_url: `${process.env.APP_URL}/payment/success`,
            cancel_url: `${process.env.APP_URL}/payment/cancel`,
          },
        }, {
          'Authorization': `Bearer ${this.accessToken}`,
          'PayPal-Request-Id': `paypal_${Date.now()}`,
        });
      });

      return {
        transactionId: request.invoiceId,
        status: this.normalizeStatus(order.status, 'paypal'),
        gatewayTransactionId: order.id,
        gatewayResponse: order,
        ...(order.links && {
          redirectUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
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
      await this.ensureAccessToken();

      const refund = await this.retryWithBackoff(async () => {
        return this.makeRequest('POST', `/v2/payments/captures/${transactionId}/refund`, {
          amount: {
            value: refundRequest.amount.toFixed(2),
            currency_code: 'SAR', // يجب تحديث هذا حسب العملة الفعلية
          },
          reason: refundRequest.reason,
        }, {
          'Authorization': `Bearer ${this.accessToken}`,
        });
      });

      return {
        refundId: refund.id,
        status: refund.status === 'COMPLETED' ? 'success' : 'pending',
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
      await this.ensureAccessToken();

      const order = await this.makeRequest('GET', `/v2/checkout/orders/${transactionId}`, undefined, {
        'Authorization': `Bearer ${this.accessToken}`,
      });

      return this.normalizeStatus(order.status, 'paypal');
    } catch (error) {
      return 'unknown';
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<any> {
    // PayPal يستخدم webhook verification مختلف
    const event = payload;

    return {
      id: event.id,
      type: event.event_type,
      data: event.resource,
      created: new Date(event.create_time),
      signature,
    };
  }

  async cancelTransaction(transactionId: string): Promise<boolean> {
    try {
      // PayPal لا يدعم إلغاء مباشر، يمكن إلغاء الطلب
      return false;
    } catch (error) {
      return false;
    }
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      await this.ensureAccessToken();

      return await this.makeRequest('GET', `/v2/checkout/orders/${transactionId}`, undefined, {
        'Authorization': `Bearer ${this.accessToken}`,
      });
    } catch (error) {
      throw new Error(`Failed to get transaction details: ${error.message}`);
    }
  }

  protected verifySignature(payload: any, signature: string): boolean {
    // PayPal webhook verification - يتطلب تنفيذ أكثر تعقيداً
    return true; // Placeholder
  }

  protected createSignature(payload: any): string {
    // PayPal لا يتطلب توقيع للطلبات الصادرة
    return '';
  }

  /**
   * الحصول على access token من PayPal
   */
  private async ensureAccessToken(): Promise<void> {
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return;
    }

    try {
      const auth = Buffer.from(`${this.config.apiKey}:${this.config.secretKey}`).toString('base64');

      const response = await this.makeRequest('POST', '/v1/oauth2/token', 'grant_type=client_credentials', {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      this.accessToken = response.access_token;
      // PayPal tokens تنتهي خلال 9 ساعات تقريباً
      this.tokenExpiresAt = new Date(Date.now() + (response.expires_in - 60) * 1000); // -60 ثانية للأمان
    } catch (error) {
      throw new Error(`Failed to get PayPal access token: ${error.message}`);
    }
  }
}
