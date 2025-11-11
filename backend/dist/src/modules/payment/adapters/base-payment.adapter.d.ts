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
export declare abstract class BasePaymentAdapter {
    protected config: PaymentConfig;
    constructor(config: PaymentConfig);
    abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;
    abstract processRefund(transactionId: string, refundRequest: RefundRequest): Promise<RefundResponse>;
    abstract checkTransactionStatus(transactionId: string): Promise<string>;
    abstract processWebhook(payload: any, signature?: string): Promise<WebhookEvent>;
    abstract cancelTransaction(transactionId: string): Promise<boolean>;
    abstract getTransactionDetails(transactionId: string): Promise<any>;
    createPaymentLink?(request: PaymentRequest): Promise<string>;
    createPaymentQR?(request: PaymentRequest): Promise<string>;
    protected abstract verifySignature(payload: any, signature: string): boolean;
    protected abstract createSignature(payload: any): string;
    protected makeRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any, headers?: Record<string, string>): Promise<any>;
    protected retryWithBackoff<T>(operation: () => Promise<T>, maxAttempts?: number): Promise<T>;
    protected formatAmount(amount: number, gateway: string): number;
    protected formatCurrency(currency: string, gateway: string): string;
    protected extractCardInfo(response: any): {
        last4?: string;
        brand?: string;
    };
    protected extractWalletInfo(response: any): {
        provider?: string;
    };
    protected normalizeStatus(gatewayStatus: string, gateway: string): string;
}
