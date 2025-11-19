import { IndexedDBService, type SyncOperation } from './IndexedDBService';
import type { QueueItem } from './types';

export class OfflineQueue {
  private db: IndexedDBService;
  private queue: QueueItem[] = [];
  private maxRetries: number = 3;
  private baseDelay: number = 1000; // 1 ثانية

  constructor(db: IndexedDBService) {
    this.db = db;
    this.loadQueueFromStorage();
  }

  // إضافة عملية للقائمة
  async addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    const queueItem: QueueItem = {
      id: crypto.randomUUID(),
      operation: {
        ...operation,
        id: operation.entity + '_' + operation.entityId + '_' + Date.now(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      },
      priority: this.getOperationPriority(operation),
      attempts: 0,
      nextAttempt: new Date(),
    };

    this.queue.push(queueItem);
    await this.saveQueueToStorage();

    console.log(`Added operation to queue: ${operation.type} ${operation.entity}:${operation.entityId}`);
  }

  // جلب العمليات المعلقة
  async getPendingOperations(): Promise<SyncOperation[]> {
    const now = new Date();

    // ترتيب حسب الأولوية ثم التوقيت
    const pendingItems = this.queue
      .filter(item => item.nextAttempt && item.nextAttempt <= now && item.attempts < this.maxRetries)
      .sort((a, b) => {
        // الأولوية العالية أولاً
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // التوقيت الأقدم أولاً
        return a.operation.timestamp - b.operation.timestamp;
      });

    return pendingItems.map(item => item.operation);
  }

  // تحديث حالة العملية
  async updateOperationStatus(operationId: string, success: boolean, error?: string): Promise<void> {
    const itemIndex = this.queue.findIndex(item => item.operation.id === operationId);

    if (itemIndex === -1) return;

    const item = this.queue[itemIndex];

    if (success) {
      // إزالة العملية الناجحة
      this.queue.splice(itemIndex, 1);
      console.log(`Operation ${operationId} completed successfully`);
    } else {
      // تحديث محاولات الفشل
      item.attempts++;
      item.lastAttempt = new Date();
      item.error = error || 'Unknown error';

      if (item.attempts >= this.maxRetries) {
        // تحديد العملية كفاشلة نهائياً
        item.operation.status = 'failed';
        console.error(`Operation ${operationId} failed permanently after ${item.attempts} attempts`);
      } else {
        // جدولة محاولة أخرى مع exponential backoff
        const delay = this.baseDelay * Math.pow(2, item.attempts - 1);
        item.nextAttempt = new Date(Date.now() + delay);
        console.warn(`Operation ${operationId} failed, retrying in ${delay}ms (attempt ${item.attempts}/${this.maxRetries})`);
      }
    }

    await this.saveQueueToStorage();
  }

  // وضع علامة على العمليات كمكتملة
  async markOperationsCompleted(operationIds: string[]): Promise<void> {
    const completedIds = new Set(operationIds);

    this.queue = this.queue.filter(item => {
      if (completedIds.has(item.operation.id)) {
        console.log(`Operation ${item.operation.id} marked as completed`);
        return false;
      }
      return true;
    });

    await this.saveQueueToStorage();
  }

  // إعادة محاولة العمليات الفاشلة
  async retryFailedOperations(): Promise<void> {
    const failedItems = this.queue.filter(item =>
      item.operation.status === 'failed' && item.attempts < this.maxRetries
    );

    for (const item of failedItems) {
      item.attempts = 0;
      item.nextAttempt = new Date();
      item.error = undefined;
      item.operation.status = 'pending';
    }

    if (failedItems.length > 0) {
      await this.saveQueueToStorage();
      console.log(`Retrying ${failedItems.length} failed operations`);
    }
  }

  // تنظيف العمليات القديمة جداً
  async cleanupOldOperations(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> { // 7 أيام
    const cutoffTime = Date.now() - maxAge;

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.operation.timestamp > cutoffTime);

    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      await this.saveQueueToStorage();
      console.log(`Cleaned up ${removedCount} old operations`);
    }
  }

  // الحصول على إحصائيات القائمة
  getQueueStats(): {
    total: number;
    pending: number;
    failed: number;
    retrying: number;
    oldestPending: Date | null;
    newestPending: Date | null;
  } {
    const pending = this.queue.filter(item => item.operation.status === 'pending');
    const failed = this.queue.filter(item => item.operation.status === 'failed');
    const retrying = this.queue.filter(item =>
      item.operation.status === 'pending' && item.attempts > 0
    );

    return {
      total: this.queue.length,
      pending: pending.length,
      failed: failed.length,
      retrying: retrying.length,
      oldestPending: pending.length > 0 ? new Date(Math.min(...pending.map(p => p.operation.timestamp))) : null,
      newestPending: pending.length > 0 ? new Date(Math.max(...pending.map(p => p.operation.timestamp))) : null,
    };
  }

  // حفظ القائمة في التخزين المحلي
  private async saveQueueToStorage(): Promise<void> {
    try {
      // حفظ كل عملية على حدة
      for (const item of this.queue) {
        await this.db.saveSyncOperation(item.operation);
      }
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  // تحميل القائمة من التخزين المحلي
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const operations = await this.db.getPendingSyncOperations();
      this.queue = operations.map(operation => ({
        id: crypto.randomUUID(),
        operation,
        priority: this.getOperationPriority(operation),
        attempts: operation.retryCount,
        nextAttempt: new Date(),
      }));
      console.log(`Loaded ${this.queue.length} operations from storage`);
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  // تحديد أولوية العملية
  private getOperationPriority(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): number {
    // عمليات الحذف لها أولوية عالية
    if (operation.type === 'DELETE') return 1;

    // عمليات الإنشاء لها أولوية متوسطة
    if (operation.type === 'CREATE') return 2;

    // عمليات التحديث لها أولوية منخفضة
    return 3;
  }
}
