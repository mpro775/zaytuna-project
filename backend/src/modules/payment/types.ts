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
  remainingAmount: number;
  gatewayRefundId?: string;
  processedAt: Date;
}
