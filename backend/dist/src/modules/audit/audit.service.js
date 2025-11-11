"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    cacheService;
    request;
    logger = new common_1.Logger(AuditService_1.name);
    auditCacheKey = 'audit_logs';
    constructor(prisma, cacheService, request) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.request = request;
    }
    async log(auditData) {
        try {
            const user = this.request?.user;
            const clientIp = this.getClientIp();
            const userAgent = this.request.get('User-Agent');
            const sessionId = this.request?.session?.id;
            const logData = {
                userId: user?.id,
                branchId: user?.branchId,
                warehouseId: this.request?.warehouseId,
                action: auditData.action,
                entity: auditData.entity,
                entityId: auditData.entityId,
                details: auditData.details || {},
                oldValues: auditData.oldValues || {},
                newValues: auditData.newValues || {},
                ipAddress: clientIp,
                userAgent: userAgent,
                sessionId: sessionId,
                success: auditData.success !== false,
                errorMessage: auditData.errorMessage,
                severity: auditData.severity || 'info',
                category: auditData.category || 'business',
                referenceType: auditData.referenceType,
                referenceId: auditData.referenceId,
                module: auditData.module,
                searchableText: auditData.searchableText || this.generateSearchableText(auditData),
            };
            await this.prisma.auditLog.create({
                data: logData,
            });
            await this.invalidateAuditCache();
            if (auditData.severity === 'error' || auditData.severity === 'critical') {
                this.logger.error(`AUDIT: ${auditData.action} on ${auditData.entity} by user ${user?.id || 'unknown'}`, {
                    entityId: auditData.entityId,
                    errorMessage: auditData.errorMessage,
                    details: auditData.details,
                });
            }
            else if (auditData.severity === 'warning') {
                this.logger.warn(`AUDIT: ${auditData.action} on ${auditData.entity} by user ${user?.id || 'unknown'}`, {
                    entityId: auditData.entityId,
                    details: auditData.details,
                });
            }
        }
        catch (error) {
            this.logger.error('فشل في تسجيل عملية التدقيق', error);
        }
    }
    async logCreate(entity, entityId, newValues, options) {
        await this.log({
            action: 'CREATE',
            entity,
            entityId,
            newValues,
            ...options,
        });
    }
    async logRead(entity, entityId, options) {
        await this.log({
            action: 'READ',
            entity,
            entityId,
            ...options,
        });
    }
    async logUpdate(entity, entityId, oldValues, newValues, options) {
        await this.log({
            action: 'UPDATE',
            entity,
            entityId,
            oldValues,
            newValues,
            ...options,
        });
    }
    async logDelete(entity, entityId, oldValues, options) {
        await this.log({
            action: 'DELETE',
            entity,
            entityId,
            oldValues,
            ...options,
        });
    }
    async logLogin(userId, success = true, options) {
        await this.log({
            action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            entity: 'User',
            entityId: userId,
            success,
            category: 'security',
            severity: success ? 'info' : 'warning',
            ...options,
        });
    }
    async logLogout(userId, options) {
        await this.log({
            action: 'LOGOUT',
            entity: 'User',
            entityId: userId,
            category: 'security',
            ...options,
        });
    }
    async logPasswordChange(userId, success = true, options) {
        await this.log({
            action: 'PASSWORD_CHANGE',
            entity: 'User',
            entityId: userId,
            success,
            category: 'security',
            severity: success ? 'info' : 'warning',
            ...options,
        });
    }
    async logPermissionChange(userId, targetUserId, oldPermissions, newPermissions, options) {
        await this.log({
            action: 'PERMISSION_CHANGE',
            entity: 'User',
            entityId: targetUserId,
            oldValues: { permissions: oldPermissions },
            newValues: { permissions: newPermissions },
            details: { changedBy: userId },
            category: 'security',
            severity: 'warning',
            ...options,
        });
    }
    async searchAuditLogs(query) {
        const where = {};
        if (query.userId)
            where.userId = query.userId;
        if (query.action)
            where.action = query.action;
        if (query.entity)
            where.entity = query.entity;
        if (query.entityId)
            where.entityId = query.entityId;
        if (query.branchId)
            where.branchId = query.branchId;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.success !== undefined)
            where.success = query.success;
        if (query.severity)
            where.severity = query.severity;
        if (query.category)
            where.category = query.category;
        if (query.referenceType)
            where.referenceType = query.referenceType;
        if (query.referenceId)
            where.referenceId = query.referenceId;
        if (query.module)
            where.module = query.module;
        if (query.startDate || query.endDate) {
            where.timestamp = {};
            if (query.startDate)
                where.timestamp.gte = query.startDate;
            if (query.endDate)
                where.timestamp.lte = query.endDate;
        }
        if (query.searchText) {
            where.searchableText = {
                contains: query.searchText,
                mode: 'insensitive',
            };
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                    branch: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    warehouse: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
                take: query.limit || 50,
                skip: query.offset || 0,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            logs,
            total,
            limit: query.limit || 50,
            offset: query.offset || 0,
        };
    }
    async getAuditLog(id) {
        return this.prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
    async getAuditStats(startDate, endDate, branchId) {
        try {
            const cacheKey = `audit_stats:${startDate?.toISOString()}:${endDate?.toISOString()}:${branchId || 'all'}`;
            const cachedStats = await this.cacheService.get(cacheKey);
            if (cachedStats) {
                return cachedStats;
            }
            const where = {};
            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate)
                    where.timestamp.gte = startDate;
                if (endDate)
                    where.timestamp.lte = endDate;
            }
            if (branchId)
                where.branchId = branchId;
            const totalLogs = await this.prisma.auditLog.count({ where });
            const logsByAction = await this.prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: { id: true },
            });
            const logsByEntity = await this.prisma.auditLog.groupBy({
                by: ['entity'],
                where,
                _count: { id: true },
            });
            const logsByUser = await this.prisma.auditLog.groupBy({
                by: ['userId'],
                where,
                _count: { id: true },
            });
            const logsBySeverity = await this.prisma.auditLog.groupBy({
                by: ['severity'],
                where,
                _count: { id: true },
            });
            const logsByCategory = await this.prisma.auditLog.groupBy({
                by: ['category'],
                where,
                _count: { id: true },
            });
            const logsByModule = await this.prisma.auditLog.groupBy({
                by: ['module'],
                where,
                _count: { id: true },
            });
            const recentActivity = await this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
                take: 10,
            });
            const errorLogs = await this.prisma.auditLog.count({
                where: {
                    ...where,
                    success: false,
                },
            });
            const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
            const topEntities = logsByEntity
                .sort((a, b) => b._count.id - a._count.id)
                .slice(0, 10)
                .map(item => ({
                entity: item.entity,
                count: item._count.id,
            }));
            const topUsersWithNames = await Promise.all(logsByUser
                .sort((a, b) => b._count.id - a._count.id)
                .slice(0, 10)
                .map(async (item) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: item.userId },
                    select: { username: true, email: true },
                });
                return {
                    userId: item.userId,
                    userName: user?.username || user?.email || 'غير معروف',
                    count: item._count.id,
                };
            }));
            const stats = {
                totalLogs,
                logsByAction: Object.fromEntries(logsByAction.map(item => [item.action, item._count.id])),
                logsByEntity: Object.fromEntries(logsByEntity.map(item => [item.entity, item._count.id])),
                logsByUser: Object.fromEntries(logsByUser.map(item => [item.userId || 'unknown', item._count.id])),
                logsBySeverity: Object.fromEntries(logsBySeverity.map(item => [item.severity, item._count.id])),
                logsByCategory: Object.fromEntries(logsByCategory.map(item => [item.category, item._count.id])),
                logsByModule: Object.fromEntries(logsByModule.map(item => [item.module || 'unknown', item._count.id])),
                recentActivity: recentActivity.map(activity => ({
                    timestamp: activity.timestamp,
                    action: activity.action,
                    entity: activity.entity,
                    userName: activity.user?.username || activity.user?.email || 'غير معروف',
                    success: activity.success,
                })),
                errorRate,
                topEntities,
                topUsers: topUsersWithNames,
            };
            await this.cacheService.set(cacheKey, stats, { ttl: 300 });
            return stats;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات التدقيق', error);
            throw error;
        }
    }
    async getEntityAuditTrail(entity, entityId, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: {
                entity,
                entityId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });
    }
    async getUserAuditTrail(userId, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: {
                userId,
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                warehouse: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });
    }
    async cleanupOldLogs(daysToKeep = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await this.prisma.auditLog.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
                severity: {
                    not: 'critical',
                },
            },
        });
        await this.invalidateAuditCache();
        this.logger.log(`تم حذف ${result.count} سجل تدقيق قديم`);
        return result.count;
    }
    async exportAuditLogs(query) {
        const result = await this.searchAuditLogs({
            ...query,
            limit: 10000,
        });
        return result.logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp,
            userId: log.userId,
            userName: log.user?.username || log.user?.email,
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            branchName: log.branch?.name,
            warehouseName: log.warehouse?.name,
            success: log.success,
            severity: log.severity,
            category: log.category,
            module: log.module,
            ipAddress: log.ipAddress,
            errorMessage: log.errorMessage,
            details: log.details,
            oldValues: log.oldValues,
            newValues: log.newValues,
        }));
    }
    getClientIp() {
        const forwarded = this.request.get('x-forwarded-for');
        const realIp = this.request.get('x-real-ip');
        const clientIp = this.request.get('x-client-ip');
        const cfConnectingIp = this.request.get('cf-connecting-ip');
        return forwarded?.split(',')[0].trim() ||
            realIp ||
            clientIp ||
            cfConnectingIp ||
            this.request.ip ||
            this.request.socket?.remoteAddress ||
            'unknown';
    }
    generateSearchableText(auditData) {
        const parts = [
            auditData.action,
            auditData.entity,
            auditData.entityId,
            auditData.referenceType,
            auditData.referenceId,
            auditData.module,
            auditData.errorMessage,
        ].filter(Boolean);
        if (auditData.details) {
            Object.values(auditData.details).forEach(value => {
                if (typeof value === 'string')
                    parts.push(value);
            });
        }
        return parts.join(' ').toLowerCase();
    }
    async getDetailedAuditTrail(entity, entityId) {
        try {
            const auditLogs = await this.prisma.auditLog.findMany({
                where: {
                    entity,
                    entityId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'asc',
                },
            });
            if (auditLogs.length === 0) {
                return {
                    entity,
                    entityId,
                    currentState: null,
                    changeHistory: [],
                    summary: {
                        totalChanges: 0,
                        lastModified: new Date(),
                        lastModifiedBy: '',
                        createdAt: new Date(),
                        createdBy: '',
                    },
                };
            }
            let currentState = {};
            const changeHistory = [];
            for (const log of auditLogs) {
                const changes = [];
                if (log.action === 'CREATE' && log.newValues) {
                    Object.entries(log.newValues).forEach(([field, value]) => {
                        currentState[field] = value;
                        changes.push({
                            field,
                            oldValue: null,
                            newValue: value,
                            changeType: 'added',
                        });
                    });
                }
                else if (log.action === 'UPDATE' && log.oldValues && log.newValues) {
                    const oldValues = log.oldValues;
                    const newValues = log.newValues;
                    Object.keys({ ...oldValues, ...newValues }).forEach(field => {
                        const oldValue = oldValues[field];
                        const newValue = newValues[field];
                        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                            currentState[field] = newValue;
                            changes.push({
                                field,
                                oldValue,
                                newValue,
                                changeType: oldValue === undefined ? 'added' : newValue === undefined ? 'removed' : 'modified',
                            });
                        }
                    });
                }
                else if (log.action === 'DELETE' && log.oldValues) {
                    const oldValues = log.oldValues;
                    Object.entries(oldValues).forEach(([field, value]) => {
                        changes.push({
                            field,
                            oldValue: value,
                            newValue: null,
                            changeType: 'removed',
                        });
                    });
                    currentState = { ...currentState, _deleted: true };
                }
                if (changes.length > 0) {
                    changeHistory.push({
                        timestamp: log.timestamp,
                        action: log.action,
                        user: log.user?.username || log.user?.email || 'غير معروف',
                        changes,
                        details: log.details,
                    });
                }
            }
            const createLog = auditLogs.find(log => log.action === 'CREATE');
            const lastLog = auditLogs[auditLogs.length - 1];
            const summary = {
                totalChanges: changeHistory.length,
                lastModified: lastLog.timestamp,
                lastModifiedBy: lastLog.user?.username || lastLog.user?.email || 'غير معروف',
                createdAt: createLog?.timestamp || lastLog.timestamp,
                createdBy: createLog?.user?.username || createLog?.user?.email || 'غير معروف',
            };
            return {
                entity,
                entityId,
                currentState,
                changeHistory,
                summary,
            };
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء تتبع التدقيق التفصيلي لـ ${entity}:${entityId}`, error);
            throw error;
        }
    }
    compareEntityStates(oldState, newState) {
        const changes = [];
        const allFields = new Set([...Object.keys(oldState || {}), ...Object.keys(newState || {})]);
        for (const field of allFields) {
            const oldValue = oldState?.[field];
            const newValue = newState?.[field];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                let changeType;
                if (oldValue === undefined || oldValue === null) {
                    changeType = 'added';
                }
                else if (newValue === undefined || newValue === null) {
                    changeType = 'removed';
                }
                else {
                    changeType = 'modified';
                }
                changes.push({
                    field,
                    oldValue,
                    newValue,
                    changeType,
                });
            }
        }
        return changes;
    }
    async getChangeReport(startDate, endDate, entity, userId) {
        try {
            const where = {
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
                action: {
                    in: ['CREATE', 'UPDATE', 'DELETE'],
                },
            };
            if (entity)
                where.entity = entity;
            if (userId)
                where.userId = userId;
            const changes = await this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            username: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    timestamp: 'desc',
                },
            });
            const changesByEntity = {};
            const changesByUser = {};
            const changesByAction = {};
            const entitiesAffected = new Set();
            const usersInvolved = new Set();
            changes.forEach(change => {
                changesByEntity[change.entity] = (changesByEntity[change.entity] || 0) + 1;
                changesByAction[change.action] = (changesByAction[change.action] || 0) + 1;
                const userKey = change.user?.username || change.user?.email || change.userId || 'unknown';
                changesByUser[userKey] = (changesByUser[userKey] || 0) + 1;
                entitiesAffected.add(change.entity);
                if (change.userId)
                    usersInvolved.add(change.userId);
            });
            const mostChangedEntity = Object.entries(changesByEntity)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
            const mostActiveUser = Object.entries(changesByUser)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
            const recentChanges = changes.slice(0, 20).map(change => ({
                timestamp: change.timestamp,
                entity: change.entity,
                entityId: change.entityId,
                action: change.action,
                user: change.user?.username || change.user?.email || 'غير معروف',
                changesCount: this.countChangesInLog(change),
            }));
            return {
                period: { start: startDate, end: endDate },
                summary: {
                    totalChanges: changes.length,
                    entitiesAffected: entitiesAffected.size,
                    usersInvolved: usersInvolved.size,
                    mostChangedEntity,
                    mostActiveUser,
                },
                changesByEntity,
                changesByUser,
                changesByAction,
                recentChanges,
            };
        }
        catch (error) {
            this.logger.error('فشل في إنشاء تقرير التغييرات', error);
            throw error;
        }
    }
    countChangesInLog(log) {
        let count = 0;
        if (log.newValues) {
            count += Object.keys(log.newValues).length;
        }
        if (log.oldValues) {
            count += Object.keys(log.oldValues).length;
        }
        return count;
    }
    async invalidateAuditCache() {
        const auditKeys = await this.cacheService.getKeys(`${this.auditCacheKey}:*`);
        for (const key of auditKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService, Object])
], AuditService);
//# sourceMappingURL=audit.service.js.map