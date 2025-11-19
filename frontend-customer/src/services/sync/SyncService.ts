import { IndexedDBService, type SyncOperation, type LocalEntity } from './IndexedDBService';
import { OfflineQueue } from './OfflineQueue';
import { ConflictResolver } from './ConflictResolver';
import { pwaService } from './PWAService';
import type { SyncChange, SyncResult, DeviceConfig } from './types';
import axios from '../../services/api/axios';

export class SyncService {
  private db: IndexedDBService;
  private queue: OfflineQueue;
  private conflictResolver: ConflictResolver;
  private deviceId: string;
  private deviceConfig: DeviceConfig | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private lastSyncTime: Date | null = null;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
    this.db = new IndexedDBService();
    this.queue = new OfflineQueue(this.db);
    this.conflictResolver = new ConflictResolver();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.db.initialize();
    await this.registerDevice();
    await this.loadDeviceConfig();
    this.setupNetworkListeners();
    this.startPeriodicSync();
  }

  // تسجيل الجهاز في الخادم
  private async registerDevice(): Promise<void> {
    try {
      const response = await axios.post('/sync/device/register', {
        deviceId: this.deviceId,
        deviceName: navigator.userAgent,
        deviceType: this.getDeviceType(),
        capabilities: ['sync', 'offline', 'push'],
      });

      console.log('Device registered:', response.data);
    } catch (error) {
      console.warn('Failed to register device, continuing offline:', error);
    }
  }

  // تحميل إعدادات الجهاز
  private async loadDeviceConfig(): Promise<void> {
    try {
      const response = await axios.get(`/sync/device/${this.deviceId}/config`);
      this.deviceConfig = response.data;
      console.log('Device config loaded:', this.deviceConfig);
    } catch (error) {
      console.warn('Failed to load device config, using defaults:', error);
      // استخدام إعدادات افتراضية
      this.deviceConfig = {
        deviceId: this.deviceId,
        syncEnabled: true,
        syncInterval: 15, // كل 15 دقيقة
        maxBatchSize: 100,
        supportedEntities: ['Product', 'ProductVariant', 'Customer', 'SalesInvoice', 'Payment'],
        offlineTimeout: 24, // 24 ساعة
      };
    }
  }

  // إعداد مستمعي الشبكة
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.performSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // مراقبة تغييرات PWA Service
    pwaService.onNetworkChange((status) => {
      this.isOnline = status.isOnline;
      if (this.isOnline) {
        this.performSync();
      }
    });
  }

  // بدء المزامنة الدورية
  private startPeriodicSync(): void {
    if (!this.deviceConfig?.syncEnabled) return;

    const interval = (this.deviceConfig.syncInterval || 15) * 60 * 1000; // بالمللي ثانية

    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.performSync();
      }
    }, interval);
  }

  // أداء المزامنة الرئيسية
  async performSync(): Promise<SyncResult> {
    if (!this.isOnline || this.syncInProgress || !this.deviceConfig?.syncEnabled) {
      return {
        success: false,
        changesUploaded: 0,
        changesDownloaded: 0,
        conflicts: 0,
        errors: ['Sync not available'],
        lastSyncTime: this.lastSyncTime || new Date(),
      };
    }

    this.syncInProgress = true;

    try {
      console.log('Starting sync...');

      // جلب العمليات المعلقة
      const pendingOperations = await this.queue.getPendingOperations();
      console.log(`Found ${pendingOperations.length} pending operations`);

      // تحويل العمليات إلى sync changes
      const uploadChanges = pendingOperations.map(op => ({
        entity: op.entity,
        operation: op.type.toLowerCase() as 'create' | 'update' | 'delete',
        id: op.entityId,
        data: op.data,
        timestamp: new Date(op.timestamp),
        version: 1,
      }));

      // إجراء المزامنة ثنائية الاتجاه
      const response = await axios.post('/sync/bidirectional', {
        deviceId: this.deviceId,
        uploadChanges,
        lastSyncTime: this.lastSyncTime?.toISOString(),
        entities: this.deviceConfig.supportedEntities,
      });

      const { uploadBatchId, downloadChanges, timestamp } = response.data;

      console.log(`Sync completed: uploaded ${uploadChanges.length}, downloaded ${downloadChanges.length}`);

      // معالجة البيانات المُحمّلة
      await this.processDownloadedChanges(downloadChanges);

      // تحديث العمليات المُرفوعة كمكتملة
      if (uploadBatchId) {
        await this.queue.markOperationsCompleted(pendingOperations.map(op => op.id));
      }

      // حفظ وقت آخر مزامنة
      this.lastSyncTime = new Date(timestamp);

      return {
        success: true,
        changesUploaded: uploadChanges.length,
        changesDownloaded: downloadChanges.length,
        conflicts: 0, // سيتم تنفيذ معالجة التعارض لاحقاً
        errors: [],
        lastSyncTime: this.lastSyncTime,
      };

    } catch (error: any) {
      console.error('Sync failed:', error);

      return {
        success: false,
        changesUploaded: 0,
        changesDownloaded: 0,
        conflicts: 0,
        errors: [error.message || 'Sync failed'],
        lastSyncTime: this.lastSyncTime || new Date(),
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // معالجة البيانات المُحمّلة
  private async processDownloadedChanges(changes: SyncChange[]): Promise<void> {
    for (const change of changes) {
      const entityName = change.entity.toLowerCase() + 's' as keyof Pick<any, 'sales' | 'inventory' | 'customers' | 'products'>;

      const localEntity: LocalEntity = {
        id: change.id,
        data: change.data,
        lastModified: change.timestamp.getTime(),
        version: change.version || 1,
      };

      try {
        if (change.operation === 'delete') {
          await this.db.deleteEntity(entityName, change.id);
        } else {
          await this.db.saveEntity(entityName, localEntity);
        }
      } catch (error) {
        console.error(`Failed to process change for ${change.entity}:${change.id}`, error);
      }
    }
  }

  // إضافة عملية للمزامنة
  async addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    await this.queue.addOperation(operation);

    // محاولة فورية للمزامنة إذا كان متصلاً
    if (this.isOnline && !this.syncInProgress) {
      setTimeout(() => this.performSync(), 1000); // تأخير قليل
    }
  }

  // مزامنة يدوية
  async syncNow(): Promise<SyncResult> {
    return this.performSync();
  }

  // الحصول على إحصائيات المزامنة
  async getSyncStats(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    pendingOperations: number;
    deviceConfig: DeviceConfig | null;
  }> {
    const pendingOperations = await this.queue.getPendingOperations();

    return {
      isOnline: this.isOnline,
      isSyncing: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: pendingOperations.length,
      deviceConfig: this.deviceConfig,
    };
  }

  // تحديث إعدادات الجهاز
  async updateDeviceConfig(config: Partial<DeviceConfig>): Promise<void> {
    if (!this.deviceConfig) return;

    try {
      await axios.put(`/sync/device/${this.deviceId}/config`, config);
      await this.loadDeviceConfig(); // إعادة تحميل الإعدادات
    } catch (error) {
      console.error('Failed to update device config:', error);
    }
  }

  // إنشاء جلسة offline
  async createOfflineSession(userId: string, branchId?: string): Promise<string> {
    try {
      const response = await axios.post('/sync/offline/session', {
        deviceId: this.deviceId,
        userId,
        branchId,
        capabilities: ['sync', 'offline'],
      });

      return response.data.sessionId;
    } catch (error) {
      console.error('Failed to create offline session:', error);
      throw error;
    }
  }

  // حفظ التغييرات من وضع offline
  async saveOfflineChanges(sessionId: string, changes: any[]): Promise<void> {
    try {
      await axios.post(`/sync/offline/changes/${sessionId}`, { changes });
    } catch (error) {
      console.error('Failed to save offline changes:', error);
      throw error;
    }
  }

  // إنهاء جلسة offline
  async endOfflineSession(sessionId: string): Promise<void> {
    try {
      await axios.delete(`/sync/offline/session/${sessionId}`);
    } catch (error) {
      console.error('Failed to end offline session:', error);
    }
  }

  // مساعد: تحديد نوع الجهاز
  private getDeviceType(): string {
    const ua = navigator.userAgent;

    if (/Android/i.test(ua)) return 'Android';
    if (/iPad|iPhone|iPod/i.test(ua)) return 'iOS';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'MacOS';
    if (/Linux/i.test(ua)) return 'Linux';

    return 'Unknown';
  }
}
