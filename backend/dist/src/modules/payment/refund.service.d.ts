import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentAdapterFactory } from './adapters/payment-adapter.factory';
import { PaymentSecurityService } from './payment-security.service';
export interface RefundRequest {
    transactionId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, any>;
}
export interface RefundResponse {
    refundId: string;
    status: 'success' | 'pending' | 'failed' | 'partial';
    refundAmount: number;
    remainingAmount: number;
    gatewayRefundId?: string;
    processedAt: Date;
}
export interface RefundPolicy {
    maxRefundDays: number;
    minRefundAmount: number;
    maxRefundAmount: number;
    allowPartialRefunds: boolean;
    requireApproval: boolean;
    approvalThreshold: number;
    supportedReasons: string[];
}
export interface RefundStats {
    totalRefunds: number;
    totalRefundAmount: number;
    successfulRefunds: number;
    failedRefunds: number;
    pendingRefunds: number;
    averageProcessingTime: number;
    refundRate: number;
    commonReasons: Record<string, number>;
}
export declare class RefundService {
    private readonly prisma;
    private readonly auditService;
    private readonly adapterFactory;
    private readonly securityService;
    private readonly logger;
    private readonly refundPolicy;
    constructor(prisma: PrismaService, auditService: AuditService, adapterFactory: PaymentAdapterFactory, securityService: PaymentSecurityService);
    processRefund(refundRequest: RefundRequest, userId: string): Promise<RefundResponse>;
    getRefundPolicy(): RefundPolicy;
    updateRefundPolicy(policy: Partial<RefundPolicy>): Promise<RefundPolicy>;
    getRefundStats(branchId?: string, startDate?: Date, endDate?: Date): Promise<RefundStats>;
    cancelRefund(refundId: string, userId: string): Promise<void>;
    approveRefund(refundId: string, approverId: string): Promise<void>;
    getRefundReport(branchId?: string, startDate?: Date, endDate?: Date, format?: 'json' | 'csv'): Promise<any>;
    private validateRefundRequest;
    private checkRefundEligibility;
    private createRefundRecord;
    private processGatewayRefund;
    private updateRefundRecord;
    private updateOriginalTransaction;
    private convertToCSV;
}
