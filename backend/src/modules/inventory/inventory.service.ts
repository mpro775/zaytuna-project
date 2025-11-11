import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

export interface StockItemWithDetails {
  id: string;
  warehouseId: string;
  productVariantId: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  productVariant: {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    product: {
      id: string;
      name: string;
    };
  };
  isLowStock: boolean;
  isOverStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovementWithDetails {
  id: string;
  warehouseId: string;
  productVariantId: string;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
  productVariant: {
    id: string;
    name: string;
    product: {
      id: string;
      name: string;
    };
  };
  createdAt: Date;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private readonly stockItemsCacheKey = 'stock_items';
  private readonly stockMovementsCacheKey = 'stock_movements';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء عنصر مخزون جديد
   */
  async createStockItem(createStockItemDto: CreateStockItemDto): Promise<StockItemWithDetails> {
    try {
      this.logger.log(`إنشاء عنصر مخزون جديد: ${createStockItemDto.warehouseId} - ${createStockItemDto.productVariantId}`);

      // التحقق من وجود المخزن
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: createStockItemDto.warehouseId },
      });

      if (!warehouse) {
        throw new NotFoundException('المخزن غير موجود');
      }

      // التحقق من وجود متغير المنتج
      const productVariant = await this.prisma.productVariant.findUnique({
        where: { id: createStockItemDto.productVariantId },
      });

      if (!productVariant) {
        throw new NotFoundException('متغير المنتج غير موجود');
      }

      // التحقق من عدم وجود عنصر مخزون مكرر
      const existingStockItem = await this.prisma.stockItem.findUnique({
        where: {
          warehouseId_productVariantId: {
            warehouseId: createStockItemDto.warehouseId,
            productVariantId: createStockItemDto.productVariantId,
          },
        },
      });

      if (existingStockItem) {
        throw new BadRequestException('عنصر المخزون موجود بالفعل في هذا المخزن');
      }

      // إنشاء عنصر المخزون
      const stockItem = await this.prisma.stockItem.create({
        data: {
          warehouseId: createStockItemDto.warehouseId,
          productVariantId: createStockItemDto.productVariantId,
          quantity: createStockItemDto.quantity || 0,
          minStock: createStockItemDto.minStock || 0,
          maxStock: createStockItemDto.maxStock || 1000,
        },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // إنشاء حركة مخزون أولية إذا كانت الكمية > 0
      if (createStockItemDto.quantity && createStockItemDto.quantity > 0) {
        await this.prisma.stockMovement.create({
          data: {
            warehouseId: createStockItemDto.warehouseId,
            productVariantId: createStockItemDto.productVariantId,
            movementType: 'adjustment',
            quantity: createStockItemDto.quantity,
            referenceType: 'initial',
            reason: 'إنشاء عنصر مخزون أولي',
            performedBy: 'system',
          },
        });
      }

      // تحديث الكاش
      await this.invalidateStockCache();

      const stockItemWithDetails = this.buildStockItemWithDetails(stockItem);

      this.logger.log(`تم إنشاء عنصر المخزون بنجاح`);
      return stockItemWithDetails;
    } catch (error) {
      this.logger.error(`فشل في إنشاء عنصر المخزون`, error);
      throw error;
    }
  }

