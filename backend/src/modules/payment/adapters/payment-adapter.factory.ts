import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BasePaymentAdapter, PaymentConfig } from './base-payment.adapter';
import { StripeAdapter } from './stripe.adapter';
import { PayPalAdapter } from './paypal.adapter';
import { TapAdapter } from './tap.adapter';
import { LocalAdapter } from './local.adapter';

export type PaymentGateway = 'stripe' | 'paypal' | 'tap' | 'local';

@Injectable()
export class PaymentAdapterFactory {
  private adapters: Map<PaymentGateway, BasePaymentAdapter> = new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * إنشاء أو استرجاع adapter لبوابة محددة
   */
  getAdapter(gateway: PaymentGateway): BasePaymentAdapter {
    if (this.adapters.has(gateway)) {
      return this.adapters.get(gateway)!;
    }

    const adapter = this.createAdapter(gateway);
    this.adapters.set(gateway, adapter);
    return adapter;
  }

  /**
   * إنشاء adapter جديد لبوابة محددة
   */
  private createAdapter(gateway: PaymentGateway): BasePaymentAdapter {
    const config = this.getGatewayConfig(gateway);

    switch (gateway) {
      case 'stripe':
        return new StripeAdapter(config);
      case 'paypal':
        return new PayPalAdapter(config);
      case 'tap':
        return new TapAdapter(config);
      case 'local':
        return new LocalAdapter(config);
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * الحصول على إعدادات البوابة من متغيرات البيئة
   */
  private getGatewayConfig(gateway: PaymentGateway): PaymentConfig {
    const baseConfig = {
      timeout: 30000, // 30 ثانية
      retryAttempts: 3,
    };

    switch (gateway) {
      case 'stripe':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('STRIPE_SECRET_KEY', ''),
          webhookSecret: this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
          baseUrl: 'https://api.stripe.com',
        };

      case 'paypal':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('PAYPAL_CLIENT_ID', ''),
          secretKey: this.configService.get<string>('PAYPAL_CLIENT_SECRET'),
          baseUrl: this.configService.get<string>('PAYPAL_ENVIRONMENT') === 'sandbox'
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com',
        };

      case 'tap':
        return {
          ...baseConfig,
          apiKey: this.configService.get<string>('TAP_API_KEY', ''),
          webhookSecret: this.configService.get<string>('TAP_WEBHOOK_SECRET'),
          baseUrl: 'https://api.tap.company',
        };

      case 'local':
        return {
          ...baseConfig,
          apiKey: 'local_system',
          baseUrl: '', // لا نحتاج baseUrl للمدفوعات المحلية
        };

      default:
        throw new Error(`Configuration not found for gateway: ${gateway}`);
    }
  }

  /**
   * التحقق من توفر البوابة
   */
  isGatewayAvailable(gateway: PaymentGateway): boolean {
    try {
      const config = this.getGatewayConfig(gateway);
      return !!(config.apiKey && config.apiKey.trim() !== '');
    } catch (error) {
      return false;
    }
  }

  /**
   * الحصول على قائمة البوابات المتاحة
   */
  getAvailableGateways(): PaymentGateway[] {
    const allGateways: PaymentGateway[] = ['stripe', 'paypal', 'tap', 'local'];
    return allGateways.filter(gateway => this.isGatewayAvailable(gateway));
  }

  /**
   * إعادة تهيئة adapter لبوابة محددة
   */
  reinitializeAdapter(gateway: PaymentGateway): void {
    this.adapters.delete(gateway);
    // سيتم إنشاء adapter جديد عند الحاجة
  }

  /**
   * إغلاق جميع الـ adapters
   */
  closeAllAdapters(): void {
    this.adapters.clear();
  }

  /**
   * الحصول على معلومات البوابة
   */
  getGatewayInfo(gateway: PaymentGateway): {
    name: string;
    displayName: string;
    description: string;
    supportedCurrencies: string[];
    supportedMethods: string[];
    features: string[];
  } {
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

  /**
   * التحقق من دعم العملة بواسطة البوابة
   */
  isCurrencySupported(gateway: PaymentGateway, currency: string): boolean {
    const info = this.getGatewayInfo(gateway);
    return info.supportedCurrencies.includes(currency.toUpperCase());
  }

  /**
   * التحقق من دعم طريقة الدفع بواسطة البوابة
   */
  isMethodSupported(gateway: PaymentGateway, method: string): boolean {
    const info = this.getGatewayInfo(gateway);
    return info.supportedMethods.includes(method);
  }

  /**
   * الحصول على البوابات التي تدعم عملة محددة
   */
  getGatewaysForCurrency(currency: string): PaymentGateway[] {
    const availableGateways = this.getAvailableGateways();
    return availableGateways.filter(gateway =>
      this.isCurrencySupported(gateway, currency)
    );
  }

  /**
   * الحصول على البوابات التي تدعم طريقة دفع محددة
   */
  getGatewaysForMethod(method: string): PaymentGateway[] {
    const availableGateways = this.getAvailableGateways();
    return availableGateways.filter(gateway =>
      this.isMethodSupported(gateway, method)
    );
  }
}
