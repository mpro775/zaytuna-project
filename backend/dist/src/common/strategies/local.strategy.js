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
var LocalStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_local_1 = require("passport-local");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../shared/database/prisma.service");
let LocalStrategy = LocalStrategy_1 = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy) {
    prisma;
    logger = new common_1.Logger(LocalStrategy_1.name);
    constructor(prisma) {
        super({
            usernameField: 'username',
            passwordField: 'password',
        });
        this.prisma = prisma;
    }
    async validate(username, password) {
        try {
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
                throw new common_1.UnauthorizedException('بيانات الدخول غير صحيحة');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('الحساب غير نشط');
            }
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('بيانات الدخول غير صحيحة');
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                },
            });
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
            this.logger.log(`تم تسجيل دخول المستخدم: ${user.username}`);
            return authenticatedUser;
        }
        catch (error) {
            this.logger.error('فشل في المصادقة المحلية:', error);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('فشل في المصادقة');
        }
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = LocalStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LocalStrategy);
//# sourceMappingURL=local.strategy.js.map