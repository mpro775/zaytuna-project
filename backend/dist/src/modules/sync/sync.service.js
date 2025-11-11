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
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const audit_service_1 = require("../audit/audit.service");
const offline_service_1 = require("./offline.service");
let SyncService = SyncService_1 = class SyncService {
    prisma;
    cacheService;
    auditService;
    offlineService;
    logger = new common_1.Logger(SyncService_1.name);
    syncCacheKey = 'sync_batches';
    changeTrackingKey = 'entity_changes';
    constructor(prisma, cacheService, auditService, offlineService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.auditService = auditService;
        this.offlineService = offlineService;
    }
    async createSyncBatch(deviceId, branchId, syncType, direction, changes, metadata) {
        try {
            const batchId = this.generateBatchId(deviceId);
            const totalRecords = changes.length;
            const batch = await this.prisma.syncBatch.create({
                data: {
                    batchId,
                    deviceId,
                    branchId,
                    syncType,
                    direction,
                    totalRecords,
                    changes: changes,
                    metadata: metadata || {},
                    clientVersion: metadata?.clientVersion,
                },
            });
            await this.invalidateSyncCache();
            this.logger.log(`تم إنشاء دفعة مزامنة: ${batchId} مع ${totalRecords} تغيير`);
            return {
                id: batch.id,
                batchId: batch.batchId,
                deviceId: batch.deviceId,
                branchId: batch.branchId || undefined,
                syncType: batch.syncType,
                direction: batch.direction,
                status: batch.status,
                changes,
                metadata: batch.metadata,
            };
        }
        catch (error) {
            this.logger.error('فشل في إنشاء دفعة المزامنة', error);
            throw error;
        }
    }
    async processSyncBatch(batchId) {
        const startTime = Date.now();
        try {
            const batch = await this.prisma.syncBatch.findUnique({
                where: { batchId },
            });
            if (!batch) {
                throw new Error(`دفعة المزامنة غير موجودة: ${batchId}`);
            }
            await this.prisma.syncBatch.update({
                where: { batchId },
                data: {
                    status: 'processing',
                    startedAt: new Date(),
                },
            });
            const changes = batch.changes;
            let processedRecords = 0;
            let failedRecords = 0;
            let conflictedRecords = 0;
            const conflicts = [];
            const errors = [];
            for (const change of changes) {
                try {
                    const conflict = await this.processChange(change, batch.deviceId, batch.branchId);
                    if (conflict) {
                        conflictedRecords++;
                        conflicts.push(conflict);
                    }
                    else {
                        processedRecords++;
                    }
                }
                catch (error) {
                    failedRecords++;
                    errors.push(`خطأ في معالجة التغيير ${change.id}: ${error.message}`);
                    this.logger.error(`خطأ في معالجة التغيير ${change.id}`, error);
                }
            }
            const finalStatus = failedRecords > 0 ? 'failed' :
                conflictedRecords > 0 ? 'conflicted' : 'completed';
            await this.prisma.syncBatch.update({
                where: { batchId },
                data: {
                    status: finalStatus,
                    processedRecords,
                    failedRecords,
                    conflictedRecords,
                    conflicts: conflicts.length > 0 ? conflicts : undefined,
                    completedAt: new Date(),
                    errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
                },
            });
            await this.invalidateSyncCache();
            const result = {
                batchId,
                status: finalStatus === 'completed' ? 'success' :
                    finalStatus === 'conflicted' ? 'partial' : 'failed',
                processedRecords,
                failedRecords,
                conflictedRecords,
                conflicts: conflicts.length > 0 ? conflicts : undefined,
                errors: errors.length > 0 ? errors : undefined,
                duration: Date.now() - startTime,
            };
            this.logger.log(`تمت معالجة دفعة المزامنة ${batchId}: ${result.status}`);
            return result;
        }
        catch (error) {
            await this.prisma.syncBatch.update({
                where: { batchId },
                data: {
                    status: 'failed',
                    errorMessage: error.message,
                    completedAt: new Date(),
                },
            }).catch(err => this.logger.error('فشل في تحديث حالة الدفعة', err));
            await this.invalidateSyncCache();
            throw error;
        }
    }
    async resolveConflict(batchId, conflictId, resolution, resolvedData) {
        try {
            const batch = await this.prisma.syncBatch.findUnique({
                where: { batchId },
            });
            if (!batch) {
                throw new Error(`دفعة المزامنة غير موجودة: ${batchId}`);
            }
            const conflicts = batch.conflicts;
            const conflictIndex = conflicts.findIndex(c => c.id === conflictId);
            if (conflictIndex === -1) {
                throw new Error(`التعارض غير موجود: ${conflictId}`);
            }
            conflicts[conflictIndex].resolution = resolution;
            conflicts[conflictIndex].resolvedData = resolvedData;
            if (resolution === 'local') {
            }
            else if (resolution === 'remote') {
                await this.applyResolvedChange(conflicts[conflictIndex], batch.deviceId);
            }
            else if (resolution === 'merge' && resolvedData) {
                await this.applyResolvedChange({
                    ...conflicts[conflictIndex],
                    localVersion: resolvedData,
                }, batch.deviceId);
            }
            else if (resolution === 'manual' && resolvedData) {
                await this.applyResolvedChange({
                    ...conflicts[conflictIndex],
                    localVersion: resolvedData,
                }, batch.deviceId);
            }
            await this.prisma.syncBatch.update({
                where: { batchId },
                data: {
                    conflicts: conflicts,
                    resolution: {
                        [conflictId]: {
                            resolution,
                            resolvedData,
                            timestamp: new Date(),
                        },
                    },
                },
            });
            await this.invalidateSyncCache();
            this.logger.log(`تم حل التعارض ${conflictId} باستخدام: ${resolution}`);
        }
        catch (error) {
            this.logger.error(`فشل في حل التعارض ${conflictId}`, error);
            throw error;
        }
    }
    async getSyncData(deviceId, branchId, lastSyncTime, entities) {
        try {
            const changes = [];
            const syncableEntities = entities || [
                'Product', 'ProductVariant', 'Category',
                'Customer', 'SalesInvoice', 'Payment',
                'Supplier', 'PurchaseInvoice', 'StockItem',
            ];
            for (const entity of syncableEntities) {
                const entityChanges = await this.getEntityChanges(entity, branchId, lastSyncTime);
                changes.push(...entityChanges);
            }
            this.logger.log(`تم جلب ${changes.length} تغيير للمزامنة من ${deviceId}`);
            return changes;
        }
        catch (error) {
            this.logger.error('فشل في جلب بيانات المزامنة', error);
            throw error;
        }
    }
    async getSyncStats(branchId) {
        try {
            const cacheKey = `sync_stats:${branchId || 'all'}`;
            const cachedStats = await this.cacheService.get(cacheKey);
            if (cachedStats) {
                return cachedStats;
            }
            const where = {};
            if (branchId)
                where.branchId = branchId;
            const batches = await this.prisma.syncBatch.findMany({
                where,
                select: {
                    status: true,
                    totalRecords: true,
                    processedRecords: true,
                    failedRecords: true,
                    conflictedRecords: true,
                    createdAt: true,
                    completedAt: true,
                },
            });
            const stats = {
                totalBatches: batches.length,
                pendingBatches: batches.filter(b => b.status === 'pending').length,
                processingBatches: batches.filter(b => b.status === 'processing').length,
                completedBatches: batches.filter(b => b.status === 'completed').length,
                failedBatches: batches.filter(b => b.status === 'failed').length,
                conflictedBatches: batches.filter(b => b.status === 'conflicted').length,
                totalRecords: batches.reduce((sum, b) => sum + b.totalRecords, 0),
                syncedRecords: batches.reduce((sum, b) => sum + b.processedRecords, 0),
                failedRecords: batches.reduce((sum, b) => sum + b.failedRecords, 0),
                conflictedRecords: batches.reduce((sum, b) => sum + b.conflictedRecords, 0),
                lastSyncTime: batches
                    .filter(b => b.completedAt)
                    .sort((a, b) => (b.completedAt.getTime() - a.completedAt.getTime()))[0]?.completedAt || undefined,
                averageSyncTime: this.calculateAverageSyncTime(batches),
            };
            await this.cacheService.set(cacheKey, stats, { ttl: 300 });
            return stats;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المزامنة', error);
            throw error;
        }
    }
    async cleanupOldSyncBatches(daysToKeep = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await this.prisma.syncBatch.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                status: {
                    in: ['completed', 'failed'],
                },
            },
        });
        await this.invalidateSyncCache();
        this.logger.log(`تم حذف ${result.count} دفعة مزامنة قديمة`);
        return result.count;
    }
    async retryFailedBatch(batchId) {
        try {
            const batch = await this.prisma.syncBatch.findUnique({
                where: { batchId },
            });
            if (!batch) {
                throw new Error(`دفعة المزامنة غير موجودة: ${batchId}`);
            }
            if (batch.status !== 'failed') {
                throw new Error(`دفعة المزامنة ليست فاشلة: ${batch.status}`);
            }
            if (batch.retryCount >= batch.maxRetries) {
                throw new Error(`تم تجاوز الحد الأقصى للمحاولات: ${batch.maxRetries}`);
            }
            await this.prisma.syncBatch.update({
                where: { batchId },
                data: {
                    status: 'pending',
                    retryCount: { increment: 1 },
                    startedAt: null,
                    completedAt: null,
                    errorMessage: null,
                },
            });
            await this.invalidateSyncCache();
            return this.processSyncBatch(batchId);
        }
        catch (error) {
            this.logger.error(`فشل في إعادة محاولة دفعة المزامنة ${batchId}`, error);
            throw error;
        }
    }
    generateBatchId(deviceId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `sync_${deviceId}_${timestamp}_${random}`;
    }
    async processChange(change, deviceId, branchId) {
        try {
            const conflict = await this.detectConflict(change);
            if (conflict) {
                return conflict;
            }
            await this.applyChange(change, deviceId);
            await this.auditService.log({
                action: change.operation.toUpperCase(),
                entity: change.entity,
                entityId: change.entityId || change.id,
                details: {
                    syncDevice: deviceId,
                    syncVersion: change.version,
                    operation: change.operation,
                },
                newValues: change.operation === 'create' || change.operation === 'update' ? change.data : undefined,
                oldValues: change.operation === 'update' || change.operation === 'delete' ? change.data : undefined,
                module: 'sync',
                category: 'system',
            });
            return null;
        }
        catch (error) {
            this.logger.error(`فشل في معالجة التغيير ${change.id}`, error);
            throw error;
        }
    }
    async detectConflict(change) {
        try {
            const currentEntity = await this.getCurrentEntityVersion(change.entity, change.entityId || change.id);
            if (!currentEntity) {
                return null;
            }
            const currentVersion = currentEntity.version || currentEntity.updatedAt?.getTime() || 0;
            const changeVersion = change.timestamp.getTime();
            if (currentVersion > changeVersion) {
                return {
                    id: `conflict_${change.id}_${Date.now()}`,
                    entity: change.entity,
                    entityId: change.entityId || change.id,
                    localVersion: currentEntity,
                    remoteVersion: change.data,
                    conflictType: 'version',
                    timestamp: new Date(),
                };
            }
            if (change.operation === 'update') {
                const dataConflict = this.detectDataConflict(currentEntity, change.data);
                if (dataConflict) {
                    return {
                        id: `conflict_${change.id}_${Date.now()}`,
                        entity: change.entity,
                        entityId: change.entityId || change.id,
                        localVersion: currentEntity,
                        remoteVersion: change.data,
                        conflictType: 'data',
                        timestamp: new Date(),
                    };
                }
            }
            return null;
        }
        catch (error) {
            this.logger.error(`فشل في كشف التعارض للتغيير ${change.id}`, error);
            return null;
        }
    }
    async applyChange(change, deviceId) {
        const modelName = this.getModelName(change.entity);
        switch (change.operation) {
            case 'create':
                await this.prisma[modelName].create({
                    data: {
                        ...change.data,
                        createdAt: change.timestamp,
                        updatedAt: change.timestamp,
                    },
                });
                break;
            case 'update':
                await this.prisma[modelName].update({
                    where: { id: change.entityId },
                    data: {
                        ...change.data,
                        updatedAt: change.timestamp,
                    },
                });
                break;
            case 'delete':
                await this.prisma[modelName].delete({
                    where: { id: change.entityId },
                });
                break;
        }
    }
    async applyResolvedChange(conflict, deviceId) {
        const change = {
            id: conflict.id,
            entity: conflict.entity,
            operation: 'update',
            data: conflict.resolvedData || conflict.remoteVersion,
            timestamp: conflict.timestamp,
            version: conflict.timestamp.getTime(),
            userId: 'sync_system',
        };
        await this.applyChange(change, deviceId);
    }
    async getCurrentEntityVersion(entity, entityId) {
        const modelName = this.getModelName(entity);
        return this.prisma[modelName].findUnique({
            where: { id: entityId },
        });
    }
    async getEntityChanges(entity, branchId, lastSyncTime) {
        const modelName = this.getModelName(entity);
        const where = {};
        if (lastSyncTime) {
            where.updatedAt = {
                gt: lastSyncTime,
            };
        }
        switch (entity) {
            case 'SalesInvoice':
            case 'StockItem':
                if (branchId)
                    where.branchId = branchId;
                break;
            case 'Product':
            case 'ProductVariant':
            case 'Category':
                break;
            case 'Customer':
                break;
        }
        const records = await this.prisma[modelName].findMany({
            where,
            orderBy: { updatedAt: 'asc' },
        });
        return records.map((record) => ({
            id: `sync_${entity}_${record.id}`,
            entity,
            operation: 'update',
            data: record,
            timestamp: record.updatedAt || record.createdAt,
            version: record.updatedAt?.getTime() || record.createdAt?.getTime() || Date.now(),
        }));
    }
    detectDataConflict(localData, remoteData) {
        const importantFields = ['name', 'price', 'quantity', 'status', 'isActive'];
        for (const field of importantFields) {
            if (localData[field] !== undefined && remoteData[field] !== undefined) {
                if (JSON.stringify(localData[field]) !== JSON.stringify(remoteData[field])) {
                    return true;
                }
            }
        }
        return false;
    }
    getModelName(entity) {
        const modelMap = {
            'Product': 'product',
            'ProductVariant': 'productVariant',
            'Category': 'category',
            'Customer': 'customer',
            'SalesInvoice': 'salesInvoice',
            'Payment': 'payment',
            'Supplier': 'supplier',
            'PurchaseInvoice': 'purchaseInvoice',
            'StockItem': 'stockItem',
        };
        return modelMap[entity] || entity.toLowerCase();
    }
    calculateAverageSyncTime(batches) {
        const completedBatches = batches.filter(b => b.completedAt && b.startedAt);
        if (completedBatches.length === 0)
            return 0;
        const totalTime = completedBatches.reduce((sum, batch) => {
            return sum + (batch.completedAt.getTime() - batch.startedAt.getTime());
        }, 0);
        return totalTime / completedBatches.length;
    }
    async createOfflineSession(deviceId, userId, branchId, capabilities) {
        return this.offlineService.createOfflineSession(deviceId, userId, branchId, capabilities);
    }
    async endOfflineSession(sessionId) {
        return this.offlineService.endOfflineSession(sessionId);
    }
    async validateOfflineSession(sessionId) {
        return this.offlineService.validateOfflineSession(sessionId);
    }
    async createOfflineDataPackage(sessionId, entities) {
        return this.offlineService.createOfflineDataPackage(sessionId, entities);
    }
    async saveOfflineChanges(sessionId, changes) {
        return this.offlineService.saveOfflineChanges(sessionId, changes);
    }
    async getDeviceOfflineSessions(deviceId) {
        return this.offlineService.getDeviceSessions(deviceId);
    }
    async getOfflineStats() {
        return this.offlineService.getOfflineStats();
    }
    async cleanupExpiredOfflineSessions() {
        return this.offlineService.cleanupExpiredSessions();
    }
    async invalidateSyncCache() {
        const syncKeys = await this.cacheService.getKeys(`${this.syncCacheKey}:*`);
        for (const key of syncKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => audit_service_1.AuditService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        audit_service_1.AuditService,
        offline_service_1.OfflineService])
], SyncService);
//# sourceMappingURL=sync.service.js.map