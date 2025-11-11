import { ConfigService } from '@nestjs/config';
import { BasePaymentAdapter } from './base-payment.adapter';
export type PaymentGateway = 'stripe' | 'paypal' | 'tap' | 'local';
export declare class PaymentAdapterFactory {
    private readonly configService;
    private adapters;
    constructor(configService: ConfigService);
    getAdapter(gateway: PaymentGateway): BasePaymentAdapter;
    private createAdapter;
    private getGatewayConfig;
    isGatewayAvailable(gateway: PaymentGateway): boolean;
    getAvailableGateways(): PaymentGateway[];
    reinitializeAdapter(gateway: PaymentGateway): void;
    closeAllAdapters(): void;
    getGatewayInfo(gateway: PaymentGateway): {
        name: string;
        displayName: string;
        description: string;
        supportedCurrencies: string[];
        supportedMethods: string[];
        features: string[];
    };
    isCurrencySupported(gateway: PaymentGateway, currency: string): boolean;
    isMethodSupported(gateway: PaymentGateway, method: string): boolean;
    getGatewaysForCurrency(currency: string): PaymentGateway[];
    getGatewaysForMethod(method: string): PaymentGateway[];
}
