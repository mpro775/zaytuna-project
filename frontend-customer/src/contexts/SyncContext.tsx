import React, { createContext, useEffect, useState } from 'react';
import { SyncService, WebSocketService, getWebSocketService, destroyWebSocketService } from '../services/sync';

export interface SyncContextType {
  syncService: SyncService | null;
  webSocketService: WebSocketService | null;
  isInitialized: boolean;
  syncStats: {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    pendingOperations: number;
  } | null;
  webSocketStats: {
    isConnected: boolean;
    lastConnected?: Date;
    lastDisconnected?: Date;
    reconnectAttempts: number;
  } | null;
  performSync: () => Promise<void>;
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export default SyncContext;

interface SyncProviderProps {
  children: React.ReactNode;
  deviceId: string;
  userId?: string;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({
  children,
  deviceId,
  userId: _userId
}) => {
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [webSocketService, setWebSocketService] = useState<WebSocketService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncContextType['syncStats']>(null);
  const [webSocketStats, setWebSocketStats] = useState<SyncContextType['webSocketStats']>(null);

  useEffect(() => {
    const initializeSync = async () => {
      try {
        // تهيئة SyncService
        const service = new SyncService(deviceId);
        setSyncService(service);

        // تهيئة WebSocketService
        const wsService = getWebSocketService({
          deviceId,
          ...(_userId !== undefined && { userId: _userId }),
          autoConnect: false, // سنتصل يدوياً
        });
        setWebSocketService(wsService);

        // إعداد event listeners للـ WebSocket
        const unsubscribeWS = wsService.onConnectionChange((status) => {
          setWebSocketStats({
            isConnected: status.connected,
            ...(status.lastConnected !== undefined && { lastConnected: status.lastConnected }),
            ...(status.lastDisconnected !== undefined && { lastDisconnected: status.lastDisconnected }),
            reconnectAttempts: status.reconnectAttempts,
          });
        });

        setIsInitialized(true);

        // تحديث الإحصائيات كل 5 ثوان
        const updateStats = async () => {
          if (service) {
            const stats = await service.getSyncStats();
            setSyncStats({
              isOnline: stats.isOnline,
              isSyncing: stats.isSyncing,
              lastSyncTime: stats.lastSyncTime,
              pendingOperations: stats.pendingOperations,
            });
          }
        };

        updateStats();
        const interval = setInterval(updateStats, 5000);

        return () => {
          clearInterval(interval);
          unsubscribeWS();
        };
      } catch (error) {
        console.error('Failed to initialize sync service:', error);
        setIsInitialized(true); // منع الانتظار الدائم
      }
    };

    if (deviceId) {
      initializeSync();
    }

    // تنظيف عند إلغاء الـ component
    return () => {
      destroyWebSocketService();
    };
  }, [deviceId, _userId]);

  const performSync = async () => {
    if (syncService) {
      await syncService.syncNow();
      // تحديث الإحصائيات فوراً
      const stats = await syncService.getSyncStats();
      setSyncStats({
        isOnline: stats.isOnline,
        isSyncing: stats.isSyncing,
        lastSyncTime: stats.lastSyncTime,
        pendingOperations: stats.pendingOperations,
      });
    }
  };

  const connectWebSocket = async () => {
    if (webSocketService) {
      await webSocketService.connect();
    }
  };

  const disconnectWebSocket = () => {
    if (webSocketService) {
      webSocketService.disconnect();
    }
  };

  const value: SyncContextType = {
    syncService,
    webSocketService,
    isInitialized,
    syncStats,
    webSocketStats,
    performSync,
    connectWebSocket,
    disconnectWebSocket,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
