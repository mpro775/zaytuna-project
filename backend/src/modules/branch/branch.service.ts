import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

export interface BranchWithDetails {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  companyId: string;
  isActive: boolean;
  company: {
    id: string;
    name: string;
  };
  warehouseCount: number;
  userCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);
  private readonly branchesCacheKey = 'branches';
  private readonly branchCacheKey = 'branch';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء فرع جديد
   */
  async create(createBranchDto: CreateBranchDto): Promise<BranchWithDetails> {
    try {
      this.logger.log(`إنشاء فرع جديد: ${createBranchDto.name}`);

      // التحقق من عدم وجود الكود
      const existingBranch = await this.prisma.branch.findUnique({
        where: { code: createBranchDto.code },
      });

      if (existingBranch) {
        throw new ConflictException('كود الفرع موجود بالفعل');
      }

      // التحقق من وجود الشركة
      const company = await this.prisma.company.findUnique({
        where: { id: createBranchDto.companyId },
      });

      if (!company) {
        throw new NotFoundException('الشركة غير موجودة');
      }

      // التحقق من وجود المدير (إذا تم تحديده)
      if (createBranchDto.managerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: createBranchDto.managerId },
        });

        if (!manager) {
          throw new NotFoundException('المدير غير موجود');
        }
      }

      // إنشاء الفرع
      const branch = await this.prisma.branch.create({
        data: {
          name: createBranchDto.name,
          code: createBranchDto.code,
          address: createBranchDto.address,
          phone: createBranchDto.phone,
          email: createBranchDto.email,
          managerId: createBranchDto.managerId,
          companyId: createBranchDto.companyId,
          isActive: createBranchDto.isActive ?? true,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
              warehouses: true,
            },
          },
        },
      });

      // تحديث الكاش
      await this.invalidateBranchesCache();

      const branchWithDetails: BranchWithDetails = {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address || undefined,
        phone: branch.phone || undefined,
        email: branch.email || undefined,
        managerId: branch.managerId || undefined,
        companyId: branch.companyId,
        isActive: branch.isActive,
        company: branch.company,
        warehouseCount: branch._count.warehouses,
        userCount: branch._count.users,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      };

      this.logger.log(`تم إنشاء الفرع بنجاح: ${branch.name}`);
      return branchWithDetails;
    } catch (error) {
      this.logger.error(`فشل في إنشاء الفرع: ${createBranchDto.name}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جميع الفروع
   */
  async findAll(companyId?: string): Promise<BranchWithDetails[]> {
    try {
      const cacheKey = companyId ? `${this.branchesCacheKey}:company:${companyId}` : this.branchesCacheKey;

      // محاولة الحصول من الكاش أولاً
      const cachedBranches = await this.cacheService.get<BranchWithDetails[]>(cacheKey);
      if (cachedBranches) {
        return cachedBranches;
      }

      const where = companyId ? { companyId, isActive: true } : { isActive: true };

      const branches = await this.prisma.branch.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
              warehouses: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const branchesWithDetails: BranchWithDetails[] = branches.map(branch => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address || undefined,
        phone: branch.phone || undefined,
        email: branch.email || undefined,
        managerId: branch.managerId || undefined,
        companyId: branch.companyId,
        isActive: branch.isActive,
        company: branch.company,
        warehouseCount: branch._count.warehouses,
        userCount: branch._count.users,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      }));

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, branchesWithDetails, { ttl: 600 });

      return branchesWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على الفروع', error);
      throw error;
    }
  }

  /**
   * الحصول على فرع بالمعرف
   */
  async findOne(id: string): Promise<BranchWithDetails> {
    try {
      const cacheKey = `${this.branchCacheKey}:${id}`;
      const cachedBranch = await this.cacheService.get<BranchWithDetails>(cacheKey);

      if (cachedBranch) {
        return cachedBranch;
      }

      const branch = await this.prisma.branch.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
              warehouses: true,
            },
          },
        },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }

      const branchWithDetails: BranchWithDetails = {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address || undefined,
        phone: branch.phone || undefined,
        email: branch.email || undefined,
        managerId: branch.managerId || undefined,
        companyId: branch.companyId,
        isActive: branch.isActive,
        company: branch.company,
        warehouseCount: branch._count.warehouses,
        userCount: branch._count.users,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      };

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, branchWithDetails, { ttl: 1800 });

      return branchWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على الفرع: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث فرع
   */
  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchWithDetails> {
    try {
      this.logger.log(`تحديث الفرع: ${id}`);

      // التحقق من وجود الفرع
      const existingBranch = await this.prisma.branch.findUnique({
        where: { id },
      });

      if (!existingBranch) {
        throw new NotFoundException('الفرع غير موجود');
      }

      // التحقق من عدم تكرار الكود
      if (updateBranchDto.code && updateBranchDto.code !== existingBranch.code) {
        const branchWithSameCode = await this.prisma.branch.findUnique({
          where: { code: updateBranchDto.code },
        });

        if (branchWithSameCode) {
          throw new ConflictException('كود الفرع موجود بالفعل');
        }
      }

      // التحقق من وجود المدير (إذا تم تحديده)
      if (updateBranchDto.managerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: updateBranchDto.managerId },
        });

        if (!manager) {
          throw new NotFoundException('المدير غير موجود');
        }
      }

      // تحديث الفرع
      const branch = await this.prisma.branch.update({
        where: { id },
        data: {
          name: updateBranchDto.name,
          code: updateBranchDto.code,
          address: updateBranchDto.address,
          phone: updateBranchDto.phone,
          email: updateBranchDto.email,
          managerId: updateBranchDto.managerId,
          isActive: updateBranchDto.isActive,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              users: true,
              warehouses: true,
            },
          },
        },
      });

      // تحديث الكاش
      await this.invalidateBranchesCache();
      await this.cacheService.delete(`${this.branchCacheKey}:${id}`);

      const branchWithDetails: BranchWithDetails = {
        id: branch.id,
        name: branch.name,
        code: branch.code,
        address: branch.address || undefined,
        phone: branch.phone || undefined,
        email: branch.email || undefined,
        managerId: branch.managerId || undefined,
        companyId: branch.companyId,
        isActive: branch.isActive,
        company: branch.company,
        warehouseCount: branch._count.warehouses,
        userCount: branch._count.users,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      };

      this.logger.log(`تم تحديث الفرع بنجاح: ${branch.name}`);
      return branchWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث الفرع: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف فرع
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`حذف الفرع: ${id}`);

      // التحقق من وجود الفرع
      const branch = await this.prisma.branch.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              warehouses: true,
            },
          },
        },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }

      // التحقق من عدم وجود مستخدمين مرتبطين
      if (branch._count.users > 0) {
        throw new BadRequestException('لا يمكن حذف فرع مرتبط بمستخدمين');
      }

      // التحقق من عدم وجود مخازن مرتبطة
      if (branch._count.warehouses > 0) {
        throw new BadRequestException('لا يمكن حذف فرع مرتبط بمخازن');
      }

      // حذف الفرع
      await this.prisma.branch.delete({
        where: { id },
      });

      // تحديث الكاش
      await this.invalidateBranchesCache();
      await this.cacheService.delete(`${this.branchCacheKey}:${id}`);

      this.logger.log(`تم حذف الفرع بنجاح: ${branch.name}`);
      return { message: 'تم حذف الفرع بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في حذف الفرع: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على المستخدمين بالفرع
   */
  async getUsersByBranch(branchId: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: { branchId, isActive: true },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
        orderBy: { username: 'asc' },
      });

      return users;
    } catch (error) {
      this.logger.error(`فشل في الحصول على المستخدمين بالفرع: ${branchId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الفروع
   */
  async getBranchStats() {
    try {
      const totalBranches = await this.prisma.branch.count();
      const activeBranches = await this.prisma.branch.count({
        where: { isActive: true },
      });

      const companiesWithBranches = await this.prisma.company.findMany({
        include: {
          _count: {
            select: { branches: true },
          },
        },
      });

      const totalUsers = await this.prisma.user.count({
        where: { isActive: true },
      });

      const totalWarehouses = await this.prisma.warehouse.count();

      return {
        totalBranches,
        activeBranches,
        inactiveBranches: totalBranches - activeBranches,
        totalCompanies: companiesWithBranches.length,
        averageBranchesPerCompany: companiesWithBranches.length > 0
          ? (totalBranches / companiesWithBranches.length).toFixed(1)
          : 0,
        totalUsers,
        totalWarehouses,
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الفروع', error);
      throw error;
    }
  }

  /**
   * إبطال كاش الفروع
   */
  private async invalidateBranchesCache(): Promise<void> {
    await this.cacheService.delete(this.branchesCacheKey);
    // إبطال جميع الكاشات المتعلقة بالشركات
    const companyKeys = await this.cacheService.getKeys(`${this.branchesCacheKey}:company:*`);
    for (const key of companyKeys) {
      await this.cacheService.delete(key);
    }
  }
}
