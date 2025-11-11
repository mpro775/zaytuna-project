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
export declare class PaymentService {
    private readonly prisma;
    private readonly cacheService;
    private readonly configService;
    private readonly auditService;
    private readonly logger;
    private readonly paymentCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService, configService: ConfigService, auditService: AuditService);
    processPayment(request: PaymentRequest, userId: string, ipAddress?: string, userAgent?: string): Promise<PaymentResponse>;
    processRefund(refundRequest: RefundRequest, userId: string): Promise<RefundResponse>;
    processWebhook(webhookData: WebhookData): Promise<void>;
    getPaymentStats(branchId?: string, startDate?: Date, endDate?: Date): Promise<PaymentStats>;
    reconcileTransactions(gateway: string, startDate: Date, endDate: Date): Promise<ReconciliationResult>;
    private validatePaymentRequest;
    private createPaymentTransaction;
    private processGatewayPayment;
    private processStripePayment;
    private processPayPalPayment;
    private processTapPayment;
    private processLocalPayment;
    private processGatewayRefund;
    private processStripeRefund;
    private processPayPalRefund;
    private processTapRefund;
    private processLocalRefund;
    private validateWebhookSignature;
    private updateTransactionFromWebhook;
    private handlePaymentSuccess;
    private handlePaymentFailure;
    private handleRefundSuccess;
    private handleDisputeCreated;
    private updateTransactionStatus;
    private generateTransactionId;
    private calculateGatewayStats;
    private calculateDailyStats;
    private fetchGatewayTransactions;
    private compareTransactions;
}
