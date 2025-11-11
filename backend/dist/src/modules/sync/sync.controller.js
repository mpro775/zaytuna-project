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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncController = void 0;
const common_1 = require("@nestjs/common");
const sync_service_1 = require("./sync.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let SyncController = class SyncController {
    syncService;
    constructor(syncService) {
        this.syncService = syncService;
    }
    async uploadSyncBatch(body) {
        const batch = await this.syncService.createSyncBatch(body.deviceId, body.branchId, body.syncType, 'upload', body.changes, body.metadata);
        setImmediate(async () => {
            try {
                await this.syncService.processSyncBatch(batch.batchId);
            }
            catch (error) {
                console.error('خطأ في معالجة دفعة المزامنة:', error);
            }
        });
        return {
            batchId: batch.batchId,
            status: 'processing',
        };
    }
    async downloadSyncData(deviceId, branchId, lastSyncTime, entities) {
        const lastSync = lastSyncTime ? new Date(lastSyncTime) : undefined;
        const entityList = entities ? entities.split(',') : undefined;
        const changes = await this.syncService.getSyncData(deviceId, branchId, lastSync, entityList);
        return {
            changes,
            timestamp: new Date(),
        };
    }
    async bidirectionalSync(body) {
        const uploadBatch = await this.syncService.createSyncBatch(body.deviceId, body.branchId, 'incremental', 'bidirectional', body.uploadChanges, body.metadata);
        const lastSync = body.lastSyncTime ? new Date(body.lastSyncTime) : undefined;
        const downloadChanges = await this.syncService.getSyncData(body.deviceId, body.branchId, lastSync, body.entities);
        setImmediate(async () => {
            try {
                await this.syncService.processSyncBatch(uploadBatch.batchId);
            }
            catch (error) {
                console.error('خطأ في معالجة دفعة المزامنة:', error);
            }
        });
        return {
            uploadBatchId: uploadBatch.batchId,
            downloadChanges,
            timestamp: new Date(),
        };
    }
    async getSyncBatchStatus(batchId) {
        return {
            batchId,
            status: 'unknown',
            message: 'سيتم تنفيذ هذه الميزة قريباً',
        };
    }
    async resolveSyncConflict(batchId, conflictId, body) {
        await this.syncService.resolveConflict(batchId, conflictId, body.resolution, body.resolvedData);
        return {
            message: `تم حل التعارض ${conflictId} باستخدام: ${body.resolution}`,
        };
    }
    async retrySyncBatch(batchId) {
        return this.syncService.retryFailedBatch(batchId);
    }
    getSyncStats(branchId) {
        return this.syncService.getSyncStats(branchId);
    }
    async getSyncBatches(branchId, deviceId, status, limit, offset) {
        return {
            batches: [],
            total: 0,
            limit: parseInt(limit || '50'),
            offset: parseInt(offset || '0'),
            message: 'سيتم تنفيذ هذه الميزة قريباً',
        };
    }
    async cleanupOldSyncBatches(days) {
        const daysToKeep = parseInt(days);
        if (isNaN(daysToKeep) || daysToKeep < 7) {
            throw new Error('يجب أن يكون عدد الأيام 7 أيام على الأقل');
        }
        const deletedCount = await this.syncService.cleanupOldSyncBatches(daysToKeep);
        return { deletedCount };
    }
    async registerDevice(body) {
        return {
            deviceId: body.deviceId,
            status: 'registered',
            capabilities: body.capabilities || ['sync', 'offline'],
        };
    }
    async unregisterDevice(body) {
        return {
            deviceId: body.deviceId,
            status: 'unregistered',
        };
    }
    async getDeviceSyncConfig(deviceId) {
        return {
            deviceId,
            syncEnabled: true,
            syncInterval: 15,
            maxBatchSize: 1000,
            supportedEntities: [
                'Product', 'ProductVariant', 'Category',
                'Customer', 'SalesInvoice', 'Payment',
                'Supplier', 'PurchaseInvoice', 'StockItem',
            ],
            offlineTimeout: 24,
        };
    }
    async updateDeviceSyncConfig(deviceId, config) {
        return {
            deviceId,
            status: 'updated',
        };
    }
    async getDevicePendingChanges(deviceId, since) {
        return {
            deviceId,
            hasPendingChanges: false,
            pendingBatches: 0,
            lastChangeTime: new Date(),
            entities: {},
        };
    }
    async forceDeviceSync(deviceId, options) {
        return {
            deviceId,
            syncInitiated: false,
            batchId: undefined,
            estimatedDuration: 0,
        };
    }
    async createSyncBackup(body) {
        return {
            backupId: `backup_${Date.now()}`,
            status: 'created',
            entities: body.entities || ['all'],
            estimatedSize: 0,
            downloadUrl: undefined,
        };
    }
    async restoreFromBackup(body) {
        return {
            backupId: body.backupId,
            status: 'completed',
            restoredEntities: body.entities || [],
            conflicts: 0,
            duration: 0,
        };
    }
    async listSyncBackups(branchId, limit) {
        return {
            backups: [],
            total: 0,
        };
    }
    async deleteSyncBackup(backupId) {
        return {
            backupId,
            status: 'deleted',
        };
    }
    async getSyncHealth() {
        return {
            status: 'healthy',
            uptime: Date.now(),
            activeConnections: 0,
            pendingBatches: 0,
            failedBatches: 0,
            averageResponseTime: 0,
            lastHealthCheck: new Date(),
        };
    }
    async getSyncPerformance(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        return {
            period: { start, end },
            metrics: {
                totalBatches: 0,
                averageBatchSize: 0,
                averageProcessingTime: 0,
                successRate: 0,
                throughput: 0,
            },
            trends: [],
        };
    }
    async getSyncErrors(startDate, endDate, limit) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        return {
            errors: [],
            summary: {
                totalErrors: 0,
                resolvedErrors: 0,
                unresolvedErrors: 0,
                commonErrorTypes: {},
            },
        };
    }
    async createOfflineSession(body) {
        return this.syncService.createOfflineSession(body.deviceId, body.userId, body.branchId, body.capabilities);
    }
    async endOfflineSession(sessionId) {
        await this.syncService.endOfflineSession(sessionId);
        return { message: `تم إنهاء جلسة offline: ${sessionId}` };
    }
    async validateOfflineSession(sessionId) {
        const valid = await this.syncService.validateOfflineSession(sessionId);
        return { valid };
    }
    async getOfflineDataPackage(sessionId, entities) {
        const entityList = entities ? entities.split(',') : undefined;
        return this.syncService.createOfflineDataPackage(sessionId, entityList);
    }
    async saveOfflineChanges(sessionId, body) {
        return this.syncService.saveOfflineChanges(sessionId, body.changes);
    }
    async getDeviceOfflineSessions(deviceId) {
        return this.syncService.getDeviceOfflineSessions(deviceId);
    }
    getOfflineStats() {
        return this.syncService.getOfflineStats();
    }
    async cleanupExpiredOfflineSessions() {
        const cleanedSessions = await this.syncService.cleanupExpiredOfflineSessions();
        return { cleanedSessions };
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, permissions_decorator_1.Permissions)('sync.upload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "uploadSyncBatch", null);
__decorate([
    (0, common_1.Get)('download'),
    (0, permissions_decorator_1.Permissions)('sync.download'),
    __param(0, (0, common_1.Query)('deviceId')),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('lastSyncTime')),
    __param(3, (0, common_1.Query)('entities')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "downloadSyncData", null);
__decorate([
    (0, common_1.Post)('bidirectional'),
    (0, permissions_decorator_1.Permissions)('sync.bidirectional'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "bidirectionalSync", null);
__decorate([
    (0, common_1.Get)('batch/:batchId'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncBatchStatus", null);
__decorate([
    (0, common_1.Put)('batch/:batchId/conflict/:conflictId'),
    (0, permissions_decorator_1.Permissions)('sync.resolve'),
    __param(0, (0, common_1.Param)('batchId')),
    __param(1, (0, common_1.Param)('conflictId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "resolveSyncConflict", null);
__decorate([
    (0, common_1.Post)('batch/:batchId/retry'),
    (0, permissions_decorator_1.Permissions)('sync.retry'),
    __param(0, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "retrySyncBatch", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "getSyncStats", null);
__decorate([
    (0, common_1.Get)('batches'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('deviceId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncBatches", null);
__decorate([
    (0, common_1.Post)('cleanup/:days'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __param(0, (0, common_1.Param)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "cleanupOldSyncBatches", null);
__decorate([
    (0, common_1.Post)('device/register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Post)('device/unregister'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "unregisterDevice", null);
__decorate([
    (0, common_1.Get)('device/:deviceId/config'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getDeviceSyncConfig", null);
__decorate([
    (0, common_1.Put)('device/:deviceId/config'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "updateDeviceSyncConfig", null);
__decorate([
    (0, common_1.Get)('device/:deviceId/changes'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Query)('since')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getDevicePendingChanges", null);
__decorate([
    (0, common_1.Post)('device/:deviceId/sync-now'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "forceDeviceSync", null);
__decorate([
    (0, common_1.Post)('backup/create'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "createSyncBackup", null);
__decorate([
    (0, common_1.Post)('backup/restore'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "restoreFromBackup", null);
__decorate([
    (0, common_1.Get)('backups'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "listSyncBackups", null);
__decorate([
    (0, common_1.Delete)('backup/:backupId'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __param(0, (0, common_1.Param)('backupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "deleteSyncBackup", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncHealth", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncPerformance", null);
__decorate([
    (0, common_1.Get)('errors'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getSyncErrors", null);
__decorate([
    (0, common_1.Post)('offline/session'),
    (0, permissions_decorator_1.Permissions)('sync.offline'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "createOfflineSession", null);
__decorate([
    (0, common_1.Delete)('offline/session/:sessionId'),
    (0, permissions_decorator_1.Permissions)('sync.offline'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "endOfflineSession", null);
__decorate([
    (0, common_1.Get)('offline/session/:sessionId/validate'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "validateOfflineSession", null);
__decorate([
    (0, common_1.Get)('offline/package/:sessionId'),
    (0, permissions_decorator_1.Permissions)('sync.offline'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Query)('entities')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getOfflineDataPackage", null);
__decorate([
    (0, common_1.Post)('offline/changes/:sessionId'),
    (0, permissions_decorator_1.Permissions)('sync.offline'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "saveOfflineChanges", null);
__decorate([
    (0, common_1.Get)('offline/device/:deviceId/sessions'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "getDeviceOfflineSessions", null);
__decorate([
    (0, common_1.Get)('offline/stats'),
    (0, permissions_decorator_1.Permissions)('sync.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SyncController.prototype, "getOfflineStats", null);
__decorate([
    (0, common_1.Post)('offline/cleanup'),
    (0, permissions_decorator_1.Permissions)('sync.admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SyncController.prototype, "cleanupExpiredOfflineSessions", null);
exports.SyncController = SyncController = __decorate([
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [sync_service_1.SyncService])
], SyncController);
//# sourceMappingURL=sync.controller.js.map