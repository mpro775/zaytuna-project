import { SetMetadata } from '@nestjs/common';
import { AuditService } from '../../modules/audit/audit.service';

/**
 * Decorator لتسجيل عمليات التدقيق تلقائياً
 */
export const AUDIT_LOG = Symbol('AUDIT_LOG');

/**
 * خيارات تسجيل التدقيق
 */
export interface AuditLogOptions {
  entity?: string;
  entityIdParam?: string; // اسم المعامل الذي يحتوي على entityId
  entityIdProperty?: string; // اسم الخاصية في الكائن المُرجع
  action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'CUSTOM';
  customAction?: string;
  module?: string;
  referenceType?: string;
  referenceIdParam?: string;
  referenceIdProperty?: string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  excludeFields?: string[]; // الحقول التي لا نريد تسجيلها
  severity?: 'info' | 'warning' | 'error' | 'critical';
  category?: 'business' | 'security' | 'system' | 'audit';
  logOnSuccess?: boolean;
  logOnError?: boolean;
  condition?: (result: any, error?: any) => boolean; // شرط لتسجيل العملية
}

/**
 * Decorator لتسجيل عمليات التدقيق
 */
export function AuditLog(options: AuditLogOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    SetMetadata(AUDIT_LOG, options)(target, propertyKey, descriptor);
  };
}

/**
 * Decorators مُحددة للعمليات الشائعة
 */

/**
 * تسجيل عملية إنشاء
 */
export function AuditCreate(options: Omit<AuditLogOptions, 'action'> = {}) {
  return AuditLog({
    action: 'CREATE',
    logOnSuccess: true,
    logOnError: true,
    severity: 'info',
    category: 'business',
    ...options,
  });
}

/**
 * تسجيل عملية قراءة
 */
export function AuditRead(options: Omit<AuditLogOptions, 'action'> = {}) {
  return AuditLog({
    action: 'READ',
    logOnSuccess: true,
    severity: 'info',
    category: 'business',
    ...options,
  });
}

/**
 * تسجيل عملية تحديث
 */
export function AuditUpdate(options: Omit<AuditLogOptions, 'action'> = {}) {
  return AuditLog({
    action: 'UPDATE',
    logOnSuccess: true,
    logOnError: true,
    severity: 'info',
    category: 'business',
    includeRequestBody: true,
    ...options,
  });
}

/**
 * تسجيل عملية حذف
 */
export function AuditDelete(options: Omit<AuditLogOptions, 'action'> = {}) {
  return AuditLog({
    action: 'DELETE',
    logOnSuccess: true,
    logOnError: true,
    severity: 'warning',
    category: 'business',
    ...options,
  });
}

/**
 * تسجيل عمليات الأمان
 */
export function AuditSecurity(options: Omit<AuditLogOptions, 'category' | 'severity'> = {}) {
  return AuditLog({
    category: 'security',
    severity: 'warning',
    logOnSuccess: true,
    logOnError: true,
    ...options,
  });
}

/**
 * تسجيل عمليات تسجيل الدخول
 */
export function AuditAuth(options: Omit<AuditLogOptions, 'category' | 'module'> = {}) {
  return AuditLog({
    category: 'security',
    module: 'auth',
    logOnSuccess: true,
    logOnError: true,
    ...options,
  });
}

/**
 * تسجيل عمليات النظام
 */
export function AuditSystem(options: Omit<AuditLogOptions, 'category'> = {}) {
  return AuditLog({
    category: 'system',
    logOnSuccess: true,
    logOnError: true,
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات المبيعات
 */
export function AuditSales(options: Omit<AuditLogOptions, 'module'> = {}) {
  return AuditLog({
    module: 'sales',
    category: 'business',
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات المخزون
 */
export function AuditInventory(options: Omit<AuditLogOptions, 'module'> = {}) {
  return AuditLog({
    module: 'inventory',
    category: 'business',
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات المحاسبة
 */
export function AuditAccounting(options: Omit<AuditLogOptions, 'module'> = {}) {
  return AuditLog({
    module: 'accounting',
    category: 'business',
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات العملاء
 */
export function AuditCustomer(options: Omit<AuditLogOptions, 'module'> = {}) {
  return AuditLog({
    module: 'customer',
    category: 'business',
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات الموردين
 */
export function AuditPurchasing(options: Omit<AuditLogOptions, 'module'> = {}) {
  return AuditLog({
    module: 'purchasing',
    category: 'business',
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات التقارير
 */
export function AuditReporting(options: Omit<AuditLogOptions, 'module'> = {}) {
  return AuditLog({
    module: 'reporting',
    category: 'business',
    ...options,
  });
}

/**
 * Decorator لتسجيل عمليات الإدارة
 */
export function AuditAdmin(options: Omit<AuditLogOptions, 'category' | 'severity'> = {}) {
  return AuditLog({
    category: 'security',
    severity: 'warning',
    logOnSuccess: true,
    logOnError: true,
    ...options,
  });
}

/**
 * Helper function للحصول على قيمة من الكائن
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Helper function لتنظيف الكائن من الحقول الحساسة
 */
export function sanitizeObject(obj: any, excludeFields: string[] = []): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };

  // إزالة الحقول الحساسة الافتراضية
  const defaultSensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'key'];
  const allExcludeFields = [...defaultSensitiveFields, ...excludeFields];

  allExcludeFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Helper function لإنشاء searchable text من الكائن
 */
export function createSearchableText(obj: any): string {
  if (!obj) return '';

  const flatten = (o: any, prefix = ''): string[] => {
    const result: string[] = [];

    for (const [key, value] of Object.entries(o)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result.push(...flatten(value, newKey));
      } else if (typeof value === 'string' || typeof value === 'number') {
        result.push(String(value));
      }
    }

    return result;
  };

  return flatten(obj).join(' ').toLowerCase();
}
