import { Injectable, Logger } from '@nestjs/common';

export interface PermissionDefinition {
  name: string;
  description: string;
  category: string;
  children?: string[];
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  // تعريف جميع الصلاحيات المتاحة في النظام
  private readonly permissions: PermissionDefinition[] = [
    // صلاحيات النظام
    {
      name: 'system',
      description: 'صلاحيات النظام',
      category: 'system',
      children: ['system.admin', 'system.config', 'system.logs'],
    },
    {
      name: 'system.admin',
      description: 'إدارة النظام',
      category: 'system',
    },
    {
      name: 'system.config',
      description: 'إعدادات النظام',
      category: 'system',
    },
    {
      name: 'system.logs',
      description: 'عرض السجلات',
      category: 'system',
    },

    // صلاحيات المستخدمين
    {
      name: 'users',
      description: 'إدارة المستخدمين',
      category: 'users',
      children: ['users.read', 'users.create', 'users.update', 'users.delete', 'users.manage'],
    },
    {
      name: 'users.read',
      description: 'قراءة بيانات المستخدمين',
      category: 'users',
    },
    {
      name: 'users.create',
      description: 'إنشاء مستخدمين جدد',
      category: 'users',
    },
    {
      name: 'users.update',
      description: 'تحديث بيانات المستخدمين',
      category: 'users',
    },
    {
      name: 'users.delete',
      description: 'حذف المستخدمين',
      category: 'users',
    },
    {
      name: 'users.manage',
      description: 'إدارة شاملة للمستخدمين',
      category: 'users',
    },

    // صلاحيات الأدوار
    {
      name: 'roles',
      description: 'إدارة الأدوار',
      category: 'roles',
      children: ['roles.read', 'roles.create', 'roles.update', 'roles.delete', 'roles.assign'],
    },
    {
      name: 'roles.read',
      description: 'قراءة الأدوار والصلاحيات',
      category: 'roles',
    },
    {
      name: 'roles.create',
      description: 'إنشاء أدوار جديدة',
      category: 'roles',
    },
    {
      name: 'roles.update',
      description: 'تحديث الأدوار',
      category: 'roles',
    },
    {
      name: 'roles.delete',
      description: 'حذف الأدوار',
      category: 'roles',
    },
    {
      name: 'roles.assign',
      description: 'تعيين الأدوار للمستخدمين',
      category: 'roles',
    },

    // صلاحيات المنتجات
    {
      name: 'products',
      description: 'إدارة المنتجات',
      category: 'products',
      children: ['products.read', 'products.create', 'products.update', 'products.delete'],
    },
    {
      name: 'products.read',
      description: 'قراءة المنتجات',
      category: 'products',
    },
    {
      name: 'products.create',
      description: 'إنشاء منتجات جديدة',
      category: 'products',
    },
    {
      name: 'products.update',
      description: 'تحديث المنتجات',
      category: 'products',
    },
    {
      name: 'products.delete',
      description: 'حذف المنتجات',
      category: 'products',
    },

    // صلاحيات المبيعات
    {
      name: 'sales',
      description: 'إدارة المبيعات',
      category: 'sales',
      children: ['sales.read', 'sales.create', 'sales.update', 'sales.delete', 'sales.refund'],
    },
    {
      name: 'sales.read',
      description: 'قراءة فواتير المبيعات',
      category: 'sales',
    },
    {
      name: 'sales.create',
      description: 'إنشاء فواتير مبيعات',
      category: 'sales',
    },
    {
      name: 'sales.update',
      description: 'تحديث فواتير المبيعات',
      category: 'sales',
    },
    {
      name: 'sales.delete',
      description: 'حذف فواتير المبيعات',
      category: 'sales',
    },
    {
      name: 'sales.refund',
      description: 'معالجة المرتجعات والاسترداد',
      category: 'sales',
    },

    // صلاحيات المخزون
    {
      name: 'inventory',
      description: 'إدارة المخزون',
      category: 'inventory',
      children: ['inventory.read', 'inventory.adjust', 'inventory.transfer'],
    },
    {
      name: 'inventory.read',
      description: 'قراءة بيانات المخزون',
      category: 'inventory',
    },
    {
      name: 'inventory.adjust',
      description: 'تعديل المخزون',
      category: 'inventory',
    },
    {
      name: 'inventory.transfer',
      description: 'نقل المخزون بين المخازن',
      category: 'inventory',
    },

    // صلاحيات المشتريات
    {
      name: 'purchases',
      description: 'إدارة المشتريات',
      category: 'purchases',
      children: ['purchases.read', 'purchases.create', 'purchases.update'],
    },
    {
      name: 'purchases.read',
      description: 'قراءة فواتير المشتريات',
      category: 'purchases',
    },
    {
      name: 'purchases.create',
      description: 'إنشاء أوامر شراء',
      category: 'purchases',
    },
    {
      name: 'purchases.update',
      description: 'تحديث أوامر الشراء',
      category: 'purchases',
    },

    // صلاحيات المحاسبة
    {
      name: 'accounting',
      description: 'إدارة المحاسبة',
      category: 'accounting',
      children: ['accounting.read', 'accounting.journal', 'accounting.reports'],
    },
    {
      name: 'accounting.read',
      description: 'قراءة السجلات المحاسبية',
      category: 'accounting',
    },
    {
      name: 'accounting.journal',
      description: 'إدارة القيود اليومية',
      category: 'accounting',
    },
    {
      name: 'accounting.reports',
      description: 'عرض التقارير المالية',
      category: 'accounting',
    },

    // صلاحيات التقارير
    {
      name: 'reports',
      description: 'إدارة التقارير',
      category: 'reports',
      children: ['reports.sales', 'reports.inventory', 'reports.financial'],
    },
    {
      name: 'reports.sales',
      description: 'تقارير المبيعات',
      category: 'reports',
    },
    {
      name: 'reports.inventory',
      description: 'تقارير المخزون',
      category: 'reports',
    },
    {
      name: 'reports.financial',
      description: 'التقارير المالية',
      category: 'reports',
    },

    // صلاحيات الفروع والمخازن
    {
      name: 'branches',
      description: 'إدارة الفروع',
      category: 'branches',
      children: ['branches.read', 'branches.manage'],
    },
    {
      name: 'branches.read',
      description: 'قراءة بيانات الفروع',
      category: 'branches',
    },
    {
      name: 'branches.manage',
      description: 'إدارة الفروع والمخازن',
      category: 'branches',
    },

    // صلاحيات عامة
    {
      name: 'admin',
      description: 'صلاحيات إدارية كاملة',
      category: 'admin',
    },
    {
      name: 'read',
      description: 'صلاحية القراءة العامة',
      category: 'general',
    },
    {
      name: 'create',
      description: 'صلاحية الإنشاء العامة',
      category: 'general',
    },
    {
      name: 'update',
      description: 'صلاحية التحديث العامة',
      category: 'general',
    },
    {
      name: 'delete',
      description: 'صلاحية الحذف العامة',
      category: 'general',
    },
  ];

