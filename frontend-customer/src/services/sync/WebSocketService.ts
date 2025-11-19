import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url?: string;
  token?: string;
  userId?: string;
  branchId?: string;
  deviceId?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
}

export interface EntityUpdate {
  entity: string;
  entityId?: string;
  data: any;
  timestamp: Date;
  sourceUserId?: string;
}

export interface SyncNotification {
  type: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    reconnectAttempts: 0,
  };

  // Event listeners
  private entityUpdateListeners: ((update: EntityUpdate) => void)[] = [];
  private notificationListeners: ((notification: SyncNotification) => void)[] = [];
  private connectionListeners: ((status: ConnectionStatus) => void)[] = [];
  private syncStatusListeners: ((status: any) => void)[] = [];

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: config.url || (process.env.NODE_ENV === 'production'
        ? 'wss://api.zaytuna.com'
        : 'ws://localhost:3000'),
      autoConnect: config.autoConnect !== false,
      reconnection: config.reconnection !== false,
      ...config,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  // الاتصال بالخادم
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(`${this.config.url}/sync`, {
        auth: {
          token: this.config.token,
          userId: this.config.userId,
          branchId: this.config.branchId,
          deviceId: this.config.deviceId,
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: this.config.reconnection,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // معالجة الاتصال
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.connectionStatus = {
          connected: true,
          lastConnected: new Date(),
          reconnectAttempts: 0,
        };
        this.notifyConnectionListeners();
        resolve();
      });

      // معالجة قطع الاتصال
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.connectionStatus = {
          ...this.connectionStatus,
          connected: false,
          lastDisconnected: new Date(),
          error: reason,
        };
        this.notifyConnectionListeners();
      });

      // معالجة فشل الاتصال
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connectionStatus.reconnectAttempts++;
        reject(error);
      });

      // معالجة تأكيد الاتصال
      this.socket.on('connected', (data) => {
        console.log('WebSocket handshake confirmed:', data);
      });

      // معالجة البيانات الأولية
      this.socket.on('initial_data', (data) => {
        console.log('Received initial data:', data);
      });

      // معالجة التحديثات الأخيرة
      this.socket.on('recent_changes', (data) => {
        console.log('Received recent changes:', data);
      });

      // معالجة تحديثات الكيانات
      this.socket.on('entity_update', (update: EntityUpdate) => {
        console.log('Received entity update:', update);
        this.notifyEntityUpdateListeners(update);
      });

      // معالجة الإشعارات
      this.socket.on('notification', (notification: SyncNotification) => {
        console.log('Received notification:', notification);
        this.notifyNotificationListeners(notification);
      });

      // معالجة تحديثات حالة المزامنة
      this.socket.on('sync_status', (status) => {
        console.log('Received sync status:', status);
        this.notifySyncStatusListeners(status);
      });

      // معالجة تحديثات البيانات
      this.socket.on('data_update', (data) => {
        console.log('Received data update:', data);
      });

      // معالجة الأخطاء
      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus.error = error.message;
        this.notifyConnectionListeners();
      });
    });
  }

  // قطع الاتصال
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus = {
      connected: false,
      lastDisconnected: new Date(),
      reconnectAttempts: 0,
    };
    this.notifyConnectionListeners();
  }

  // التحقق من حالة الاتصال
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // الاشتراك في تحديثات كيان
  subscribeToEntity(entity: string, entityId?: string): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected, cannot subscribe');
      return;
    }

    this.socket.emit('subscribe', { entity, entityId });
    console.log(`Subscribed to ${entity}${entityId ? ':' + entityId : ''}`);
  }

  // إلغاء الاشتراك من كيان
  unsubscribeFromEntity(entity: string, entityId?: string): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected, cannot unsubscribe');
      return;
    }

    this.socket.emit('unsubscribe', { entity, entityId });
    console.log(`Unsubscribed from ${entity}${entityId ? ':' + entityId : ''}`);
  }

  // طلب تحديثات
  requestUpdate(entity: string, entityId?: string, lastSyncTime?: string): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected, cannot request update');
      return;
    }

    this.socket.emit('request_update', {
      entity,
      entityId,
      lastSyncTime,
    });
  }

  // إرسال تحديث كيان (للاستخدام الداخلي)
  emitEntityUpdate(update: EntityUpdate): void {
    if (!this.socket || !this.isConnected()) {
      console.warn('WebSocket not connected, cannot emit update');
      return;
    }

    // هذا يمكن أن يكون للتحديثات المحلية أو الإدارية
    this.socket.emit('entity_update', update);
  }

  // Event listeners management
  onEntityUpdate(listener: (update: EntityUpdate) => void): () => void {
    this.entityUpdateListeners.push(listener);
    return () => {
      const index = this.entityUpdateListeners.indexOf(listener);
      if (index > -1) {
        this.entityUpdateListeners.splice(index, 1);
      }
    };
  }

  onNotification(listener: (notification: SyncNotification) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      const index = this.notificationListeners.indexOf(listener);
      if (index > -1) {
        this.notificationListeners.splice(index, 1);
      }
    };
  }

  onConnectionChange(listener: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  onSyncStatus(listener: (status: any) => void): () => void {
    this.syncStatusListeners.push(listener);
    return () => {
      const index = this.syncStatusListeners.indexOf(listener);
      if (index > -1) {
        this.syncStatusListeners.splice(index, 1);
      }
    };
  }

  // Private methods
  private notifyEntityUpdateListeners(update: EntityUpdate): void {
    this.entityUpdateListeners.forEach(listener => {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in entity update listener:', error);
      }
    });
  }

  private notifyNotificationListeners(notification: SyncNotification): void {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener({ ...this.connectionStatus });
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  private notifySyncStatusListeners(status: any): void {
    this.syncStatusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  // إعادة الاتصال اليدوي
  reconnect(): Promise<void> {
    this.disconnect();
    return this.connect();
  }

  // تحديث التكوين
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };

    // إعادة الاتصال إذا لزم الأمر
    if (this.socket && config.token) {
      this.reconnect();
    }
  }

  // الحصول على إحصائيات الاتصال
  getConnectionStats(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // تنظيف الموارد
  destroy(): void {
    this.disconnect();
    this.entityUpdateListeners = [];
    this.notificationListeners = [];
    this.connectionListeners = [];
    this.syncStatusListeners = [];
  }
}

// Singleton instance
let webSocketInstance: WebSocketService | null = null;

export const getWebSocketService = (config?: WebSocketConfig): WebSocketService => {
  if (!webSocketInstance) {
    webSocketInstance = new WebSocketService(config);
  } else if (config) {
    webSocketInstance.updateConfig(config);
  }

  return webSocketInstance;
};

export const destroyWebSocketService = (): void => {
  if (webSocketInstance) {
    webSocketInstance.destroy();
    webSocketInstance = null;
  }
};
