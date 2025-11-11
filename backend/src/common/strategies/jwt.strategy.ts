import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

export interface JwtPayload {
  sub: string; // user id
  username: string;
  email: string;
  roleId: string;
  branchId?: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  roleId: string;
  branchId?: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      // التحقق من نوع الرمز المميز
      if (payload.type !== 'access') {
        throw new UnauthorizedException('نوع الرمز المميز غير صحيح');
      }

      // البحث عن المستخدم في قاعدة البيانات
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
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
        throw new UnauthorizedException('المستخدم غير موجود');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('الحساب غير نشط');
      }

      // التحقق من الجلسة في الكاش
      const sessionKey = `session:${payload.sub}:${payload.iat}`;
      const sessionData = await this.cacheService.get(sessionKey);

      if (!sessionData) {
        throw new UnauthorizedException('الجلسة منتهية الصلاحية');
      }

      // تحديث نشاط المستخدم في قاعدة البيانات
      await this.updateLastLogin(user.id);

      // إرجاع بيانات المستخدم المصادق عليه
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

      this.logger.debug(`تم التحقق من المستخدم: ${user.username}`);

      return authenticatedUser;

    } catch (error) {
      this.logger.error('فشل في التحقق من JWT:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('فشل في التحقق من الهوية');
    }
  }

  /**
   * تحديث وقت آخر تسجيل دخول للمستخدم
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.warn(`فشل في تحديث وقت آخر تسجيل دخول للمستخدم ${userId}:`, error);
    }
  }
}