  /**
   * الحصول على عناصر المخزون
   */
  async findAllStockItems(warehouseId?: string, lowStockOnly?: boolean): Promise<StockItemWithDetails[]> {
    try {
      const cacheKey = warehouseId
        ? `stock_items:warehouse:${warehouseId}`
        : lowStockOnly
        ? 'stock_items:low_stock'
        : this.stockItemsCacheKey;

      // محاولة الحصول من الكاش أولاً
      const cachedItems = await this.cacheService.get<StockItemWithDetails[]>(cacheKey);
      if (cachedItems) {
        return cachedItems;
      }

      const where: any = {};

      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      const stockItems = await this.prisma.stockItem.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { warehouse: { name: 'asc' } },
          { productVariant: { product: { name: 'asc' } } },
        ],
      });

      let stockItemsWithDetails = stockItems.map(item => this.buildStockItemWithDetails(item));

      // فلترة العناصر ذات المخزون المنخفض إذا طُلب ذلك
      if (lowStockOnly) {
        stockItemsWithDetails = stockItemsWithDetails.filter(item => item.isLowStock);
      }

      // حفظ في الكاش لمدة 5 دقائق
      await this.cacheService.set(cacheKey, stockItemsWithDetails, { ttl: 300 });

      return stockItemsWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على عناصر المخزون', error);
      throw error;
    }
  }

  /**
   * الحصول على عنصر مخزون بالمعرف
   */
  async findStockItemById(id: string): Promise<StockItemWithDetails> {
    try {
      const cacheKey = `${this.stockItemsCacheKey}:${id}`;
      const cachedItem = await this.cacheService.get<StockItemWithDetails>(cacheKey);

      if (cachedItem) {
        return cachedItem;
      }

      const stockItem = await this.prisma.stockItem.findUnique({
        where: { id },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!stockItem) {
        throw new NotFoundException('عنصر المخزون غير موجود');
      }

      const stockItemWithDetails = this.buildStockItemWithDetails(stockItem);

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, stockItemWithDetails, { ttl: 600 });

      return stockItemWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على عنصر المخزون: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على عنصر مخزون بمفتاح مركب
   */
  async findStockItemByWarehouseAndVariant(
    warehouseId: string,
    productVariantId: string,
  ): Promise<StockItemWithDetails | null> {
    try {
      const stockItem = await this.prisma.stockItem.findUnique({
        where: {
          warehouseId_productVariantId: {
            warehouseId,
            productVariantId,
          },
        },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!stockItem) {
        return null;
      }

      return this.buildStockItemWithDetails(stockItem);
    } catch (error) {
      this.logger.error(`فشل في الحصول على عنصر المخزون: ${warehouseId} - ${productVariantId}`, error);
      throw error;
    }
  }

  /**
   * تحديث عنصر مخزون
   */
  async updateStockItem(id: string, updateStockItemDto: UpdateStockItemDto): Promise<StockItemWithDetails> {
    try {
      this.logger.log(`تحديث عنصر المخزون: ${id}`);

      // التحقق من وجود عنصر المخزون
      const existingItem = await this.prisma.stockItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw new NotFoundException('عنصر المخزون غير موجود');
      }

      // تحديث عنصر المخزون
      const stockItem = await this.prisma.stockItem.update({
        where: { id },
        data: {
          minStock: updateStockItemDto.minStock,
          maxStock: updateStockItemDto.maxStock,
        },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // تحديث الكاش
      await this.invalidateStockCache();

      const stockItemWithDetails = this.buildStockItemWithDetails(stockItem);

      this.logger.log(`تم تحديث عنصر المخزون بنجاح`);
      return stockItemWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث عنصر المخزون: ${id}`, error);
      throw error;
    }
  }

  /**
   * تعديل كمية المخزون
   */
  async adjustStock(
    warehouseId: string,
    productVariantId: string,
    adjustStockDto: AdjustStockDto,
    performedBy?: string,
  ): Promise<StockItemWithDetails> {
    try {
      this.logger.log(`تعديل المخزون: ${warehouseId} - ${productVariantId} - ${adjustStockDto.quantity}`);

      return await this.prisma.$transaction(async (tx) => {
        // الحصول على عنصر المخزون الحالي
        const currentStockItem = await tx.stockItem.findUnique({
          where: {
            warehouseId_productVariantId: {
              warehouseId,
              productVariantId,
            },
          },
        });

        if (!currentStockItem) {
          throw new NotFoundException('عنصر المخزون غير موجود');
        }

        const newQuantity = Number(currentStockItem.quantity) + adjustStockDto.quantity;

        if (newQuantity < 0) {
          throw new BadRequestException('الكمية الجديدة لا يمكن أن تكون سالبة');
        }

        // تحديث الكمية
        const updatedStockItem = await tx.stockItem.update({
          where: {
            warehouseId_productVariantId: {
              warehouseId,
              productVariantId,
            },
          },
          data: {
            quantity: newQuantity,
          },
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        // إنشاء حركة مخزون
        await tx.stockMovement.create({
          data: {
            warehouseId,
            productVariantId,
            movementType: adjustStockDto.movementType || 'adjustment',
            quantity: adjustStockDto.quantity,
            referenceType: adjustStockDto.referenceType,
            referenceId: adjustStockDto.referenceId,
            reason: adjustStockDto.reason,
            performedBy: performedBy || 'system',
          },
        });

        // تحديث الكاش
        await this.invalidateStockCache();

        const stockItemWithDetails = this.buildStockItemWithDetails(updatedStockItem);

        this.logger.log(`تم تعديل المخزون بنجاح`);
        return stockItemWithDetails;
      });
    } catch (error) {
      this.logger.error(`فشل في تعديل المخزون: ${warehouseId} - ${productVariantId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على حركات المخزون
   */
  async findStockMovements(
    warehouseId?: string,
    productVariantId?: string,
    limit: number = 50,
  ): Promise<StockMovementWithDetails[]> {
    try {
      const where: any = {};

      if (warehouseId) {
        where.warehouseId = warehouseId;
      }

      if (productVariantId) {
        where.productVariantId = productVariantId;
      }

      const movements = await this.prisma.stockMovement.findMany({
        where,
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return movements.map(movement => ({
        id: movement.id,
        warehouseId: movement.warehouseId,
        productVariantId: movement.productVariantId,
        movementType: movement.movementType,
        quantity: Number(movement.quantity),
        referenceType: movement.referenceType || undefined,
        referenceId: movement.referenceId || undefined,
        reason: movement.reason || undefined,
        performedBy: movement.performedBy || undefined,
        warehouse: movement.warehouse,
        productVariant: movement.productVariant,
        createdAt: movement.createdAt,
      }));
    } catch (error) {
      this.logger.error('فشل في الحصول على حركات المخزون', error);
      throw error;
    }
  }

  /**
   * الحصول على تنبيهات المخزون المنخفض
   */
  async getLowStockAlerts(): Promise<StockItemWithDetails[]> {
    try {
      const lowStockItems = await this.prisma.stockItem.findMany({
        where: {
          quantity: {
            lte: this.prisma.stockItem.fields.minStock,
          },
        },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { quantity: 'asc' },
          { warehouse: { name: 'asc' } },
        ],
      });

      return lowStockItems.map(item => this.buildStockItemWithDetails(item));
    } catch (error) {
      this.logger.error('فشل في الحصول على تنبيهات المخزون المنخفض', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المخزون
   */
  async getInventoryStats(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overStockItems: number;
    totalMovements: number;
  }> {
    try {
      // إحصائيات عناصر المخزون
      const stockItems = await this.prisma.stockItem.findMany({
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
      });

      const totalItems = stockItems.length;
      const lowStockItems = stockItems.filter(item =>
        Number(item.quantity) <= Number(item.minStock)
      ).length;
      const outOfStockItems = stockItems.filter(item =>
        Number(item.quantity) === 0
      ).length;
      const overStockItems = stockItems.filter(item =>
        Number(item.quantity) >= Number(item.maxStock)
      ).length;

      // حساب القيمة الإجمالية
      let totalValue = 0;
      for (const item of stockItems) {
        const price = item.productVariant.price
          ? Number(item.productVariant.price)
          : Number(item.productVariant.product.basePrice);
        totalValue += Number(item.quantity) * price;
      }

      // إحصائيات حركات المخزون
      const totalMovements = await this.prisma.stockMovement.count();

      return {
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        overStockItems,
        totalMovements,
      };
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المخزون', error);
      throw error;
    }
  }

  /**
   * بناء كائن عنصر مخزون مع التفاصيل
   */
  private buildStockItemWithDetails(stockItem: any): StockItemWithDetails {
    const quantity = Number(stockItem.quantity);
    const minStock = Number(stockItem.minStock);
    const maxStock = Number(stockItem.maxStock);

    return {
      id: stockItem.id,
      warehouseId: stockItem.warehouseId,
      productVariantId: stockItem.productVariantId,
      quantity,
      minStock,
      maxStock,
      warehouse: stockItem.warehouse,
      productVariant: stockItem.productVariant,
      isLowStock: quantity <= minStock,
      isOverStock: quantity >= maxStock,
      createdAt: stockItem.createdAt,
      updatedAt: stockItem.updatedAt,
    };
  }

  /**
   * إبطال كاش المخزون
   */
  private async invalidateStockCache(): Promise<void> {
    await this.cacheService.delete(this.stockItemsCacheKey);
    await this.cacheService.delete(this.stockMovementsCacheKey);

    // إبطال جميع الكاشات المتعلقة بالمخزون
    const stockKeys = await this.cacheService.getKeys('stock_items:*');
    for (const key of stockKeys) {
      await this.cacheService.delete(key);
    }
  }
}
