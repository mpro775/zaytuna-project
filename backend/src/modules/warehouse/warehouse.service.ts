import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

export interface WarehouseWithDetails {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  branchId: string;
  isActive: boolean;
  manager?: {
    id: string;
    username: string;
    email: string;
  };
  branch: {
    id: string;
    name: string;
    code: string;
  };
  stockItemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);
  private readonly warehousesCacheKey = 'warehouses';
  private readonly warehouseCacheKey = 'warehouse';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء مخزن جديد
   */
  async create(createWarehouseDto: CreateWarehouseDto): Promise<WarehouseWithDetails> {
    try {
      this.logger.log(`إنشاء مخزن جديد: ${createWarehouseDto.name}`);

      // التحقق من عدم وجود الكود
      const existingWarehouse = await this.prisma.warehouse.findUnique({
        where: { code: createWarehouseDto.code },
      });

      if (existingWarehouse) {
        throw new ConflictException('كود المخزن موجود بالفعل');
      }

      // التحقق من وجود الفرع
      const branch = await this.prisma.branch.findUnique({
        where: { id: createWarehouseDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }

      // التحقق من وجود المدير (إذا تم تحديده)
      if (createWarehouseDto.managerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: createWarehouseDto.managerId },
        });

        if (!manager) {
          throw new NotFoundException('المدير غير موجود');
        }
      }

      // إنشاء المخزن
      const warehouse = await this.prisma.warehouse.create({
        data: {
          name: createWarehouseDto.name,
          code: createWarehouseDto.code,
          address: createWarehouseDto.address,
          phone: createWarehouseDto.phone,
          email: createWarehouseDto.email,
          managerId: createWarehouseDto.managerId,
          branchId: createWarehouseDto.branchId,
          isActive: createWarehouseDto.isActive ?? true,
        },
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              stockItems: true,
            },
          },
        },
      });

      // تحديث الكاش
      await this.invalidateWarehousesCache();

      const warehouseWithDetails: WarehouseWithDetails = {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || undefined,
        phone: warehouse.phone || undefined,
        email: warehouse.email || undefined,
        managerId: warehouse.managerId || undefined,
        branchId: warehouse.branchId,
        isActive: warehouse.isActive,
        manager: warehouse.manager || undefined,
        branch: warehouse.branch,
        stockItemCount: warehouse._count.stockItems,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt,
      };

      this.logger.log(`تم إنشاء المخزن بنجاح: ${warehouse.name}`);
      return warehouseWithDetails;
    } catch (error) {
      this.logger.error(`فشل في إنشاء المخزن: ${createWarehouseDto.name}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جميع المخازن
   */
  async findAll(branchId?: string): Promise<WarehouseWithDetails[]> {
    try {
      const cacheKey = branchId ? `${this.warehousesCacheKey}:branch:${branchId}` : this.warehousesCacheKey;

      // محاولة الحصول من الكاش أولاً
      const cachedWarehouses = await this.cacheService.get<WarehouseWithDetails[]>(cacheKey);
      if (cachedWarehouses) {
        return cachedWarehouses;
      }

      const where = branchId ? { branchId, isActive: true } : { isActive: true };

      const warehouses = await this.prisma.warehouse.findMany({
        where,
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              stockItems: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const warehousesWithDetails: WarehouseWithDetails[] = warehouses.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || undefined,
        phone: warehouse.phone || undefined,
        email: warehouse.email || undefined,
        managerId: warehouse.managerId || undefined,
        branchId: warehouse.branchId,
        isActive: warehouse.isActive,
        manager: warehouse.manager || undefined,
        branch: warehouse.branch,
        stockItemCount: warehouse._count.stockItems,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt,
      }));

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, warehousesWithDetails, { ttl: 600 });

      return warehousesWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على المخازن', error);
      throw error;
    }
  }

  /**
   * الحصول على مخزن بالمعرف
   */
  async findOne(id: string): Promise<WarehouseWithDetails> {
    try {
      const cacheKey = `${this.warehouseCacheKey}:${id}`;
      const cachedWarehouse = await this.cacheService.get<WarehouseWithDetails>(cacheKey);

      if (cachedWarehouse) {
        return cachedWarehouse;
      }

      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id },
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              stockItems: true,
            },
          },
        },
      });

      if (!warehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      const warehouseWithDetails: WarehouseWithDetails = {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || undefined,
        phone: warehouse.phone || undefined,
        email: warehouse.email || undefined,
        managerId: warehouse.managerId || undefined,
        branchId: warehouse.branchId,
        isActive: warehouse.isActive,
        manager: warehouse.manager || undefined,
        branch: warehouse.branch,
        stockItemCount: warehouse._count.stockItems,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt,
      };

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, warehouseWithDetails, { ttl: 1800 });

      return warehouseWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على المخزن: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث مخزن
   */
  async update(id: string, updateWarehouseDto: UpdateWarehouseDto): Promise<WarehouseWithDetails> {
    try {
      this.logger.log(`تحديث المخزن: ${id}`);

      // التحقق من وجود المخزن
      const existingWarehouse = await this.prisma.warehouse.findUnique({
        where: { id },
      });

      if (!existingWarehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      // التحقق من عدم تكرار الكود
      if (updateWarehouseDto.code && updateWarehouseDto.code !== existingWarehouse.code) {
        const warehouseWithSameCode = await this.prisma.warehouse.findUnique({
          where: { code: updateWarehouseDto.code },
        });

        if (warehouseWithSameCode) {
          throw new ConflictException('كود المخزن موجود بالفعل');
        }
      }

      // التحقق من وجود المدير (إذا تم تحديده)
      if (updateWarehouseDto.managerId) {
        const manager = await this.prisma.user.findUnique({
          where: { id: updateWarehouseDto.managerId },
        });

        if (!manager) {
          throw new NotFoundException('المدير غير موجود');
        }
      }

      // تحديث المخزن
      const warehouse = await this.prisma.warehouse.update({
        where: { id },
        data: {
          name: updateWarehouseDto.name,
          code: updateWarehouseDto.code,
          address: updateWarehouseDto.address,
          phone: updateWarehouseDto.phone,
          email: updateWarehouseDto.email,
          managerId: updateWarehouseDto.managerId,
          isActive: updateWarehouseDto.isActive,
        },
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              stockItems: true,
            },
          },
        },
      });

      // تحديث الكاش
      await this.invalidateWarehousesCache();
      await this.cacheService.delete(`${this.warehouseCacheKey}:${id}`);

      const warehouseWithDetails: WarehouseWithDetails = {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || undefined,
        phone: warehouse.phone || undefined,
        email: warehouse.email || undefined,
        managerId: warehouse.managerId || undefined,
        branchId: warehouse.branchId,
        isActive: warehouse.isActive,
        manager: warehouse.manager || undefined,
        branch: warehouse.branch,
        stockItemCount: warehouse._count.stockItems,
        createdAt: warehouse.createdAt,
        updatedAt: warehouse.updatedAt,
      };

      this.logger.log(`تم تحديث المخزن بنجاح: ${warehouse.name}`);
      return warehouseWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث المخزن: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف مخزن
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`حذف المخزن: ${id}`);

      // التحقق من وجود المخزن
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              stockItems: true,
            },
          },
        },
      });

      if (!warehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      // التحقق من عدم وجود عناصر مخزون
      if (warehouse._count.stockItems > 0) {
        throw new BadRequestException('لا يمكن حذف مخزن يحتوي على عناصر مخزون');
      }

      // حذف المخزن
      await this.prisma.warehouse.delete({
        where: { id },
      });

      // تحديث الكاش
      await this.invalidateWarehousesCache();
      await this.cacheService.delete(`${this.warehouseCacheKey}:${id}`);

      this.logger.log(`تم حذف المخزن بنجاح: ${warehouse.name}`);
      return { message: 'تم حذف المخزن بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في حذف المخزن: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على عناصر المخزون بالمخزن
   */
  async getStockItemsByWarehouse(warehouseId: string) {
    try {
      const stockItems = await this.prisma.stockItem.findMany({
        where: { warehouseId },
        orderBy: { createdAt: 'desc' },
      });

      return stockItems.map(item => ({
        id: item.id,
        productVariantId: item.productVariantId,
        quantity: Number(item.quantity),
        minStock: Number(item.minStock),
        maxStock: Number(item.maxStock),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    } catch (error) {
      this.logger.error(`فشل في الحصول على عناصر المخزون بالمخزن: ${warehouseId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المخازن
   */
  async getWarehouseStats() {
    try {
      const totalWarehouses = await this.prisma.warehouse.count();
      const activeWarehouses = await this.prisma.warehouse.count({
        where: { isActive: true },
      });

      const totalStockItems = await this.prisma.stockItem.count();

      // إحصائيات المخزون
      const stockStats = await this.prisma.stockItem.aggregate({
        _sum: {
          quantity: true,
        },
        _count: {
          id: true,
        },
      });

      const branchesWithWarehouses = await this.prisma.branch.findMany({
        include: {
          _count: {
            select: { warehouses: true },
          },
        },
      });

      return {
        totalWarehouses,
        activeWarehouses,
        inactiveWarehouses: totalWarehouses - activeWarehouses,
        totalStockItems: stockStats._count.id,
        totalStockQuantity: stockStats._sum.quantity || 0,
        averageWarehousesPerBranch: branchesWithWarehouses.length > 0
          ? (totalWarehouses / branchesWithWarehouses.length).toFixed(1)
          : 0,
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المخازن', error);
      throw error;
    }
  }

  /**
   * نقل المخزون بين المخازن
   */
  async transferStock(
    fromWarehouseId: string,
    toWarehouseId: string,
    productVariantId: string,
    quantity: number,
    notes?: string,
  ): Promise<{ message: string }> {
    try {
      this.logger.log(`نقل مخزون من ${fromWarehouseId} إلى ${toWarehouseId}`);

      // التحقق من وجود المخازن
      const [fromWarehouse, toWarehouse] = await Promise.all([
        this.prisma.warehouse.findUnique({ where: { id: fromWarehouseId } }),
        this.prisma.warehouse.findUnique({ where: { id: toWarehouseId } }),
      ]);

      if (!fromWarehouse) {
        throw new NotFoundException('مخزن المصدر غير موجود');
      }

      if (!toWarehouse) {
        throw new NotFoundException('مخزن الوجهة غير موجود');
      }

      // التحقق من وجود المنتج في مخزن المصدر
      const sourceStock = await this.prisma.stockItem.findUnique({
        where: {
          warehouseId_productVariantId: {
            warehouseId: fromWarehouseId,
            productVariantId,
          },
        },
      });

      if (!sourceStock || Number(sourceStock.quantity) < quantity) {
        throw new BadRequestException('الكمية المتاحة غير كافية في مخزن المصدر');
      }

      // تنفيذ النقل في معاملة
      await this.prisma.$transaction(async (tx) => {
        // تقليل الكمية من مخزن المصدر
        await tx.stockItem.update({
          where: {
            warehouseId_productVariantId: {
              warehouseId: fromWarehouseId,
              productVariantId,
            },
          },
          data: {
            quantity: { decrement: quantity },
          },
        });

        // زيادة الكمية في مخزن الوجهة (أو إنشاء سجل جديد)
        await tx.stockItem.upsert({
          where: {
            warehouseId_productVariantId: {
              warehouseId: toWarehouseId,
              productVariantId,
            },
          },
          update: {
            quantity: { increment: quantity },
          },
          create: {
            warehouseId: toWarehouseId,
            productVariantId,
            quantity,
            minStock: 0,
            maxStock: 1000,
          },
        });

        // تسجيل حركة المخزون
        await tx.stockMovement.create({
          data: {
            warehouseId: fromWarehouseId,
            productVariantId,
            movementType: 'transfer',
            quantity: -quantity,
            referenceType: 'transfer',
            referenceId: toWarehouseId,
            reason: `نقل إلى مخزن ${toWarehouse.name}`,
            performedBy: 'system', // سيتم تحديثه لاحقاً
          },
        });

        await tx.stockMovement.create({
          data: {
            warehouseId: toWarehouseId,
            productVariantId,
            movementType: 'transfer',
            quantity,
            referenceType: 'transfer',
            referenceId: fromWarehouseId,
            reason: `استلام من مخزن ${fromWarehouse.name}`,
            performedBy: 'system', // سيتم تحديثه لاحقاً
          },
        });
      });

      // تحديث الكاش
      await this.invalidateWarehousesCache();

      this.logger.log(`تم نقل ${quantity} وحدة من المنتج بنجاح`);
      return { message: 'تم نقل المخزون بنجاح' };
    } catch (error) {
      this.logger.error('فشل في نقل المخزون', error);
      throw error;
    }
  }

  /**
   * إبطال كاش المخازن
   */
  private async invalidateWarehousesCache(): Promise<void> {
    await this.cacheService.delete(this.warehousesCacheKey);
    // إبطال جميع الكاشات المتعلقة بالفروع
    const branchKeys = await this.cacheService.getKeys(`${this.warehousesCacheKey}:branch:*`);
    for (const key of branchKeys) {
      await this.cacheService.delete(key);
    }
  }
}
