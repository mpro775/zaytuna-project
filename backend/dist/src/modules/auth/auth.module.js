"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const jwt_strategy_1 = require("../../common/strategies/jwt.strategy");
const local_strategy_1 = require("../../common/strategies/local.strategy");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permission_guard_1 = require("../../common/guards/permission.guard");
const role_guard_1 = require("../../common/guards/role.guard");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const role_controller_1 = require("./role.controller");
const role_service_1 = require("./role.service");
const permission_controller_1 = require("./permission.controller");
const permission_service_1 = require("./permission.service");
const local_auth_guard_1 = require("../../common/guards/local-auth.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('jwt.secret') || 'fallback-secret',
                    signOptions: {
                        expiresIn: parseInt(configService.get('jwt.accessTokenTtl', '900'), 10),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            permission_guard_1.PermissionGuard,
            role_guard_1.RoleGuard,
            local_auth_guard_1.LocalAuthGuard,
            prisma_service_1.PrismaService,
            cache_service_1.CacheService,
            auth_service_1.AuthService,
            role_service_1.RoleService,
            permission_service_1.PermissionService,
        ],
        exports: [
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            permission_guard_1.PermissionGuard,
            role_guard_1.RoleGuard,
            passport_1.PassportModule,
            jwt_1.JwtModule,
            prisma_service_1.PrismaService,
            cache_service_1.CacheService,
            auth_service_1.AuthService,
            role_service_1.RoleService,
            permission_service_1.PermissionService,
        ],
        controllers: [auth_controller_1.AuthController, role_controller_1.RoleController, permission_controller_1.PermissionController],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map