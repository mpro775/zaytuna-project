import type { Conflict, ConflictResolution, LocalEntity } from './types';

export interface ConflictAnalysis {
  entityType: string;
  entityId: string;
  localVersion: LocalEntity;
  serverVersion: any;
  differences: ConflictDifference[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: ConflictResolution['resolution'];
  reason: string;
  riskAssessment: {
    dataLoss: 'none' | 'low' | 'medium' | 'high';
    businessImpact: 'none' | 'low' | 'medium' | 'high';
    userImpact: 'none' | 'low' | 'medium' | 'high';
  };
}

export interface ConflictDifference {
  field: string;
  localValue: any;
  serverValue: any;
  type:
    | 'value_change'
    | 'type_change'
    | 'field_added'
    | 'field_removed'
    | 'array_item_added'
    | 'array_item_removed';
  significance: 'low' | 'medium' | 'high';
  fieldCategory: 'core' | 'metadata' | 'relations' | 'computed';
}

export interface SmartResolutionStrategy {
  name: string;
  description: string;
  applicableTo: string[]; // أنواع الكيانات التي تنطبق عليها
  priority: number; // أولوية الاستراتيجية (الأعلى أولاً)
  canAutoResolve: boolean;
  resolver: (analysis: ConflictAnalysis) => ConflictResolution | null;
}

export class ConflictResolver {
  private conflicts: Conflict[] = [];
  private readonly maxConflicts: number = 100;
  private smartStrategies: SmartResolutionStrategy[] = [];
  private conflictHistory: Map<string, ConflictResolution[]> = new Map();

  constructor() {
    this.initializeSmartStrategies();
  }

  // تهيئة الاستراتيجيات الذكية للحل التلقائي
  private initializeSmartStrategies(): void {
    this.smartStrategies = [
      // استراتيجية: دمج مخزون المنتجات
      {
        name: 'inventory_merge',
        description: 'دمج تغييرات المخزون فقط',
        applicableTo: ['Product', 'ProductVariant'],
        priority: 100,
        canAutoResolve: true,
        resolver: this.inventoryMergeResolver.bind(this),
      },

      // استراتيجية: دمج بيانات العملاء
      {
        name: 'customer_data_merge',
        description: 'دمج عناوين وأرقام الهواتف للعملاء',
        applicableTo: ['Customer'],
        priority: 90,
        canAutoResolve: true,
        resolver: this.customerDataMergeResolver.bind(this),
      },

      // استراتيجية: تحديث البيانات الوصفية فقط
      {
        name: 'metadata_update_only',
        description: 'قبول تحديثات البيانات الوصفية فقط',
        applicableTo: ['*'], // جميع الكيانات
        priority: 80,
        canAutoResolve: true,
        resolver: this.metadataOnlyResolver.bind(this),
      },

      // استراتيجية: الأحدث يفوز (للحقول غير الحساسة)
      {
        name: 'latest_wins_non_critical',
        description: 'اختيار النسخة الأحدث للحقول غير الحساسة',
        applicableTo: ['*'],
        priority: 70,
        canAutoResolve: true,
        resolver: this.latestWinsNonCriticalResolver.bind(this),
      },

      // استراتيجية: حل يدوي مطلوب
      {
        name: 'manual_resolution_required',
        description: 'يتطلب تدخل يدوي',
        applicableTo: ['SalesInvoice', 'PurchaseOrder'],
        priority: 10,
        canAutoResolve: false,
        resolver: () => null,
      },
    ];
  }

  // تحليل تضارب متقدم
  analyzeConflict(
    entity: string,
    entityId: string,
    localData: LocalEntity,
    serverData: any
  ): ConflictAnalysis {
    const differences = this.compareEntities(localData, serverData);

    const severity = this.calculateSeverity(differences, entity);
    const riskAssessment = this.assessRisk(differences, entity);

    // تحديد الاستراتيجية الموصى بها
    const recommendedStrategy = this.findBestStrategy(entity, differences, severity);

    return {
      entityType: entity,
      entityId,
      localVersion: localData,
      serverVersion: serverData,
      differences,
      severity,
      recommendedAction: recommendedStrategy?.resolution || 'manual',
      reason: recommendedStrategy?.reason || 'يتطلب تدخل يدوي',
      riskAssessment,
    };
  }

