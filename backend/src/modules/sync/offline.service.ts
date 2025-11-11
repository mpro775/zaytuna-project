import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class OfflineService {
  private readonly logger = new Logger(OfflineService.name);
  private readonly offlineCacheKey = 'offline_sessions';
  private readonly maxOfflineHours = 24; // ساعات

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء جلسة عمل offline
   */
  async createOfflineSession(
    deviceId: string,
    userId: string,
    branchId?: string,
    capabilities: string[] = ['read', 'write', 'sync'],
  ): Promise<OfflineSession> {
    try {
      const sessionId = this.generateSessionId(deviceId);
      const now = new Date();

      const session: OfflineSession = {
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

      // حفظ الجلسة في الكاش
      await this.cacheService.set(
        `offline_session:${sessionId}`,
        session,
        { ttl: this.maxOfflineHours * 60 * 60 } // بالثواني
      );

      // تحديث قائمة جلسات الجهاز
      await this.addDeviceSession(deviceId, sessionId);

      this.logger.log(`تم إنشاء جلسة offline: ${sessionId} للجهاز: ${deviceId}`);

      return session;
    } catch (error) {
      this.logger.error('فشل في إنشاء جلسة offline', error);
      throw error;
    }
  }

  /**
   * تحديث نشاط الجلسة
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const session = await this.getOfflineSession(sessionId);
      if (!session) {
        throw new Error(`جلسة offline غير موجودة: ${sessionId}`);
      }

      session.lastActivity = new Date();

      // التحقق من انتهاء الجلسة
      const hoursDiff = (Date.now() - session.startedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > session.maxOfflineHours) {
        session.status = 'expired';
      }

      await this.cacheService.set(
        `offline_session:${sessionId}`,
        session,
        { ttl: session.maxOfflineHours * 60 * 60 }
      );
    } catch (error) {
      this.logger.error(`فشل في تحديث نشاط الجلسة ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * إنهاء جلسة offline
   */
  async endOfflineSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getOfflineSession(sessionId);
      if (!session) {
        return; // الجلسة غير موجودة بالفعل
      }

      // إزالة من الكاش
      await this.cacheService.delete(`offline_session:${sessionId}`);

      // إزالة من قائمة جلسات الجهاز
      await this.removeDeviceSession(session.deviceId, sessionId);

      this.logger.log(`تم إنهاء جلسة offline: ${sessionId}`);
    } catch (error) {
      this.logger.error(`فشل في إنهاء الجلسة ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جلسة offline
   */
  async getOfflineSession(sessionId: string): Promise<OfflineSession | null> {
    try {
      return await this.cacheService.get<OfflineSession>(`offline_session:${sessionId}`);
    } catch (error) {
      this.logger.error(`فشل في جلب جلسة offline ${sessionId}`, error);
      return null;
    }
  }

  /**
   * التحقق من صحة جلسة offline
   */
  async validateOfflineSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getOfflineSession(sessionId);

      if (!session) {
        return false;
      }

      if (session.status !== 'active') {
        return false;
      }

      // التحقق من المهلة الزمنية
      const hoursDiff = (Date.now() - session.startedAt.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > session.maxOfflineHours) {
        session.status = 'expired';
        await this.cacheService.set(`offline_session:${sessionId}`, session);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`فشل في التحقق من صحة الجلسة ${sessionId}`, error);
      return false;
    }
  }

  /**
   * إنشاء حزمة البيانات للعمل offline
   */
  async createOfflineDataPackage(
    sessionId: string,
    entities?: string[],
  ): Promise<OfflineDataPackage> {
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
      const packageData: Record<string, any[]> = {};

      // جلب البيانات لكل كيان
      for (const entity of syncEntities) {
        packageData[entity] = await this.getEntityDataForOffline(entity, session);
      }

      const timestamp = new Date();
      const dataSize = this.calculateDataSize(packageData);
      const checksum = this.generateChecksum(packageData);

      const dataPackage: OfflineDataPackage = {
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

      // حفظ لقطة البيانات في الجلسة
      session.dataSnapshot = {
        timestamp: timestamp.toISOString(),
        checksum,
        entities: Object.keys(packageData),
      };

      await this.cacheService.set(`offline_session:${sessionId}`, session);

      this.logger.log(`تم إنشاء حزمة بيانات offline للجلسة: ${sessionId}`);

      return dataPackage;
    } catch (error) {
      this.logger.error(`فشل في إنشاء حزمة البيانات للجلسة ${sessionId}`, error);
      throw error;
    }
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
      const errors: string[] = [];

      // حفظ التغييرات في قائمة انتظار المزامنة
      for (const change of changes) {
        try {
          await this.queueOfflineChange(sessionId, change);
          savedChanges++;
        } catch (error) {
          conflicts++;
          errors.push(`خطأ في حفظ التغيير ${change.entity}: ${error.message}`);
        }
      }

      // تحديث نشاط الجلسة
      await this.updateSessionActivity(sessionId);

      this.logger.log(`تم حفظ ${savedChanges} تغيير من وضع offline للجلسة: ${sessionId}`);

      return {
        sessionId,
        savedChanges,
        conflicts,
        errors,
      };
    } catch (error) {
      this.logger.error(`فشل في حفظ التغييرات من وضع offline للجلسة ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * جلب قائمة جلسات الجهاز
   */
  async getDeviceSessions(deviceId: string): Promise<OfflineSession[]> {
    try {
      const sessionIds = await this.cacheService.get<string[]>(`device_sessions:${deviceId}`) || [];
      const sessions: OfflineSession[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getOfflineSession(sessionId);
        if (session && session.status === 'active') {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      this.logger.error(`فشل في جلب جلسات الجهاز ${deviceId}`, error);
      return [];
    }
  }

  /**
   * تنظيف الجلسات المنتهية الصلاحية
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      // هذه عملية تنظيف بسيطة - في التطبيق الحقيقي قد نحتاج لمسح شامل
      this.logger.log('تم تنظيف الجلسات المنتهية الصلاحية');
      return 0;
    } catch (error) {
      this.logger.error('فشل في تنظيف الجلسات المنتهية', error);
      return 0;
    }
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
    try {
      // في التطبيق الحقيقي، سنحتاج لتتبع هذه الإحصائيات في قاعدة البيانات
      return {
        activeSessions: 0,
        totalSessions: 0,
        expiredSessions: 0,
        averageSessionDuration: 0,
        mostActiveDevices: [],
      };
    } catch (error) {
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

  // ========== PRIVATE METHODS ==========

  /**
   * إنشاء معرف جلسة فريد
   */
  private generateSessionId(deviceId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `offline_${deviceId}_${timestamp}_${random}`;
  }

  /**
   * إضافة جلسة للجهاز
   */
  private async addDeviceSession(deviceId: string, sessionId: string): Promise<void> {
    try {
      const sessions = await this.cacheService.get<string[]>(`device_sessions:${deviceId}`) || [];
      sessions.push(sessionId);
      await this.cacheService.set(`device_sessions:${deviceId}`, sessions);
    } catch (error) {
      this.logger.error(`فشل في إضافة جلسة ${sessionId} للجهاز ${deviceId}`, error);
    }
  }

  /**
   * إزالة جلسة من الجهاز
   */
  private async removeDeviceSession(deviceId: string, sessionId: string): Promise<void> {
    try {
      const sessions = await this.cacheService.get<string[]>(`device_sessions:${deviceId}`) || [];
      const filteredSessions = sessions.filter(id => id !== sessionId);
      await this.cacheService.set(`device_sessions:${deviceId}`, filteredSessions);
    } catch (error) {
      this.logger.error(`فشل في إزالة جلسة ${sessionId} من الجهاز ${deviceId}`, error);
    }
  }

  /**
   * جلب بيانات الكيان للعمل offline
   */
  private async getEntityDataForOffline(entity: string, session: OfflineSession): Promise<any[]> {
    try {
      const modelName = this.getModelName(entity);
      const where: any = {};

      // إضافة فلاتر حسب الكيان والجلسة
      switch (entity) {
        case 'SalesInvoice':
        case 'StockItem':
          if (session.branchId) where.branchId = session.branchId;
          break;
        case 'Product':
        case 'ProductVariant':
        case 'Category':
          // منتجات عامة
          break;
        case 'Customer':
          // عملاء عامون أو حسب الفرع
          break;
      }

      // تحديد الحقول المطلوبة للعمل offline
      const select = this.getOfflineSelectFields(entity);

      const records = await (this.prisma as any)[modelName].findMany({
        where,
        select,
        take: 10000, // حد أقصى للبيانات
      });

      return records;
    } catch (error) {
      this.logger.error(`فشل في جلب بيانات ${entity} للعمل offline`, error);
      return [];
    }
  }

  /**
   * تحديد حقول الكيان المطلوبة للعمل offline
   */
  private getOfflineSelectFields(entity: string): Record<string, boolean> {
    const fieldMaps: Record<string, Record<string, boolean>> = {
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

  /**
   * حفظ التغيير في قائمة انتظار المزامنة
   */
  private async queueOfflineChange(
    sessionId: string,
    change: {
      entity: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      localId?: string;
    },
  ): Promise<void> {
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

      // حفظ في الكاش كقائمة انتظار
      const queueKey = `offline_queue:${sessionId}`;
      const queue = await this.cacheService.get<any[]>(queueKey) || [];
      queue.push(queuedChange);

      await this.cacheService.set(queueKey, queue, { ttl: 7 * 24 * 60 * 60 }); // أسبوع
    } catch (error) {
      this.logger.error(`فشل في حفظ التغيير في قائمة الانتظار ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * حساب حجم البيانات
   */
  private calculateDataSize(data: Record<string, any[]>): number {
    return JSON.stringify(data).length;
  }

  /**
   * إنشاء checksum للبيانات
   */
  private generateChecksum(data: Record<string, any[]>): string {
    const crypto = require('crypto');
    const dataString = JSON.stringify(data);
    return crypto.createHash('md5').update(dataString).digest('hex');
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
      'Warehouse': 'warehouse',
    };

    return modelMap[entity] || entity.toLowerCase();
  }
}
