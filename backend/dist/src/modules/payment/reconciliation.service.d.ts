import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentAdapterFactory, PaymentGateway } from './adapters/payment-adapter.factory';
export interface ReconciliationPeriod {
    startDate: Date;
    endDate: Date;
    gateway: PaymentGateway;
    branchId?: string;
}
export interface TransactionRecord {
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    processedAt: Date;
    fee?: number;
    metadata?: any;
}
export interface ReconciliationResult {
    period: ReconciliationPeriod;
    summary: {
        totalSystemTransactions: number;
        totalSystemAmount: number;
        totalGatewayTransactions: number;
        totalGatewayAmount: number;
        matchedTransactions: number;
        unmatchedSystemTransactions: number;
        unmatchedGatewayTransactions: number;
        discrepancies: number;
        totalDiscrepancyAmount: number;
    };
    matched: TransactionMatch[];
    unmatchedSystem: TransactionRecord[];
    unmatchedGateway: TransactionRecord[];
    discrepancies: DiscrepancyRecord[];
    processingTime: number;
    status: 'completed' | 'partial' | 'failed';
}
export interface TransactionMatch {
    systemTransaction: TransactionRecord;
    gatewayTransaction: TransactionRecord;
    matchType: 'exact' | 'amount_only' | 'id_partial';
    confidence: number;
}
export interface DiscrepancyRecord {
    systemTransaction?: TransactionRecord;
    gatewayTransaction?: TransactionRecord;
    discrepancyType: 'amount_mismatch' | 'status_mismatch' | 'missing_in_system' | 'missing_in_gateway' | 'fee_mismatch';
    amountDifference: number;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedAction: string;
}
export interface ReconciliationReport {
    id: string;
    period: ReconciliationPeriod;
    result: ReconciliationResult;
    generatedAt: Date;
    generatedBy: string;
    approvedAt?: Date;
    approvedBy?: string;
    notes?: string;
}
export declare class ReconciliationService {
    private readonly prisma;
    private readonly auditService;
    private readonly adapterFactory;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService, adapterFactory: PaymentAdapterFactory);
    reconcileTransactions(period: ReconciliationPeriod, options?: {
        autoResolveThreshold?: number;
        includeFees?: boolean;
        generateReport?: boolean;
    }): Promise<ReconciliationResult>;
    resolveDiscrepancy(discrepancyId: string, resolution: {
        action: 'accept' | 'adjust_system' | 'adjust_gateway' | 'ignore';
        notes?: string;
        adjustedAmount?: number;
    }, resolvedBy: string): Promise<void>;
    getReconciliationReports(gateway?: PaymentGateway, startDate?: Date, endDate?: Date, status?: 'completed' | 'partial' | 'failed'): Promise<ReconciliationReport[]>;
    runScheduledReconciliation(gateway: PaymentGateway, daysBack?: number): Promise<ReconciliationResult>;
    getReconciliationStats(gateway?: PaymentGateway, period?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalReconciliations: number;
        successfulReconciliations: number;
        failedReconciliations: number;
        totalDiscrepancies: number;
        resolvedDiscrepancies: number;
        averageProcessingTime: number;
        discrepancyRate: number;
    }>;
    private getSystemTransactions;
    private getGatewayTransactions;
    private matchTransactions;
    private calculateSummary;
    private generateReconciliationReport;
}