  // مقارنة الكيانات وإيجاد الاختلافات
  private compareEntities(local: any, server: any): ConflictDifference[] {
    const differences: ConflictDifference[] = [];
    const allFields = new Set([...Object.keys(local), ...Object.keys(server)]);

    for (const field of allFields) {
      const localValue = local[field];
      const serverValue = server[field];

      // حقل موجود محلياً فقط
      if (localValue !== undefined && serverValue === undefined) {
        differences.push({
          field,
          localValue,
          serverValue,
          type: 'field_added',
          significance: this.getFieldSignificance(field),
          fieldCategory: this.getFieldCategory(field),
        });
        continue;
      }

      // حقل موجود على الخادم فقط
      if (localValue === undefined && serverValue !== undefined) {
        differences.push({
          field,
          localValue,
          serverValue,
          type: 'field_removed',
          significance: this.getFieldSignificance(field),
          fieldCategory: this.getFieldCategory(field),
        });
        continue;
      }

      // مقارنة القيم
      if (!this.areValuesEqual(localValue, serverValue)) {
        // فحص المصفوفات
        if (Array.isArray(localValue) && Array.isArray(serverValue)) {
          const arrayDiffs = this.compareArrays(field, localValue, serverValue);
          differences.push(...arrayDiffs);
        } else {
          differences.push({
            field,
            localValue,
            serverValue,
            type: 'value_change',
            significance: this.getFieldSignificance(field),
            fieldCategory: this.getFieldCategory(field),
          });
        }
      }
    }

    return differences;
  }

  // مقارنة المصفوفات
  private compareArrays(
    field: string,
    localArray: any[],
    serverArray: any[]
  ): ConflictDifference[] {
    const differences: ConflictDifference[] = [];

    // البحث عن العناصر المضافة
    for (const item of localArray) {
      if (!serverArray.some(s => this.areValuesEqual(item, s))) {
        differences.push({
          field: `${field}[]`,
          localValue: item,
          serverValue: null,
          type: 'array_item_added',
          significance: 'medium',
          fieldCategory: this.getFieldCategory(field),
        });
      }
    }

    // البحث عن العناصر المحذوفة
    for (const item of serverArray) {
      if (!localArray.some(l => this.areValuesEqual(item, l))) {
        differences.push({
          field: `${field}[]`,
          localValue: null,
          serverValue: item,
          type: 'array_item_removed',
          significance: 'medium',
          fieldCategory: this.getFieldCategory(field),
        });
      }
    }

    return differences;
  }

  // فحص تساوي القيم
  private areValuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;

    // مقارنة التواريخ
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // مقارنة الكائنات
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  // حساب شدة التضارب
  private calculateSeverity(
    differences: ConflictDifference[],
    entityType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const highSignificance = differences.filter(d => d.significance === 'high').length;
    const coreFields = differences.filter(d => d.fieldCategory === 'core').length;

    if (entityType === 'SalesInvoice' || entityType === 'PurchaseOrder') {
      return coreFields > 0 ? 'critical' : 'high';
    }

    if (highSignificance > 0 || coreFields > 2) return 'high';
    if (coreFields > 0) return 'medium';
    return 'low';
  }

  // تقييم المخاطر
  private assessRisk(differences: ConflictDifference[], entityType: string) {
    const coreChanges = differences.filter(d => d.fieldCategory === 'core');
    const highImpact = differences.filter(d => d.significance === 'high');

    let dataLoss: 'none' | 'low' | 'medium' | 'high' = 'none';
    let businessImpact: 'none' | 'low' | 'medium' | 'high' = 'none';
    let userImpact: 'none' | 'low' | 'medium' | 'high' = 'none';

    // تقييم فقدان البيانات
    if (coreChanges.length > 0) dataLoss = 'high';
    else if (highImpact.length > 0) dataLoss = 'medium';

    // تقييم التأثير على الأعمال
    if (['SalesInvoice', 'PurchaseOrder', 'Product'].includes(entityType)) {
      businessImpact = coreChanges.length > 0 ? 'high' : 'medium';
    }

    // تقييم التأثير على المستخدم
    if (entityType === 'Customer' && coreChanges.length > 0) {
      userImpact = 'high';
    }

    return { dataLoss, businessImpact, userImpact };
  }

