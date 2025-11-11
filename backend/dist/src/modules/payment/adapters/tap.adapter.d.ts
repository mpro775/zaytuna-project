import { BasePaymentAdapter, PaymentConfig } from './base-payment.adapter';
import { PaymentRequest, PaymentResponse, RefundRequest, RefundResponse } from '../payment.service';
export declare class TapAdapter extends BasePaymentAdapter {
    constructor(config: PaymentConfig);
    processPayment(request: PaymentRequest): Promise<PaymentResponse>;
    processRefund(transactionId: string, refundRequest: RefundRequest): Promise<RefundResponse>;
    checkTransactionStatus(transactionId: string): Promise<string>;
    processWebhook(payload: any, signature?: string): Promise<any>;
    cancelTransaction(transactionId: string): Promise<boolean>;
    getTransactionDetails(transactionId: string): Promise<any>;
    createPaymentQR(request: PaymentRequest): Promise<string>;
    protected verifySignature(payload: any, signature: string): boolean;
    protected createSignature(payload: any): string;
}
