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
var RoleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
const permission_service_1 = require("./permission.service");
let RoleService = RoleService_1 = class RoleService {
    prisma;
    cacheService;
    permissionService;
    logger = new common_1.Logger(RoleService_1.name);
    rolesCacheKey = 'roles';
    userRolesCacheKey = 'user_roles';
    constructor(prisma, cacheService, permissionService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.permissionService = permissionService;
    }
    async create(createRoleDto) {
        try {
            this.logger.log(`إنشاء دور جديد: ${createRoleDto.name}`);
            const existingRole = await this.prisma.role.findUnique({
                where: { name: createRoleDto.name },
            });
            if (existingRole) {
                throw new common_1.ConflictException('الدور موجود بالفعل');
            }
            if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
                await this.validatePermissions(createRoleDto.permissions);
            }
            const role = await this.prisma.role.create({
                data: {
                    name: createRoleDto.name,
                    description: createRoleDto.description,
                    permissions: createRoleDto.permissions || [],
                    isSystemRole: createRoleDto.isSystemRole || false,
                },
                include: {
                    _count: {
                        select: { users: true },
                    },
                },
            });
            await this.invalidateRolesCache();
            const roleWithPermissions = {
                id: role.id,
                name: role.name,
                description: role.description || undefined,
                permissions: Array.isArray(role.permissions) ? role.permissions : [],
                userCount: role._count.users,
                isSystemRole: role.isSystemRole,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            };
            this.logger.log(`تم إنشاء الدور بنجاح: ${role.name}`);
            return roleWithPermissions;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء الدور: ${createRoleDto.name}`, error);
            throw error;
        }
    }
    async findAll() {
        try {
            const cachedRoles = await this.cacheService.get(this.rolesCacheKey);
            if (cachedRoles) {
                return cachedRoles;
            }
            const roles = await this.prisma.role.findMany({
                include: {
                    _count: {
                        select: { users: true },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const rolesWithPermissions = roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description || undefined,
                permissions: Array.isArray(role.permissions) ? role.permissions : [],
                userCount: role._count.users,
                isSystemRole: role.isSystemRole,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            }));
            await this.cacheService.set(this.rolesCacheKey, rolesWithPermissions, { ttl: 600 });
            return rolesWithPermissions;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على الأدوار', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const role = await this.prisma.role.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { users: true },
                    },
                },
            });
            if (!role) {
                throw new common_1.NotFoundException('الدور غير موجود');
            }
            return {
                id: role.id,
                name: role.name,
                description: role.description || undefined,
                permissions: Array.isArray(role.permissions) ? role.permissions : [],
                userCount: role._count.users,
                isSystemRole: role.isSystemRole,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            };
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على الدور: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateRoleDto) {
        try {
            this.logger.log(`تحديث الدور: ${id}`);
            const existingRole = await this.prisma.role.findUnique({
                where: { id },
            });
            if (!existingRole) {
                throw new common_1.NotFoundException('الدور غير موجود');
            }
            if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
                const roleWithSameName = await this.prisma.role.findUnique({
                    where: { name: updateRoleDto.name },
                });
                if (roleWithSameName) {
                    throw new common_1.ConflictException('اسم الدور موجود بالفعل');
                }
            }
            if (updateRoleDto.permissions && updateRoleDto.permissions.length > 0) {
                await this.validatePermissions(updateRoleDto.permissions);
            }
            if (existingRole.isSystemRole && updateRoleDto.isSystemRole === false) {
                throw new common_1.BadRequestException('لا يمكن تعديل الأدوار النظامية');
            }
            const role = await this.prisma.role.update({
                where: { id },
                data: {
                    name: updateRoleDto.name,
                    description: updateRoleDto.description,
                    permissions: updateRoleDto.permissions,
                    isSystemRole: updateRoleDto.isSystemRole,
                },
                include: {
                    _count: {
                        select: { users: true },
                    },
                },
            });
            await this.invalidateRolesCache();
            const roleWithPermissions = {
                id: role.id,
                name: role.name,
                description: role.description || undefined,
                permissions: Array.isArray(role.permissions) ? role.permissions : [],
                userCount: role._count.users,
                isSystemRole: role.isSystemRole,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
            };
            this.logger.log(`تم تحديث الدور بنجاح: ${role.name}`);
            return roleWithPermissions;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث الدور: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف الدور: ${id}`);
            const role = await this.prisma.role.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { users: true },
                    },
                },
            });
            if (!role) {
                throw new common_1.NotFoundException('الدور غير موجود');
            }
            if (role.isSystemRole) {
                throw new common_1.BadRequestException('لا يمكن حذف الأدوار النظامية');
            }
            if (role._count.users > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف دور مرتبط بمستخدمين');
            }
            await this.prisma.role.delete({
                where: { id },
            });
            await this.invalidateRolesCache();
            this.logger.log(`تم حذف الدور بنجاح: ${role.name}`);
            return { message: 'تم حذف الدور بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في حذف الدور: ${id}`, error);
            throw error;
        }
    }
    async assignRoleToUser(assignRoleDto) {
        try {
            this.logger.log(`تعيين دور ${assignRoleDto.roleId} للمستخدم ${assignRoleDto.userId}`);
            const user = await this.prisma.user.findUnique({
                where: { id: assignRoleDto.userId },
            });
            if (!user) {
                throw new common_1.NotFoundException('المستخدم غير موجود');
            }
            const role = await this.prisma.role.findUnique({
                where: { id: assignRoleDto.roleId },
            });
            if (!role) {
                throw new common_1.NotFoundException('الدور غير موجود');
            }
            await this.prisma.user.update({
                where: { id: assignRoleDto.userId },
                data: {
                    roleId: assignRoleDto.roleId,
                },
            });
            await this.invalidateUserRolesCache(assignRoleDto.userId);
            this.logger.log(`تم تعيين الدور ${role.name} للمستخدم ${user.username} بنجاح`);
            return { message: 'تم تعيين الدور للمستخدم بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في تعيين الدور للمستخدم`, error);
            throw error;
        }
    }
    async getUserRole(userId) {
        try {
            const cacheKey = `${this.userRolesCacheKey}:${userId}`;
            const cachedRole = await this.cacheService.get(cacheKey);
            if (cachedRole) {
                return cachedRole;
            }
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    role: {
                        include: {
                            _count: {
                                select: { users: true },
                            },
                        },
                    },
                },
            });
            if (!user?.role) {
                return null;
            }
            const roleWithPermissions = {
                id: user.role.id,
                name: user.role.name,
                description: user.role.description || undefined,
                permissions: Array.isArray(user.role.permissions) ? user.role.permissions : [],
                userCount: user.role._count.users,
                isSystemRole: user.role.isSystemRole,
                createdAt: user.role.createdAt,
                updatedAt: user.role.updatedAt,
            };
            await this.cacheService.set(cacheKey, roleWithPermissions, { ttl: 1800 });
            return roleWithPermissions;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على دور المستخدم: ${userId}`, error);
            throw error;
        }
    }
    async getUsersByRole(roleId) {
        try {
            const users = await this.prisma.user.findMany({
                where: { roleId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { username: 'asc' },
            });
            return users;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المستخدمين بالدور: ${roleId}`, error);
            throw error;
        }
    }
    async getRoleStats() {
        try {
            const totalRoles = await this.prisma.role.count();
            const systemRoles = await this.prisma.role.count({
                where: { isSystemRole: true },
            });
            const customRoles = totalRoles - systemRoles;
            const totalUsers = await this.prisma.user.count();
            const activeUsers = await this.prisma.user.count({
                where: { isActive: true },
            });
            return {
                totalRoles,
                systemRoles,
                customRoles,
                totalUsers,
                activeUsers,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الأدوار', error);
            throw error;
        }
    }
    async validatePermissions(permissions) {
        for (const permission of permissions) {
            if (!this.permissionService.isValidPermission(permission)) {
                throw new common_1.BadRequestException(`الصلاحية غير صحيحة: ${permission}`);
            }
        }
    }
    async invalidateRolesCache() {
        await this.cacheService.delete(this.rolesCacheKey);
    }
    async invalidateUserRolesCache(userId) {
        await this.cacheService.delete(`${this.userRolesCacheKey}:${userId}`);
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = RoleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        permission_service_1.PermissionService])
], RoleService);
//# sourceMappingURL=role.service.js.map