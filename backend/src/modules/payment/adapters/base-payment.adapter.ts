import { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../payment.service';

export interface PaymentConfig {
  apiKey: string;
  secretKey?: string;
  webhookSecret?: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: Date;
  signature?: string;
}

export abstract class BasePaymentAdapter {
  protected config: PaymentConfig;

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  /**
   * معالجة الدفع
   */
  abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;

  /**
   * معالجة الاسترداد
   */
  abstract processRefund(transactionId: string, refundRequest: RefundRequest): Promise<RefundResponse>;

  /**
   * التحقق من حالة المعاملة
   */
  abstract checkTransactionStatus(transactionId: string): Promise<string>;

  /**
   * معالجة webhook
   */
  abstract processWebhook(payload: any, signature?: string): Promise<WebhookEvent>;

  /**
   * إلغاء معاملة
   */
  abstract cancelTransaction(transactionId: string): Promise<boolean>;

  /**
   * الحصول على تفاصيل المعاملة
   */
  abstract getTransactionDetails(transactionId: string): Promise<any>;

  /**
   * إنشاء رابط دفع (للبوابات التي تدعم ذلك)
   */
  createPaymentLink?(request: PaymentRequest): Promise<string> {
    throw new Error('Payment link creation not supported by this gateway');
  }

  /**
   * إنشاء QR code للدفع (للبوابات التي تدعم ذلك)
   */
  createPaymentQR?(request: PaymentRequest): Promise<string> {
    throw new Error('QR code generation not supported by this gateway');
  }

  /**
   * التحقق من صحة التوقيع
   */
  protected abstract verifySignature(payload: any, signature: string): boolean;

  /**
   * إنشاء توقيع للطلب
   */
  protected abstract createSignature(payload: any): string;

  /**
   * إرسال طلب HTTP
   */
  protected async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * إعادة المحاولة مع backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = this.config.retryAttempts,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          break;
        }

        // انتظار تصاعدي (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * تنسيق المبلغ حسب متطلبات البوابة
   */
  protected formatAmount(amount: number, gateway: string): number {
    switch (gateway) {
      case 'stripe':
        return Math.round(amount * 100); // cents
      case 'paypal':
        return amount; // dollars
      case 'tap':
        return Math.round(amount * 1000); // halalas
      default:
        return amount;
    }
  }

  /**
   * تنسيق العملة حسب متطلبات البوابة
   */
  protected formatCurrency(currency: string, gateway: string): string {
    switch (gateway) {
      case 'stripe':
      case 'tap':
        return currency.toLowerCase();
      case 'paypal':
        return currency.toUpperCase();
      default:
        return currency;
    }
  }

  /**
   * استخراج معلومات البطاقة من الاستجابة
   */
  protected extractCardInfo(response: any): { last4?: string; brand?: string } {
    return {
      last4: response?.card?.last4 || response?.payment_method_details?.card?.last4,
      brand: response?.card?.brand || response?.payment_method_details?.card?.brand,
    };
  }

  /**
   * استخراج معلومات المحفظة من الاستجابة
   */
  protected extractWalletInfo(response: any): { provider?: string } {
    return {
      provider: response?.wallet?.provider || response?.payment_method_details?.wallet?.provider,
    };
  }

  /**
   * تحويل حالة البوابة إلى حالة موحدة
   */
  protected normalizeStatus(gatewayStatus: string, gateway: string): string {
    const statusMap: Record<string, Record<string, string>> = {
      stripe: {
        'succeeded': 'completed',
        'pending': 'pending',
        'failed': 'failed',
        'canceled': 'cancelled',
        'requires_payment_method': 'failed',
        'requires_confirmation': 'pending',
        'requires_action': 'pending',
        'processing': 'processing',
        'requires_capture': 'pending',
      },
      paypal: {
        'COMPLETED': 'completed',
        'PENDING': 'pending',
        'FAILED': 'failed',
        'CANCELLED': 'cancelled',
        'APPROVED': 'pending',
        'CREATED': 'pending',
      },
      tap: {
        'CAPTURED': 'completed',
        'AUTHORIZED': 'pending',
        'DECLINED': 'failed',
        'CANCELLED': 'cancelled',
        'FAILED': 'failed',
        'PENDING': 'pending',
        'RESTRICTED': 'failed',
      },
    };

    return statusMap[gateway]?.[gatewayStatus] || 'unknown';
  }
}
