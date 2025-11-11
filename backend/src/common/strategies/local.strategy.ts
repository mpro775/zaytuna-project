import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuthenticatedUser } from './jwt.strategy';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super({
      usernameField: 'username', // استخدام username بدلاً من email
      passwordField: 'password',
    });
  }

  async validate(username: string, password: string): Promise<AuthenticatedUser> {
    try {
      // البحث عن المستخدم بالـ username أو الـ email
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username },
          ],
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('الحساب غير نشط');
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      // تحديث وقت آخر تسجيل دخول
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      });

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        branchId: user.branchId || undefined,
        permissions: Array.isArray(user.role.permissions)
          ? (user.role.permissions as string[])
          : [],
      };

      this.logger.log(`تم تسجيل دخول المستخدم: ${user.username}`);

      return authenticatedUser;

    } catch (error) {
      this.logger.error('فشل في المصادقة المحلية:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('فشل في المصادقة');
    }
  }
}
