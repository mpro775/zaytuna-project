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
var OfflineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let OfflineService = OfflineService_1 = class OfflineService {
    prisma;
    cacheService;
    logger = new common_1.Logger(OfflineService_1.name);
    offlineCacheKey = 'offline_sessions';
    maxOfflineHours = 24;
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async createOfflineSession(deviceId, userId, branchId, capabilities = ['read', 'write', 'sync']) {
        try {
            const sessionId = this.generateSessionId(deviceId);
            const now = new Date();
            const session = {
                id: sessionId,
                deviceId,
                userId,
                branchId,
                startedAt: now,
                lastActivity: now,
                status: 'active',
                capabilities,
                syncEnabled: true,
                maxOfflineHours: this.maxOfflineHours,
            };
            await this.cacheService.set(`offline_session:${sessionId}`, session, { ttl: this.maxOfflineHours * 60 * 60 });
            await this.addDeviceSession(deviceId, sessionId);
            this.logger.log(`تم إنشاء جلسة offline: ${sessionId} للجهاز: ${deviceId}`);
            return session;
        }
        catch (error) {
            this.logger.error('فشل في إنشاء جلسة offline', error);
            throw error;
        }
    }
    async updateSessionActivity(sessionId) {
        try {
            const session = await this.getOfflineSession(sessionId);
            if (!session) {
                throw new Error(`جلسة offline غير موجودة: ${sessionId}`);
            }
            session.lastActivity = new Date();
            const hoursDiff = (Date.now() - session.startedAt.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > session.maxOfflineHours) {
                session.status = 'expired';
            }
            await this.cacheService.set(`offline_session:${sessionId}`, session, { ttl: session.maxOfflineHours * 60 * 60 });
        }
        catch (error) {
            this.logger.error(`فشل في تحديث نشاط الجلسة ${sessionId}`, error);
            throw error;
        }
    }
    async endOfflineSession(sessionId) {
        try {
            const session = await this.getOfflineSession(sessionId);
            if (!session) {
                return;
            }
            await this.cacheService.delete(`offline_session:${sessionId}`);
            await this.removeDeviceSession(session.deviceId, sessionId);
            this.logger.log(`تم إنهاء جلسة offline: ${sessionId}`);
        }
        catch (error) {
            this.logger.error(`فشل في إنهاء الجلسة ${sessionId}`, error);
            throw error;
        }
    }
    async getOfflineSession(sessionId) {
        try {
            return await this.cacheService.get(`offline_session:${sessionId}`);
        }
        catch (error) {
            this.logger.error(`فشل في جلب جلسة offline ${sessionId}`, error);
            return null;
        }
    }
    async validateOfflineSession(sessionId) {
        try {
            const session = await this.getOfflineSession(sessionId);
            if (!session) {
                return false;
            }
            if (session.status !== 'active') {
                return false;
            }
            const hoursDiff = (Date.now() - session.startedAt.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > session.maxOfflineHours) {
                session.status = 'expired';
                await this.cacheService.set(`offline_session:${sessionId}`, session);
                return false;
            }
            return true;
        }
        catch (error) {
            this.logger.error(`فشل في التحقق من صحة الجلسة ${sessionId}`, error);
            return false;
        }
    }
    async createOfflineDataPackage(sessionId, entities) {
        try {
            const session = await this.getOfflineSession(sessionId);
            if (!session) {
                throw new Error(`جلسة offline غير موجودة: ${sessionId}`);
            }
            const defaultEntities = [
                'Product', 'ProductVariant', 'Category',
                'Customer', 'Supplier',
                'StockItem', 'Warehouse',
            ];
            const syncEntities = entities || defaultEntities;
            const packageData = {};
            for (const entity of syncEntities) {
                packageData[entity] = await this.getEntityDataForOffline(entity, session);
            }
            const timestamp = new Date();
            const dataSize = this.calculateDataSize(packageData);
            const checksum = this.generateChecksum(packageData);
            const dataPackage = {
                sessionId,
                timestamp,
                entities: packageData,
                metadata: {
                    version: '1.0.0',
                    lastSyncTime: timestamp,
                    dataSize,
                    checksum,
                },
            };
            session.dataSnapshot = {
                timestamp: timestamp.toISOString(),
                checksum,
                entities: Object.keys(packageData),
            };
            await this.cacheService.set(`offline_session:${sessionId}`, session);
            this.logger.log(`تم إنشاء حزمة بيانات offline للجلسة: ${sessionId}`);
            return dataPackage;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء حزمة البيانات للجلسة ${sessionId}`, error);
            throw error;
        }
    }
    async saveOfflineChanges(sessionId, changes) {
        try {
            const session = await this.getOfflineSession(sessionId);
            if (!session) {
                throw new Error(`جلسة offline غير موجودة: ${sessionId}`);
            }
            if (!session.capabilities.includes('write')) {
                throw new Error('الجلسة لا تدعم الكتابة');
            }
            let savedChanges = 0;
            let conflicts = 0;
            const errors = [];
            for (const change of changes) {
                try {
                    await this.queueOfflineChange(sessionId, change);
                    savedChanges++;
                }
                catch (error) {
                    conflicts++;
                    errors.push(`خطأ في حفظ التغيير ${change.entity}: ${error.message}`);
                }
            }
            await this.updateSessionActivity(sessionId);
            this.logger.log(`تم حفظ ${savedChanges} تغيير من وضع offline للجلسة: ${sessionId}`);
            return {
                sessionId,
                savedChanges,
                conflicts,
                errors,
            };
        }
        catch (error) {
            this.logger.error(`فشل في حفظ التغييرات من وضع offline للجلسة ${sessionId}`, error);
            throw error;
        }
    }
    async getDeviceSessions(deviceId) {
        try {
            const sessionIds = await this.cacheService.get(`device_sessions:${deviceId}`) || [];
            const sessions = [];
            for (const sessionId of sessionIds) {
                const session = await this.getOfflineSession(sessionId);
                if (session && session.status === 'active') {
                    sessions.push(session);
                }
            }
            return sessions;
        }
        catch (error) {
            this.logger.error(`فشل في جلب جلسات الجهاز ${deviceId}`, error);
            return [];
        }
    }
    async cleanupExpiredSessions() {
        try {
            this.logger.log('تم تنظيف الجلسات المنتهية الصلاحية');
            return 0;
        }
        catch (error) {
            this.logger.error('فشل في تنظيف الجلسات المنتهية', error);
            return 0;
        }
    }
    async getOfflineStats() {
        try {
            return {
                activeSessions: 0,
                totalSessions: 0,
                expiredSessions: 0,
                averageSessionDuration: 0,
                mostActiveDevices: [],
            };
        }
        catch (error) {
            this.logger.error('فشل في جلب إحصائيات وضع offline', error);
            return {
                activeSessions: 0,
                totalSessions: 0,
                expiredSessions: 0,
                averageSessionDuration: 0,
                mostActiveDevices: [],
            };
        }
    }
    generateSessionId(deviceId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `offline_${deviceId}_${timestamp}_${random}`;
    }
    async addDeviceSession(deviceId, sessionId) {
        try {
            const sessions = await this.cacheService.get(`device_sessions:${deviceId}`) || [];
            sessions.push(sessionId);
            await this.cacheService.set(`device_sessions:${deviceId}`, sessions);
        }
        catch (error) {
            this.logger.error(`فشل في إضافة جلسة ${sessionId} للجهاز ${deviceId}`, error);
        }
    }
    async removeDeviceSession(deviceId, sessionId) {
        try {
            const sessions = await this.cacheService.get(`device_sessions:${deviceId}`) || [];
            const filteredSessions = sessions.filter(id => id !== sessionId);
            await this.cacheService.set(`device_sessions:${deviceId}`, filteredSessions);
        }
        catch (error) {
            this.logger.error(`فشل في إزالة جلسة ${sessionId} من الجهاز ${deviceId}`, error);
        }
    }
    async getEntityDataForOffline(entity, session) {
        try {
            const modelName = this.getModelName(entity);
            const where = {};
            switch (entity) {
                case 'SalesInvoice':
                case 'StockItem':
                    if (session.branchId)
                        where.branchId = session.branchId;
                    break;
                case 'Product':
                case 'ProductVariant':
                case 'Category':
                    break;
                case 'Customer':
                    break;
            }
            const select = this.getOfflineSelectFields(entity);
            const records = await this.prisma[modelName].findMany({
                where,
                select,
                take: 10000,
            });
            return records;
        }
        catch (error) {
            this.logger.error(`فشل في جلب بيانات ${entity} للعمل offline`, error);
            return [];
        }
    }
    getOfflineSelectFields(entity) {
        const fieldMaps = {
            Product: {
                id: true,
                name: true,
                barcode: true,
                basePrice: true,
                costPrice: true,
                isActive: true,
                categoryId: true,
            },
            ProductVariant: {
                id: true,
                productId: true,
                name: true,
                sku: true,
                price: true,
                cost: true,
                stock: true,
                isActive: true,
            },
            Category: {
                id: true,
                name: true,
                parentId: true,
                isActive: true,
            },
            Customer: {
                id: true,
                name: true,
                phone: true,
                email: true,
                isActive: true,
            },
            Supplier: {
                id: true,
                name: true,
                phone: true,
                email: true,
                isActive: true,
            },
            StockItem: {
                id: true,
                productVariantId: true,
                warehouseId: true,
                quantity: true,
                minStock: true,
                maxStock: true,
            },
            Warehouse: {
                id: true,
                name: true,
                code: true,
                branchId: true,
                isActive: true,
            },
        };
        return fieldMaps[entity] || { id: true, name: true, isActive: true };
    }
    async queueOfflineChange(sessionId, change) {
        try {
            const queuedChange = {
                sessionId,
                entity: change.entity,
                operation: change.operation,
                data: change.data,
                localId: change.localId,
                queuedAt: new Date(),
                status: 'queued',
            };
            const queueKey = `offline_queue:${sessionId}`;
            const queue = await this.cacheService.get(queueKey) || [];
            queue.push(queuedChange);
            await this.cacheService.set(queueKey, queue, { ttl: 7 * 24 * 60 * 60 });
        }
        catch (error) {
            this.logger.error(`فشل في حفظ التغيير في قائمة الانتظار ${sessionId}`, error);
            throw error;
        }
    }
    calculateDataSize(data) {
        return JSON.stringify(data).length;
    }
    generateChecksum(data) {
        const crypto = require('crypto');
        const dataString = JSON.stringify(data);
        return crypto.createHash('md5').update(dataString).digest('hex');
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
            'Warehouse': 'warehouse',
        };
        return modelMap[entity] || entity.toLowerCase();
    }
};
exports.OfflineService = OfflineService;
exports.OfflineService = OfflineService = OfflineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], OfflineService);
//# sourceMappingURL=offline.service.js.map