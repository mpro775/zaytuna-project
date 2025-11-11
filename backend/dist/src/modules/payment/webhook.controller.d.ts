import { PaymentService } from './payment.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
export declare class WebhookController {
    private readonly paymentService;
    private readonly adapterFactory;
    private readonly logger;
    constructor(paymentService: PaymentService, adapterFactory: PaymentAdapterFactory);
    stripeWebhook(payload: any, signature?: string): Promise<{
        received: boolean;
    }>;
    paypalWebhook(payload: any, transmissionId?: string, transmissionTime?: string, certUrl?: string, signature?: string): Promise<{
        received: boolean;
    }>;
    tapWebhook(payload: any, signature?: string): Promise<{
        received: boolean;
    }>;
    genericWebhook(payload: any, headers: Record<string, string>, gateway: string): Promise<{
        received: boolean;
    }>;
    testWebhook(payload: any, gateway: string): Promise<{
        received: boolean;
        gateway: string;
        mode: string;
        timestamp: string;
    }>;
    healthCheck(gateway: string): Promise<{
        gateway: string;
        status: string;
        available: boolean;
        timestamp: string;
        error?: undefined;
    } | {
        gateway: string;
        status: string;
        error: any;
        timestamp: string;
        available?: undefined;
    }>;
}
