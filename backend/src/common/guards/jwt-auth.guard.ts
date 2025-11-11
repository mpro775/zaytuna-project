import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // التحقق من أن الـ endpoint عام
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // تطبيق JWT guard للـ endpoints المحمية
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // التحقق من الأخطاء
    if (err || !user) {
      let message = 'فشل في المصادقة';

      if (info?.name === 'TokenExpiredError') {
        message = 'انتهت صلاحية الرمز المميز';
      } else if (info?.name === 'JsonWebTokenError') {
        message = 'الرمز المميز غير صحيح';
      } else if (info?.message) {
        message = info.message;
      }

      this.logger.warn(`فشل في المصادقة: ${message}`, {
        error: err?.message,
        info: info?.message,
        path: context.switchToHttp().getRequest().path,
      });

      throw new UnauthorizedException(message);
    }

    return user;
  }
}
