import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator لتحديد الصلاحيات المطلوبة للوصول للـ endpoint
 * @param permissions مصفوفة من الصلاحيات المطلوبة
 */
export const Permissions = (...permissions: string[]) => {
  return SetMetadata(PERMISSIONS_KEY, permissions);
};

/**
 * Decorator لجعل الـ endpoint متاح للجميع بدون مصادقة
 */
export const Public = () => {
  return SetMetadata(IS_PUBLIC_KEY, true);
};

/**
 * Decorator لتحديد أن الـ endpoint يتطلب صلاحية القراءة
 */
export const RequireRead = () => {
  return Permissions('read');
};

/**
 * Decorator لتحديد أن الـ endpoint يتطلب صلاحية الكتابة
 */
export const RequireWrite = () => {
  return Permissions('write');
};

/**
 * Decorator لتحديد أن الـ endpoint يتطلب صلاحية الإنشاء
 */
export const RequireCreate = () => {
  return Permissions('create');
};

/**
 * Decorator لتحديد أن الـ endpoint يتطلب صلاحية التعديل
 */
export const RequireUpdate = () => {
  return Permissions('update');
};

/**
 * Decorator لتحديد أن الـ endpoint يتطلب صلاحية الحذف
 */
export const RequireDelete = () => {
  return Permissions('delete');
};

/**
 * Decorator لتحديد أن الـ endpoint يتطلب صلاحية الإدارة
 */
export const RequireAdmin = () => {
  return Permissions('admin');
};

/**
 * فئة مساعدة للتحقق من الصلاحيات
 */
export class PermissionChecker {
  constructor(private reflector: Reflector) {}

  /**
   * الحصول على الصلاحيات المطلوبة للـ handler
   */
  getRequiredPermissions(context: any): string[] | undefined {
    return this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /**
   * التحقق من أن الـ endpoint عام
   */
  isPublic(context: any): boolean {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? false;
  }

  /**
   * التحقق من وجود صلاحيات مطلوبة
   */
  hasRequiredPermissions(requiredPermissions: string[], userPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // لا توجد صلاحيات مطلوبة
    }

    return requiredPermissions.some(requiredPerm =>
      userPermissions.some(userPerm => this.matchesPermission(userPerm, requiredPerm))
    );
  }

  /**
   * التحقق من تطابق الصلاحية (يدعم wildcards)
   */
  private matchesPermission(userPermission: string, requiredPermission: string): boolean {
    // تطابق دقيق
    if (userPermission === requiredPermission) {
      return true;
    }

    // دعم wildcards
    if (requiredPermission.includes('*')) {
      const regex = new RegExp(
        requiredPermission.replace(/\*/g, '.*').replace(/\./g, '\\.')
      );
      return regex.test(userPermission);
    }

    // دعم الصلاحيات الهرمية (مثل: user.create.branch_1)
    if (userPermission.startsWith(requiredPermission + '.')) {
      return true;
    }

    return false;
  }
}
