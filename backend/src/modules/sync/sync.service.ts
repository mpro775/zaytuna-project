import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
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

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly syncCacheKey = 'sync_batches';
  private readonly changeTrackingKey = 'entity_changes';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
    private readonly offlineService: OfflineService,
  ) {}

  /**
   * إنشاء دفعة مزامنة جديدة
   */
  async createSyncBatch(
    deviceId: string,
    branchId: string | undefined,
    syncType: SyncBatch['syncType'],
    direction: SyncBatch['direction'],
    changes: SyncChange[],
    metadata?: Record<string, any>,
  ): Promise<SyncBatch> {
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
          changes: changes as any,
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
        syncType: batch.syncType as SyncBatch['syncType'],
        direction: batch.direction as SyncBatch['direction'],
        status: batch.status as SyncBatch['status'],
        changes,
        metadata: batch.metadata as any,
      };
    } catch (error) {
      this.logger.error('فشل في إنشاء دفعة المزامنة', error);
      throw error;
    }
  }

  /**
   * معالجة دفعة المزامنة
   */
  async processSyncBatch(batchId: string): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      const batch = await this.prisma.syncBatch.findUnique({
        where: { batchId },
      });

      if (!batch) {
        throw new Error(`دفعة المزامنة غير موجودة: ${batchId}`);
      }

      // تحديث حالة الدفعة
      await this.prisma.syncBatch.update({
        where: { batchId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      });

      const changes = batch.changes as unknown as SyncChange[];
      let processedRecords = 0;
      let failedRecords = 0;
      let conflictedRecords = 0;
      const conflicts: SyncConflict[] = [];
      const errors: string[] = [];

      // معالجة كل تغيير
      for (const change of changes) {
        try {
          const conflict = await this.processChange(change, batch.deviceId, batch.branchId);

          if (conflict) {
            conflictedRecords++;
            conflicts.push(conflict);
          } else {
            processedRecords++;
          }
        } catch (error) {
          failedRecords++;
          errors.push(`خطأ في معالجة التغيير ${change.id}: ${error.message}`);
          this.logger.error(`خطأ في معالجة التغيير ${change.id}`, error);
        }
      }

      // تحديث حالة الدفعة النهائية
      const finalStatus: 'completed' | 'failed' | 'conflicted' =
        failedRecords > 0 ? 'failed' :
        conflictedRecords > 0 ? 'conflicted' : 'completed';

      await this.prisma.syncBatch.update({
        where: { batchId },
        data: {
          status: finalStatus,
          processedRecords,
          failedRecords,
          conflictedRecords,
          conflicts: conflicts.length > 0 ? conflicts as any : undefined,
          completedAt: new Date(),
          errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
        },
      });

      await this.invalidateSyncCache();

      const result: SyncResult = {
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
    } catch (error) {
      // تحديث حالة الدفعة عند الفشل
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

  /**
   * حل تعارض المزامنة
   */
  async resolveConflict(
    batchId: string,
    conflictId: string,
    resolution: SyncConflict['resolution'],
    resolvedData?: any,
  ): Promise<void> {
    try {
      const batch = await this.prisma.syncBatch.findUnique({
        where: { batchId },
      });

      if (!batch) {
        throw new Error(`دفعة المزامنة غير موجودة: ${batchId}`);
      }

      const conflicts = batch.conflicts as unknown as SyncConflict[];
      const conflictIndex = conflicts.findIndex(c => c.id === conflictId);

      if (conflictIndex === -1) {
        throw new Error(`التعارض غير موجود: ${conflictId}`);
      }

      conflicts[conflictIndex].resolution = resolution;
      conflicts[conflictIndex].resolvedData = resolvedData;

      // تطبيق الحل
      if (resolution === 'local') {
        // استخدم البيانات المحلية (لا تغيير)
      } else if (resolution === 'remote') {
        // استخدم البيانات البعيدة
        await this.applyResolvedChange(conflicts[conflictIndex], batch.deviceId);
      } else if (resolution === 'merge' && resolvedData) {
        // دمج البيانات
        await this.applyResolvedChange({
          ...conflicts[conflictIndex],
          localVersion: resolvedData,
        }, batch.deviceId);
      } else if (resolution === 'manual' && resolvedData) {
        // حل يدوي
        await this.applyResolvedChange({
          ...conflicts[conflictIndex],
          localVersion: resolvedData,
        }, batch.deviceId);
      }

      // تحديث الدفعة
      await this.prisma.syncBatch.update({
        where: { batchId },
        data: {
          conflicts: conflicts as any,
          resolution: {
            [conflictId]: {
              resolution,
              resolvedData,
              timestamp: new Date(),
            },
          } as any,
        },
      });

      await this.invalidateSyncCache();

      this.logger.log(`تم حل التعارض ${conflictId} باستخدام: ${resolution}`);
    } catch (error) {
      this.logger.error(`فشل في حل التعارض ${conflictId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على البيانات للمزامنة
   */
  async getSyncData(
    deviceId: string,
    branchId: string | undefined,
    lastSyncTime?: Date,
    entities?: string[],
  ): Promise<SyncChange[]> {
    try {
      const changes: SyncChange[] = [];

      // قائمة الكيانات التي يمكن مزامنتها
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
    } catch (error) {
      this.logger.error('فشل في جلب بيانات المزامنة', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المزامنة
   */
  async getSyncStats(branchId?: string): Promise<SyncStats> {
    try {
      const cacheKey = `sync_stats:${branchId || 'all'}`;

      const cachedStats = await this.cacheService.get<SyncStats>(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const where: any = {};
      if (branchId) where.branchId = branchId;

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

      const stats: SyncStats = {
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
          .sort((a, b) => (b.completedAt!.getTime() - a.completedAt!.getTime()))
          [0]?.completedAt || undefined,
        averageSyncTime: this.calculateAverageSyncTime(batches),
      };

      await this.cacheService.set(cacheKey, stats, { ttl: 300 }); // 5 دقائق

      return stats;
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المزامنة', error);
      throw error;
    }
  }

  /**
   * تنظيف دفعات المزامنة القديمة
   */
  async cleanupOldSyncBatches(daysToKeep: number = 30): Promise<number> {
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

  /**
   * إعادة محاولة دفعة المزامنة الفاشلة
   */
  async retryFailedBatch(batchId: string): Promise<SyncResult> {
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

      // إعادة تعيين الدفعة
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

      // إعادة معالجة الدفعة
      return this.processSyncBatch(batchId);
    } catch (error) {
      this.logger.error(`فشل في إعادة محاولة دفعة المزامنة ${batchId}`, error);
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * إنشاء معرف دفعة فريد
   */
  private generateBatchId(deviceId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `sync_${deviceId}_${timestamp}_${random}`;
  }

  /**
   * معالجة تغيير واحد
   */
  private async processChange(
    change: SyncChange,
    deviceId: string,
    branchId?: string | null,
  ): Promise<SyncConflict | null> {
    try {
      // التحقق من وجود تعارض
      const conflict = await this.detectConflict(change);
      if (conflict) {
        return conflict;
      }

      // تطبيق التغيير
      await this.applyChange(change, deviceId);

      // تسجيل في سجل التدقيق
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
    } catch (error) {
      this.logger.error(`فشل في معالجة التغيير ${change.id}`, error);
      throw error;
    }
  }

  /**
   * كشف التعارضات
   */
  private async detectConflict(change: SyncChange): Promise<SyncConflict | null> {
    try {
      // البحث عن إصدار أحدث في قاعدة البيانات
      const currentEntity = await this.getCurrentEntityVersion(change.entity, change.entityId || change.id);

      if (!currentEntity) {
        // الكيان غير موجود - لا تعارض
        return null;
      }

      const currentVersion = currentEntity.version || currentEntity.updatedAt?.getTime() || 0;
      const changeVersion = change.timestamp.getTime();

      if (currentVersion > changeVersion) {
        // الإصدار الحالي أحدث - تعارض
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

      // فحص تعارض البيانات للعمليات المحدثة
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
    } catch (error) {
      this.logger.error(`فشل في كشف التعارض للتغيير ${change.id}`, error);
      return null;
    }
  }

  /**
   * تطبيق التغيير
   */
  private async applyChange(change: SyncChange, deviceId: string): Promise<void> {
    const modelName = this.getModelName(change.entity);

    switch (change.operation) {
      case 'create':
        await (this.prisma as any)[modelName].create({
          data: {
            ...change.data,
            createdAt: change.timestamp,
            updatedAt: change.timestamp,
          },
        });
        break;

      case 'update':
        await (this.prisma as any)[modelName].update({
          where: { id: change.entityId },
          data: {
            ...change.data,
            updatedAt: change.timestamp,
          },
        });
        break;

      case 'delete':
        await (this.prisma as any)[modelName].delete({
          where: { id: change.entityId },
        });
        break;
    }
  }

  /**
   * تطبيق الحل المُختار للتعارض
   */
  private async applyResolvedChange(conflict: SyncConflict, deviceId: string): Promise<void> {
    const change: SyncChange = {
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

  /**
   * الحصول على إصدار الكيان الحالي
   */
  private async getCurrentEntityVersion(entity: string, entityId: string): Promise<any> {
    const modelName = this.getModelName(entity);
    return (this.prisma as any)[modelName].findUnique({
      where: { id: entityId },
    });
  }

  /**
   * الحصول على تغييرات الكيان
   */
  private async getEntityChanges(
    entity: string,
    branchId: string | undefined,
    lastSyncTime?: Date,
  ): Promise<SyncChange[]> {
    const modelName = this.getModelName(entity);
    const where: any = {};

    if (lastSyncTime) {
      where.updatedAt = {
        gt: lastSyncTime,
      };
    }

    // إضافة فلاتر حسب الكيان
    switch (entity) {
      case 'SalesInvoice':
      case 'StockItem':
        if (branchId) where.branchId = branchId;
        break;
      case 'Product':
      case 'ProductVariant':
      case 'Category':
        // منتجات عامة
        break;
      case 'Customer':
        // عملاء عامون
        break;
    }

    const records = await (this.prisma as any)[modelName].findMany({
      where,
      orderBy: { updatedAt: 'asc' },
    });

    return records.map((record: any) => ({
      id: `sync_${entity}_${record.id}`,
      entity,
      operation: 'update', // افتراضياً update، يمكن تحسين هذا
      data: record,
      timestamp: record.updatedAt || record.createdAt,
      version: record.updatedAt?.getTime() || record.createdAt?.getTime() || Date.now(),
    }));
  }

  /**
   * كشف تعارض البيانات
   */
  private detectDataConflict(localData: any, remoteData: any): boolean {
    // مقارنة الحقول المهمة
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

  /**
   * الحصول على اسم النموذج
   */
  private getModelName(entity: string): string {
    const modelMap: Record<string, string> = {
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

  /**
   * حساب متوسط وقت المزامنة
   */
  private calculateAverageSyncTime(batches: any[]): number {
    const completedBatches = batches.filter(b => b.completedAt && b.startedAt);

    if (completedBatches.length === 0) return 0;

    const totalTime = completedBatches.reduce((sum, batch) => {
      return sum + (batch.completedAt.getTime() - batch.startedAt.getTime());
    }, 0);

    return totalTime / completedBatches.length;
  }

  /**
   * إنشاء جلسة عمل offline
   */
  async createOfflineSession(
    deviceId: string,
    userId: string,
    branchId?: string,
    capabilities?: string[],
  ): Promise<OfflineSession> {
    return this.offlineService.createOfflineSession(deviceId, userId, branchId, capabilities);
  }

  /**
   * إنهاء جلسة offline
   */
  async endOfflineSession(sessionId: string): Promise<void> {
    return this.offlineService.endOfflineSession(sessionId);
  }

  /**
   * التحقق من صحة جلسة offline
   */
  async validateOfflineSession(sessionId: string): Promise<boolean> {
    return this.offlineService.validateOfflineSession(sessionId);
  }

  /**
   * إنشاء حزمة بيانات للعمل offline
   */
  async createOfflineDataPackage(
    sessionId: string,
    entities?: string[],
  ): Promise<OfflineDataPackage> {
    return this.offlineService.createOfflineDataPackage(sessionId, entities);
  }

  /**
   * حفظ التغييرات من وضع offline
   */
  async saveOfflineChanges(
    sessionId: string,
    changes: Array<{
      entity: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      localId?: string;
    }>,
  ): Promise<{
    sessionId: string;
    savedChanges: number;
    conflicts: number;
    errors: string[];
  }> {
    return this.offlineService.saveOfflineChanges(sessionId, changes);
  }

  /**
   * جلب جلسات الجهاز
   */
  async getDeviceOfflineSessions(deviceId: string): Promise<OfflineSession[]> {
    return this.offlineService.getDeviceSessions(deviceId);
  }

  /**
   * إحصائيات وضع offline
   */
  async getOfflineStats(): Promise<{
    activeSessions: number;
    totalSessions: number;
    expiredSessions: number;
    averageSessionDuration: number;
    mostActiveDevices: Array<{ deviceId: string; sessionCount: number }>;
  }> {
    return this.offlineService.getOfflineStats();
  }

  /**
   * تنظيف الجلسات المنتهية الصلاحية
   */
  async cleanupExpiredOfflineSessions(): Promise<number> {
    return this.offlineService.cleanupExpiredSessions();
  }

  /**
   * إبطال كاش المزامنة
   */
  private async invalidateSyncCache(): Promise<void> {
    const syncKeys = await this.cacheService.getKeys(`${this.syncCacheKey}:*`);
    for (const key of syncKeys) {
      await this.cacheService.delete(key);
    }
  }
}
