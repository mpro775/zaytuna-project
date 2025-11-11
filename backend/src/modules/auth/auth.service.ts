import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from '../../common/strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * تسجيل دخول المستخدم
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      this.logger.log(`محاولة تسجيل دخول للمستخدم: ${loginDto.username}`);

      // البحث عن المستخدم
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: loginDto.username },
            { email: loginDto.username },
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
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      // إنشاء الرموز المميزة
      const tokens = await this.generateTokens(user);

      // حفظ الجلسة في الكاش
      await this.createSession(user.id, tokens.accessToken);

      // تحديث وقت آخر تسجيل دخول
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      this.logger.log(`تم تسجيل دخول المستخدم بنجاح: ${user.username}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role.name,
          branch: user.branch?.name,
        },
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      this.logger.error(`فشل في تسجيل دخول المستخدم: ${loginDto.username}`, error);
      throw error;
    }
  }

  /**
   * تسجيل مستخدم جديد
   */
  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    try {
      this.logger.log(`محاولة تسجيل مستخدم جديد: ${registerDto.username}`);

      // التحقق من وجود المستخدم
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: registerDto.username },
            { email: registerDto.email },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.username === registerDto.username) {
          throw new ConflictException('اسم المستخدم موجود بالفعل');
        }
        if (existingUser.email === registerDto.email) {
          throw new ConflictException('البريد الإلكتروني موجود بالفعل');
        }
      }

      // التحقق من وجود الدور
      const role = await this.prisma.role.findUnique({
        where: { id: registerDto.roleId },
      });

      if (!role) {
        throw new BadRequestException('الدور المحدد غير موجود');
      }

      // التحقق من وجود الفرع (إذا تم تحديده)
      if (registerDto.branchId) {
        const branch = await this.prisma.branch.findUnique({
          where: { id: registerDto.branchId },
        });

        if (!branch) {
          throw new BadRequestException('الفرع المحدد غير موجود');
        }
      }

      // تشفير كلمة المرور
      const passwordHash = await this.hashPassword(registerDto.password);

      // إنشاء المستخدم
      const newUser = await this.prisma.user.create({
        data: {
          username: registerDto.username,
          email: registerDto.email,
          passwordHash,
          phone: registerDto.phone,
          roleId: registerDto.roleId,
          branchId: registerDto.branchId,
          isActive: true, // المستخدمين الجدد نشطون افتراضياً
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

      // إنشاء الرموز المميزة
      const tokens = await this.generateTokens(newUser);

      // حفظ الجلسة في الكاش
      await this.createSession(newUser.id, tokens.accessToken);

      this.logger.log(`تم تسجيل المستخدم بنجاح: ${newUser.username}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role.name,
          branch: newUser.branch?.name,
        },
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      this.logger.error(`فشل في تسجيل المستخدم: ${registerDto.username}`, error);
      throw error;
    }
  }

  /**
   * تحديث الرمز المميز
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    try {
      this.logger.log('محاولة تحديث الرمز المميز');

      // التحقق من صحة refresh token
      const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);

      // البحث عن المستخدم
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

      if (!user || !user.isActive) {
        throw new UnauthorizedException('المستخدم غير موجود أو غير نشط');
      }

      // إنشاء رموز مميزة جديدة
      const tokens = await this.generateTokens(user);

      // تحديث الجلسة في الكاش
      await this.updateSession(user.id, tokens.accessToken);

      this.logger.log(`تم تحديث الرمز المميز للمستخدم: ${user.username}`);

      return tokens;
    } catch (error) {
      this.logger.error('فشل في تحديث الرمز المميز', error);
      throw new UnauthorizedException('فشل في تحديث الرمز المميز');
    }
  }

  /**
   * تسجيل الخروج
   */
  async logout(userId: string): Promise<void> {
    try {
      this.logger.log(`تسجيل خروج المستخدم: ${userId}`);

      // حذف الجلسة من الكاش
      await this.destroySession(userId);

      this.logger.log(`تم تسجيل خروج المستخدم بنجاح: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في تسجيل خروج المستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * تغيير كلمة المرور
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      this.logger.log(`محاولة تغيير كلمة المرور للمستخدم: ${userId}`);

      // البحث عن المستخدم
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('المستخدم غير موجود');
      }

      // التحقق من كلمة المرور الحالية
      if (changePasswordDto.currentPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(
          changePasswordDto.currentPassword,
          user.passwordHash,
        );

        if (!isCurrentPasswordValid) {
          throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
        }
      }

      // تشفير كلمة المرور الجديدة
      const newPasswordHash = await this.hashPassword(changePasswordDto.newPassword);

      // تحديث كلمة المرور
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      // إنهاء جميع جلسات المستخدم (للأمان)
      await this.destroyAllUserSessions(userId);

      this.logger.log(`تم تغيير كلمة المرور بنجاح للمستخدم: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في تغيير كلمة المرور للمستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * إعادة تعيين كلمة المرور (للمشرفين)
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.log(`إعادة تعيين كلمة المرور للمستخدم: ${userId}`);

      // التحقق من وجود المستخدم
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('المستخدم غير موجود');
      }

      // تشفير كلمة المرور الجديدة
      const newPasswordHash = await this.hashPassword(newPassword);

      // تحديث كلمة المرور
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      // إنهاء جميع جلسات المستخدم
      await this.destroyAllUserSessions(userId);

      this.logger.log(`تم إعادة تعيين كلمة المرور بنجاح للمستخدم: ${userId}`);
    } catch (error) {
      this.logger.error(`فشل في إعادة تعيين كلمة المرور للمستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * إنشاء رموز مميزة للمستخدم
   */
  private async generateTokens(user: any): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      branchId: user.branchId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + parseInt(this.configService.get<string>('jwt.accessTokenTtl', '900'), 10),
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload);

    // إنشاء refresh token
    const refreshPayload: JwtPayload = {
      ...payload,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + parseInt(this.configService.get<string>('jwt.refreshTokenTtl', '604800'), 10),
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.refreshSecret') || this.configService.get<string>('jwt.secret'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseInt(this.configService.get<string>('jwt.accessTokenTtl', '900'), 10),
    };
  }

  /**
   * التحقق من صحة refresh token
   */
  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.refreshSecret') || this.configService.get<string>('jwt.secret'),
      });

      if (payload.type !== 'refresh') {
        throw new Error('نوع الرمز غير صحيح');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('الرمز المميز غير صحيح');
    }
  }

  /**
   * إنشاء جلسة في الكاش
   */
  private async createSession(userId: string, accessToken: string): Promise<void> {
    const sessionData = {
      userId,
      accessToken,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };

    const ttl = parseInt(this.configService.get<string>('jwt.refreshTokenTtl', '604800'), 10);
    await this.cacheService.set(`session:${userId}:${Date.now()}`, sessionData, { ttl });
  }

  /**
   * تحديث جلسة في الكاش
   */
  private async updateSession(userId: string, newAccessToken: string): Promise<void> {
    // البحث عن الجلسة الحالية وتحديثها
    const sessionKey = `session:${userId}:*`; // ستحتاج للبحث عن المفاتيح
    await this.createSession(userId, newAccessToken);
  }

  /**
   * إنهاء جلسة من الكاش
   */
  private async destroySession(userId: string): Promise<void> {
    // حذف جميع جلسات المستخدم
    await this.cacheService.deleteMany(`session:${userId}:*`);
  }

  /**
   * إنهاء جميع جلسات المستخدم
   */
  private async destroyAllUserSessions(userId: string): Promise<void> {
    await this.destroySession(userId);
  }

  /**
   * تشفير كلمة المرور
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
}
