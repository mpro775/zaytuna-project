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
var RoleGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleGuard = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../shared/database/prisma.service");
exports.ROLES_KEY = 'roles';
let RoleGuard = RoleGuard_1 = class RoleGuard {
    reflector;
    prisma;
    logger = new common_1.Logger(RoleGuard_1.name);
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(exports.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('المستخدم غير مصادق عليه');
        }
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
            throw new common_1.ForbiddenException('دور المستخدم غير موجود');
        }
        const userRole = userWithRole.role.name;
        const hasRequiredRole = requiredRoles.includes(userRole);
        if (!hasRequiredRole) {
            this.logger.warn(`تم رفض الوصول للمستخدم ${user.username} - الدور الحالي: ${userRole}, الأدوار المطلوبة: ${requiredRoles.join(', ')}`);
            throw new common_1.ForbiddenException('ليس لديك الدور المطلوب للوصول إلى هذا المورد');
        }
        this.logger.debug(`تم السماح بالوصول للمستخدم ${user.username} بالدور: ${userRole}`);
        return true;
    }
};
exports.RoleGuard = RoleGuard;
exports.RoleGuard = RoleGuard = RoleGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], RoleGuard);
//# sourceMappingURL=role.guard.js.map