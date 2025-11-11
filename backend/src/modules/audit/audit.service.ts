import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

export interface AuditLogData {
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  referenceType?: string;
  referenceId?: string;
  module?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  category?: string;
  success?: boolean;
  errorMessage?: string;
  searchableText?: string;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  branchId?: string;
  warehouseId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  severity?: string;
  category?: string;
  referenceType?: string;
  referenceId?: string;
  module?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntity: Record<string, number>;
  logsByUser: Record<string, number>;
  logsBySeverity: Record<string, number>;
  logsByCategory: Record<string, number>;
  logsByModule: Record<string, number>;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    entity: string;
    userName: string;
    success: boolean;
  }>;
  errorRate: number;
  topEntities: Array<{
    entity: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditCacheKey = 'audit_logs';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  /**
   * تسجيل عملية في سجل التدقيق
   */
  async log(auditData: AuditLogData): Promise<void> {
    try {
      const user = (this.request as any)?.user;
      const clientIp = this.getClientIp();
      const userAgent = this.request.get('User-Agent');
      const sessionId = (this.request as any)?.session?.id;

      const logData = {
        userId: user?.id,
        branchId: user?.branchId,
        warehouseId: (this.request as any)?.warehouseId,
        action: auditData.action,
        entity: auditData.entity,
        entityId: auditData.entityId,
        details: auditData.details || {},
        oldValues: auditData.oldValues || {},
        newValues: auditData.newValues || {},
        ipAddress: clientIp,
        userAgent: userAgent,
        sessionId: sessionId,
        success: auditData.success !== false,
        errorMessage: auditData.errorMessage,
        severity: auditData.severity || 'info',
        category: auditData.category || 'business',
        referenceType: auditData.referenceType,
        referenceId: auditData.referenceId,
        module: auditData.module,
        searchableText: auditData.searchableText || this.generateSearchableText(auditData),
      };

      await this.prisma.auditLog.create({
        data: logData,
      });

      // إبطال الكاش المتعلق بالتقارير
      await this.invalidateAuditCache();

      // تسجيل في Logger أيضاً للعمليات الحساسة
      if (auditData.severity === 'error' || auditData.severity === 'critical') {
        this.logger.error(
          `AUDIT: ${auditData.action} on ${auditData.entity} by user ${user?.id || 'unknown'}`,
          {
            entityId: auditData.entityId,
            errorMessage: auditData.errorMessage,
            details: auditData.details,
          }
        );
      } else if (auditData.severity === 'warning') {
        this.logger.warn(
          `AUDIT: ${auditData.action} on ${auditData.entity} by user ${user?.id || 'unknown'}`,
          {
            entityId: auditData.entityId,
            details: auditData.details,
          }
        );
      }

    } catch (error) {
      // لا نرمي خطأ هنا لأن فشل التسجيل لا يجب أن يوقف العملية الأساسية
      this.logger.error('فشل في تسجيل عملية التدقيق', error);
    }
  }

  /**
   * تسجيل عملية إنشاء
   */
  async logCreate(entity: string, entityId: string, newValues: Record<string, any>, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'CREATE',
      entity,
      entityId,
      newValues,
      ...options,
    });
  }

  /**
   * تسجيل عملية قراءة
   */
  async logRead(entity: string, entityId: string, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'READ',
      entity,
      entityId,
      ...options,
    });
  }

  /**
   * تسجيل عملية تحديث
   */
  async logUpdate(entity: string, entityId: string, oldValues: Record<string, any>, newValues: Record<string, any>, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'UPDATE',
      entity,
      entityId,
      oldValues,
      newValues,
      ...options,
    });
  }

  /**
   * تسجيل عملية حذف
   */
  async logDelete(entity: string, entityId: string, oldValues: Record<string, any>, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'DELETE',
      entity,
      entityId,
      oldValues,
      ...options,
    });
  }

  /**
   * تسجيل عملية تسجيل دخول
   */
  async logLogin(userId: string, success: boolean = true, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      entity: 'User',
      entityId: userId,
      success,
      category: 'security',
      severity: success ? 'info' : 'warning',
      ...options,
    });
  }

  /**
   * تسجيل عملية تسجيل خروج
   */
  async logLogout(userId: string, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'LOGOUT',
      entity: 'User',
      entityId: userId,
      category: 'security',
      ...options,
    });
  }

  /**
   * تسجيل عملية تغيير كلمة مرور
   */
  async logPasswordChange(userId: string, success: boolean = true, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
      success,
      category: 'security',
      severity: success ? 'info' : 'warning',
      ...options,
    });
  }

  /**
   * تسجيل عملية تغيير صلاحيات
   */
  async logPermissionChange(userId: string, targetUserId: string, oldPermissions: any, newPermissions: any, options?: Partial<AuditLogData>): Promise<void> {
    await this.log({
      action: 'PERMISSION_CHANGE',
      entity: 'User',
      entityId: targetUserId,
      oldValues: { permissions: oldPermissions },
      newValues: { permissions: newPermissions },
      details: { changedBy: userId },
      category: 'security',
      severity: 'warning',
      ...options,
    });
  }

  /**
   * البحث في سجلات التدقيق
   */
  async searchAuditLogs(query: AuditQuery) {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.entity) where.entity = query.entity;
    if (query.entityId) where.entityId = query.entityId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.success !== undefined) where.success = query.success;
    if (query.severity) where.severity = query.severity;
    if (query.category) where.category = query.category;
    if (query.referenceType) where.referenceType = query.referenceType;
    if (query.referenceId) where.referenceId = query.referenceId;
    if (query.module) where.module = query.module;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = query.startDate;
      if (query.endDate) where.timestamp.lte = query.endDate;
    }

    if (query.searchText) {
      where.searchableText = {
        contains: query.searchText,
        mode: 'insensitive',
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: query.limit || 50,
        skip: query.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  /**
   * الحصول على سجل تدقيق محدد
   */
  async getAuditLog(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * الحصول على إحصائيات التدقيق
   */
  async getAuditStats(
    startDate?: Date,
    endDate?: Date,
    branchId?: string,
  ): Promise<AuditStats> {
    try {
      const cacheKey = `audit_stats:${startDate?.toISOString()}:${endDate?.toISOString()}:${branchId || 'all'}`;

      const cachedStats = await this.cacheService.get<AuditStats>(cacheKey);
      if (cachedStats) {
        return cachedStats;
      }

      const where: any = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }
      if (branchId) where.branchId = branchId;

      // إحصائيات أساسية
      const totalLogs = await this.prisma.auditLog.count({ where });

      // إحصائيات بالعمليات
      const logsByAction = await this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
      });

      // إحصائيات بالكيانات
      const logsByEntity = await this.prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { id: true },
      });

      // إحصائيات بالمستخدمين
      const logsByUser = await this.prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
      });

      // إحصائيات بالخطورة
      const logsBySeverity = await this.prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      });

      // إحصائيات بالفئة
      const logsByCategory = await this.prisma.auditLog.groupBy({
        by: ['category'],
        where,
        _count: { id: true },
      });

      // إحصائيات بالوحدة
      const logsByModule = await this.prisma.auditLog.groupBy({
        by: ['module'],
        where,
        _count: { id: true },
      });

      // الأنشطة الأخيرة
      const recentActivity = await this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
      });

      // معدل الأخطاء
      const errorLogs = await this.prisma.auditLog.count({
        where: {
          ...where,
          success: false,
        },
      });

      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

      // أكثر الكيانات نشاطاً
      const topEntities = logsByEntity
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10)
        .map(item => ({
          entity: item.entity,
          count: item._count.id,
        }));

      // أكثر المستخدمين نشاطاً
      const topUsersWithNames = await Promise.all(
        logsByUser
          .sort((a, b) => b._count.id - a._count.id)
          .slice(0, 10)
          .map(async (item) => {
            const user = await this.prisma.user.findUnique({
              where: { id: item.userId! },
              select: { username: true, email: true },
            });

            return {
              userId: item.userId!,
              userName: user?.username || user?.email || 'غير معروف',
              count: item._count.id,
            };
          })
      );

      const stats: AuditStats = {
        totalLogs,
        logsByAction: Object.fromEntries(
          logsByAction.map(item => [item.action, item._count.id])
        ),
        logsByEntity: Object.fromEntries(
          logsByEntity.map(item => [item.entity, item._count.id])
        ),
        logsByUser: Object.fromEntries(
          logsByUser.map(item => [item.userId || 'unknown', item._count.id])
        ),
        logsBySeverity: Object.fromEntries(
          logsBySeverity.map(item => [item.severity, item._count.id])
        ),
        logsByCategory: Object.fromEntries(
          logsByCategory.map(item => [item.category, item._count.id])
        ),
        logsByModule: Object.fromEntries(
          logsByModule.map(item => [item.module || 'unknown', item._count.id])
        ),
        recentActivity: recentActivity.map(activity => ({
          timestamp: activity.timestamp,
          action: activity.action,
          entity: activity.entity,
          userName: activity.user?.username || activity.user?.email || 'غير معروف',
          success: activity.success,
        })),
        errorRate,
        topEntities,
        topUsers: topUsersWithNames,
      };

      await this.cacheService.set(cacheKey, stats, { ttl: 300 }); // 5 دقائق

      return stats;
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات التدقيق', error);
      throw error;
    }
  }

  /**
   * الحصول على تتبع العمليات لكيان محدد
   */
  async getEntityAuditTrail(entity: string, entityId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * الحصول على تتبع العمليات لمستخدم محدد
   */
  async getUserAuditTrail(userId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * تنظيف سجلات التدقيق القديمة
   */
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        severity: {
          not: 'critical', // نحتفظ بسجلات الأخطاء الحرجة لفترة أطول
        },
      },
    });

    await this.invalidateAuditCache();

    this.logger.log(`تم حذف ${result.count} سجل تدقيق قديم`);
    return result.count;
  }

  /**
   * تصدير سجلات التدقيق
   */
  async exportAuditLogs(query: AuditQuery): Promise<any[]> {
    const result = await this.searchAuditLogs({
      ...query,
      limit: 10000, // حد أقصى للتصدير
    });

    return result.logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userName: log.user?.username || log.user?.email,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      branchName: log.branch?.name,
      warehouseName: log.warehouse?.name,
      success: log.success,
      severity: log.severity,
      category: log.category,
      module: log.module,
      ipAddress: log.ipAddress,
      errorMessage: log.errorMessage,
      details: log.details,
      oldValues: log.oldValues,
      newValues: log.newValues,
    }));
  }

  // ========== HELPER METHODS ==========

  /**
   * الحصول على عنوان IP للعميل
   */
  private getClientIp(): string {
    const forwarded = this.request.get('x-forwarded-for');
    const realIp = this.request.get('x-real-ip');
    const clientIp = this.request.get('x-client-ip');
    const cfConnectingIp = this.request.get('cf-connecting-ip');

    return forwarded?.split(',')[0].trim() ||
           realIp ||
           clientIp ||
           cfConnectingIp ||
           this.request.ip ||
           this.request.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * إنشاء نص قابل للبحث من بيانات التدقيق
   */
  private generateSearchableText(auditData: AuditLogData): string {
    const parts = [
      auditData.action,
      auditData.entity,
      auditData.entityId,
      auditData.referenceType,
      auditData.referenceId,
      auditData.module,
      auditData.errorMessage,
    ].filter(Boolean);

    // إضافة تفاصيل مهمة
    if (auditData.details) {
      Object.values(auditData.details).forEach(value => {
        if (typeof value === 'string') parts.push(value);
      });
    }

    return parts.join(' ').toLowerCase();
  }

  /**
   * إنشاء تتبع تفصيلي للتغييرات على كيان محدد
   */
  async getDetailedAuditTrail(entity: string, entityId: string): Promise<{
    entity: string;
    entityId: string;
    currentState: any;
    changeHistory: Array<{
      timestamp: Date;
      action: string;
      user: string;
      changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
        changeType: 'added' | 'modified' | 'removed';
      }>;
      details: any;
    }>;
    summary: {
      totalChanges: number;
      lastModified: Date;
      lastModifiedBy: string;
      createdAt: Date;
      createdBy: string;
    };
  }> {
    try {
      // الحصول على جميع السجلات المتعلقة بالكيان
      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          entity,
          entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (auditLogs.length === 0) {
        return {
          entity,
          entityId,
          currentState: null,
          changeHistory: [],
          summary: {
            totalChanges: 0,
            lastModified: new Date(),
            lastModifiedBy: '',
            createdAt: new Date(),
            createdBy: '',
          },
        };
      }

      // بناء حالة الكيان الحالية
      let currentState: any = {};
      const changeHistory: any[] = [];

      for (const log of auditLogs) {
        const changes: any[] = [];

        if (log.action === 'CREATE' && log.newValues) {
          // إنشاء الكيان
          Object.entries(log.newValues as any).forEach(([field, value]) => {
            currentState[field] = value;
            changes.push({
              field,
              oldValue: null,
              newValue: value,
              changeType: 'added',
            });
          });
        } else if (log.action === 'UPDATE' && log.oldValues && log.newValues) {
          // تحديث الكيان
          const oldValues = log.oldValues as any;
          const newValues = log.newValues as any;

          Object.keys({ ...oldValues, ...newValues }).forEach(field => {
            const oldValue = oldValues[field];
            const newValue = newValues[field];

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              currentState[field] = newValue;
              changes.push({
                field,
                oldValue,
                newValue,
                changeType: oldValue === undefined ? 'added' : newValue === undefined ? 'removed' : 'modified',
              });
            }
          });
        } else if (log.action === 'DELETE' && log.oldValues) {
          // حذف الكيان
          const oldValues = log.oldValues as any;
          Object.entries(oldValues).forEach(([field, value]) => {
            changes.push({
              field,
              oldValue: value,
              newValue: null,
              changeType: 'removed',
            });
          });
          currentState = { ...currentState, _deleted: true };
        }

        if (changes.length > 0) {
          changeHistory.push({
            timestamp: log.timestamp,
            action: log.action,
            user: log.user?.username || log.user?.email || 'غير معروف',
            changes,
            details: log.details,
          });
        }
      }

      // حساب الملخص
      const createLog = auditLogs.find(log => log.action === 'CREATE');
      const lastLog = auditLogs[auditLogs.length - 1];

      const summary = {
        totalChanges: changeHistory.length,
        lastModified: lastLog.timestamp,
        lastModifiedBy: lastLog.user?.username || lastLog.user?.email || 'غير معروف',
        createdAt: createLog?.timestamp || lastLog.timestamp,
        createdBy: createLog?.user?.username || createLog?.user?.email || 'غير معروف',
      };

      return {
        entity,
        entityId,
        currentState,
        changeHistory,
        summary,
      };
    } catch (error) {
      this.logger.error(`فشل في إنشاء تتبع التدقيق التفصيلي لـ ${entity}:${entityId}`, error);
      throw error;
    }
  }

  /**
   * مقارنة حالتين من الكيان
   */
  compareEntityStates(
    oldState: any,
    newState: any,
  ): Array<{
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'removed';
  }> {
    const changes: any[] = [];
    const allFields = new Set([...Object.keys(oldState || {}), ...Object.keys(newState || {})]);

    for (const field of allFields) {
      const oldValue = oldState?.[field];
      const newValue = newState?.[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        let changeType: 'added' | 'modified' | 'removed';

        if (oldValue === undefined || oldValue === null) {
          changeType = 'added';
        } else if (newValue === undefined || newValue === null) {
          changeType = 'removed';
        } else {
          changeType = 'modified';
        }

        changes.push({
          field,
          oldValue,
          newValue,
          changeType,
        });
      }
    }

    return changes;
  }

  /**
   * إنشاء تقرير التغييرات لفترة زمنية
   */
  async getChangeReport(
    startDate: Date,
    endDate: Date,
    entity?: string,
    userId?: string,
  ): Promise<{
    period: { start: Date; end: Date };
    summary: {
      totalChanges: number;
      entitiesAffected: number;
      usersInvolved: number;
      mostChangedEntity: string;
      mostActiveUser: string;
    };
    changesByEntity: Record<string, number>;
    changesByUser: Record<string, number>;
    changesByAction: Record<string, number>;
    recentChanges: Array<{
      timestamp: Date;
      entity: string;
      entityId: string;
      action: string;
      user: string;
      changesCount: number;
    }>;
  }> {
    try {
      const where: any = {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        action: {
          in: ['CREATE', 'UPDATE', 'DELETE'],
        },
      };

      if (entity) where.entity = entity;
      if (userId) where.userId = userId;

      const changes = await this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      // حساب الإحصائيات
      const changesByEntity: Record<string, number> = {};
      const changesByUser: Record<string, number> = {};
      const changesByAction: Record<string, number> = {};

      const entitiesAffected = new Set<string>();
      const usersInvolved = new Set<string>();

      changes.forEach(change => {
        changesByEntity[change.entity] = (changesByEntity[change.entity] || 0) + 1;
        changesByAction[change.action] = (changesByAction[change.action] || 0) + 1;

        const userKey = change.user?.username || change.user?.email || change.userId || 'unknown';
        changesByUser[userKey] = (changesByUser[userKey] || 0) + 1;

        entitiesAffected.add(change.entity);
        if (change.userId) usersInvolved.add(change.userId);
      });

      // العثور على الأكثر تغييراً
      const mostChangedEntity = Object.entries(changesByEntity)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      const mostActiveUser = Object.entries(changesByUser)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

      // التغييرات الأخيرة
      const recentChanges = changes.slice(0, 20).map(change => ({
        timestamp: change.timestamp,
        entity: change.entity,
        entityId: change.entityId,
        action: change.action,
        user: change.user?.username || change.user?.email || 'غير معروف',
        changesCount: this.countChangesInLog(change),
      }));

      return {
        period: { start: startDate, end: endDate },
        summary: {
          totalChanges: changes.length,
          entitiesAffected: entitiesAffected.size,
          usersInvolved: usersInvolved.size,
          mostChangedEntity,
          mostActiveUser,
        },
        changesByEntity,
        changesByUser,
        changesByAction,
        recentChanges,
      };
    } catch (error) {
      this.logger.error('فشل في إنشاء تقرير التغييرات', error);
      throw error;
    }
  }

  /**
   * حساب عدد التغييرات في سجل تدقيق
   */
  private countChangesInLog(log: any): number {
    let count = 0;

    if (log.newValues) {
      count += Object.keys(log.newValues).length;
    }

    if (log.oldValues) {
      count += Object.keys(log.oldValues).length;
    }

    return count;
  }

  /**
   * إبطال كاش التدقيق
   */
  private async invalidateAuditCache(): Promise<void> {
    const auditKeys = await this.cacheService.getKeys(`${this.auditCacheKey}:*`);
    for (const key of auditKeys) {
      await this.cacheService.delete(key);
    }
  }
}
