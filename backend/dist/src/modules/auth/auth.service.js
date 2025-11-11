"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    cacheService;
    logger = new common_1.Logger(AuthService_1.name);
    saltRounds = 12;
    constructor(prisma, jwtService, configService, cacheService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.cacheService = cacheService;
    }
    async login(loginDto) {
        try {
            this.logger.log(`محاولة تسجيل دخول للمستخدم: ${loginDto.username}`);
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
                throw new common_1.UnauthorizedException('بيانات الدخول غير صحيحة');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('الحساب غير نشط');
            }
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('بيانات الدخول غير صحيحة');
            }
            const tokens = await this.generateTokens(user);
            await this.createSession(user.id, tokens.accessToken);
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
        }
        catch (error) {
            this.logger.error(`فشل في تسجيل دخول المستخدم: ${loginDto.username}`, error);
            throw error;
        }
    }
    async register(registerDto) {
        try {
            this.logger.log(`محاولة تسجيل مستخدم جديد: ${registerDto.username}`);
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
                    throw new common_1.ConflictException('اسم المستخدم موجود بالفعل');
                }
                if (existingUser.email === registerDto.email) {
                    throw new common_1.ConflictException('البريد الإلكتروني موجود بالفعل');
                }
            }
            const role = await this.prisma.role.findUnique({
                where: { id: registerDto.roleId },
            });
            if (!role) {
                throw new common_1.BadRequestException('الدور المحدد غير موجود');
            }
            if (registerDto.branchId) {
                const branch = await this.prisma.branch.findUnique({
                    where: { id: registerDto.branchId },
                });
                if (!branch) {
                    throw new common_1.BadRequestException('الفرع المحدد غير موجود');
                }
            }
            const passwordHash = await this.hashPassword(registerDto.password);
            const newUser = await this.prisma.user.create({
                data: {
                    username: registerDto.username,
                    email: registerDto.email,
                    passwordHash,
                    phone: registerDto.phone,
                    roleId: registerDto.roleId,
                    branchId: registerDto.branchId,
                    isActive: true,
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
            const tokens = await this.generateTokens(newUser);
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
        }
        catch (error) {
            this.logger.error(`فشل في تسجيل المستخدم: ${registerDto.username}`, error);
            throw error;
        }
    }
    async refreshToken(refreshTokenDto) {
        try {
            this.logger.log('محاولة تحديث الرمز المميز');
            const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);
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
                throw new common_1.UnauthorizedException('المستخدم غير موجود أو غير نشط');
            }
            const tokens = await this.generateTokens(user);
            await this.updateSession(user.id, tokens.accessToken);
            this.logger.log(`تم تحديث الرمز المميز للمستخدم: ${user.username}`);
            return tokens;
        }
        catch (error) {
            this.logger.error('فشل في تحديث الرمز المميز', error);
            throw new common_1.UnauthorizedException('فشل في تحديث الرمز المميز');
        }
    }
    async logout(userId) {
        try {
            this.logger.log(`تسجيل خروج المستخدم: ${userId}`);
            await this.destroySession(userId);
            this.logger.log(`تم تسجيل خروج المستخدم بنجاح: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في تسجيل خروج المستخدم: ${userId}`, error);
            throw error;
        }
    }
    async changePassword(userId, changePasswordDto) {
        try {
            this.logger.log(`محاولة تغيير كلمة المرور للمستخدم: ${userId}`);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.BadRequestException('المستخدم غير موجود');
            }
            if (changePasswordDto.currentPassword) {
                const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash);
                if (!isCurrentPasswordValid) {
                    throw new common_1.BadRequestException('كلمة المرور الحالية غير صحيحة');
                }
            }
            const newPasswordHash = await this.hashPassword(changePasswordDto.newPassword);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    updatedAt: new Date(),
                },
            });
            await this.destroyAllUserSessions(userId);
            this.logger.log(`تم تغيير كلمة المرور بنجاح للمستخدم: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في تغيير كلمة المرور للمستخدم: ${userId}`, error);
            throw error;
        }
    }
    async resetPassword(userId, newPassword) {
        try {
            this.logger.log(`إعادة تعيين كلمة المرور للمستخدم: ${userId}`);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new common_1.BadRequestException('المستخدم غير موجود');
            }
            const newPasswordHash = await this.hashPassword(newPassword);
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    passwordHash: newPasswordHash,
                    updatedAt: new Date(),
                },
            });
            await this.destroyAllUserSessions(userId);
            this.logger.log(`تم إعادة تعيين كلمة المرور بنجاح للمستخدم: ${userId}`);
        }
        catch (error) {
            this.logger.error(`فشل في إعادة تعيين كلمة المرور للمستخدم: ${userId}`, error);
            throw error;
        }
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            roleId: user.roleId,
            branchId: user.branchId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + parseInt(this.configService.get('jwt.accessTokenTtl', '900'), 10),
            type: 'access',
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshPayload = {
            ...payload,
            type: 'refresh',
            exp: Math.floor(Date.now() / 1000) + parseInt(this.configService.get('jwt.refreshTokenTtl', '604800'), 10),
        };
        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: this.configService.get('jwt.refreshSecret') || this.configService.get('jwt.secret'),
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: parseInt(this.configService.get('jwt.accessTokenTtl', '900'), 10),
        };
    }
    async verifyRefreshToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('jwt.refreshSecret') || this.configService.get('jwt.secret'),
            });
            if (payload.type !== 'refresh') {
                throw new Error('نوع الرمز غير صحيح');
            }
            return payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('الرمز المميز غير صحيح');
        }
    }
    async createSession(userId, accessToken) {
        const sessionData = {
            userId,
            accessToken,
            createdAt: new Date(),
            lastActivity: new Date(),
            isActive: true,
        };
        const ttl = parseInt(this.configService.get('jwt.refreshTokenTtl', '604800'), 10);
        await this.cacheService.set(`session:${userId}:${Date.now()}`, sessionData, { ttl });
    }
    async updateSession(userId, newAccessToken) {
        const sessionKey = `session:${userId}:*`;
        await this.createSession(userId, newAccessToken);
    }
    async destroySession(userId) {
        await this.cacheService.deleteMany(`session:${userId}:*`);
    }
    async destroyAllUserSessions(userId) {
        await this.destroySession(userId);
    }
    async hashPassword(password) {
        return bcrypt.hash(password, this.saltRounds);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        cache_service_1.CacheService])
], AuthService);
//# sourceMappingURL=auth.service.js.map