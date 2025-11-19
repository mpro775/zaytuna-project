import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SyncService } from './sync.service';
import { JwtWsGuard } from '../../common/guards/jwt-ws.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  branchId?: string;
  deviceId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/sync',
})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SyncGateway.name);
  private connectedClients: Map<string, AuthenticatedSocket> = new Map();

  constructor(private readonly syncService: SyncService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      // استخراج token من handshake
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // التحقق من صحة الtoken (يمكن تحسين هذا لاحقاً)
      // للآن نقبل أي token

      const userId = client.handshake.auth.userId;
      const branchId = client.handshake.auth.branchId;
      const deviceId = client.handshake.auth.deviceId;

      client.userId = userId;
      client.branchId = branchId;
      client.deviceId = deviceId;

      this.connectedClients.set(client.id, client);

      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Device: ${deviceId})`);

      // إرسال تأكيد الاتصال
      client.emit('connected', {
        message: 'تم الاتصال بنجاح',
        timestamp: new Date(),
        clientId: client.id,
      });

      // إرسال البيانات الأولية
      await this.sendInitialData(client);

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * الاشتراك في تحديثات كيان معين
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { entity: string; entityId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = data.entityId
      ? `${data.entity}:${data.entityId}`
      : data.entity;

    client.join(roomName);

    this.logger.log(`Client ${client.id} subscribed to ${roomName}`);

    client.emit('subscribed', {
      entity: data.entity,
      entityId: data.entityId,
      room: roomName,
      timestamp: new Date(),
    });
  }

  /**
   * إلغاء الاشتراك من تحديثات كيان
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { entity: string; entityId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = data.entityId
      ? `${data.entity}:${data.entityId}`
      : data.entity;

    client.leave(roomName);

    this.logger.log(`Client ${client.id} unsubscribed from ${roomName}`);

    client.emit('unsubscribed', {
      entity: data.entity,
      entityId: data.entityId,
      room: roomName,
      timestamp: new Date(),
    });
  }

  /**
   * طلب بيانات محدثة
   */
  @SubscribeMessage('request_update')
  async handleRequestUpdate(
    @MessageBody() data: { entity: string; entityId?: string; lastSyncTime?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const changes = await this.syncService.getSyncData(
        client.deviceId!,
        client.branchId,
        data.lastSyncTime ? new Date(data.lastSyncTime) : undefined,
        data.entity ? [data.entity] : undefined,
      );

      client.emit('data_update', {
        entity: data.entity,
        entityId: data.entityId,
        changes,
        timestamp: new Date(),
      });

    } catch (error) {
      this.logger.error('Failed to send data update:', error);
      client.emit('error', {
        message: 'فشل في جلب البيانات المحدثة',
        error: error.message,
      });
    }
  }

  /**
   * إرسال تحديثات لجميع المشتركين
   */
  async broadcastUpdate(entity: string, entityId: string | null, data: any, userId?: string) {
    const roomName = entityId ? `${entity}:${entityId}` : entity;

    // إرسال للمشتركين في الغرفة المحددة
    this.server.to(roomName).emit('entity_update', {
      entity,
      entityId,
      data,
      timestamp: new Date(),
      sourceUserId: userId,
    });

    // إرسال للمشتركين في الكيان العام (للتحديثات العامة)
    if (entityId) {
      this.server.to(entity).emit('entity_update', {
        entity,
        entityId,
        data,
        timestamp: new Date(),
        sourceUserId: userId,
      });
    }

    this.logger.log(`Broadcasted update for ${roomName}`);
  }

  /**
   * إرسال إشعار لمستخدم محدد
   */
  async sendNotificationToUser(userId: string, notification: any) {
    const userClients = Array.from(this.connectedClients.values())
      .filter(client => client.userId === userId);

    userClients.forEach(client => {
      client.emit('notification', {
        ...notification,
        timestamp: new Date(),
      });
    });

    this.logger.log(`Sent notification to ${userClients.length} clients for user ${userId}`);
  }

  /**
   * إرسال تحديث حالة المزامنة
   */
  async sendSyncStatus(clientId: string, status: any) {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit('sync_status', {
        ...status,
        timestamp: new Date(),
      });
    }
  }

  /**
   * إرسال البيانات الأولية عند الاتصال
   */
  private async sendInitialData(client: AuthenticatedSocket) {
    try {
      // إرسال معلومات الاتصال
      client.emit('initial_data', {
        userId: client.userId,
        branchId: client.branchId,
        deviceId: client.deviceId,
        serverTime: new Date(),
        features: [
          'real_time_updates',
          'sync_notifications',
          'conflict_resolution',
        ],
      });

      // إرسال آخر تحديثات مهمة
      const recentChanges = await this.syncService.getSyncData(
        client.deviceId!,
        client.branchId,
        new Date(Date.now() - 5 * 60 * 1000), // آخر 5 دقائق
      );

      if (recentChanges.length > 0) {
        client.emit('recent_changes', {
          changes: recentChanges,
          timestamp: new Date(),
        });
      }

    } catch (error) {
      this.logger.error('Failed to send initial data:', error);
    }
  }

  /**
   * الحصول على إحصائيات الاتصالات
   */
  getConnectionStats() {
    const clients = Array.from(this.connectedClients.values());
    const stats = {
      totalConnections: clients.length,
      connectionsByBranch: {} as Record<string, number>,
      connectionsByUser: {} as Record<string, number>,
      timestamp: new Date(),
    };

    clients.forEach(client => {
      if (client.branchId) {
        stats.connectionsByBranch[client.branchId] = (stats.connectionsByBranch[client.branchId] || 0) + 1;
      }
      if (client.userId) {
        stats.connectionsByUser[client.userId] = (stats.connectionsByUser[client.userId] || 0) + 1;
      }
    });

    return stats;
  }
}
