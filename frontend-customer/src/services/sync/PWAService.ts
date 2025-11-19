// Extend the global Window interface for PWA
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAStatus {
  isSupported: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  installPrompt?: BeforeInstallPromptEvent | null;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
}

export class PWAService {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private networkStatus: NetworkStatus = { isOnline: navigator.onLine };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // مراقبة حالة الاتصال بالشبكة
    window.addEventListener('online', () => {
      this.networkStatus.isOnline = true;
      this.emitNetworkChange();
    });

    window.addEventListener('offline', () => {
      this.networkStatus.isOnline = false;
      this.emitNetworkChange();
    });

    // مراقبة Connection API إذا كان متوفراً
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.networkStatus.connectionType = connection.type;
        this.networkStatus.effectiveType = connection.effectiveType;
        this.networkStatus.downlink = connection.downlink;

        connection.addEventListener('change', () => {
          this.networkStatus.connectionType = connection.type;
          this.networkStatus.effectiveType = connection.effectiveType;
          this.networkStatus.downlink = connection.downlink;
          this.emitNetworkChange();
        });
      }
    }

    // مراقبة beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.emitInstallPrompt();
    });

    // مراقبة appinstalled
    window.addEventListener('appinstalled', () => {
      this.installPrompt = null;
      console.log('PWA was installed');
    });
  }

  // تسجيل Service Worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration);

      // مراقبة تحديثات الـ Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.emitServiceWorkerUpdate();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // طلب إذن الإشعارات
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // تسجيل Push Subscription
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as any
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  // إلغاء Push Subscription
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const result = await subscription.unsubscribe();
        console.log('Push subscription unsubscribed');
        return result;
      }

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }

  // تثبيت التطبيق
  async installApp(): Promise<boolean> {
    if (!this.installPrompt) {
      return false;
    }

    try {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;

      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        this.installPrompt = null;
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Failed to install app:', error);
      return false;
    }
  }

  // الحصول على حالة PWA
  getPWAStatus(): PWAStatus {
    const isSupported = 'serviceWorker' in navigator && 'caches' in window;
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;

    return {
      isSupported,
      isInstalled,
      canInstall: !!this.installPrompt,
      installPrompt: this.installPrompt || undefined
    };
  }

  // الحصول على حالة الشبكة
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  // تحديث Service Worker
  async updateServiceWorker(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  }

  // إعادة تحميل التطبيق
  reloadApp(): void {
    window.location.reload();
  }

  // إرسال رسالة للـ Service Worker
  async sendMessageToSW(message: any): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
    }
  }

  // مراقبة التغييرات في الاتصال
  onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
    const handler = () => callback(this.getNetworkStatus());
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);

    // تنظيف
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }

  // مراقبة طلب التثبيت
  onInstallPrompt(callback: (prompt: BeforeInstallPromptEvent) => void): () => void {
    const handler = () => {
      if (this.installPrompt) {
        callback(this.installPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }

  // مراقبة تحديثات Service Worker
  onServiceWorkerUpdate(callback: () => void): () => void {
    const handler = () => callback();

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        handler();
      }
    });

    return handler;
  }

  private emitNetworkChange(): void {
    const event = new CustomEvent('networkchange', {
      detail: this.networkStatus
    });
    window.dispatchEvent(event);
  }

  private emitInstallPrompt(): void {
    const event = new CustomEvent('installprompt', {
      detail: this.installPrompt
    });
    window.dispatchEvent(event);
  }

  private emitServiceWorkerUpdate(): void {
    const event = new CustomEvent('swupdate');
    window.dispatchEvent(event);
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// إنشاء instance واحد من الخدمة
export const pwaService = new PWAService();
