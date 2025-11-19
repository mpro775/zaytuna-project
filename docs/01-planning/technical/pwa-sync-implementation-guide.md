# دليل تنفيذ PWA مع المزامنة - مشروع زيتونة

## نظرة عامة
هذا الدليل يوضح كيفية تنفيذ Progressive Web App متقدم مع نظام مزامنة كامل مع الباك إند لمشروع لوحة تحكم زيتونة SaaS.

## البنية المقترحة للفرونت إند

### 1. هيكل المجلدات
```
src/
├── services/
│   ├── sync/
│   │   ├── SyncService.ts          # خدمة المزامنة الرئيسية
│   │   ├── OfflineQueue.ts         # نظام الـ Queue للعمليات المؤجلة
│   │   ├── IndexedDBService.ts     # إدارة IndexedDB
│   │   └── ConflictResolver.ts     # حل تضارب البيانات
│   ├── notifications/
│   │   ├── NotificationService.ts  # خدمة الإشعارات
│   │   └── PushManager.ts          # إدارة Push Notifications
│   └── api/
│       └── SyncAPI.ts              # API calls للمزامنة
├── stores/
│   ├── syncStore.ts                # Zustand store للمزامنة
│   └── notificationStore.ts        # Zustand store للإشعارات
├── components/
│   ├── sync/
│   │   ├── SyncStatusIndicator.tsx # مؤشر حالة المزامنة
│   │   ├── OfflineBanner.tsx       # بانر وضع offline
│   │   └── ConflictDialog.tsx      # حوار حل التضارب
│   └── notifications/
│       ├── NotificationList.tsx    # قائمة الإشعارات
│       └── NotificationSettings.tsx # إعدادات الإشعارات
├── hooks/
│   ├── useSync.ts                  # Hook للمزامنة
│   ├── useOfflineQueue.ts          # Hook للـ Queue
│   └── useNetworkStatus.ts         # Hook لحالة الشبكة
└── utils/
    ├── serviceWorker.ts            # مساعدات Service Worker
    ├── indexedDB.ts                # مساعدات IndexedDB
    └── syncUtils.ts                # مساعدات المزامنة
```

### 2. أنواع TypeScript الأساسية

```typescript
// src/types/sync.ts
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

export interface SyncQueue {
  operations: SyncOperation[];
  lastSyncTimestamp: number;
  deviceId: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingOperations: number;
  conflicts: Conflict[];
}

export interface Conflict {
  id: string;
  entity: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merge';
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  deviceId: string;
}
```

## تنفيذ الخدمات الأساسية

### 1. SyncService - خدمة المزامنة الرئيسية

```typescript
// src/services/sync/SyncService.ts
import { SyncAPI } from '../api/SyncAPI';
import { OfflineQueue } from './OfflineQueue';
import { IndexedDBService } from './IndexedDBService';
import { ConflictResolver } from './ConflictResolver';

export class SyncService {
  private api: SyncAPI;
  private queue: OfflineQueue;
  private db: IndexedDBService;
  private conflictResolver: ConflictResolver;

  constructor() {
    this.api = new SyncAPI();
    this.queue = new OfflineQueue();
    this.db = new IndexedDBService();
    this.conflictResolver = new ConflictResolver();
  }

  async initialize(): Promise<void> {
    await this.db.initialize();
    await this.queue.loadFromStorage();
    this.startBackgroundSync();
  }

  async syncData(): Promise<void> {
    if (!navigator.onLine) return;

    const operations = await this.queue.getPendingOperations();
    if (operations.length === 0) return;

    try {
      // إرسال العمليات المعلقة للخادم
      const result = await this.api.syncOperations(operations);

      // التحقق من التضارب
      if (result.conflicts?.length > 0) {
        await this.conflictResolver.handleConflicts(result.conflicts);
      }

      // تحديث البيانات المحلية
      await this.updateLocalData(result.serverData);

      // تحديث حالة العمليات
      await this.queue.markOperationsCompleted(operations.map(op => op.id));

    } catch (error) {
      console.error('Sync failed:', error);
      // إعادة المحاولة لاحقاً
      this.scheduleRetry();
    }
  }

  private startBackgroundSync(): void {
    // مزامنة كل 5 دقائق عند الاتصال
    setInterval(() => {
      if (navigator.onLine) {
        this.syncData();
      }
    }, 5 * 60 * 1000);

    // مزامنة عند عودة الاتصال
    window.addEventListener('online', () => {
      this.syncData();
    });
  }

  private async updateLocalData(serverData: any): Promise<void> {
    // تحديث البيانات المحلية من الخادم
    await this.db.updateEntities(serverData);
  }

  private scheduleRetry(): void {
    // إعادة المحاولة مع exponential backoff
    setTimeout(() => {
      this.syncData();
    }, Math.min(1000 * Math.pow(2, this.retryCount), 30000));
  }
}
```