  /**
   * الحصول على جميع الصلاحيات
   */
  getAllPermissions(): PermissionDefinition[] {
    return this.permissions;
  }

  /**
   * الحصول على الصلاحيات بالفئة
   */
  getPermissionsByCategory(category: string): PermissionDefinition[] {
    return this.permissions.filter(permission => permission.category === category);
  }

  /**
   * الحصول على فئات الصلاحيات
   */
  getCategories(): string[] {
    const categories = this.permissions.map(p => p.category);
    return [...new Set(categories)];
  }

  /**
   * التحقق من صحة الصلاحية
   */
  isValidPermission(permission: string): boolean {
    return this.permissions.some(p => p.name === permission);
  }

  /**
   * الحصول على تفاصيل الصلاحية
   */
  getPermissionDetails(permission: string): PermissionDefinition | null {
    return this.permissions.find(p => p.name === permission) || null;
  }

  /**
   * الحصول على الصلاحيات الفرعية
   */
  getChildPermissions(parentPermission: string): string[] {
    const parent = this.permissions.find(p => p.name === parentPermission);
    if (!parent?.children) {
      return [];
    }

    const children = [...parent.children];
    // إضافة الأحفاد (recursive)
    for (const child of parent.children) {
      const grandChildren = this.getChildPermissions(child);
      children.push(...grandChildren);
    }

    return children;
  }

  /**
   * التحقق من أن الصلاحية تحتوي على صلاحيات فرعية
   */
  hasChildren(permission: string): boolean {
    const perm = this.permissions.find(p => p.name === permission);
    return !!(perm?.children && perm.children.length > 0);
  }

  /**
   * الحصول على صلاحيات المستخدم الموسعة (مع الصلاحيات الفرعية)
   */
  expandPermissions(userPermissions: string[]): string[] {
    const expandedPermissions = new Set(userPermissions);

    for (const permission of userPermissions) {
      // إضافة الصلاحيات الفرعية
      const children = this.getChildPermissions(permission);
      children.forEach(child => expandedPermissions.add(child));

      // إضافة الصلاحيات الأب
      const parents = this.getParentPermissions(permission);
      parents.forEach(parent => expandedPermissions.add(parent));
    }

    return Array.from(expandedPermissions);
  }

  /**
   * الحصول على الصلاحيات الأب
   */
  private getParentPermissions(permission: string): string[] {
    const parents: string[] = [];

    for (const perm of this.permissions) {
      if (perm.children?.includes(permission)) {
        parents.push(perm.name);
        // إضافة الأجداد (recursive)
        const grandParents = this.getParentPermissions(perm.name);
        parents.push(...grandParents);
      }
    }

    return parents;
  }

  /**
   * التحقق من وجود صلاحية محددة لدى المستخدم
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    const expandedPermissions = this.expandPermissions(userPermissions);
    return expandedPermissions.includes(requiredPermission);
  }

  /**
   * التحقق من وجود أي من الصلاحيات المطلوبة
   */
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission =>
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * التحقق من وجود جميع الصلاحيات المطلوبة
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission =>
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * الحصول على الصلاحيات المفقودة
   */
  getMissingPermissions(userPermissions: string[], requiredPermissions: string[]): string[] {
    const expandedPermissions = this.expandPermissions(userPermissions);
    return requiredPermissions.filter(permission =>
      !expandedPermissions.includes(permission)
    );
  }

  /**
   * تصفية الصلاحيات حسب النمط
   */
  filterPermissions(permissions: string[], pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return permissions.filter(permission => regex.test(permission));
  }
}
