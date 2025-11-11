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
var ProductVariantService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let ProductVariantService = ProductVariantService_1 = class ProductVariantService {
    prisma;
    cacheService;
    logger = new common_1.Logger(ProductVariantService_1.name);
    variantsCacheKey = 'product_variants';
    variantCacheKey = 'product_variant';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(createVariantDto) {
        try {
            this.logger.log(`إنشاء متغير منتج جديد: ${createVariantDto.name}`);
            const product = await this.prisma.product.findUnique({
                where: { id: createVariantDto.productId },
            });
            if (!product) {
                throw new common_1.NotFoundException('المنتج غير موجود');
            }
            if (createVariantDto.sku) {
                const existingVariant = await this.prisma.productVariant.findUnique({
                    where: { sku: createVariantDto.sku },
                });
                if (existingVariant) {
                    throw new common_1.ConflictException('رمز SKU موجود بالفعل');
                }
            }
            if (createVariantDto.barcode) {
                const existingVariant = await this.prisma.productVariant.findUnique({
                    where: { barcode: createVariantDto.barcode },
                });
                if (existingVariant) {
                    throw new common_1.ConflictException('الباركود موجود بالفعل');
                }
            }
            const variant = await this.prisma.productVariant.create({
                data: {
                    productId: createVariantDto.productId,
                    name: createVariantDto.name,
                    sku: createVariantDto.sku,
                    barcode: createVariantDto.barcode,
                    price: createVariantDto.price,
                    costPrice: createVariantDto.costPrice,
                    weight: createVariantDto.weight,
                    dimensions: createVariantDto.dimensions,
                    attributes: createVariantDto.attributes,
                    imageUrl: createVariantDto.imageUrl,
                    isActive: createVariantDto.isActive ?? true,
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            await this.invalidateVariantsCache();
            const variantWithDetails = {
                id: variant.id,
                productId: variant.productId,
                name: variant.name,
                sku: variant.sku || undefined,
                barcode: variant.barcode || undefined,
                price: variant.price ? Number(variant.price) : undefined,
                costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
                weight: variant.weight ? Number(variant.weight) : undefined,
                dimensions: variant.dimensions || undefined,
                attributes: variant.attributes || undefined,
                imageUrl: variant.imageUrl || undefined,
                isActive: variant.isActive,
                product: variant.product,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt,
            };
            this.logger.log(`تم إنشاء متغير المنتج بنجاح: ${variant.name}`);
            return variantWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء متغير المنتج: ${createVariantDto.name}`, error);
            throw error;
        }
    }
    async findAll(productId) {
        try {
            const cacheKey = productId ? `${this.variantsCacheKey}:product:${productId}` : this.variantsCacheKey;
            const cachedVariants = await this.cacheService.get(cacheKey);
            if (cachedVariants) {
                return cachedVariants;
            }
            const where = { isActive: true };
            if (productId) {
                where.productId = productId;
            }
            const variants = await this.prisma.productVariant.findMany({
                where,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const variantsWithDetails = variants.map(variant => ({
                id: variant.id,
                productId: variant.productId,
                name: variant.name,
                sku: variant.sku || undefined,
                barcode: variant.barcode || undefined,
                price: variant.price ? Number(variant.price) : undefined,
                costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
                weight: variant.weight ? Number(variant.weight) : undefined,
                dimensions: variant.dimensions || undefined,
                attributes: variant.attributes || undefined,
                imageUrl: variant.imageUrl || undefined,
                isActive: variant.isActive,
                product: variant.product,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt,
            }));
            await this.cacheService.set(cacheKey, variantsWithDetails, { ttl: 600 });
            return variantsWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على متغيرات المنتج', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.variantCacheKey}:${id}`;
            const cachedVariant = await this.cacheService.get(cacheKey);
            if (cachedVariant) {
                return cachedVariant;
            }
            const variant = await this.prisma.productVariant.findUnique({
                where: { id },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            if (!variant) {
                throw new common_1.NotFoundException('متغير المنتج غير موجود');
            }
            const variantWithDetails = {
                id: variant.id,
                productId: variant.productId,
                name: variant.name,
                sku: variant.sku || undefined,
                barcode: variant.barcode || undefined,
                price: variant.price ? Number(variant.price) : undefined,
                costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
                weight: variant.weight ? Number(variant.weight) : undefined,
                dimensions: variant.dimensions || undefined,
                attributes: variant.attributes || undefined,
                imageUrl: variant.imageUrl || undefined,
                isActive: variant.isActive,
                product: variant.product,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt,
            };
            await this.cacheService.set(cacheKey, variantWithDetails, { ttl: 1800 });
            return variantWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على متغير المنتج: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateVariantDto) {
        try {
            this.logger.log(`تحديث متغير المنتج: ${id}`);
            const existingVariant = await this.prisma.productVariant.findUnique({
                where: { id },
            });
            if (!existingVariant) {
                throw new common_1.NotFoundException('متغير المنتج غير موجود');
            }
            if (updateVariantDto.sku && updateVariantDto.sku !== existingVariant.sku) {
                const variantWithSameSku = await this.prisma.productVariant.findUnique({
                    where: { sku: updateVariantDto.sku },
                });
                if (variantWithSameSku) {
                    throw new common_1.ConflictException('رمز SKU موجود بالفعل');
                }
            }
            if (updateVariantDto.barcode && updateVariantDto.barcode !== existingVariant.barcode) {
                const variantWithSameBarcode = await this.prisma.productVariant.findUnique({
                    where: { barcode: updateVariantDto.barcode },
                });
                if (variantWithSameBarcode) {
                    throw new common_1.ConflictException('الباركود موجود بالفعل');
                }
            }
            const variant = await this.prisma.productVariant.update({
                where: { id },
                data: {
                    name: updateVariantDto.name,
                    sku: updateVariantDto.sku,
                    barcode: updateVariantDto.barcode,
                    price: updateVariantDto.price,
                    costPrice: updateVariantDto.costPrice,
                    weight: updateVariantDto.weight,
                    dimensions: updateVariantDto.dimensions,
                    attributes: updateVariantDto.attributes,
                    imageUrl: updateVariantDto.imageUrl,
                    isActive: updateVariantDto.isActive,
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            await this.invalidateVariantsCache();
            await this.cacheService.delete(`${this.variantCacheKey}:${id}`);
            const variantWithDetails = {
                id: variant.id,
                productId: variant.productId,
                name: variant.name,
                sku: variant.sku || undefined,
                barcode: variant.barcode || undefined,
                price: variant.price ? Number(variant.price) : undefined,
                costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
                weight: variant.weight ? Number(variant.weight) : undefined,
                dimensions: variant.dimensions || undefined,
                attributes: variant.attributes || undefined,
                imageUrl: variant.imageUrl || undefined,
                isActive: variant.isActive,
                product: variant.product,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt,
            };
            this.logger.log(`تم تحديث متغير المنتج بنجاح: ${variant.name}`);
            return variantWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث متغير المنتج: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف متغير المنتج: ${id}`);
            const variant = await this.prisma.productVariant.findUnique({
                where: { id },
            });
            if (!variant) {
                throw new common_1.NotFoundException('متغير المنتج غير موجود');
            }
            await this.prisma.productVariant.delete({
                where: { id },
            });
            await this.invalidateVariantsCache();
            await this.cacheService.delete(`${this.variantCacheKey}:${id}`);
            this.logger.log(`تم حذف متغير المنتج بنجاح: ${variant.name}`);
            return { message: 'تم حذف متغير المنتج بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في حذف متغير المنتج: ${id}`, error);
            throw error;
        }
    }
    async findByBarcodeOrSku(identifier) {
        try {
            const variant = await this.prisma.productVariant.findFirst({
                where: {
                    OR: [
                        { barcode: identifier },
                        { sku: identifier },
                    ],
                    isActive: true,
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            if (!variant) {
                return null;
            }
            return {
                id: variant.id,
                productId: variant.productId,
                name: variant.name,
                sku: variant.sku || undefined,
                barcode: variant.barcode || undefined,
                price: variant.price ? Number(variant.price) : undefined,
                costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
                weight: variant.weight ? Number(variant.weight) : undefined,
                dimensions: variant.dimensions || undefined,
                attributes: variant.attributes || undefined,
                imageUrl: variant.imageUrl || undefined,
                isActive: variant.isActive,
                product: variant.product,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt,
            };
        }
        catch (error) {
            this.logger.error(`فشل في البحث عن متغير المنتج: ${identifier}`, error);
            throw error;
        }
    }
    async invalidateVariantsCache() {
        await this.cacheService.delete(this.variantsCacheKey);
        const variantKeys = await this.cacheService.getKeys(`${this.variantsCacheKey}:*`);
        for (const key of variantKeys) {
            await this.cacheService.delete(key);
        }
        const individualKeys = await this.cacheService.getKeys(`${this.variantCacheKey}:*`);
        for (const key of individualKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.ProductVariantService = ProductVariantService;
exports.ProductVariantService = ProductVariantService = ProductVariantService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], ProductVariantService);
//# sourceMappingURL=product-variant.service.js.map