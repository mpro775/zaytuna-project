import type { Response } from 'express';
import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    searchAuditLogs(query: {
        userId?: string;
        action?: string;
        entity?: string;
        entityId?: string;
        branchId?: string;
        warehouseId?: string;
        startDate?: string;
        endDate?: string;
        success?: string;
        severity?: string;
        category?: string;
        referenceType?: string;
        referenceId?: string;
        module?: string;
        searchText?: string;
        limit?: string;
        offset?: string;
    }): Promise<{
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
    getAuditStats(startDate?: string, endDate?: string, branchId?: string): Promise<import("./audit.service").AuditStats>;
    getDailyAuditStats(branchId?: string): Promise<import("./audit.service").AuditStats>;
    getWeeklyAuditStats(branchId?: string): Promise<import("./audit.service").AuditStats>;
    getMonthlyAuditStats(year?: number, month?: number, branchId?: string): Promise<import("./audit.service").AuditStats>;
    getEntityAuditTrail(entity: string, entityId: string, limit?: string): Promise<({
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
    getUserAuditTrail(userId: string, limit?: string): Promise<({
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
    getErrorReport(startDate?: string, endDate?: string, branchId?: string): Promise<{
        errorRate: number;
        errorsBySeverity: {
            [k: string]: number;
        };
        errorsByModule: {
            [k: string]: number;
        };
        recentErrors: {
            timestamp: Date;
            action: string;
            entity: string;
            userName: string;
            success: boolean;
        }[];
    }>;
    getSecurityReport(startDate?: string, endDate?: string, branchId?: string): Promise<{
        totalSecurityEvents: number;
        securityEventsByType: {
            [k: string]: number;
        };
        securityEventsByUser: {
            [k: string]: number;
        };
        failedLogins: number;
        permissionChanges: number;
        passwordChanges: number;
    }>;
    getActivityReport(startDate?: string, endDate?: string, branchId?: string): Promise<{
        totalActivity: number;
        activityByModule: Record<string, number>;
        activityByEntity: Record<string, number>;
        topEntities: {
            entity: string;
            count: number;
        }[];
        topUsers: {
            userId: string;
            userName: string;
            count: number;
        }[];
        activityTrend: {
            timestamp: Date;
            action: string;
            entity: string;
            userName: string;
            success: boolean;
        }[];
    }>;
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
                changeType: "added" | "modified" | "removed";
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
    compareEntityStates(entity: string, entityId: string, version1: string, version2: string): {
        message: string;
        entity: string;
        entityId: string;
        version1: string;
        version2: string;
    };
    getChangeReport(startDate: string, endDate: string, entity?: string, userId?: string): Promise<{
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
    getDailyChangeReport(entity?: string, userId?: string): Promise<{
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
    getWeeklyChangeReport(entity?: string, userId?: string): Promise<{
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
    getComplianceReport(startDate?: string, endDate?: string, branchId?: string): Promise<{
        period: {
            startDate: string | undefined;
            endDate: string | undefined;
            branchId: string | undefined;
        };
        complianceMetrics: {
            totalAuditableEvents: number;
            auditCoverage: number;
            errorRate: number;
            securityIncidents: number;
            dataAccessEvents: number;
            adminActions: number;
            complianceStatus: string;
        };
        auditTrail: {
            timestamp: Date;
            action: string;
            entity: string;
            userName: string;
            success: boolean;
        }[];
        recommendations: string[];
    }>;
    exportAuditLogsToExcel(res: Response, query: {
        userId?: string;
        action?: string;
        entity?: string;
        entityId?: string;
        branchId?: string;
        warehouseId?: string;
        startDate?: string;
        endDate?: string;
        success?: string;
        severity?: string;
        category?: string;
        referenceType?: string;
        referenceId?: string;
        module?: string;
        searchText?: string;
    }): Promise<void>;
    exportAuditLogsToJSON(res: Response, query: {
        userId?: string;
        action?: string;
        entity?: string;
        entityId?: string;
        branchId?: string;
        warehouseId?: string;
        startDate?: string;
        endDate?: string;
        success?: string;
        severity?: string;
        category?: string;
        referenceType?: string;
        referenceId?: string;
        module?: string;
        searchText?: string;
    }): Promise<void>;
    cleanupOldLogs(days: string): Promise<{
        message: string;
        daysKept: number;
        deletedCount: number;
    }>;
    private generateComplianceRecommendations;
}
