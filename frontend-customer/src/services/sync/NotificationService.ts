import { pwaService } from './PWAService';
import axios from '../../services/api/axios';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  deviceId: string;
  deviceName?: string;
  subscriptionId?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  timestamp?: number;
}

export interface NotificationSettings {
  enabled: boolean;
  types: {
    sales: boolean;
    inventory: boolean;
    system: boolean;
    marketing: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
}

export interface NotificationHistoryItem {
  id: string;
  type: 'push' | 'in_app';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  data?: any;
  actionUrl?: string;
}

export class NotificationService {
  private subscription: PushSubscription | null = null;
  private subscriptionData: PushSubscriptionData | null = null;
  private settings: NotificationSettings = this.getDefaultSettings();
  private history: NotificationHistoryItem[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // تحميل الإعدادات المحفوظة
    await this.loadSettings();

    // تحميل السجل من localStorage
    this.loadHistory();

    // التحقق من وجود subscription موجود
    await this.checkExistingSubscription();

    // تسجيل event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // مراقبة تغييرات الإعدادات
    window.addEventListener('notification-settings-changed', () => {
      this.loadSettings();
    });
  }

  // طلب إذن الإشعارات
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported in this browser');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        await this.subscribeToPush();
      }

      return permission;
    }

    return Notification.permission;
  }

  // الاشتراك في Push Notifications
  async subscribeToPush(): Promise<boolean> {
    try {
      if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // إنشاء VAPID public key (يجب أن يكون من الخادم)
      const vapidPublicKey = await this.getVapidPublicKey();

      this.subscription = await pwaService.subscribeToPush(vapidPublicKey);

      if (this.subscription) {
        this.subscriptionData = {
          endpoint: this.subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(this.subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(this.subscription.getKey('auth')!))),
          },
          deviceId: this.getDeviceId(),
          deviceName: navigator.userAgent,
        };

        // تسجيل الاشتراك في الخادم
        await this.registerSubscription();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  // إلغاء الاشتراك
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const success = await pwaService.unsubscribeFromPush();

      if (success && this.subscriptionData?.subscriptionId) {
        await axios.delete(`/sync/notifications/unsubscribe/${this.subscriptionData.subscriptionId}`);
        this.subscription = null;
        this.subscriptionData = null;
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // تسجيل الاشتراك في الخادم
  private async registerSubscription(): Promise<void> {
    if (!this.subscriptionData) return;

    try {
      const response = await axios.post('/sync/notifications/register-device', {
        deviceId: this.subscriptionData.deviceId,
        deviceName: this.subscriptionData.deviceName,
        subscription: this.subscriptionData,
        userId: this.getCurrentUserId(),
      });

      this.subscriptionData.subscriptionId = response.data.subscriptionId;

      console.log('Push subscription registered on server');
    } catch (error) {
      console.error('Failed to register subscription on server:', error);
    }
  }

  // الحصول على VAPID public key من الخادم
  private async getVapidPublicKey(): Promise<string> {
    try {
      const response = await axios.get('/sync/notifications/vapid-public-key');
      return response.data.publicKey;
    } catch (error) {
      console.warn('Failed to get VAPID public key from server, using default', error);
      // استخدام مفتاح افتراضي للتطوير (يجب تغييره في الإنتاج)
      return 'BLXHQZ5Rd7KdUbFxqjBfhK7RHFjKzZs8wBzMq2YYpG5K4J8M4nT4K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K';
    }
  }

  // التحقق من وجود اشتراك حالي
  private async checkExistingSubscription(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();

      if (this.subscription) {
        console.log('Found existing push subscription');
        // يمكن إعادة تسجيل الاشتراك إذا لزم الأمر
      }
    } catch (error) {
      console.warn('Failed to check existing subscription:', error);
    }
  }

  // إرسال إشعار محلي
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const options: ExtendedNotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      ...(payload.image ? { image: payload.image } : {}),
      data: payload.data,
      ...(payload.actions ? { actions: payload.actions } : {}),
      ...(payload.requireInteraction !== undefined ? { requireInteraction: payload.requireInteraction } : {}),
      ...(payload.silent !== undefined ? { silent: payload.silent } : {}),
      ...(payload.tag ? { tag: payload.tag } : {}),
      timestamp: payload.timestamp || Date.now(),
    };

    const notification = new Notification(payload.title, options);

    // إضافة المؤشر السمعي للإشعارات المهمة
    if (!payload.silent) {
      // يمكن إضافة صوت مخصص هنا
    }

    // حفظ في السجل
    this.addToHistory({
      id: crypto.randomUUID(),
      type: 'in_app',
      title: payload.title,
      body: payload.body,
      timestamp: new Date(),
      read: false,
      data: payload.data,
    });

    // معالجة النقر على الإشعار
    notification.onclick = () => {
      notification.close();

      // التنقل إلى صفحة محددة إذا كان هناك actionUrl
      if (payload.data?.actionUrl) {
        window.focus();
        window.location.href = payload.data.actionUrl;
      }
    };

    // إغلاق تلقائي بعد 5 ثوان
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // إرسال إشعار اختباري
  async sendTestNotification(): Promise<void> {
    const testPayload: NotificationPayload = {
      title: 'إشعار اختباري',
      body: 'هذا إشعار اختباري للتأكد من عمل نظام الإشعارات',
      icon: '/icons/icon-192x192.png',
      tag: 'test',
      data: {
        actionUrl: '/dashboard',
      },
    };

    await this.showLocalNotification(testPayload);
  }

  // إدارة الإعدادات
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();

    // إرسال حدث لتحديث المكونات الأخرى
    window.dispatchEvent(new CustomEvent('notification-settings-changed'));
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }




  // إدارة السجل
  private addToHistory(item: NotificationHistoryItem): void {
    this.history.unshift(item);

    // الحفاظ على حد أقصى 100 إشعار
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }

    this.saveHistory();
  }

  getHistory(limit: number = 50): NotificationHistoryItem[] {
    return this.history.slice(0, limit);
  }

  markAsRead(notificationId: string): void {
    const item = this.history.find(h => h.id === notificationId);
    if (item) {
      item.read = true;
      this.saveHistory();
    }
  }

  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  getUnreadCount(): number {
    return this.history.filter(h => !h.read).length;
  }

  // إدارة التخزين المحلي
  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem('notification-settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('notification-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('notification-history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  // مساعدات
  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      types: {
        sales: true,
        inventory: true,
        system: true,
        marketing: false,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };
  }

  private getDeviceId(): string {
    const stored = localStorage.getItem('zaytuna_device_id');
    if (stored) return stored;

    const newId = crypto.randomUUID();
    localStorage.setItem('zaytuna_device_id', newId);
    return newId;
  }

  private getCurrentUserId(): string | undefined {
    // يمكن الحصول على معرف المستخدم من AuthContext
    // للآن نعيد undefined
    return undefined;
  }

  // معلومات الحالة
  getStatus(): {
    permission: NotificationPermission;
    isSubscribed: boolean;
    settings: NotificationSettings;
    unreadCount: number;
  } {
    return {
      permission: Notification.permission,
      isSubscribed: !!this.subscription,
      settings: this.settings,
      unreadCount: this.getUnreadCount(),
    };
  }
}

// إنشاء instance واحد من الخدمة
export const notificationService = new NotificationService();
