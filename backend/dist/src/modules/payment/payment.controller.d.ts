import { PaymentService } from './payment.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import type { PaymentRequest, RefundRequest, PaymentGateway } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    private readonly adapterFactory;
    constructor(paymentService: PaymentService, adapterFactory: PaymentAdapterFactory);
    processPayment(request: PaymentRequest): Promise<import("./payment.service").PaymentResponse>;
    processRefund(refundRequest: RefundRequest): Promise<import("./payment.service").RefundResponse>;
    getTransaction(transactionId: string): Promise<{
        transactionId: string;
        status: string;
        message: string;
    }>;
    getUserTransactions(page?: number, limit?: number, status?: string): Promise<{
        transactions: never[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        message: string;
    }>;
    getPaymentStats(branchId?: string, startDate?: string, endDate?: string): Promise<import("./payment.service").PaymentStats>;
    getAvailableGateways(): Promise<{
        gateways: {
            name: string;
            displayName: string;
            description: string;
            supportedCurrencies: string[];
            supportedMethods: string[];
            features: string[];
        }[];
        total: number;
    }>;
    getGatewayInfo(gateway: PaymentGateway): Promise<{
        available: boolean;
        name: string;
        displayName: string;
        description: string;
        supportedCurrencies: string[];
        supportedMethods: string[];
        features: string[];
    }>;
    createPaymentLink(request: PaymentRequest): Promise<{
        gateway: string;
        paymentLink: string;
        expiresAt: Date;
    }>;
    createPaymentQR(request: PaymentRequest): Promise<{
        gateway: string;
        qrCode: string;
        expiresAt: Date;
    }>;
    checkCurrencySupport(gateway: PaymentGateway, currency: string): Promise<{
        gateway: PaymentGateway;
        currency: string;
        supported: boolean;
    }>;
    checkMethodSupport(gateway: PaymentGateway, method: string): Promise<{
        gateway: PaymentGateway;
        method: string;
        supported: boolean;
    }>;
    getGatewaysForCurrency(currency: string): Promise<{
        currency: string;
        gateways: {
            name: string;
            displayName: string;
            description: string;
            supportedCurrencies: string[];
            supportedMethods: string[];
            features: string[];
        }[];
        total: number;
    }>;
    getGatewaysForMethod(method: string): Promise<{
        method: string;
        gateways: {
            name: string;
            displayName: string;
            description: string;
            supportedCurrencies: string[];
            supportedMethods: string[];
            features: string[];
        }[];
        total: number;
    }>;
    reconcileTransactions(body: {
        gateway: PaymentGateway;
        startDate: string;
        endDate: string;
    }): Promise<import("./payment.service").ReconciliationResult>;
    getPaymentReport(gateway?: PaymentGateway, status?: string, startDate?: string, endDate?: string, format?: 'json' | 'csv'): Promise<{
        report: {
            gateway: string;
            status: string;
            period: {
                start: string;
                end: string;
            };
            format: "json" | "csv";
        };
        data: never[];
        message: string;
    }>;
    getPaymentPerformance(gateway?: PaymentGateway, period?: 'hour' | 'day' | 'week' | 'month'): Promise<{
        gateway: string;
        period: "week" | "day" | "hour" | "month";
        metrics: {
            totalTransactions: number;
            successRate: number;
            averageProcessingTime: number;
            errorRate: number;
        };
        trends: never[];
        message: string;
    }>;
    stripePaymentSuccess(paymentIntentId: string, status: string): Promise<{
        gateway: string;
        paymentIntentId: string;
        status: string;
        message: string;
        redirect: string;
    }>;
    stripePaymentCancel(paymentIntentId: string): Promise<{
        gateway: string;
        paymentIntentId: string;
        status: string;
        message: string;
        redirect: string;
    }>;
    paypalCallback(token: string, payerId: string): Promise<{
        gateway: string;
        token: string;
        payerId: string;
        message: string;
        redirect: string;
    }>;
    tapCallback(tapId: string, reference: string): Promise<{
        gateway: string;
        tapId: string;
        reference: string;
        message: string;
        redirect: string;
    }>;
}
