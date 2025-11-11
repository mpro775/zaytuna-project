import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { OfflineService, OfflineSession, OfflineDataPackage } from './offline.service';
export interface SyncChange {
    id: string;
    entity: string;
    entityId?: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    version: number;
    userId?: string;
}
export interface SyncConflict {
    id: string;
    entity: string;
    entityId: string;
    localVersion: any;
    remoteVersion: any;
    conflictType: 'version' | 'data' | 'deleted';
    resolution?: 'local' | 'remote' | 'merge' | 'manual';
    resolvedData?: any;
    timestamp: Date;
}
export interface SyncBatch {
    id: string;
    batchId: string;
    deviceId: string;
    branchId?: string;
    syncType: 'full' | 'incremental' | 'changes_only';
    direction: 'upload' | 'download' | 'bidirectional';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'conflicted';
    changes: SyncChange[];
    conflicts?: SyncConflict[];
    metadata?: Record<string, any>;
}
export interface SyncResult {
    batchId: string;
    status: 'success' | 'partial' | 'failed';
    processedRecords: number;
    failedRecords: number;
    conflictedRecords: number;
    conflicts?: SyncConflict[];
    errors?: string[];
    duration: number;
}
export interface SyncStats {
    totalBatches: number;
    pendingBatches: number;
    processingBatches: number;
    completedBatches: number;
    failedBatches: number;
    conflictedBatches: number;
    totalRecords: number;
    syncedRecords: number;
    failedRecords: number;
    conflictedRecords: number;
    lastSyncTime?: Date;
    averageSyncTime: number;
}
export declare class SyncService {
    private readonly prisma;
    private readonly cacheService;
    private readonly auditService;
    private readonly offlineService;
    private readonly logger;
    private readonly syncCacheKey;
    private readonly changeTrackingKey;
    constructor(prisma: PrismaService, cacheService: CacheService, auditService: AuditService, offlineService: OfflineService);
    createSyncBatch(deviceId: string, branchId: string | undefined, syncType: SyncBatch['syncType'], direction: SyncBatch['direction'], changes: SyncChange[], metadata?: Record<string, any>): Promise<SyncBatch>;
    processSyncBatch(batchId: string): Promise<SyncResult>;
    resolveConflict(batchId: string, conflictId: string, resolution: SyncConflict['resolution'], resolvedData?: any): Promise<void>;
    getSyncData(deviceId: string, branchId: string | undefined, lastSyncTime?: Date, entities?: string[]): Promise<SyncChange[]>;
    getSyncStats(branchId?: string): Promise<SyncStats>;
    cleanupOldSyncBatches(daysToKeep?: number): Promise<number>;
    retryFailedBatch(batchId: string): Promise<SyncResult>;
    private generateBatchId;
    private processChange;
    private detectConflict;
    private applyChange;
    private applyResolvedChange;
    private getCurrentEntityVersion;
    private getEntityChanges;
    private detectDataConflict;
    private getModelName;
    private calculateAverageSyncTime;
    createOfflineSession(deviceId: string, userId: string, branchId?: string, capabilities?: string[]): Promise<OfflineSession>;
    endOfflineSession(sessionId: string): Promise<void>;
    validateOfflineSession(sessionId: string): Promise<boolean>;
    createOfflineDataPackage(sessionId: string, entities?: string[]): Promise<OfflineDataPackage>;
    saveOfflineChanges(sessionId: string, changes: Array<{
        entity: string;
        operation: 'create' | 'update' | 'delete';
        data: any;
        localId?: string;
    }>): Promise<{
        sessionId: string;
        savedChanges: number;
        conflicts: number;
        errors: string[];
    }>;
    getDeviceOfflineSessions(deviceId: string): Promise<OfflineSession[]>;
    getOfflineStats(): Promise<{
        activeSessions: number;
        totalSessions: number;
        expiredSessions: number;
        averageSessionDuration: number;
        mostActiveDevices: Array<{
            deviceId: string;
            sessionCount: number;
        }>;
    }>;
    cleanupExpiredOfflineSessions(): Promise<number>;
    private invalidateSyncCache;
}
