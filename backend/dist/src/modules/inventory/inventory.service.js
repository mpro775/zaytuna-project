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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let InventoryService = InventoryService_1 = class InventoryService {
    prisma;
    cacheService;
    logger = new common_1.Logger(InventoryService_1.name);
    stockItemsCacheKey = 'stock_items';
    stockMovementsCacheKey = 'stock_movements';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async createStockItem(createStockItemDto) {
        try {
            this.logger.log(`إنشاء عنصر مخزون جديد: ${createStockItemDto.warehouseId} - ${createStockItemDto.productVariantId}`);
            const warehouse = await this.prisma.warehouse.findUnique({
                where: { id: createStockItemDto.warehouseId },
            });
            if (!warehouse) {
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            const productVariant = await this.prisma.productVariant.findUnique({
                where: { id: createStockItemDto.productVariantId },
            });
            if (!productVariant) {
                throw new common_1.NotFoundException('متغير المنتج غير موجود');
            }
            const existingStockItem = await this.prisma.stockItem.findUnique({
                where: {
                    warehouseId_productVariantId: {
                        warehouseId: createStockItemDto.warehouseId,
                        productVariantId: createStockItemDto.productVariantId,
                    },
                },
            });
            if (existingStockItem) {
                throw new common_1.BadRequestException('عنصر المخزون موجود بالفعل في هذا المخزن');
            }
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
            await this.invalidateStockCache();
            const stockItemWithDetails = this.buildStockItemWithDetails(stockItem);
            this.logger.log(`تم إنشاء عنصر المخزون بنجاح`);
            return stockItemWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء عنصر المخزون`, error);
            throw error;
        }
    }
    async findAllStockItems(warehouseId, lowStockOnly) {
        try {
            const cacheKey = warehouseId
                ? `stock_items:warehouse:${warehouseId}`
                : lowStockOnly
                    ? 'stock_items:low_stock'
                    : this.stockItemsCacheKey;
            const cachedItems = await this.cacheService.get(cacheKey);
            if (cachedItems) {
                return cachedItems;
            }
            const where = {};
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
            if (lowStockOnly) {
                stockItemsWithDetails = stockItemsWithDetails.filter(item => item.isLowStock);
            }
            await this.cacheService.set(cacheKey, stockItemsWithDetails, { ttl: 300 });
            return stockItemsWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على عناصر المخزون', error);
            throw error;
        }
    }
    async findStockItemById(id) {
        try {
            const cacheKey = `${this.stockItemsCacheKey}:${id}`;
            const cachedItem = await this.cacheService.get(cacheKey);
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
                throw new common_1.NotFoundException('عنصر المخزون غير موجود');
            }
            const stockItemWithDetails = this.buildStockItemWithDetails(stockItem);
            await this.cacheService.set(cacheKey, stockItemWithDetails, { ttl: 600 });
            return stockItemWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على عنصر المخزون: ${id}`, error);
            throw error;
        }
    }
    async findStockItemByWarehouseAndVariant(warehouseId, productVariantId) {
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
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على عنصر المخزون: ${warehouseId} - ${productVariantId}`, error);
            throw error;
        }
    }
    async updateStockItem(id, updateStockItemDto) {
        try {
            this.logger.log(`تحديث عنصر المخزون: ${id}`);
            const existingItem = await this.prisma.stockItem.findUnique({
                where: { id },
            });
            if (!existingItem) {
                throw new common_1.NotFoundException('عنصر المخزون غير موجود');
            }
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
            await this.invalidateStockCache();
            const stockItemWithDetails = this.buildStockItemWithDetails(stockItem);
            this.logger.log(`تم تحديث عنصر المخزون بنجاح`);
            return stockItemWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث عنصر المخزون: ${id}`, error);
            throw error;
        }
    }
    async adjustStock(warehouseId, productVariantId, adjustStockDto, performedBy) {
        try {
            this.logger.log(`تعديل المخزون: ${warehouseId} - ${productVariantId} - ${adjustStockDto.quantity}`);
            return await this.prisma.$transaction(async (tx) => {
                const currentStockItem = await tx.stockItem.findUnique({
                    where: {
                        warehouseId_productVariantId: {
                            warehouseId,
                            productVariantId,
                        },
                    },
                });
                if (!currentStockItem) {
                    throw new common_1.NotFoundException('عنصر المخزون غير موجود');
                }
                const newQuantity = Number(currentStockItem.quantity) + adjustStockDto.quantity;
                if (newQuantity < 0) {
                    throw new common_1.BadRequestException('الكمية الجديدة لا يمكن أن تكون سالبة');
                }
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
                await this.invalidateStockCache();
                const stockItemWithDetails = this.buildStockItemWithDetails(updatedStockItem);
                this.logger.log(`تم تعديل المخزون بنجاح`);
                return stockItemWithDetails;
            });
        }
        catch (error) {
            this.logger.error(`فشل في تعديل المخزون: ${warehouseId} - ${productVariantId}`, error);
            throw error;
        }
    }
    async findStockMovements(warehouseId, productVariantId, limit = 50) {
        try {
            const where = {};
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
        }
        catch (error) {
            this.logger.error('فشل في الحصول على حركات المخزون', error);
            throw error;
        }
    }
    async getLowStockAlerts() {
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
        }
        catch (error) {
            this.logger.error('فشل في الحصول على تنبيهات المخزون المنخفض', error);
            throw error;
        }
    }
    async getInventoryStats() {
        try {
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
            const lowStockItems = stockItems.filter(item => Number(item.quantity) <= Number(item.minStock)).length;
            const outOfStockItems = stockItems.filter(item => Number(item.quantity) === 0).length;
            const overStockItems = stockItems.filter(item => Number(item.quantity) >= Number(item.maxStock)).length;
            let totalValue = 0;
            for (const item of stockItems) {
                const price = item.productVariant.price
                    ? Number(item.productVariant.price)
                    : Number(item.productVariant.product.basePrice);
                totalValue += Number(item.quantity) * price;
            }
            const totalMovements = await this.prisma.stockMovement.count();
            return {
                totalItems,
                totalValue,
                lowStockItems,
                outOfStockItems,
                overStockItems,
                totalMovements,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المخزون', error);
            throw error;
        }
    }
    buildStockItemWithDetails(stockItem) {
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
    async invalidateStockCache() {
        await this.cacheService.delete(this.stockItemsCacheKey);
        await this.cacheService.delete(this.stockMovementsCacheKey);
        const stockKeys = await this.cacheService.getKeys('stock_items:*');
        for (const key of stockKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map