  // إيجاد أفضل استراتيجية
  private findBestStrategy(
    entityType: string,
    differences: ConflictDifference[],
    severity: string
  ) {
    const applicableStrategies = this.smartStrategies
      .filter(s => s.applicableTo.includes('*') || s.applicableTo.includes(entityType))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      const mockAnalysis: ConflictAnalysis = {
        entityType,
        entityId: '',
        localVersion: {} as LocalEntity,
        serverVersion: {},
        differences,
        severity: severity as any,
        recommendedAction: 'manual',
        reason: '',
        riskAssessment: { dataLoss: 'none', businessImpact: 'none', userImpact: 'none' },
      };

      const resolution = strategy.resolver(mockAnalysis);
      if (resolution && strategy.canAutoResolve) {
        return {
          resolution: resolution.resolution,
          reason: strategy.description,
          strategy: strategy.name,
        };
      }
    }

    return null;
  }

  // ========== الاستراتيجيات الذكية للحل ==========

  // استراتيجية دمج المخزون
  private inventoryMergeResolver(analysis: ConflictAnalysis): ConflictResolution | null {
    const inventoryFields = ['stockQuantity', 'minStockLevel', 'maxStockLevel', 'reorderPoint'];
    const onlyInventoryChanges = analysis.differences.every(
      diff => inventoryFields.includes(diff.field) || diff.fieldCategory === 'metadata'
    );

    if (!onlyInventoryChanges) return null;

    // دمج المخزون - اختيار القيمة الأعلى للمخزون المتاح
    const local = analysis.localVersion as any;
    const server = analysis.serverVersion;

    const resolvedData = {
      ...server,
      stockQuantity: Math.max(local.stockQuantity || 0, server.stockQuantity || 0),
      minStockLevel: Math.max(local.minStockLevel || 0, server.minStockLevel || 0),
      maxStockLevel: Math.max(local.maxStockLevel || 0, server.maxStockLevel || 0),
      lastModified: new Date(),
      lastInventoryUpdate: new Date(),
    };

    return {
      conflictId: crypto.randomUUID(),
      resolution: 'merge',
      resolvedData,
    };
  }

  // استراتيجية دمج بيانات العملاء
  private customerDataMergeResolver(analysis: ConflictAnalysis): ConflictResolution | null {
    const coreFields = ['name', 'email', 'phone', 'taxId'];
    const hasCoreConflicts = analysis.differences.some(
      diff => coreFields.includes(diff.field) && diff.type === 'value_change'
    );

    if (hasCoreConflicts) return null; // لا يمكن الدمج إذا كانت الحقول الأساسية متعارضة

    const local = analysis.localVersion as any;
    const server = analysis.serverVersion;

    const resolvedData = {
      ...server,
      // دمج العناوين
      addresses: [...(server.addresses || []), ...(local.addresses || [])].filter(
        (addr: any, index: number, arr: any[]) =>
          arr.findIndex((a: any) => a.type === addr.type && a.street === addr.street) === index
      ),

      // دمج أرقام الهواتف
      phoneNumbers: [...(server.phoneNumbers || []), ...(local.phoneNumbers || [])].filter(
        (phone: any, index: number, arr: any[]) =>
          arr.findIndex((p: any) => p.number === phone.number) === index
      ),

      lastModified: new Date(),
    };

    return {
      conflictId: crypto.randomUUID(),
      resolution: 'merge',
      resolvedData,
    };
  }

