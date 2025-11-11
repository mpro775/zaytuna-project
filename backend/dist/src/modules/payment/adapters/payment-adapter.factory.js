"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAdapterFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_adapter_1 = require("./stripe.adapter");
const paypal_adapter_1 = require("./paypal.adapter");
const tap_adapter_1 = require("./tap.adapter");
const local_adapter_1 = require("./local.adapter");
let PaymentAdapterFactory = class PaymentAdapterFactory {
    configService;
    adapters = new Map();
    constructor(configService) {
        this.configService = configService;
    }
    getAdapter(gateway) {
        if (this.adapters.has(gateway)) {
            return this.adapters.get(gateway);
        }
        const adapter = this.createAdapter(gateway);
        this.adapters.set(gateway, adapter);
        return adapter;
    }
    createAdapter(gateway) {
        const config = this.getGatewayConfig(gateway);
        switch (gateway) {
            case 'stripe':
                return new stripe_adapter_1.StripeAdapter(config);
            case 'paypal':
                return new paypal_adapter_1.PayPalAdapter(config);
            case 'tap':
                return new tap_adapter_1.TapAdapter(config);
            case 'local':
                return new local_adapter_1.LocalAdapter(config);
            default:
                throw new Error(`Unsupported payment gateway: ${gateway}`);
        }
    }
    getGatewayConfig(gateway) {
        const baseConfig = {
            timeout: 30000,
            retryAttempts: 3,
        };
        switch (gateway) {
            case 'stripe':
                return {
                    ...baseConfig,
                    apiKey: this.configService.get('STRIPE_SECRET_KEY', ''),
                    webhookSecret: this.configService.get('STRIPE_WEBHOOK_SECRET'),
                    baseUrl: 'https://api.stripe.com',
                };
            case 'paypal':
                return {
                    ...baseConfig,
                    apiKey: this.configService.get('PAYPAL_CLIENT_ID', ''),
                    secretKey: this.configService.get('PAYPAL_CLIENT_SECRET'),
                    baseUrl: this.configService.get('PAYPAL_ENVIRONMENT') === 'sandbox'
                        ? 'https://api-m.sandbox.paypal.com'
                        : 'https://api-m.paypal.com',
                };
            case 'tap':
                return {
                    ...baseConfig,
                    apiKey: this.configService.get('TAP_API_KEY', ''),
                    webhookSecret: this.configService.get('TAP_WEBHOOK_SECRET'),
                    baseUrl: 'https://api.tap.company',
                };
            case 'local':
                return {
                    ...baseConfig,
                    apiKey: 'local_system',
                    baseUrl: '',
                };
            default:
                throw new Error(`Configuration not found for gateway: ${gateway}`);
        }
    }
    isGatewayAvailable(gateway) {
        try {
            const config = this.getGatewayConfig(gateway);
            return !!(config.apiKey && config.apiKey.trim() !== '');
        }
        catch (error) {
            return false;
        }
    }
    getAvailableGateways() {
        const allGateways = ['stripe', 'paypal', 'tap', 'local'];
        return allGateways.filter(gateway => this.isGatewayAvailable(gateway));
    }
    reinitializeAdapter(gateway) {
        this.adapters.delete(gateway);
    }
    closeAllAdapters() {
        this.adapters.clear();
    }
    getGatewayInfo(gateway) {
        const gatewayInfo = {
            stripe: {
                name: 'stripe',
                displayName: 'Stripe',
                description: 'بوابة دفع عالمية تدعم جميع أنواع البطاقات والمحافظ',
                supportedCurrencies: ['SAR', 'USD', 'EUR', 'GBP'],
                supportedMethods: ['card', 'wallet'],
                features: ['3d_secure', 'recurring', 'refunds', 'webhooks', 'payment_links'],
            },
            paypal: {
                name: 'paypal',
                displayName: 'PayPal',
                description: 'بوابة دفع شهيرة تدعم الحسابات البنكية والمحافظ',
                supportedCurrencies: ['SAR', 'USD', 'EUR', 'GBP'],
                supportedMethods: ['paypal', 'card'],
                features: ['recurring', 'refunds', 'webhooks'],
            },
            tap: {
                name: 'tap',
                displayName: 'Tap',
                description: 'بوابة دفع متخصصة في الشرق الأوسط ودعم العملات المحلية',
                supportedCurrencies: ['SAR', 'AED', 'KWD', 'BHD'],
                supportedMethods: ['card', 'wallet', 'bank_transfer'],
                features: ['qr_code', 'refunds', 'webhooks', 'apple_pay', 'google_pay'],
            },
            local: {
                name: 'local',
                displayName: 'الدفع المحلي',
                description: 'مدفوعات نقدية وتحويلات بنكية محلية',
                supportedCurrencies: ['SAR'],
                supportedMethods: ['cash', 'bank_transfer', 'check'],
                features: ['offline_support', 'manual_processing'],
            },
        };
        return gatewayInfo[gateway];
    }
    isCurrencySupported(gateway, currency) {
        const info = this.getGatewayInfo(gateway);
        return info.supportedCurrencies.includes(currency.toUpperCase());
    }
    isMethodSupported(gateway, method) {
        const info = this.getGatewayInfo(gateway);
        return info.supportedMethods.includes(method);
    }
    getGatewaysForCurrency(currency) {
        const availableGateways = this.getAvailableGateways();
        return availableGateways.filter(gateway => this.isCurrencySupported(gateway, currency));
    }
    getGatewaysForMethod(method) {
        const availableGateways = this.getAvailableGateways();
        return availableGateways.filter(gateway => this.isMethodSupported(gateway, method));
    }
};
exports.PaymentAdapterFactory = PaymentAdapterFactory;
exports.PaymentAdapterFactory = PaymentAdapterFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaymentAdapterFactory);
//# sourceMappingURL=payment-adapter.factory.js.map