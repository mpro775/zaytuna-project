import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionChecker } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);
  private readonly permissionChecker: PermissionChecker;

  constructor(private readonly reflector: Reflector) {
    this.permissionChecker = new PermissionChecker(reflector);
  }

  canActivate(context: ExecutionContext): boolean {
    // التحقق من أن الـ endpoint عام
    if (this.permissionChecker.isPublic(context)) {
      return true;
    }

    // الحصول على الصلاحيات المطلوبة
    const requiredPermissions = this.permissionChecker.getRequiredPermissions(context);

    // إذا لم تكن هناك صلاحيات مطلوبة، السماح بالوصول
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // الحصول على المستخدم من الطلب
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('المستخدم غير مصادق عليه');
    }

    // التحقق من الصلاحيات
    const hasPermission = this.permissionChecker.hasRequiredPermissions(
      requiredPermissions,
      user.permissions,
    );

    if (!hasPermission) {
      this.logger.warn(
        `تم رفض الوصول للمستخدم ${user.username} - الصلاحيات المطلوبة: ${requiredPermissions.join(', ')}`,
      );

      throw new ForbiddenException(
        'ليس لديك الصلاحيات المطلوبة للوصول إلى هذا المورد',
      );
    }

    this.logger.debug(
      `تم السماح بالوصول للمستخدم ${user.username} للصلاحيات: ${requiredPermissions.join(', ')}`,
    );

    return true;
  }
}
