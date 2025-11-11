import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

export const ROLES_KEY = 'roles';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // الحصول على الأدوار المطلوبة
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // إذا لم تكن هناك أدوار مطلوبة، السماح بالوصول
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // الحصول على المستخدم من الطلب
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('المستخدم غير مصادق عليه');
    }

    // الحصول على دور المستخدم من قاعدة البيانات
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userWithRole?.role) {
      throw new ForbiddenException('دور المستخدم غير موجود');
    }

    // التحقق من الأدوار
    const userRole = userWithRole.role.name;
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      this.logger.warn(
        `تم رفض الوصول للمستخدم ${user.username} - الدور الحالي: ${userRole}, الأدوار المطلوبة: ${requiredRoles.join(', ')}`,
      );

      throw new ForbiddenException(
        'ليس لديك الدور المطلوب للوصول إلى هذا المورد',
      );
    }

    this.logger.debug(
      `تم السماح بالوصول للمستخدم ${user.username} بالدور: ${userRole}`,
    );

    return true;
  }
}
