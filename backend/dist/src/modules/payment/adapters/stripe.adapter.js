"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAdapter = void 0;
const base_payment_adapter_1 = require("./base-payment.adapter");
class StripeAdapter extends base_payment_adapter_1.BasePaymentAdapter {
    constructor(config) {
        super(config);
    }
    async processPayment(request) {
        try {
            const amount = this.formatAmount(request.amount, 'stripe');
            const currency = this.formatCurrency(request.currency, 'stripe');
            const paymentIntent = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v1/payment_intents', {
                    amount,
                    currency,
                    description: request.description,
                    metadata: {
                        invoice_id: request.invoiceId,
                        invoice_type: request.invoiceType,
                        ...request.metadata,
                    },
                    automatic_payment_methods: {
                        enabled: true,
                    },
                });
            });
            return {
                transactionId: request.invoiceId,
                status: this.normalizeStatus(paymentIntent.status, 'stripe'),
                gatewayTransactionId: paymentIntent.id,
                gatewayResponse: paymentIntent,
                ...(paymentIntent.next_action?.redirect_to_url && {
                    redirectUrl: paymentIntent.next_action.redirect_to_url.url,
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
            const amount = this.formatAmount(refundRequest.amount, 'stripe');
            const refund = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v1/refunds', {
                    payment_intent: transactionId,
                    amount,
                    reason: this.mapRefundReason(refundRequest.reason),
                    metadata: refundRequest.metadata,
                });
            });
            return {
                refundId: refund.id,
                status: refund.status === 'succeeded' ? 'success' : 'pending',
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
            const paymentIntent = await this.makeRequest('GET', `/v1/payment_intents/${transactionId}`);
            return this.normalizeStatus(paymentIntent.status, 'stripe');
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
            data: event.data.object,
            created: new Date(event.created * 1000),
            signature,
        };
    }
    async cancelTransaction(transactionId) {
        try {
            await this.makeRequest('POST', `/v1/payment_intents/${transactionId}/cancel`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getTransactionDetails(transactionId) {
        try {
            return await this.makeRequest('GET', `/v1/payment_intents/${transactionId}`);
        }
        catch (error) {
            throw new Error(`Failed to get transaction details: ${error.message}`);
        }
    }
    async createPaymentLink(request) {
        try {
            const amount = this.formatAmount(request.amount, 'stripe');
            const currency = this.formatCurrency(request.currency, 'stripe');
            const paymentLink = await this.retryWithBackoff(async () => {
                return this.makeRequest('POST', '/v1/payment_links', {
                    line_items: [{
                            price_data: {
                                currency,
                                product_data: {
                                    name: request.description || 'Payment',
                                },
                                unit_amount: amount,
                            },
                            quantity: 1,
                        }],
                    metadata: {
                        invoice_id: request.invoiceId,
                        invoice_type: request.invoiceType,
                    },
                });
            });
            return paymentLink.url;
        }
        catch (error) {
            throw new Error(`Failed to create payment link: ${error.message}`);
        }
    }
    verifySignature(payload, signature) {
        if (!this.config.webhookSecret) {
            return true;
        }
        try {
            const crypto = require('crypto');
            const elements = signature.split(',');
            const signatureElements = {};
            elements.forEach(element => {
                const [key, value] = element.split('=');
                signatureElements[key] = value;
            });
            const timestamp = signatureElements['t'];
            const expectedSignature = signatureElements['v1'];
            const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
            const expected = crypto
                .createHmac('sha256', this.config.webhookSecret)
                .update(signedPayload, 'utf8')
                .digest('hex');
            return expected === expectedSignature;
        }
        catch (error) {
            return false;
        }
    }
    createSignature(payload) {
        return '';
    }
    mapRefundReason(reason) {
        const reasonMap = {
            'duplicate': 'duplicate',
            'fraudulent': 'fraudulent',
            'requested_by_customer': 'requested_by_customer',
        };
        return reasonMap[reason.toLowerCase()] || 'requested_by_customer';
    }
}
exports.StripeAdapter = StripeAdapter;
//# sourceMappingURL=stripe.adapter.js.map