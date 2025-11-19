import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly saltRounds = 12;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * إنشاء مستخدم جديد
   */
  async create(createUserDto: CreateUserDto) {
    // التحقق من عدم وجود المستخدم
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('اسم المستخدم موجود بالفعل');
      }
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('البريد الإلكتروني موجود بالفعل');
      }
    }

    // التحقق من وجود الدور
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    // التحقق من وجود الفرع إذا تم تحديده
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: createUserDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }
    }

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(createUserDto.password, this.saltRounds);

    // إنشاء المستخدم
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        phone: createUserDto.phone,
        passwordHash,
        roleId: createUserDto.roleId,
        branchId: createUserDto.branchId,
        isActive: createUserDto.isActive ?? true,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // إزالة passwordHash من الاستجابة
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * الحصول على جميع المستخدمين
   */
  async findAll(options?: { branchId?: string; roleId?: string; isActive?: boolean }) {
    const where: any = {};

    if (options?.branchId) {
      where.branchId = options.branchId;
    }

    if (options?.roleId) {
      where.roleId = options.roleId;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
    });

    // إزالة passwordHash من الاستجابة
    return users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * الحصول على مستخدم بالمعرف
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // إزالة passwordHash من الاستجابة
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * تحديث مستخدم
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // التحقق من وجود المستخدم
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // التحقق من عدم تكرار اسم المستخدم أو البريد الإلكتروني
    if (updateUserDto.username || updateUserDto.email) {
      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateUserDto.username ? { username: updateUserDto.username } : {},
                updateUserDto.email ? { email: updateUserDto.email } : {},
              ].filter(condition => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicateUser) {
        if (updateUserDto.username && duplicateUser.username === updateUserDto.username) {
          throw new ConflictException('اسم المستخدم موجود بالفعل');
        }
        if (updateUserDto.email && duplicateUser.email === updateUserDto.email) {
          throw new ConflictException('البريد الإلكتروني موجود بالفعل');
        }
      }
    }

    // التحقق من وجود الدور إذا تم تحديده
    if (updateUserDto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: updateUserDto.roleId },
      });

      if (!role) {
        throw new NotFoundException('الدور غير موجود');
      }
    }

    // التحقق من وجود الفرع إذا تم تحديده
    if (updateUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: updateUserDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }
    }

    // تحديث المستخدم
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username,
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        roleId: updateUserDto.roleId,
        branchId: updateUserDto.branchId,
        isActive: updateUserDto.isActive,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // إزالة passwordHash من الاستجابة
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * حذف مستخدم
   */
  async remove(id: string) {
    // التحقق من وجود المستخدم
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // حذف المستخدم
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'تم حذف المستخدم بنجاح' };
  }

  /**
   * تغيير كلمة مرور المستخدم
   */
  async changePassword(id: string, changePasswordDto: ChangeUserPasswordDto) {
    // التحقق من وجود المستخدم
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // تشفير كلمة المرور الجديدة
    const passwordHash = await bcrypt.hash(changePasswordDto.newPassword, this.saltRounds);

    // تحديث كلمة المرور
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
      },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  /**
   * الحصول على إحصائيات المستخدمين
   */
  async getUserStats() {
    const [totalUsers, activeUsers, inactiveUsers, usersByRole, usersByBranch] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['roleId'],
        _count: { id: true },
      }),
      this.prisma.user.groupBy({
        by: ['branchId'],
        _count: { id: true },
        where: { branchId: { not: null } },
      }),
    ]);

    // جلب أسماء الأدوار والفروع
    const roles = await this.prisma.role.findMany({
      where: { id: { in: usersByRole.map(r => r.roleId) } },
      select: { id: true, name: true },
    });

    const branches = await this.prisma.branch.findMany({
      where: { id: { in: usersByBranch.map(b => b.branchId!).filter(Boolean) } },
      select: { id: true, name: true },
    });

    const roleMap = roles.reduce((acc, role) => ({ ...acc, [role.id]: role.name }), {});
    const branchMap = branches.reduce((acc, branch) => ({ ...acc, [branch.id]: branch.name }), {});

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: usersByRole.map(r => ({
        roleId: r.roleId,
        roleName: roleMap[r.roleId] || 'غير معروف',
        count: r._count.id,
      })),
      byBranch: usersByBranch.map(b => ({
        branchId: b.branchId,
        branchName: branchMap[b.branchId!] || 'غير معروف',
        count: b._count.id,
      })),
    };
  }

  /**
   * تبديل حالة المستخدم (تفعيل/إلغاء تفعيل)
   */
  async toggleUserStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