  // استراتيجية تحديث البيانات الوصفية فقط
  private metadataOnlyResolver(analysis: ConflictAnalysis): ConflictResolution | null {
    const metadataFields = ['lastModified', 'updatedAt', 'updatedBy', 'version', 'etag'];
    const onlyMetadataChanges = analysis.differences.every(
      diff => metadataFields.includes(diff.field) || diff.fieldCategory === 'metadata'
    );

    if (!onlyMetadataChanges) return null;

    // اختيار النسخة الأحدث
    const localTime = new Date(analysis.localVersion.lastModified || 0).getTime();
    const serverTime = new Date(analysis.serverVersion.lastModified || 0).getTime();

    return {
      conflictId: crypto.randomUUID(),
      resolution: localTime > serverTime ? 'local' : 'server',
    };
  }

  // استراتيجية الأحدث يفوز للحقول غير الحساسة
  private latestWinsNonCriticalResolver(analysis: ConflictAnalysis): ConflictResolution | null {
    // فحص إذا كانت جميع التغييرات غير حساسة
    const hasCriticalChanges = analysis.differences.some(
      diff => diff.significance === 'high' || diff.fieldCategory === 'core'
    );

    if (hasCriticalChanges) return null;

    // اختيار النسخة الأحدث
    const localTime = new Date(analysis.localVersion.lastModified || 0).getTime();
    const serverTime = new Date(analysis.serverVersion.lastModified || 0).getTime();

    return {
      conflictId: crypto.randomUUID(),
      resolution: localTime > serverTime ? 'local' : 'server',
    };
  }

  // ========== مساعدات ==========

  // تحديد أهمية الحقل
  private getFieldSignificance(field: string): 'low' | 'medium' | 'high' {
    const highImportance = [
      'id',
      'code',
      'name',
      'email',
      'phone',
      'total',
      'amount',
      'price',
      'stockQuantity',
      'status',
      'type',
      'category',
    ];

    const mediumImportance = [
      'description',
      'notes',
      'address',
      'createdAt',
      'updatedAt',
      'minStockLevel',
      'maxStockLevel',
      'unit',
      'taxRate',
    ];

    if (highImportance.includes(field)) return 'high';
    if (mediumImportance.includes(field)) return 'medium';
    return 'low';
  }

  // تحديد فئة الحقل
  private getFieldCategory(field: string): 'core' | 'metadata' | 'relations' | 'computed' {
    const coreFields = [
      'id',
      'code',
      'name',
      'title',
      'email',
      'phone',
      'total',
      'amount',
      'price',
      'status',
      'type',
      'category',
      'stockQuantity',
    ];

    const metadataFields = [
      'createdAt',
      'updatedAt',
      'createdBy',
      'updatedBy',
      'version',
      'lastModified',
      'etag',
      'syncVersion',
    ];

    const relationFields = [
      'customerId',
      'productId',
      'supplierId',
      'warehouseId',
      'branchId',
      'userId',
      'parentId',
      'children',
      'tags',
      'attachments',
    ];

    const computedFields = [
      'subtotal',
      'taxAmount',
      'discountAmount',
      'netTotal',
      'totalItems',
      'totalQuantity',
      'averagePrice',
    ];

    if (coreFields.includes(field)) return 'core';
    if (metadataFields.includes(field)) return 'metadata';
    if (relationFields.includes(field)) return 'relations';
    if (computedFields.includes(field)) return 'computed';

    return 'metadata'; // افتراضي
  }

  // ========== الوظائف الأساسية المحدثة ==========

  // اكتشاف تضارب
  detectConflict(
    entity: string,
    entityId: string,
    localData: any,
    serverData: any,
    localVersion?: number,
    serverVersion?: number
  ): Conflict | null {
    // تحقق من تضارب الإصدارات
    if (localVersion && serverVersion && localVersion !== serverVersion) {
      return {
        id: crypto.randomUUID(),
        entity,
        entityId,
        localVersion: localData,
        serverVersion: serverData,
        conflictType: 'version',
        timestamp: new Date(),
        resolved: false,
      };
    }

    // تحقق من تضارب البيانات (مقارنة مبسطة)
    if (this.hasDataConflict(localData, serverData)) {
      return {
        id: crypto.randomUUID(),
        entity,
        entityId,
        localVersion: localData,
        serverVersion: serverData,
        conflictType: 'data',
        timestamp: new Date(),
        resolved: false,
      };
    }

    return null;
  }

