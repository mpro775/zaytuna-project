// Service Worker لتطبيق زيتونة SaaS PWA
// يدير التخزين المؤقت و background sync

let workbox;
let syncQueue = null;

// دالة للتحقق من وضع Mock
function isMockModeEnabled() {
  try {
    // في Service Worker، لا يمكن الوصول مباشرة إلى localStorage
    // نستخدم IndexedDB أو نتحقق من خلال رسالة من الصفحة الرئيسية
    // للبساطة، نتحقق من أن الطلب لا يحتوي على localhost:3000 في وضع Mock
    // أو نستخدم علامة في URL
    return false; // سنتحقق من ذلك في onSync
  } catch (error) {
    return false;
  }
}

// دالة للتحقق من أن الطلب يجب تجاهله في وضع Mock
function shouldSkipSync(request) {
  try {
    const url = new URL(request.url);
    // إذا كان الطلب إلى localhost:3000 وكان Mock مفعّل، نتجاهل المزامنة
    // نتحقق من خلال محاولة الوصول إلى localStorage عبر postMessage
    // أو ببساطة نتجاهل الأخطاء في وضع التطوير
    if (url.hostname === 'localhost' && url.port === '3000') {
      // في وضع التطوير مع Mock، نتجاهل المزامنة
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// محاولة تحميل Workbox من CDN مع معالجة الأخطاء
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');
  workbox = self.workbox;
} catch (error) {
  console.error('Failed to load Workbox from CDN:', error);
  // استخدام fallback بسيط بدون Workbox
  workbox = null;
}

// إعداد Workbox modules إذا تم تحميلها بنجاح
if (workbox) {
  const { registerRoute } = workbox.routing;
  const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  
  // Plugin مخصص لمعالجة أخطاء الخطوط
  const fontErrorHandler = {
    fetchDidFail: async ({ request, error }) => {
      console.warn('Font fetch failed, using cache or fallback:', request.url, error);
      // محاولة الحصول من الـ cache
      const cache = await caches.open('google-fonts');
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      // إرجاع null للسماح للاستراتيجية بالتعامل معه
      return null;
    },
  };

  // محاولة إعداد Background Sync
  try {
    if (workbox.backgroundSync && workbox.backgroundSync.Queue) {
      // استخدام Queue API من Workbox
      syncQueue = new workbox.backgroundSync.Queue('syncQueue', {
        maxRetentionTime: 24 * 60, // 24 ساعة
        onSync: async ({queue}) => {
          let entry;
          while ((entry = await queue.shiftRequest())) {
            try {
              // التحقق من وضع Mock - إذا كان الطلب إلى localhost:3000 في وضع التطوير، نتجاهله
              if (shouldSkipSync(entry.request)) {
                console.log('Skipping sync in mock mode:', entry.request.url);
                // نحذف الطلب من الـ queue بدلاً من إعادة المحاولة
                continue;
              }

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
              // تحسين معالجة الأخطاء
              const url = entry.request.url;
              const isLocalhost = url.includes('localhost:3000');
              
              if (isLocalhost) {
                // في وضع التطوير، نتجاهل أخطاء localhost (Mock mode)
                console.log('Ignoring sync error for localhost (likely mock mode):', url);
                // نحذف الطلب من الـ queue
                continue;
              } else {
                // للأخطاء الأخرى، نعيد الطلب للـ queue
                console.error('Sync failed:', error);
                await queue.unshiftRequest(entry);
                throw error;
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn('BackgroundSync not available:', error);
  }

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
  // استخدام StaleWhileRevalidate للخطوط لضمان تحديثها وتجنب الأخطاء
  registerRoute(
    ({request}) => {
      const isFont = request.destination === 'font';
      const isStyle = request.destination === 'style';
      const isGoogleFont = request.url.includes('fonts.gstatic.com') || 
                          request.url.includes('fonts.googleapis.com');
      return (isFont || isStyle) && isGoogleFont;
    },
    new StaleWhileRevalidate({
      cacheName: 'google-fonts',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 يوم
          purgeOnQuotaError: true,
        }),
        fontErrorHandler, // معالجة أخطاء الخطوط
      ],
      matchOptions: {
        ignoreSearch: false,
      },
      fetchOptions: {
        mode: 'cors',
        credentials: 'omit',
      },
    })
  );

  // Cache للخطوط والـ CSS الأخرى (غير Google Fonts)
  registerRoute(
    ({request}) => {
      const isFont = request.destination === 'font';
      const isStyle = request.destination === 'style';
      const isGoogleFont = request.url.includes('fonts.gstatic.com') || 
                          request.url.includes('fonts.googleapis.com');
      return (isFont || isStyle) && !isGoogleFont;
    },
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
}

// معالجة العمليات غير الـ GET (POST, PUT, DELETE)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // تخطي معالجة الخطوط - نترك Workbox يتعامل معها
  if (url.includes('fonts.gstatic.com') || url.includes('fonts.googleapis.com')) {
    return; // نترك Workbox يتعامل مع الخطوط
  }

  // معالجة العمليات غير الـ GET
  if (event.request.method !== 'GET') {
    const requestUrl = event.request.url;
    const isLocalhost = requestUrl.includes('localhost:3000');
    
    event.respondWith(
      fetch(event.request.clone()).catch((error) => {
        // إذا كان الطلب إلى localhost:3000 في وضع التطوير، نتجاهل المزامنة
        if (isLocalhost) {
          console.log('Skipping background sync for localhost request (mock mode):', requestUrl);
          // إرجاع response ناجح مؤقتاً بدون إضافة للـ queue
          return new Response(JSON.stringify({ 
            success: true, 
            offline: false,
            mockMode: true,
            message: 'Request handled in mock mode'
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        }

        // إضافة العملية للـ queue عند الفشل (إذا كان متاحاً)
        if (syncQueue && typeof syncQueue.pushRequest === 'function') {
          try {
            return syncQueue.pushRequest({request: event.request}).then(() => {
              // إرجاع response ناجح مؤقتاً
              return new Response(JSON.stringify({ success: true, offline: true }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }).catch((queueError) => {
              console.error('Failed to queue request:', queueError);
              // Fallback response
              return new Response(JSON.stringify({ 
                success: false, 
                offline: true,
                message: 'Request queued for retry when online'
              }), {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              });
            });
          } catch (error) {
            console.error('Error queuing request:', error);
          }
        }
        // Fallback بدون background sync
        return new Response(JSON.stringify({ 
          success: false, 
          offline: true,
          message: 'Request queued for retry when online'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
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
