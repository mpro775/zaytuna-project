import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { PermissionService } from './permission.service';

export interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  userCount: number;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  private readonly rolesCacheKey = 'roles';
  private readonly userRolesCacheKey = 'user_roles';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * إنشاء دور جديد
   */
  async create(createRoleDto: CreateRoleDto): Promise<RoleWithPermissions> {
    try {
      this.logger.log(`إنشاء دور جديد: ${createRoleDto.name}`);

      // التحقق من عدم وجود الدور
      const existingRole = await this.prisma.role.findUnique({
        where: { name: createRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException('الدور موجود بالفعل');
      }

      // التحقق من صحة الصلاحيات
      if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
        await this.validatePermissions(createRoleDto.permissions);
      }

      // إنشاء الدور
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

      // تحديث الكاش
      await this.invalidateRolesCache();

      const roleWithPermissions: RoleWithPermissions = {
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        permissions: Array.isArray(role.permissions) ? (role.permissions as string[]) : [],
        userCount: role._count.users,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };

      this.logger.log(`تم إنشاء الدور بنجاح: ${role.name}`);
      return roleWithPermissions;
    } catch (error) {
      this.logger.error(`فشل في إنشاء الدور: ${createRoleDto.name}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جميع الأدوار
   */
  async findAll(): Promise<RoleWithPermissions[]> {
    try {
      // محاولة الحصول من الكاش أولاً
      const cachedRoles = await this.cacheService.get<RoleWithPermissions[]>(this.rolesCacheKey);
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

      const rolesWithPermissions: RoleWithPermissions[] = roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        permissions: Array.isArray(role.permissions) ? (role.permissions as string[]) : [],
        userCount: role._count.users,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(this.rolesCacheKey, rolesWithPermissions, { ttl: 600 });

      return rolesWithPermissions;
    } catch (error) {
      this.logger.error('فشل في الحصول على الأدوار', error);
      throw error;
    }
  }

  /**
   * الحصول على دور بالمعرف
   */
  async findOne(id: string): Promise<RoleWithPermissions> {
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
        throw new NotFoundException('الدور غير موجود');
      }

      return {
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        permissions: Array.isArray(role.permissions) ? (role.permissions as string[]) : [],
        userCount: role._count.users,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };
    } catch (error) {
      this.logger.error(`فشل في الحصول على الدور: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث دور
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleWithPermissions> {
    try {
      this.logger.log(`تحديث الدور: ${id}`);

      // التحقق من وجود الدور
      const existingRole = await this.prisma.role.findUnique({
        where: { id },
      });

      if (!existingRole) {
        throw new NotFoundException('الدور غير موجود');
      }

      // التحقق من عدم تكرار الاسم
      if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
        const roleWithSameName = await this.prisma.role.findUnique({
          where: { name: updateRoleDto.name },
        });

        if (roleWithSameName) {
          throw new ConflictException('اسم الدور موجود بالفعل');
        }
      }

      // التحقق من الصلاحيات
      if (updateRoleDto.permissions && updateRoleDto.permissions.length > 0) {
        await this.validatePermissions(updateRoleDto.permissions);
      }

      // منع تعديل الأدوار النظامية إلا إذا كان المستخدم مشرف
      if (existingRole.isSystemRole && updateRoleDto.isSystemRole === false) {
        throw new BadRequestException('لا يمكن تعديل الأدوار النظامية');
      }

      // تحديث الدور
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

      // تحديث الكاش
      await this.invalidateRolesCache();

      const roleWithPermissions: RoleWithPermissions = {
        id: role.id,
        name: role.name,
        description: role.description || undefined,
        permissions: Array.isArray(role.permissions) ? (role.permissions as string[]) : [],
        userCount: role._count.users,
        isSystemRole: role.isSystemRole,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };

      this.logger.log(`تم تحديث الدور بنجاح: ${role.name}`);
      return roleWithPermissions;
    } catch (error) {
      this.logger.error(`فشل في تحديث الدور: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف دور
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`حذف الدور: ${id}`);

      // التحقق من وجود الدور
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!role) {
        throw new NotFoundException('الدور غير موجود');
      }

      // منع حذف الأدوار النظامية
      if (role.isSystemRole) {
        throw new BadRequestException('لا يمكن حذف الأدوار النظامية');
      }

      // التحقق من عدم وجود مستخدمين مرتبطين بالدور
      if (role._count.users > 0) {
        throw new BadRequestException('لا يمكن حذف دور مرتبط بمستخدمين');
      }

      // حذف الدور
      await this.prisma.role.delete({
        where: { id },
      });

      // تحديث الكاش
      await this.invalidateRolesCache();

      this.logger.log(`تم حذف الدور بنجاح: ${role.name}`);
      return { message: 'تم حذف الدور بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في حذف الدور: ${id}`, error);
      throw error;
    }
  }

  /**
   * تعيين دور لمستخدم
   */
  async assignRoleToUser(assignRoleDto: AssignRoleDto): Promise<{ message: string }> {
    try {
      this.logger.log(`تعيين دور ${assignRoleDto.roleId} للمستخدم ${assignRoleDto.userId}`);

      // التحقق من وجود المستخدم
      const user = await this.prisma.user.findUnique({
        where: { id: assignRoleDto.userId },
      });

      if (!user) {
        throw new NotFoundException('المستخدم غير موجود');
      }

      // التحقق من وجود الدور
      const role = await this.prisma.role.findUnique({
        where: { id: assignRoleDto.roleId },
      });

      if (!role) {
        throw new NotFoundException('الدور غير موجود');
      }

      // تحديث دور المستخدم
      await this.prisma.user.update({
        where: { id: assignRoleDto.userId },
        data: {
          roleId: assignRoleDto.roleId,
        },
      });

      // تحديث الكاش
      await this.invalidateUserRolesCache(assignRoleDto.userId);

      this.logger.log(`تم تعيين الدور ${role.name} للمستخدم ${user.username} بنجاح`);
      return { message: 'تم تعيين الدور للمستخدم بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في تعيين الدور للمستخدم`, error);
      throw error;
    }
  }

  /**
   * الحصول على دور المستخدم
   */
  async getUserRole(userId: string): Promise<RoleWithPermissions | null> {
    try {
      const cacheKey = `${this.userRolesCacheKey}:${userId}`;
      const cachedRole = await this.cacheService.get<RoleWithPermissions>(cacheKey);

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

      const roleWithPermissions: RoleWithPermissions = {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description || undefined,
        permissions: Array.isArray(user.role.permissions) ? (user.role.permissions as string[]) : [],
        userCount: user.role._count.users,
        isSystemRole: user.role.isSystemRole,
        createdAt: user.role.createdAt,
        updatedAt: user.role.updatedAt,
      };

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, roleWithPermissions, { ttl: 1800 });

      return roleWithPermissions;
    } catch (error) {
      this.logger.error(`فشل في الحصول على دور المستخدم: ${userId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على المستخدمين بالدور
   */
  async getUsersByRole(roleId: string) {
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
    } catch (error) {
      this.logger.error(`فشل في الحصول على المستخدمين بالدور: ${roleId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الأدوار
   */
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
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الأدوار', error);
      throw error;
    }
  }

  /**
   * التحقق من صحة الصلاحيات
   */
  private async validatePermissions(permissions: string[]): Promise<void> {
    for (const permission of permissions) {
      if (!this.permissionService.isValidPermission(permission)) {
        throw new BadRequestException(`الصلاحية غير صحيحة: ${permission}`);
      }
    }
  }

  /**
   * إبطال كاش الأدوار
   */
  private async invalidateRolesCache(): Promise<void> {
    await this.cacheService.delete(this.rolesCacheKey);
  }

  /**
   * إبطال كاش أدوار المستخدم
   */
  private async invalidateUserRolesCache(userId: string): Promise<void> {
    await this.cacheService.delete(`${this.userRolesCacheKey}:${userId}`);
  }
}
