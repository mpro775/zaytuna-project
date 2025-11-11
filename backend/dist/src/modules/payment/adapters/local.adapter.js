"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAdapter = void 0;
const base_payment_adapter_1 = require("./base-payment.adapter");
class LocalAdapter extends base_payment_adapter_1.BasePaymentAdapter {
    constructor(config) {
        super(config);
    }
    async processPayment(request) {
        try {
            let status = 'pending';
            switch (request.method) {
                case 'cash':
                    status = 'success';
                    break;
                case 'bank_transfer':
                    status = 'pending';
                    break;
                case 'check':
                    status = 'pending';
                    break;
                default:
                    status = 'success';
            }
            return {
                transactionId: request.invoiceId,
                status,
                gatewayTransactionId: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                gatewayResponse: {
                    method: request.method,
                    processed_at: new Date().toISOString(),
                    amount: request.amount,
                    currency: request.currency,
                    local_payment: true,
                },
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
            return {
                refundId: `local_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'success',
                refundAmount: refundRequest.amount,
                gatewayRefundId: `local_refund_${Date.now()}`,
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
        return 'completed';
    }
    async processWebhook(payload, signature) {
        throw new Error('Webhooks not supported for local payments');
    }
    async cancelTransaction(transactionId) {
        return true;
    }
    async getTransactionDetails(transactionId) {
        return {
            id: transactionId,
            type: 'local',
            status: 'completed',
            created_at: new Date().toISOString(),
        };
    }
    verifySignature(payload, signature) {
        return true;
    }
    createSignature(payload) {
        return '';
    }
}
exports.LocalAdapter = LocalAdapter;
//# sourceMappingURL=local.adapter.js.map