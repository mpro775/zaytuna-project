import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface LocalEntity {
  id: string;
  data: any;
  lastModified: number;
  version: number;
}

interface ZaytunaDB extends DBSchema {
  syncOperations: {
    key: string;
    value: SyncOperation;
    indexes: { 'by-status': string; 'by-entity': string };
  };
  sales: {
    key: string;
    value: LocalEntity;
    indexes: { 'by-modified': number };
  };
  inventory: {
    key: string;
    value: LocalEntity;
    indexes: { 'by-modified': number };
  };
  customers: {
    key: string;
    value: LocalEntity;
    indexes: { 'by-modified': number };
  };
  products: {
    key: string;
    value: LocalEntity;
    indexes: { 'by-modified': number };
  };
  syncMetadata: {
    key: string;
    value: { lastSync: number; version: number };
  };
}

export class IndexedDBService {
  private db: IDBPDatabase<ZaytunaDB> | null = null;
  private readonly dbName = 'ZaytunaSyncDB';
  private readonly version = 1;

  async initialize(): Promise<void> {
    try {
      this.db = await openDB<ZaytunaDB>(this.dbName, this.version, {
        upgrade(db, _oldVersion, _newVersion) {
          // إنشاء stores للعمليات المزامنة
          if (!db.objectStoreNames.contains('syncOperations')) {
            const syncStore = db.createObjectStore('syncOperations', { keyPath: 'id' });
            syncStore.createIndex('by-status', 'status');
            syncStore.createIndex('by-entity', 'entity');
          }

          // إنشاء stores للبيانات المحلية
          const entities: Array<keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>> = ['sales', 'inventory', 'customers', 'products'];
          entities.forEach(entity => {
            if (!db.objectStoreNames.contains(entity)) {
              const store = db.createObjectStore(entity, { keyPath: 'id' });
              store.createIndex('by-modified', 'lastModified');
            }
          });

          // إنشاء store للبيانات الوصفية للمزامنة
          if (!db.objectStoreNames.contains('syncMetadata')) {
            db.createObjectStore('syncMetadata');
          }
        },
        blocked() {
          console.warn('IndexedDB blocked - another tab has the database open');
        },
        blocking() {
          console.warn('IndexedDB blocking - close other tabs');
        },
        terminated() {
          console.error('IndexedDB terminated unexpectedly');
        }
      });

      console.log('IndexedDB initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  }

  // إدارة العمليات المزامنة
  async saveSyncOperation(operation: SyncOperation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put('syncOperations', operation);
    } catch (error) {
      console.error('Failed to save sync operation:', error);
      throw error;
    }
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const operations = await this.db.getAllFromIndex('syncOperations', 'by-status', 'pending');
      return operations.sort((a, b) => a.timestamp - b.timestamp); // ترتيب زمني
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      throw error;
    }
  }

  async updateSyncOperationStatus(id: string, status: SyncOperation['status'], retryCount?: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const operation = await this.db.get('syncOperations', id);
      if (operation) {
        operation.status = status;
        if (retryCount !== undefined) {
          operation.retryCount = retryCount;
        }
        await this.db.put('syncOperations', operation);
      }
    } catch (error) {
      console.error('Failed to update sync operation status:', error);
      throw error;
    }
  }

  async deleteSyncOperation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.delete('syncOperations', id);
    } catch (error) {
      console.error('Failed to delete sync operation:', error);
      throw error;
    }
  }

  async clearCompletedSyncOperations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const operations = await this.db.getAllFromIndex('syncOperations', 'by-status', 'completed');
      await Promise.all(operations.map(op => this.db!.delete('syncOperations', op.id)));
    } catch (error) {
      console.error('Failed to clear completed operations:', error);
      throw error;
    }
  }

  // إدارة البيانات المحلية
  async saveEntity(entityName: keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>, entity: LocalEntity): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put(entityName, entity);
    } catch (error) {
      console.error(`Failed to save ${entityName} entity:`, error);
      throw error;
    }
  }

  async getEntity(entityName: keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>, id: string): Promise<LocalEntity | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      return await this.db.get(entityName, id);
    } catch (error) {
      console.error(`Failed to get ${entityName} entity:`, error);
      throw error;
    }
  }

  async getAllEntities(entityName: keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>): Promise<LocalEntity[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const entities = await this.db.getAll(entityName);
      return entities.sort((a, b) => b.lastModified - a.lastModified); // الأحدث أولاً
    } catch (error) {
      console.error(`Failed to get all ${entityName} entities:`, error);
      throw error;
    }
  }

  async deleteEntity(entityName: keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.delete(entityName, id);
    } catch (error) {
      console.error(`Failed to delete ${entityName} entity:`, error);
      throw error;
    }
  }

  async updateEntities(data: { [entityName: string]: any[] }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const entityNames = Object.keys(data) as Array<keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>>;
      const transaction = this.db.transaction(entityNames, 'readwrite');

      Object.entries(data).forEach(([entityName, entities]) => {
        const store = transaction.objectStore(entityName as keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>);
        entities.forEach(entity => {
          store.put(entity);
        });
      });
    } catch (error) {
      console.error('Failed to update entities:', error);
      throw error;
    }
  }

  // إدارة البيانات الوصفية للمزامنة
  async setLastSync(entityName: string, timestamp: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.put('syncMetadata', { lastSync: timestamp, version: 1 }, entityName);
    } catch (error) {
      console.error('Failed to set last sync:', error);
      throw error;
    }
  }

  async getLastSync(entityName: string): Promise<number | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const metadata = await this.db.get('syncMetadata', entityName);
      return metadata?.lastSync || null;
    } catch (error) {
      console.error('Failed to get last sync:', error);
      throw error;
    }
  }

  // تنظيف البيانات القديمة
  async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> { // 30 يوم افتراضياً
    if (!this.db) throw new Error('Database not initialized');

    try {
      const cutoffTime = Date.now() - maxAge;
      const entities: (keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>)[] = ['sales', 'inventory', 'customers', 'products'];

      for (const entityName of entities) {
        const oldEntities = await this.db.getAllFromIndex(entityName, 'by-modified', IDBKeyRange.upperBound(cutoffTime));
        await Promise.all(oldEntities.map(entity => this.db!.delete(entityName, entity.id)));
      }

      console.log('Old data cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      throw error;
    }
  }

  // إحصائيات قاعدة البيانات
  async getStats(): Promise<{
    operations: { pending: number; completed: number; failed: number };
    entities: Record<string, number>;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const operations = await this.db.getAll('syncOperations');
      const entities = ['sales', 'inventory', 'customers', 'products'];

      const entityCounts: Record<string, number> = {};
      for (const entity of entities) {
        const count = await this.db.count(entity as keyof Pick<ZaytunaDB, 'sales' | 'inventory' | 'customers' | 'products'>);
        entityCounts[entity] = count;
      }

      return {
        operations: {
          pending: operations.filter(op => op.status === 'pending').length,
          completed: operations.filter(op => op.status === 'completed').length,
          failed: operations.filter(op => op.status === 'failed').length
        },
        entities: entityCounts
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  // إغلاق قاعدة البيانات
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
