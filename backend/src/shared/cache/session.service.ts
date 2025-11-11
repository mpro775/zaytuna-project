import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';

export interface SessionData {
  userId: string;
  username: string;
  roleId: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessionPrefix = 'session:';
  private readonly userSessionsPrefix = 'user_sessions:';

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * إنشاء جلسة جديدة
   */
  async createSession(
    sessionId: string,
    userData: Omit<SessionData, 'createdAt' | 'lastActivity' | 'isActive'>,
  ): Promise<void> {
    const sessionData: SessionData = {
      ...userData,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };

    const ttl = this.configService.get<number>('jwt.refreshTokenTtl', 604800); // 7 days default

    // حفظ بيانات الجلسة
    await this.cacheService.setObject(
      `${this.sessionPrefix}${sessionId}`,
      sessionData,
      ttl,
    );

    // إضافة الجلسة لقائمة جلسات المستخدم
    await this.addUserSession(userData.userId, sessionId);

    this.logger.log(`تم إنشاء جلسة جديدة للمستخدم: ${userData.username}`);
  }

  /**
   * الحصول على بيانات الجلسة
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    return await this.cacheService.getObject<SessionData>(
      `${this.sessionPrefix}${sessionId}`,
    );
  }

  /**
   * تحديث نشاط الجلسة
   */
  async updateActivity(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (sessionData) {
      sessionData.lastActivity = new Date();
      const ttl = await this.cacheService.ttl(
        `${this.sessionPrefix}${sessionId}`,
      );

      await this.cacheService.setObject(
        `${this.sessionPrefix}${sessionId}`,
        sessionData,
        ttl > 0 ? ttl : 3600, // 1 hour minimum
      );
    }
  }

  /**
   * إنهاء جلسة
   */
  async destroySession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (sessionData) {
      // إزالة من قائمة جلسات المستخدم
      await this.removeUserSession(sessionData.userId, sessionId);

      // حذف بيانات الجلسة
      await this.cacheService.delete(`${this.sessionPrefix}${sessionId}`);

      this.logger.log(`تم إنهاء الجلسة: ${sessionId}`);
    }
  }

  /**
   * إنهاء جميع جلسات المستخدم
   */
  async destroyUserSessions(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);

    for (const sessionId of userSessions) {
      await this.cacheService.delete(`${this.sessionPrefix}${sessionId}`);
    }

    await this.cacheService.delete(`${this.userSessionsPrefix}${userId}`);

    this.logger.log(`تم إنهاء جميع جلسات المستخدم: ${userId}`);
  }

  /**
   * التحقق من صحة الجلسة
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const sessionData = await this.getSession(sessionId);
    return sessionData?.isActive ?? false;
  }

  /**
   * الحصول على جميع جلسات المستخدم
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const sessions = await this.cacheService.getObject<string[]>(
      `${this.userSessionsPrefix}${userId}`,
    );
    return sessions || [];
  }

  /**
   * إضافة جلسة للمستخدم
   */
  private async addUserSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    if (!userSessions.includes(sessionId)) {
      userSessions.push(sessionId);
      await this.cacheService.setObject(
        `${this.userSessionsPrefix}${userId}`,
        userSessions,
      );
    }
  }

  /**
   * إزالة جلسة من المستخدم
   */
  private async removeUserSession(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    const filteredSessions = userSessions.filter((id) => id !== sessionId);

    if (filteredSessions.length > 0) {
      await this.cacheService.setObject(
        `${this.userSessionsPrefix}${userId}`,
        filteredSessions,
      );
    } else {
      await this.cacheService.delete(`${this.userSessionsPrefix}${userId}`);
    }
  }

  /**
   * الحصول على إحصائيات الجلسات
   */
  async getSessionStats(): Promise<{
    activeSessions: number;
    totalUsers: number;
  }> {
    try {
      const keys = await this.cacheService['client'].keys(
        `${this.userSessionsPrefix}*`,
      );
      const totalUsers = keys.length;

      let activeSessions = 0;
      for (const key of keys) {
        const sessions = await this.cacheService.getObject<string[]>(key);
        if (sessions) {
          activeSessions += sessions.length;
        }
      }

      return { activeSessions, totalUsers };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الجلسات:', error);
      return { activeSessions: 0, totalUsers: 0 };
    }
  }

  /**
   * تنظيف الجلسات المنتهية الصلاحية (للصيانة)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const keys = await this.cacheService['client'].keys(
        `${this.sessionPrefix}*`,
      );
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await this.cacheService.ttl(key);
        if (ttl === -2) {
          // Key doesn't exist or error
          await this.cacheService.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`تم تنظيف ${cleanedCount} جلسة منتهية الصلاحية`);
      }
    } catch (error) {
      this.logger.error('فشل في تنظيف الجلسات المنتهية الصلاحية:', error);
    }
  }
}
