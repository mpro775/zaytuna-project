import { SyncService, SyncBatch, SyncResult, SyncChange } from './sync.service';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    uploadSyncBatch(body: {
        deviceId: string;
        branchId?: string;
        syncType: SyncBatch['syncType'];
        changes: SyncChange[];
        metadata?: Record<string, any>;
    }): Promise<{
        batchId: string;
        status: string;
    }>;
    downloadSyncData(deviceId: string, branchId?: string, lastSyncTime?: string, entities?: string): Promise<{
        changes: SyncChange[];
        timestamp: Date;
    }>;
    bidirectionalSync(body: {
        deviceId: string;
        branchId?: string;
        uploadChanges: SyncChange[];
        lastSyncTime?: string;
        entities?: string[];
        metadata?: Record<string, any>;
    }): Promise<{
        uploadBatchId: string;
        downloadChanges: SyncChange[];
        timestamp: Date;
    }>;
    getSyncBatchStatus(batchId: string): Promise<any>;
    resolveSyncConflict(batchId: string, conflictId: string, body: {
        resolution: 'local' | 'remote' | 'merge' | 'manual';
        resolvedData?: any;
    }): Promise<{
        message: string;
    }>;
    retrySyncBatch(batchId: string): Promise<SyncResult>;
    getSyncStats(branchId?: string): Promise<import("./sync.service").SyncStats>;
    getSyncBatches(branchId?: string, deviceId?: string, status?: string, limit?: string, offset?: string): Promise<any>;
    cleanupOldSyncBatches(days: string): Promise<{
        deletedCount: number;
    }>;
    registerDevice(body: {
        deviceId: string;
        deviceName: string;
        deviceType: string;
        branchId?: string;
        capabilities?: string[];
    }): Promise<{
        deviceId: string;
        status: string;
        capabilities: string[];
    }>;
    unregisterDevice(body: {
        deviceId: string;
    }): Promise<{
        deviceId: string;
        status: string;
    }>;
    getDeviceSyncConfig(deviceId: string): Promise<{
        deviceId: string;
        syncEnabled: boolean;
        syncInterval: number;
        maxBatchSize: number;
        supportedEntities: string[];
        offlineTimeout: number;
    }>;
    updateDeviceSyncConfig(deviceId: string, config: {
        syncEnabled?: boolean;
        syncInterval?: number;
        maxBatchSize?: number;
        supportedEntities?: string[];
        offlineTimeout?: number;
    }): Promise<{
        deviceId: string;
        status: string;
    }>;
    getDevicePendingChanges(deviceId: string, since?: string): Promise<{
        deviceId: string;
        hasPendingChanges: boolean;
        pendingBatches: number;
        lastChangeTime?: Date;
        entities: Record<string, number>;
    }>;
    forceDeviceSync(deviceId: string, options?: {
        fullSync?: boolean;
        entities?: string[];
        priority?: number;
    }): Promise<{
        deviceId: string;
        syncInitiated: boolean;
        batchId?: string;
        estimatedDuration?: number;
    }>;
    createSyncBackup(body: {
        branchId?: string;
        entities?: string[];
        includeAuditLogs?: boolean;
    }): Promise<{
        backupId: string;
        status: string;
        entities: string[];
        estimatedSize: number;
        downloadUrl?: string;
    }>;
    restoreFromBackup(body: {
        backupId: string;
        targetBranchId?: string;
        entities?: string[];
        conflictResolution?: 'overwrite' | 'skip' | 'merge';
    }): Promise<{
        backupId: string;
        status: string;
        restoredEntities: string[];
        conflicts: number;
        duration: number;
    }>;
    listSyncBackups(branchId?: string, limit?: string): Promise<{
        backups: Array<{
            backupId: string;
            createdAt: Date;
            size: number;
            entities: string[];
            branchId?: string;
            status: string;
        }>;
        total: number;
    }>;
    deleteSyncBackup(backupId: string): Promise<{
        backupId: string;
        status: string;
    }>;
    getSyncHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        uptime: number;
        activeConnections: number;
        pendingBatches: number;
        failedBatches: number;
        averageResponseTime: number;
        lastHealthCheck: Date;
    }>;
    getSyncPerformance(startDate?: string, endDate?: string): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        metrics: {
            totalBatches: number;
            averageBatchSize: number;
            averageProcessingTime: number;
            successRate: number;
            throughput: number;
        };
        trends: Array<{
            timestamp: Date;
            batchCount: number;
            averageTime: number;
            successRate: number;
        }>;
    }>;
    getSyncErrors(startDate?: string, endDate?: string, limit?: string): Promise<{
        errors: Array<{
            batchId: string;
            errorType: string;
            errorMessage: string;
            timestamp: Date;
            deviceId: string;
            resolved: boolean;
        }>;
        summary: {
            totalErrors: number;
            resolvedErrors: number;
            unresolvedErrors: number;
            commonErrorTypes: Record<string, number>;
        };
    }>;
    createOfflineSession(body: {
        deviceId: string;
        userId: string;
        branchId?: string;
        capabilities?: string[];
    }): Promise<import("./offline.service").OfflineSession>;
    endOfflineSession(sessionId: string): Promise<{
        message: string;
    }>;
    validateOfflineSession(sessionId: string): Promise<{
        valid: boolean;
    }>;
    getOfflineDataPackage(sessionId: string, entities?: string): Promise<import("./offline.service").OfflineDataPackage>;
    saveOfflineChanges(sessionId: string, body: {
        changes: Array<{
            entity: string;
            operation: 'create' | 'update' | 'delete';
            data: any;
            localId?: string;
        }>;
    }): Promise<{
        sessionId: string;
        savedChanges: number;
        conflicts: number;
        errors: string[];
    }>;
    getDeviceOfflineSessions(deviceId: string): Promise<import("./offline.service").OfflineSession[]>;
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
    cleanupExpiredOfflineSessions(): Promise<{
        cleanedSessions: number;
    }>;
}
