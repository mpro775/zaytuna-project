"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    prisma;
    cacheService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(configService, prisma, cacheService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret') || 'fallback-secret',
        });
        this.configService = configService;
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async validate(payload) {
        try {
            if (payload.type !== 'access') {
                throw new common_1.UnauthorizedException('نوع الرمز المميز غير صحيح');
            }
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
                throw new common_1.UnauthorizedException('المستخدم غير موجود');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('الحساب غير نشط');
            }
            const sessionKey = `session:${payload.sub}:${payload.iat}`;
            const sessionData = await this.cacheService.get(sessionKey);
            if (!sessionData) {
                throw new common_1.UnauthorizedException('الجلسة منتهية الصلاحية');
            }
            await this.updateLastLogin(user.id);
            const authenticatedUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                roleId: user.roleId,
                branchId: user.branchId || undefined,
                permissions: Array.isArray(user.role.permissions)
                    ? user.role.permissions
                    : [],
            };
            this.logger.debug(`تم التحقق من المستخدم: ${user.username}`);
            return authenticatedUser;
        }
        catch (error) {
            this.logger.error('فشل في التحقق من JWT:', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('فشل في التحقق من الهوية');
        }
    }
    async updateLastLogin(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    lastLoginAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.warn(`فشل في تحديث وقت آخر تسجيل دخول للمستخدم ${userId}:`, error);
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map