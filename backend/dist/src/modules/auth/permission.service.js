"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PermissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
let PermissionService = PermissionService_1 = class PermissionService {
    logger = new common_1.Logger(PermissionService_1.name);
    permissions = [
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
    getAllPermissions() {
        return this.permissions;
    }
    getPermissionsByCategory(category) {
        return this.permissions.filter(permission => permission.category === category);
    }
    getCategories() {
        const categories = this.permissions.map(p => p.category);
        return [...new Set(categories)];
    }
    isValidPermission(permission) {
        return this.permissions.some(p => p.name === permission);
    }
    getPermissionDetails(permission) {
        return this.permissions.find(p => p.name === permission) || null;
    }
    getChildPermissions(parentPermission) {
        const parent = this.permissions.find(p => p.name === parentPermission);
        if (!parent?.children) {
            return [];
        }
        const children = [...parent.children];
        for (const child of parent.children) {
            const grandChildren = this.getChildPermissions(child);
            children.push(...grandChildren);
        }
        return children;
    }
    hasChildren(permission) {
        const perm = this.permissions.find(p => p.name === permission);
        return !!(perm?.children && perm.children.length > 0);
    }
    expandPermissions(userPermissions) {
        const expandedPermissions = new Set(userPermissions);
        for (const permission of userPermissions) {
            const children = this.getChildPermissions(permission);
            children.forEach(child => expandedPermissions.add(child));
            const parents = this.getParentPermissions(permission);
            parents.forEach(parent => expandedPermissions.add(parent));
        }
        return Array.from(expandedPermissions);
    }
    getParentPermissions(permission) {
        const parents = [];
        for (const perm of this.permissions) {
            if (perm.children?.includes(permission)) {
                parents.push(perm.name);
                const grandParents = this.getParentPermissions(perm.name);
                parents.push(...grandParents);
            }
        }
        return parents;
    }
    hasPermission(userPermissions, requiredPermission) {
        const expandedPermissions = this.expandPermissions(userPermissions);
        return expandedPermissions.includes(requiredPermission);
    }
    hasAnyPermission(userPermissions, requiredPermissions) {
        return requiredPermissions.some(permission => this.hasPermission(userPermissions, permission));
    }
    hasAllPermissions(userPermissions, requiredPermissions) {
        return requiredPermissions.every(permission => this.hasPermission(userPermissions, permission));
    }
    getMissingPermissions(userPermissions, requiredPermissions) {
        const expandedPermissions = this.expandPermissions(userPermissions);
        return requiredPermissions.filter(permission => !expandedPermissions.includes(permission));
    }
    filterPermissions(permissions, pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return permissions.filter(permission => regex.test(permission));
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = PermissionService_1 = __decorate([
    (0, common_1.Injectable)()
], PermissionService);
//# sourceMappingURL=permission.service.js.map