  // حل تضارب تلقائي متقدم
  resolveConflictAutomatically(conflict: Conflict): ConflictResolution | null {
    try {
      // تحليل التضارب أولاً
      const analysis = this.analyzeConflict(
        conflict.entity,
        conflict.entityId,
        conflict.localVersion,
        conflict.serverVersion
      );

      // البحث عن أفضل استراتيجية
      const applicableStrategies = this.smartStrategies
        .filter(s => s.applicableTo.includes('*') || s.applicableTo.includes(conflict.entity))
        .sort((a, b) => b.priority - a.priority);

      for (const strategy of applicableStrategies) {
        if (strategy.canAutoResolve) {
          const resolution = strategy.resolver(analysis);
          if (resolution) {
            // حفظ في التاريخ
            const history = this.conflictHistory.get(conflict.entity) || [];
            history.push({
              conflictId: conflict.id,
              resolution: resolution.resolution,
              resolvedData: resolution.resolvedData,
              timestamp: new Date(),
              strategy: strategy.name,
              analysis: analysis,
            });
            this.conflictHistory.set(conflict.entity, history);

            console.log(`Auto-resolved conflict using strategy: ${strategy.name}`);
            return resolution;
          }
        }
      }

      return null; // لا يمكن الحل التلقائي
    } catch (error) {
      console.error('Error in automatic conflict resolution:', error);
      return null;
    }
  }

  // حل بالتوقيت (الأحدث يفوز)

  // إضافة تضارب للقائمة
  addConflict(conflict: Conflict): void {
    this.conflicts.unshift(conflict); // إضافة في البداية

    // الحفاظ على الحد الأقصى
    if (this.conflicts.length > this.maxConflicts) {
      this.conflicts = this.conflicts.slice(0, this.maxConflicts);
    }

    console.warn(
      `Conflict detected: ${conflict.entity}:${conflict.entityId} (${conflict.conflictType})`
    );
  }

  // حل تضارب
  resolveConflict(conflictId: string, resolution: ConflictResolution): boolean {
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);

    if (conflictIndex === -1) return false;

    const conflict = this.conflicts[conflictIndex];
    if (conflict) {
      conflict.resolved = true;
      conflict.resolution = resolution.resolution;
      conflict.resolvedData = resolution.resolvedData;

      console.log(
        `Conflict resolved: ${conflict.entity}:${conflict.entityId} -> ${resolution.resolution}`
      );
    }

