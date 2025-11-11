"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePaymentAdapter = void 0;
class BasePaymentAdapter {
    config;
    constructor(config) {
        this.config = config;
    }
    createPaymentLink(request) {
        throw new Error('Payment link creation not supported by this gateway');
    }
    createPaymentQR(request) {
        throw new Error('QR code generation not supported by this gateway');
    }
    async makeRequest(method, endpoint, data, headers) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...headers,
        };
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            const response = await fetch(url, {
                method,
                headers: requestHeaders,
                body: data ? JSON.stringify(data) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }
    async retryWithBackoff(operation, maxAttempts = this.config.retryAttempts) {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxAttempts) {
                    break;
                }
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    formatAmount(amount, gateway) {
        switch (gateway) {
            case 'stripe':
                return Math.round(amount * 100);
            case 'paypal':
                return amount;
            case 'tap':
                return Math.round(amount * 1000);
            default:
                return amount;
        }
    }
    formatCurrency(currency, gateway) {
        switch (gateway) {
            case 'stripe':
            case 'tap':
                return currency.toLowerCase();
            case 'paypal':
                return currency.toUpperCase();
            default:
                return currency;
        }
    }
    extractCardInfo(response) {
        return {
            last4: response?.card?.last4 || response?.payment_method_details?.card?.last4,
            brand: response?.card?.brand || response?.payment_method_details?.card?.brand,
        };
    }
    extractWalletInfo(response) {
        return {
            provider: response?.wallet?.provider || response?.payment_method_details?.wallet?.provider,
        };
    }
    normalizeStatus(gatewayStatus, gateway) {
        const statusMap = {
            stripe: {
                'succeeded': 'completed',
                'pending': 'pending',
                'failed': 'failed',
                'canceled': 'cancelled',
                'requires_payment_method': 'failed',
                'requires_confirmation': 'pending',
                'requires_action': 'pending',
                'processing': 'processing',
                'requires_capture': 'pending',
            },
            paypal: {
                'COMPLETED': 'completed',
                'PENDING': 'pending',
                'FAILED': 'failed',
                'CANCELLED': 'cancelled',
                'APPROVED': 'pending',
                'CREATED': 'pending',
            },
            tap: {
                'CAPTURED': 'completed',
                'AUTHORIZED': 'pending',
                'DECLINED': 'failed',
                'CANCELLED': 'cancelled',
                'FAILED': 'failed',
                'PENDING': 'pending',
                'RESTRICTED': 'failed',
            },
        };
        return statusMap[gateway]?.[gatewayStatus] || 'unknown';
    }
}
exports.BasePaymentAdapter = BasePaymentAdapter;
//# sourceMappingURL=base-payment.adapter.js.map