### 2. OfflineQueue - نظام الـ Queue

```typescript
// src/services/sync/OfflineQueue.ts
import { SyncOperation } from '../../types/sync';
import { IndexedDBService } from './IndexedDBService';

export class OfflineQueue {
  private db: IndexedDBService;
  private operations: SyncOperation[] = [];

  constructor() {
    this.db = new IndexedDBService();
  }

  async addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    const newOperation: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    this.operations.push(newOperation);
    await this.saveToStorage();

    // محاولة فورية للمزامنة إذا كان متصلاً
    if (navigator.onLine) {
      // تشغيل المزامنة
    }
  }

  async getPendingOperations(): Promise<SyncOperation[]> {
    return this.operations.filter(op => op.status === 'pending');
  }

  async markOperationsCompleted(operationIds: string[]): Promise<void> {
    this.operations = this.operations.filter(op => !operationIds.includes(op.id));
    await this.saveToStorage();
  }

  async loadFromStorage(): Promise<void> {
    this.operations = await this.db.getAllOperations();
  }

  private async saveToStorage(): Promise<void> {
    await this.db.saveOperations(this.operations);
  }
}
```

### 3. IndexedDBService - إدارة البيانات المحلية

```typescript
// src/services/sync/IndexedDBService.ts
export class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ZaytunaSyncDB';
  private readonly version = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // إنشاء stores للبيانات المختلفة
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
      };
    });
  }

  async saveOperations(operations: SyncOperation[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');

    operations.forEach(operation => {
      store.put(operation);
    });
  }

  async getAllOperations(): Promise<SyncOperation[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateEntities(data: { [entityName: string]: any[] }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(Object.keys(data), 'readwrite');

    Object.entries(data).forEach(([entityName, entities]) => {
      const store = transaction.objectStore(entityName);
      entities.forEach(entity => {
        store.put(entity);
      });
    });
  }
}
```

## Service Worker المتقدم

```javascript
// public/sw.js
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { backgroundSync } = workbox.backgroundSync;

// إعداد Background Sync
const syncQueue = new backgroundSync.Queue('syncQueue', {
  maxRetentionTime: 24 * 60, // 24 ساعات
  onSync: async ({queue}) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request);
      } catch (error) {
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// Cache strategies
registerRoute(
  ({request}) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'documents',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10 }),
    ],
  })
);

registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 أيام
      }),
    ],
  })
);

// API routes - Network First للبيانات الحديثة
registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100 }),
    ],
  })
);

// Background sync للـ POST/PUT/DELETE
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request.clone()).catch(() => {
        return syncQueue.pushRequest({request: event.request});
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.url,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
```

## إعداد الباك إند

### 1. NotificationModule

```typescript
// src/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema }
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}
```

### 2. SyncModule

```typescript
// src/modules/sync/sync.module.ts
import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncGateway } from './sync.gateway';

@Module({
  controllers: [SyncController],
  providers: [SyncService, SyncGateway],
  exports: [SyncService]
})
export class SyncModule {}
```

## الاختبار والجودة

### 1. اختبار PWA
```typescript
// tests/pwa-sync.spec.ts
describe('PWA Sync Functionality', () => {
  it('should cache API responses offline', async () => {
    // اختبار التخزين المؤقت
  });

  it('should queue operations when offline', async () => {
    // اختبار الـ Queue
  });

  it('should sync data when online', async () => {
    // اختبار المزامنة
  });

  it('should handle conflicts properly', async () => {
    // اختبار حل التضارب
  });
});
```

### 2. Lighthouse Score
- **Performance**: ≥ 90
- **PWA**: ≥ 90
- **Accessibility**: ≥ 85
- **Best Practices**: ≥ 90
- **SEO**: ≥ 85

## الأمان والخصوصية

### 1. تشفير البيانات
- تشفير البيانات الحساسة محلياً باستخدام Web Crypto API
- عدم تخزين كلمات المرور أو tokens في IndexedDB

### 2. إدارة الصلاحيات
- طلب إذن الإشعارات من المستخدم
- التحقق من صحة الـ Service Worker
- إدارة أمان الـ WebSocket connections

هذا الدليل يوفر أساساً متيناً لتنفيذ PWA متقدم مع مزامنة كاملة. يجب تخصيصه حسب احتياجات المشروع المحددة.
