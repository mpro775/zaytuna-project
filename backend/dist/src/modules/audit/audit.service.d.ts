import type { Request } from 'express';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
export interface AuditLogData {
    action: string;
    entity: string;
    entityId: string;
    details?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    referenceType?: string;
    referenceId?: string;
    module?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    category?: string;
    success?: boolean;
    errorMessage?: string;
    searchableText?: string;
}
export interface AuditQuery {
    userId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    branchId?: string;
    warehouseId?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
    severity?: string;
    category?: string;
    referenceType?: string;
    referenceId?: string;
    module?: string;
    searchText?: string;
    limit?: number;
    offset?: number;
}
export interface AuditStats {
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByEntity: Record<string, number>;
    logsByUser: Record<string, number>;
    logsBySeverity: Record<string, number>;
    logsByCategory: Record<string, number>;
    logsByModule: Record<string, number>;
    recentActivity: Array<{
        timestamp: Date;
        action: string;
        entity: string;
        userName: string;
        success: boolean;
    }>;
    errorRate: number;
    topEntities: Array<{
        entity: string;
        count: number;
    }>;
    topUsers: Array<{
        userId: string;
        userName: string;
        count: number;
    }>;
}
export declare class AuditService {
    private readonly prisma;
    private readonly cacheService;
    private readonly request;
    private readonly logger;
    private readonly auditCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService, request: Request);
    log(auditData: AuditLogData): Promise<void>;
    logCreate(entity: string, entityId: string, newValues: Record<string, any>, options?: Partial<AuditLogData>): Promise<void>;
    logRead(entity: string, entityId: string, options?: Partial<AuditLogData>): Promise<void>;
    logUpdate(entity: string, entityId: string, oldValues: Record<string, any>, newValues: Record<string, any>, options?: Partial<AuditLogData>): Promise<void>;
    logDelete(entity: string, entityId: string, oldValues: Record<string, any>, options?: Partial<AuditLogData>): Promise<void>;
    logLogin(userId: string, success?: boolean, options?: Partial<AuditLogData>): Promise<void>;
    logLogout(userId: string, options?: Partial<AuditLogData>): Promise<void>;
    logPasswordChange(userId: string, success?: boolean, options?: Partial<AuditLogData>): Promise<void>;
    logPermissionChange(userId: string, targetUserId: string, oldPermissions: any, newPermissions: any, options?: Partial<AuditLogData>): Promise<void>;
    searchAuditLogs(query: AuditQuery): Promise<{
        logs: ({
            branch: {
                id: string;
                name: string;
            } | null;
            warehouse: {
                id: string;
                name: string;
            } | null;
            user: {
                id: string;
                email: string;
                username: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            branchId: string | null;
            category: string;
            userId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
            warehouseId: string | null;
            referenceType: string | null;
            referenceId: string | null;
            action: string;
            entity: string;
            entityId: string;
            details: import("@prisma/client/runtime/library").JsonValue | null;
            oldValues: import("@prisma/client/runtime/library").JsonValue | null;
            newValues: import("@prisma/client/runtime/library").JsonValue | null;
            sessionId: string | null;
            success: boolean;
            errorMessage: string | null;
            severity: string;
            module: string | null;
            timestamp: Date;
            searchableText: string | null;
        })[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getAuditLog(id: string): Promise<({
        branch: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            name: string;
        } | null;
        user: {
            id: string;
            email: string;
            username: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        branchId: string | null;
        category: string;
        userId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        warehouseId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        action: string;
        entity: string;
        entityId: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        sessionId: string | null;
        success: boolean;
        errorMessage: string | null;
        severity: string;
        module: string | null;
        timestamp: Date;
        searchableText: string | null;
    }) | null>;
    getAuditStats(startDate?: Date, endDate?: Date, branchId?: string): Promise<AuditStats>;
    getEntityAuditTrail(entity: string, entityId: string, limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            username: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        branchId: string | null;
        category: string;
        userId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        warehouseId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        action: string;
        entity: string;
        entityId: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        sessionId: string | null;
        success: boolean;
        errorMessage: string | null;
        severity: string;
        module: string | null;
        timestamp: Date;
        searchableText: string | null;
    })[]>;
    getUserAuditTrail(userId: string, limit?: number): Promise<({
        branch: {
            id: string;
            name: string;
        } | null;
        warehouse: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        branchId: string | null;
        category: string;
        userId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        warehouseId: string | null;
        referenceType: string | null;
        referenceId: string | null;
        action: string;
        entity: string;
        entityId: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        sessionId: string | null;
        success: boolean;
        errorMessage: string | null;
        severity: string;
        module: string | null;
        timestamp: Date;
        searchableText: string | null;
    })[]>;
    cleanupOldLogs(daysToKeep?: number): Promise<number>;
    exportAuditLogs(query: AuditQuery): Promise<any[]>;
    private getClientIp;
    private generateSearchableText;
    getDetailedAuditTrail(entity: string, entityId: string): Promise<{
        entity: string;
        entityId: string;
        currentState: any;
        changeHistory: Array<{
            timestamp: Date;
            action: string;
            user: string;
            changes: Array<{
                field: string;
                oldValue: any;
                newValue: any;
                changeType: 'added' | 'modified' | 'removed';
            }>;
            details: any;
        }>;
        summary: {
            totalChanges: number;
            lastModified: Date;
            lastModifiedBy: string;
            createdAt: Date;
            createdBy: string;
        };
    }>;
    compareEntityStates(oldState: any, newState: any): Array<{
        field: string;
        oldValue: any;
        newValue: any;
        changeType: 'added' | 'modified' | 'removed';
    }>;
    getChangeReport(startDate: Date, endDate: Date, entity?: string, userId?: string): Promise<{
        period: {
            start: Date;
            end: Date;
        };
        summary: {
            totalChanges: number;
            entitiesAffected: number;
            usersInvolved: number;
            mostChangedEntity: string;
            mostActiveUser: string;
        };
        changesByEntity: Record<string, number>;
        changesByUser: Record<string, number>;
        changesByAction: Record<string, number>;
        recentChanges: Array<{
            timestamp: Date;
            entity: string;
            entityId: string;
            action: string;
            user: string;
            changesCount: number;
        }>;
    }>;
    private countChangesInLog;
    private invalidateAuditCache;
}
