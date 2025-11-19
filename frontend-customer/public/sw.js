// Service Worker لتطبيق زيتونة SaaS PWA
// يدير التخزين المؤقت و background sync

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { backgroundSync } = workbox.backgroundSync;

// إعداد Background Sync للعمليات المؤجلة
const syncQueue = new backgroundSync.Queue('syncQueue', {
  maxRetentionTime: 24 * 60, // 24 ساعة
  onSync: async ({queue}) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone());

        // إرسال إشعار نجاح المزامنة
        if (response.ok) {
          await self.registration.showNotification('تم المزامنة', {
            body: 'تم مزامنة البيانات بنجاح',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png'
          });
        }

      } catch (error) {
        console.error('Sync failed:', error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  }
});

// Cache strategies للملفات الثابتة
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
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 يوم
      }),
    ],
  })
);

// Cache للخطوط والـ CSS
registerRoute(
  ({request}) => request.destination === 'font' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // أسبوع
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
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 دقائق
      }),
    ],
  })
);

// معالجة العمليات غير الـ GET (POST, PUT, DELETE)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    event.respondWith(
      fetch(event.request.clone()).catch(() => {
        // إضافة العملية للـ queue عند الفشل
        return syncQueue.pushRequest({request: event.request}).then(() => {
          // إرجاع response ناجح مؤقتاً
          return new Response(JSON.stringify({ success: true, offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
  }
});

// معالجة Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url || '/',
    actions: data.actions || [
      {
        action: 'view',
        title: 'عرض',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'تجاهل'
      }
    ],
    requireInteraction: true,
    silent: false,
    tag: data.tag || 'default',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'إشعار جديد', options)
  );
});

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // التحقق من وجود نافذة مفتوحة
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }

      // فتح نافذة جديدة إذا لم يكن هناك أي نافذة
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// معالجة تحديث الـ Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// تثبيت الـ Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// تفعيل الـ Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');

  // تنظيف caches القديمة
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'documents' && cacheName !== 'images' && cacheName !== 'assets' && cacheName !== 'api-cache') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // اتخاذ السيطرة على جميع العملاء
  event.waitUntil(self.clients.claim());
});
