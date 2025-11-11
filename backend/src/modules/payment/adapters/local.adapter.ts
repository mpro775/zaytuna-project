import { BasePaymentAdapter, PaymentConfig } from './base-payment.adapter';
import { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../payment.service';

export class LocalAdapter extends BasePaymentAdapter {
  constructor(config: PaymentConfig) {
    super(config);
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // للمدفوعات المحلية (نقدي، تحويل بنكي، إلخ)
      // لا نحتاج لإرسال طلب إلى بوابة خارجية

      let status: 'success' | 'pending' | 'failed' = 'pending';

      // تحديد الحالة بناءً على طريقة الدفع
      switch (request.method) {
        case 'cash':
          status = 'success'; // النقدي يُعتبر مكتملاً فوراً
          break;
        case 'bank_transfer':
          status = 'pending'; // التحويل البنكي يحتاج تأكيد
          break;
        case 'check':
          status = 'pending'; // الشيك يحتاج تحصيل
          break;
        default:
          status = 'success';
      }

      return {
        transactionId: request.invoiceId,
        status,
        gatewayTransactionId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gatewayResponse: {
          method: request.method,
          processed_at: new Date().toISOString(),
          amount: request.amount,
          currency: request.currency,
          local_payment: true,
        },
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
      // الاسترداد المحلي (إعادة النقود أو إلغاء الشيك)

      return {
        refundId: `local_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        refundAmount: refundRequest.amount,
        gatewayRefundId: `local_refund_${Date.now()}`,
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
    // للمدفوعات المحلية، نفترض أنها مكتملة
    return 'completed';
  }

  async processWebhook(payload: any, signature?: string): Promise<any> {
    // المدفوعات المحلية لا تستخدم webhooks عادةً
    throw new Error('Webhooks not supported for local payments');
  }

  async cancelTransaction(transactionId: string): Promise<boolean> {
    // إلغاء معاملة محلية - قد يحتاج تحديث حالة الفاتورة
    return true;
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    // إرجاع تفاصيل المعاملة المحلية
    return {
      id: transactionId,
      type: 'local',
      status: 'completed',
      created_at: new Date().toISOString(),
    };
  }

  protected verifySignature(payload: any, signature: string): boolean {
    // لا نحتاج للتحقق من التوقيع للمدفوعات المحلية
    return true;
  }

  protected createSignature(payload: any): string {
    // لا نحتاج لتوقيع الطلبات
    return '';
  }
}