    return true;
  }

  // جلب التضارب غير المحلول
  getUnresolvedConflicts(): Conflict[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  // جلب جميع التضارب
  getAllConflicts(): Conflict[] {
    return [...this.conflicts];
  }

  // تنظيف التضارب المحلول القديمة
  cleanupResolvedConflicts(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
    // 30 يوم
    const cutoffTime = Date.now() - maxAge;

    this.conflicts = this.conflicts.filter(
      conflict => !conflict.resolved || conflict.timestamp.getTime() > cutoffTime
    );
  }

  // إحصائيات التضارب الموسعة
  getConflictStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    autoResolved: number;
    manualResolved: number;
    byType: Record<string, number>;
    byEntity: Record<string, number>;
    bySeverity: Record<string, number>;
    byStrategy: Record<string, number>;
    resolutionRate: number;
    averageResolutionTime: number;
  } {
    const resolved = this.conflicts.filter(c => c.resolved).length;
    const unresolved = this.conflicts.filter(c => !c.resolved).length;

    const byType: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStrategy: Record<string, number> = {};

    let autoResolved = 0;
    let manualResolved = 0;
    let totalResolutionTime = 0;
    let resolutionCount = 0;

    this.conflicts.forEach(conflict => {
      byType[conflict.conflictType] = (byType[conflict.conflictType] || 0) + 1;
      byEntity[conflict.entity] = (byEntity[conflict.entity] || 0) + 1;

      if (conflict.resolved) {
        const history = this.conflictHistory
          .get(conflict.entity)
          ?.find(h => h.conflictId === conflict.id);
        if (history) {
          byStrategy[history.strategy || 'unknown'] =
            (byStrategy[history.strategy || 'unknown'] || 0) + 1;

          if (history.strategy !== 'manual') {
            autoResolved++;
          } else {
            manualResolved++;
          }

          // حساب وقت الحل
          if (history.timestamp) {
            const resolutionTime = history.timestamp.getTime() - conflict.timestamp.getTime();
            totalResolutionTime += resolutionTime;
            resolutionCount++;
          }
        }

        // تحليل شدة التضارب
        const analysis = this.analyzeConflict(
          conflict.entity,
          conflict.entityId,
          conflict.localVersion,
          conflict.serverVersion
        );
        bySeverity[analysis.severity] = (bySeverity[analysis.severity] || 0) + 1;
      }
    });

    return {
      total: this.conflicts.length,
      resolved,
      unresolved,
      autoResolved,
      manualResolved,
      byType,
      byEntity,
      bySeverity,
      byStrategy,
      resolutionRate: resolved / Math.max(this.conflicts.length, 1),
      averageResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
    };
  }

  // الحصول على تاريخ التضارب
  getConflictHistory(entityType?: string): Array<{
    conflictId: string;
    entityType: string;
    entityId: string;
    resolution: ConflictResolution['resolution'];
    strategy: string;
    timestamp: Date;
    analysis: ConflictAnalysis;
  }> {
    if (entityType) {
      const history = this.conflictHistory.get(entityType) || [];
      return history.map(item => ({
        conflictId: item.conflictId,
        entityType: entityType,
        entityId: item.analysis?.entityId || '',
        resolution: item.resolution,
        strategy: item.strategy || '',
        timestamp: item.timestamp || new Date(),
        analysis: item.analysis || ({} as ConflictAnalysis),
      }));
    }

    const allHistory: Array<{
      conflictId: string;
      entityType: string;
      entityId: string;
      resolution: ConflictResolution['resolution'];
      strategy: string;
      timestamp: Date;
      analysis: ConflictAnalysis;
    }> = [];
    this.conflictHistory.forEach((history, entity) => {
      history.forEach(item => {
        allHistory.push({
          conflictId: item.conflictId,
          entityType: entity,
          entityId: item.analysis?.entityId || '',
          resolution: item.resolution,
          strategy: item.strategy || '',
          timestamp: item.timestamp || new Date(),
          analysis: item.analysis || ({} as ConflictAnalysis),
        });
      });
    });

    return allHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // تنظيف التاريخ القديم
  cleanupHistory(maxAge: number = 90 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAge;
    let removedCount = 0;

    this.conflictHistory.forEach((history, entity) => {
      const originalLength = history.length;
      const filtered = history.filter(
        item => item.timestamp && item.timestamp.getTime() > cutoffTime
      );
      removedCount += originalLength - filtered.length;
      this.conflictHistory.set(entity, filtered);
    });

    return removedCount;
  }

  // مساعد: فحص تضارب البيانات
  private hasDataConflict(localData: any, serverData: any): boolean {
    // مقارنة مبسطة - يمكن تحسينها حسب الحاجة
    if (!localData || !serverData) return false;

    // مقارنة الحقول الأساسية
    const compareFields = ['name', 'title', 'code', 'description'];

    for (const field of compareFields) {
      if (
        localData[field] !== serverData[field] &&
        localData[field] !== null &&
        localData[field] !== undefined &&
        serverData[field] !== null &&
        serverData[field] !== undefined
      ) {
        return true;
      }
    }

    return false;
  }

  // مساعد: فحص إذا كان التغيير في المخزون فقط
 

  // مساعد: فحص إمكانية دمج بيانات العميل
}
