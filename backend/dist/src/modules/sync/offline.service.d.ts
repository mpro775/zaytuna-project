import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
export interface OfflineSession {
    id: string;
    deviceId: string;
    userId: string;
    branchId?: string;
    startedAt: Date;
    lastActivity: Date;
    status: 'active' | 'expired' | 'suspended';
    capabilities: string[];
    syncEnabled: boolean;
    maxOfflineHours: number;
    dataSnapshot?: Record<string, any>;
}
export interface OfflineDataPackage {
    sessionId: string;
    timestamp: Date;
    entities: Record<string, any[]>;
    metadata: {
        version: string;
        lastSyncTime: Date;
        dataSize: number;
        checksum: string;
    };
}
export declare class OfflineService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly offlineCacheKey;
    private readonly maxOfflineHours;
    constructor(prisma: PrismaService, cacheService: CacheService);
    createOfflineSession(deviceId: string, userId: string, branchId?: string, capabilities?: string[]): Promise<OfflineSession>;
    updateSessionActivity(sessionId: string): Promise<void>;
    endOfflineSession(sessionId: string): Promise<void>;
    getOfflineSession(sessionId: string): Promise<OfflineSession | null>;
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
    getDeviceSessions(deviceId: string): Promise<OfflineSession[]>;
    cleanupExpiredSessions(): Promise<number>;
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
    private generateSessionId;
    private addDeviceSession;
    private removeDeviceSession;
    private getEntityDataForOffline;
    private getOfflineSelectFields;
    private queueOfflineChange;
    private calculateDataSize;
    private generateChecksum;
    private getModelName;
}
