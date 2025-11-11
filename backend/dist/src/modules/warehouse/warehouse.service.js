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
var WarehouseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let WarehouseService = WarehouseService_1 = class WarehouseService {
    prisma;
    cacheService;
    logger = new common_1.Logger(WarehouseService_1.name);
    warehousesCacheKey = 'warehouses';
    warehouseCacheKey = 'warehouse';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(createWarehouseDto) {
        try {
            this.logger.log(`إنشاء مخزن جديد: ${createWarehouseDto.name}`);
            const existingWarehouse = await this.prisma.warehouse.findUnique({
                where: { code: createWarehouseDto.code },
            });
            if (existingWarehouse) {
                throw new common_1.ConflictException('كود المخزن موجود بالفعل');
            }
            const branch = await this.prisma.branch.findUnique({
                where: { id: createWarehouseDto.branchId },
            });
            if (!branch) {
                throw new common_1.NotFoundException('الفرع غير موجود');
            }
            if (createWarehouseDto.managerId) {
                const manager = await this.prisma.user.findUnique({
                    where: { id: createWarehouseDto.managerId },
                });
                if (!manager) {
                    throw new common_1.NotFoundException('المدير غير موجود');
                }
            }
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
            await this.invalidateWarehousesCache();
            const warehouseWithDetails = {
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
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء المخزن: ${createWarehouseDto.name}`, error);
            throw error;
        }
    }
    async findAll(branchId) {
        try {
            const cacheKey = branchId ? `${this.warehousesCacheKey}:branch:${branchId}` : this.warehousesCacheKey;
            const cachedWarehouses = await this.cacheService.get(cacheKey);
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
            const warehousesWithDetails = warehouses.map(warehouse => ({
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
            await this.cacheService.set(cacheKey, warehousesWithDetails, { ttl: 600 });
            return warehousesWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على المخازن', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.warehouseCacheKey}:${id}`;
            const cachedWarehouse = await this.cacheService.get(cacheKey);
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
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            const warehouseWithDetails = {
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
            await this.cacheService.set(cacheKey, warehouseWithDetails, { ttl: 1800 });
            return warehouseWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المخزن: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateWarehouseDto) {
        try {
            this.logger.log(`تحديث المخزن: ${id}`);
            const existingWarehouse = await this.prisma.warehouse.findUnique({
                where: { id },
            });
            if (!existingWarehouse) {
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            if (updateWarehouseDto.code && updateWarehouseDto.code !== existingWarehouse.code) {
                const warehouseWithSameCode = await this.prisma.warehouse.findUnique({
                    where: { code: updateWarehouseDto.code },
                });
                if (warehouseWithSameCode) {
                    throw new common_1.ConflictException('كود المخزن موجود بالفعل');
                }
            }
            if (updateWarehouseDto.managerId) {
                const manager = await this.prisma.user.findUnique({
                    where: { id: updateWarehouseDto.managerId },
                });
                if (!manager) {
                    throw new common_1.NotFoundException('المدير غير موجود');
                }
            }
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
            await this.invalidateWarehousesCache();
            await this.cacheService.delete(`${this.warehouseCacheKey}:${id}`);
            const warehouseWithDetails = {
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
        }
        catch (error) {
            this.logger.error(`فشل في تحديث المخزن: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف المخزن: ${id}`);
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
                throw new common_1.NotFoundException('المخزن غير موجود');
            }
            if (warehouse._count.stockItems > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف مخزن يحتوي على عناصر مخزون');
            }
            await this.prisma.warehouse.delete({
                where: { id },
            });
            await this.invalidateWarehousesCache();
            await this.cacheService.delete(`${this.warehouseCacheKey}:${id}`);
            this.logger.log(`تم حذف المخزن بنجاح: ${warehouse.name}`);
            return { message: 'تم حذف المخزن بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في حذف المخزن: ${id}`, error);
            throw error;
        }
    }
    async getStockItemsByWarehouse(warehouseId) {
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
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على عناصر المخزون بالمخزن: ${warehouseId}`, error);
            throw error;
        }
    }
    async getWarehouseStats() {
        try {
            const totalWarehouses = await this.prisma.warehouse.count();
            const activeWarehouses = await this.prisma.warehouse.count({
                where: { isActive: true },
            });
            const totalStockItems = await this.prisma.stockItem.count();
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
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المخازن', error);
            throw error;
        }
    }
    async transferStock(fromWarehouseId, toWarehouseId, productVariantId, quantity, notes) {
        try {
            this.logger.log(`نقل مخزون من ${fromWarehouseId} إلى ${toWarehouseId}`);
            const [fromWarehouse, toWarehouse] = await Promise.all([
                this.prisma.warehouse.findUnique({ where: { id: fromWarehouseId } }),
                this.prisma.warehouse.findUnique({ where: { id: toWarehouseId } }),
            ]);
            if (!fromWarehouse) {
                throw new common_1.NotFoundException('مخزن المصدر غير موجود');
            }
            if (!toWarehouse) {
                throw new common_1.NotFoundException('مخزن الوجهة غير موجود');
            }
            const sourceStock = await this.prisma.stockItem.findUnique({
                where: {
                    warehouseId_productVariantId: {
                        warehouseId: fromWarehouseId,
                        productVariantId,
                    },
                },
            });
            if (!sourceStock || Number(sourceStock.quantity) < quantity) {
                throw new common_1.BadRequestException('الكمية المتاحة غير كافية في مخزن المصدر');
            }
            await this.prisma.$transaction(async (tx) => {
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
                await tx.stockMovement.create({
                    data: {
                        warehouseId: fromWarehouseId,
                        productVariantId,
                        movementType: 'transfer',
                        quantity: -quantity,
                        referenceType: 'transfer',
                        referenceId: toWarehouseId,
                        reason: `نقل إلى مخزن ${toWarehouse.name}`,
                        performedBy: 'system',
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
                        performedBy: 'system',
                    },
                });
            });
            await this.invalidateWarehousesCache();
            this.logger.log(`تم نقل ${quantity} وحدة من المنتج بنجاح`);
            return { message: 'تم نقل المخزون بنجاح' };
        }
        catch (error) {
            this.logger.error('فشل في نقل المخزون', error);
            throw error;
        }
    }
    async invalidateWarehousesCache() {
        await this.cacheService.delete(this.warehousesCacheKey);
        const branchKeys = await this.cacheService.getKeys(`${this.warehousesCacheKey}:branch:*`);
        for (const key of branchKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.WarehouseService = WarehouseService;
exports.WarehouseService = WarehouseService = WarehouseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], WarehouseService);
//# sourceMappingURL=warehouse.service.js.map