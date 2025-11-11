"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalAdapter = void 0;
const base_payment_adapter_1 = require("./base-payment.adapter");
class PayPalAdapter extends base_payment_adapter_1.BasePaymentAdapter {
    accessToken = null;
    tokenExpiresAt = null;
    constructor(config) {
        super(config);
    }
    async processPayment(request) {
        try {
            await this.ensureAccessToken();
            const currency = this.formatCurrency(request.currency, 'paypal');
            const order = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v2/checkout/orders', {
                    intent: 'CAPTURE',
                    purchase_units: [{
                            reference_id: request.invoiceId,
                            amount: {
                                currency_code: currency,
                                value: request.amount.toFixed(2),
                            },
                            description: request.description,
                        }],
                    application_context: {
                        return_url: `${process.env.APP_URL}/payment/success`,
                        cancel_url: `${process.env.APP_URL}/payment/cancel`,
                    },
                }, {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'PayPal-Request-Id': `paypal_${Date.now()}`,
                });
            });
            return {
                transactionId: request.invoiceId,
                status: this.normalizeStatus(order.status, 'paypal'),
                gatewayTransactionId: order.id,
                gatewayResponse: order,
                ...(order.links && {
                    redirectUrl: order.links.find((link) => link.rel === 'approve')?.href,
                }),
            };
        }
        catch (error) {
            return {
                transactionId: request.invoiceId,
                status: 'failed',
                gatewayResponse: { error: error.message },
            };
        }
    }
    async processRefund(transactionId, refundRequest) {
        try {
            await this.ensureAccessToken();
            const refund = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', `/v2/payments/captures/${transactionId}/refund`, {
                    amount: {
                        value: refundRequest.amount.toFixed(2),
                        currency_code: 'SAR',
                    },
                    reason: refundRequest.reason,
                }, {
                    'Authorization': `Bearer ${this.accessToken}`,
                });
            });
            return {
                refundId: refund.id,
                status: refund.status === 'COMPLETED' ? 'success' : 'pending',
                refundAmount: refundRequest.amount,
                gatewayRefundId: refund.id,
            };
        }
        catch (error) {
            return {
                refundId: `refund_failed_${Date.now()}`,
                status: 'failed',
                refundAmount: 0,
            };
        }
    }
    async checkTransactionStatus(transactionId) {
        try {
            await this.ensureAccessToken();
            const order = await this.makeRequest('GET', `/v2/checkout/orders/${transactionId}`, undefined, {
                'Authorization': `Bearer ${this.accessToken}`,
            });
            return this.normalizeStatus(order.status, 'paypal');
        }
        catch (error) {
            return 'unknown';
        }
    }
    async processWebhook(payload, signature) {
        const event = payload;
        return {
            id: event.id,
            type: event.event_type,
            data: event.resource,
            created: new Date(event.create_time),
            signature,
        };
    }
    async cancelTransaction(transactionId) {
        try {
            return false;
        }
        catch (error) {
            return false;
        }
    }
    async getTransactionDetails(transactionId) {
        try {
            await this.ensureAccessToken();
            return await this.makeRequest('GET', `/v2/checkout/orders/${transactionId}`, undefined, {
                'Authorization': `Bearer ${this.accessToken}`,
            });
        }
        catch (error) {
            throw new Error(`Failed to get transaction details: ${error.message}`);
        }
    }
    verifySignature(payload, signature) {
        return true;
    }
    createSignature(payload) {
        return '';
    }
    async ensureAccessToken() {
        if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
            return;
        }
        try {
            const auth = Buffer.from(`${this.config.apiKey}:${this.config.secretKey}`).toString('base64');
            const response = await this.makeRequest('POST', '/v1/oauth2/token', 'grant_type=client_credentials', {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            });
            this.accessToken = response.access_token;
            this.tokenExpiresAt = new Date(Date.now() + (response.expires_in - 60) * 1000);
        }
        catch (error) {
            throw new Error(`Failed to get PayPal access token: ${error.message}`);
        }
    }
}
exports.PayPalAdapter = PayPalAdapter;
//# sourceMappingURL=paypal.adapter.js.map