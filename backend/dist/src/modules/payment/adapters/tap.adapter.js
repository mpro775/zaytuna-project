"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapAdapter = void 0;
const base_payment_adapter_1 = require("./base-payment.adapter");
class TapAdapter extends base_payment_adapter_1.BasePaymentAdapter {
    constructor(config) {
        super(config);
    }
    async processPayment(request) {
        try {
            const amount = this.formatAmount(request.amount, 'tap');
            const currency = this.formatCurrency(request.currency, 'tap');
            const charge = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v2/charges', {
                    amount,
                    currency,
                    description: request.description,
                    reference: {
                        transaction: request.invoiceId,
                        order: request.invoiceId,
                    },
                    metadata: {
                        invoice_type: request.invoiceType,
                        ...request.metadata,
                    },
                    source: {
                        type: request.method === 'card' ? 'card' : 'wallet',
                    },
                    redirect: {
                        url: `${process.env.APP_URL}/payment/tap/callback`,
                    },
                });
            });
            return {
                transactionId: request.invoiceId,
                status: this.normalizeStatus(charge.status, 'tap'),
                gatewayTransactionId: charge.id,
                gatewayResponse: charge,
                ...(charge.transaction?.url && {
                    redirectUrl: charge.transaction.url,
                }),
                ...(charge.qr_code && {
                    qrCode: charge.qr_code,
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
            const refund = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v2/refunds', {
                    charge_id: transactionId,
                    amount: refundRequest.amount,
                    currency: 'SAR',
                    reason: refundRequest.reason,
                    metadata: refundRequest.metadata,
                });
            });
            return {
                refundId: refund.id,
                status: refund.status === 'REFUNDED' ? 'success' : 'pending',
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
            const charge = await this.makeRequest('GET', `/v2/charges/${transactionId}`);
            return this.normalizeStatus(charge.status, 'tap');
        }
        catch (error) {
            return 'unknown';
        }
    }
    async processWebhook(payload, signature) {
        if (signature && !this.verifySignature(payload, signature)) {
            throw new Error('Invalid webhook signature');
        }
        const event = payload;
        return {
            id: event.id,
            type: event.type,
            data: event.data,
            created: new Date(event.created * 1000),
            signature,
        };
    }
    async cancelTransaction(transactionId) {
        try {
            await this.makeRequest('POST', `/v2/charges/${transactionId}/cancel`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getTransactionDetails(transactionId) {
        try {
            return await this.makeRequest('GET', `/v2/charges/${transactionId}`);
        }
        catch (error) {
            throw new Error(`Failed to get transaction details: ${error.message}`);
        }
    }
    async createPaymentQR(request) {
        try {
            const amount = this.formatAmount(request.amount, 'tap');
            const currency = this.formatCurrency(request.currency, 'tap');
            const qrCharge = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v2/charges', {
                    amount,
                    currency,
                    description: request.description,
                    reference: {
                        transaction: request.invoiceId,
                        order: request.invoiceId,
                    },
                    source: {
                        type: 'CARD_NOT_PRESENT',
                    },
                    metadata: {
                        invoice_type: request.invoiceType,
                        qr_payment: true,
                        ...request.metadata,
                    },
                });
            });
            return qrCharge.qr_code || '';
        }
        catch (error) {
            throw new Error(`Failed to create QR code: ${error.message}`);
        }
    }
    verifySignature(payload, signature) {
        if (!this.config.webhookSecret) {
            return true;
        }
        try {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', this.config.webhookSecret)
                .update(JSON.stringify(payload), 'utf8')
                .digest('hex');
            return expectedSignature === signature;
        }
        catch (error) {
            return false;
        }
    }
    createSignature(payload) {
        return '';
    }
}
exports.TapAdapter = TapAdapter;
//# sourceMappingURL=tap.adapter.js.map