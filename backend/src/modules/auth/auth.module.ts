import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Strategies
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { LocalStrategy } from '../../common/strategies/local.strategy';

// Guards
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RoleGuard } from '../../common/guards/role.guard';

// Services
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

// Controllers and Services
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'fallback-secret',
        signOptions: {
          expiresIn: parseInt(configService.get<string>('jwt.accessTokenTtl', '900'), 10), // 15 minutes
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Strategies
    JwtStrategy,
    LocalStrategy,

    // Guards
    JwtAuthGuard,
    PermissionGuard,
    RoleGuard,
    LocalAuthGuard,

    // Services
    PrismaService,
    CacheService,
    AuthService,
    RoleService,
    PermissionService,
  ],
  exports: [
    // Strategies
    JwtStrategy,
    LocalStrategy,

    // Guards
    JwtAuthGuard,
    PermissionGuard,
    RoleGuard,

    // Modules
    PassportModule,
    JwtModule,

    // Services
    PrismaService,
    CacheService,
    AuthService,
    RoleService,
    PermissionService,
  ],
  controllers: [AuthController, RoleController, PermissionController],
})
export class AuthModule {}
