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
var ProductService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let ProductService = ProductService_1 = class ProductService {
    prisma;
    cacheService;
    logger = new common_1.Logger(ProductService_1.name);
    productsCacheKey = 'products';
    productCacheKey = 'product';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(createProductDto) {
        try {
            this.logger.log(`إنشاء منتج جديد: ${createProductDto.name}`);
            if (createProductDto.barcode) {
                const existingProduct = await this.prisma.product.findUnique({
                    where: { barcode: createProductDto.barcode },
                });
                if (existingProduct) {
                    throw new common_1.ConflictException('الباركود موجود بالفعل');
                }
            }
            if (createProductDto.sku) {
                const existingProduct = await this.prisma.product.findUnique({
                    where: { sku: createProductDto.sku },
                });
                if (existingProduct) {
                    throw new common_1.ConflictException('رمز SKU موجود بالفعل');
                }
            }
            const category = await this.prisma.category.findUnique({
                where: { id: createProductDto.categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException('الفئة غير موجودة');
            }
            const product = await this.prisma.product.create({
                data: {
                    name: createProductDto.name,
                    description: createProductDto.description,
                    barcode: createProductDto.barcode,
                    sku: createProductDto.sku,
                    categoryId: createProductDto.categoryId,
                    basePrice: createProductDto.basePrice,
                    costPrice: createProductDto.costPrice,
                    taxId: createProductDto.taxId,
                    isActive: createProductDto.isActive ?? true,
                    trackInventory: createProductDto.trackInventory ?? true,
                    reorderPoint: createProductDto.reorderPoint,
                    imageUrl: createProductDto.imageUrl,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            variants: true,
                        },
                    },
                },
            });
            await this.invalidateProductsCache();
            const productWithDetails = {
                id: product.id,
                name: product.name,
                description: product.description || undefined,
                barcode: product.barcode || undefined,
                sku: product.sku || undefined,
                categoryId: product.categoryId,
                basePrice: Number(product.basePrice),
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                taxId: product.taxId || undefined,
                isActive: product.isActive,
                trackInventory: product.trackInventory,
                reorderPoint: product.reorderPoint || undefined,
                imageUrl: product.imageUrl || undefined,
                category: product.category,
                variantCount: product._count.variants,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            };
            this.logger.log(`تم إنشاء المنتج بنجاح: ${product.name}`);
            return productWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء المنتج: ${createProductDto.name}`, error);
            throw error;
        }
    }
    async findAll(categoryId, search) {
        try {
            const cacheKey = categoryId
                ? `products:category:${categoryId}`
                : search
                    ? `products:search:${search}`
                    : this.productsCacheKey;
            const cachedProducts = await this.cacheService.get(cacheKey);
            if (cachedProducts) {
                return cachedProducts;
            }
            const where = { isActive: true };
            if (categoryId) {
                where.categoryId = categoryId;
            }
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { barcode: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } },
                ];
            }
            const products = await this.prisma.product.findMany({
                where,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            variants: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const productsWithDetails = products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description || undefined,
                barcode: product.barcode || undefined,
                sku: product.sku || undefined,
                categoryId: product.categoryId,
                basePrice: Number(product.basePrice),
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                taxId: product.taxId || undefined,
                isActive: product.isActive,
                trackInventory: product.trackInventory,
                reorderPoint: product.reorderPoint || undefined,
                imageUrl: product.imageUrl || undefined,
                category: product.category,
                variantCount: product._count.variants,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            }));
            await this.cacheService.set(cacheKey, productsWithDetails, { ttl: 600 });
            return productsWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على المنتجات', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.productCacheKey}:${id}`;
            const cachedProduct = await this.cacheService.get(cacheKey);
            if (cachedProduct) {
                return cachedProduct;
            }
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            variants: true,
                        },
                    },
                },
            });
            if (!product) {
                throw new common_1.NotFoundException('المنتج غير موجود');
            }
            const productWithDetails = {
                id: product.id,
                name: product.name,
                description: product.description || undefined,
                barcode: product.barcode || undefined,
                sku: product.sku || undefined,
                categoryId: product.categoryId,
                basePrice: Number(product.basePrice),
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                taxId: product.taxId || undefined,
                isActive: product.isActive,
                trackInventory: product.trackInventory,
                reorderPoint: product.reorderPoint || undefined,
                imageUrl: product.imageUrl || undefined,
                category: product.category,
                variantCount: product._count.variants,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            };
            await this.cacheService.set(cacheKey, productWithDetails, { ttl: 1800 });
            return productWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على المنتج: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateProductDto) {
        try {
            this.logger.log(`تحديث المنتج: ${id}`);
            const existingProduct = await this.prisma.product.findUnique({
                where: { id },
            });
            if (!existingProduct) {
                throw new common_1.NotFoundException('المنتج غير موجود');
            }
            if (updateProductDto.barcode && updateProductDto.barcode !== existingProduct.barcode) {
                const productWithSameBarcode = await this.prisma.product.findUnique({
                    where: { barcode: updateProductDto.barcode },
                });
                if (productWithSameBarcode) {
                    throw new common_1.ConflictException('الباركود موجود بالفعل');
                }
            }
            if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
                const productWithSameSku = await this.prisma.product.findUnique({
                    where: { sku: updateProductDto.sku },
                });
                if (productWithSameSku) {
                    throw new common_1.ConflictException('رمز SKU موجود بالفعل');
                }
            }
            const product = await this.prisma.product.update({
                where: { id },
                data: {
                    name: updateProductDto.name,
                    description: updateProductDto.description,
                    barcode: updateProductDto.barcode,
                    sku: updateProductDto.sku,
                    categoryId: updateProductDto.categoryId,
                    basePrice: updateProductDto.basePrice,
                    costPrice: updateProductDto.costPrice,
                    taxId: updateProductDto.taxId,
                    isActive: updateProductDto.isActive,
                    trackInventory: updateProductDto.trackInventory,
                    reorderPoint: updateProductDto.reorderPoint,
                    imageUrl: updateProductDto.imageUrl,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            variants: true,
                        },
                    },
                },
            });
            await this.invalidateProductsCache();
            await this.cacheService.delete(`${this.productCacheKey}:${id}`);
            const productWithDetails = {
                id: product.id,
                name: product.name,
                description: product.description || undefined,
                barcode: product.barcode || undefined,
                sku: product.sku || undefined,
                categoryId: product.categoryId,
                basePrice: Number(product.basePrice),
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                taxId: product.taxId || undefined,
                isActive: product.isActive,
                trackInventory: product.trackInventory,
                reorderPoint: product.reorderPoint || undefined,
                imageUrl: product.imageUrl || undefined,
                category: product.category,
                variantCount: product._count.variants,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            };
            this.logger.log(`تم تحديث المنتج بنجاح: ${product.name}`);
            return productWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث المنتج: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف المنتج: ${id}`);
            const product = await this.prisma.product.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            variants: true,
                        },
                    },
                },
            });
            if (!product) {
                throw new common_1.NotFoundException('المنتج غير موجود');
            }
            if (product._count.variants > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف منتج مرتبط بمتغيرات');
            }
            await this.prisma.product.delete({
                where: { id },
            });
            await this.invalidateProductsCache();
            await this.cacheService.delete(`${this.productCacheKey}:${id}`);
            this.logger.log(`تم حذف المنتج بنجاح: ${product.name}`);
            return { message: 'تم حذف المنتج بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في حذف المنتج: ${id}`, error);
            throw error;
        }
    }
    async findByBarcodeOrSku(identifier) {
        try {
            const product = await this.prisma.product.findFirst({
                where: {
                    OR: [
                        { barcode: identifier },
                        { sku: identifier },
                    ],
                    isActive: true,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            variants: true,
                        },
                    },
                },
            });
            if (!product) {
                return null;
            }
            return {
                id: product.id,
                name: product.name,
                description: product.description || undefined,
                barcode: product.barcode || undefined,
                sku: product.sku || undefined,
                categoryId: product.categoryId,
                basePrice: Number(product.basePrice),
                costPrice: product.costPrice ? Number(product.costPrice) : undefined,
                taxId: product.taxId || undefined,
                isActive: product.isActive,
                trackInventory: product.trackInventory,
                reorderPoint: product.reorderPoint || undefined,
                imageUrl: product.imageUrl || undefined,
                category: product.category,
                variantCount: product._count.variants,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            };
        }
        catch (error) {
            this.logger.error(`فشل في البحث عن المنتج: ${identifier}`, error);
            throw error;
        }
    }
    async getProductStats() {
        try {
            const totalProducts = await this.prisma.product.count();
            const activeProducts = await this.prisma.product.count({
                where: { isActive: true },
            });
            const totalVariants = await this.prisma.productVariant.count();
            const activeVariants = await this.prisma.productVariant.count({
                where: { isActive: true },
            });
            const categoriesWithProducts = await this.prisma.category.findMany({
                include: {
                    _count: {
                        select: { products: true },
                    },
                },
            });
            return {
                totalProducts,
                activeProducts,
                inactiveProducts: totalProducts - activeProducts,
                totalVariants,
                activeVariants,
                inactiveVariants: totalVariants - activeVariants,
                totalCategories: categoriesWithProducts.length,
                averageProductsPerCategory: categoriesWithProducts.length > 0
                    ? (totalProducts / categoriesWithProducts.length).toFixed(1)
                    : 0,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات المنتجات', error);
            throw error;
        }
    }
    async invalidateProductsCache() {
        await this.cacheService.delete(this.productsCacheKey);
        const productKeys = await this.cacheService.getKeys('products:*');
        for (const key of productKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = ProductService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], ProductService);
//# sourceMappingURL=product.service.js.map