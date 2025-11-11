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
var CategoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const cache_service_1 = require("../../shared/cache/cache.service");
let CategoryService = CategoryService_1 = class CategoryService {
    prisma;
    cacheService;
    logger = new common_1.Logger(CategoryService_1.name);
    categoriesCacheKey = 'categories';
    categoryCacheKey = 'category';
    constructor(prisma, cacheService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
    }
    async create(createCategoryDto) {
        try {
            this.logger.log(`إنشاء فئة جديدة: ${createCategoryDto.name}`);
            const existingCategory = await this.prisma.category.findFirst({
                where: { name: createCategoryDto.name },
            });
            if (existingCategory) {
                throw new common_1.ConflictException('اسم الفئة موجود بالفعل');
            }
            if (createCategoryDto.parentId) {
                const parentCategory = await this.prisma.category.findUnique({
                    where: { id: createCategoryDto.parentId },
                });
                if (!parentCategory) {
                    throw new common_1.NotFoundException('الفئة الأب غير موجودة');
                }
                if (!parentCategory.isActive) {
                    throw new common_1.BadRequestException('لا يمكن إنشاء فئة فرعية لفئة غير نشطة');
                }
            }
            const category = await this.prisma.category.create({
                data: {
                    name: createCategoryDto.name,
                    description: createCategoryDto.description,
                    parentId: createCategoryDto.parentId,
                    imageUrl: createCategoryDto.imageUrl,
                    isActive: createCategoryDto.isActive ?? true,
                },
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    children: {
                        select: {
                            id: true,
                            name: true,
                        },
                        where: { isActive: true },
                        orderBy: { name: 'asc' },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            await this.invalidateCategoriesCache();
            const categoryWithDetails = await this.buildCategoryWithDetails(category);
            this.logger.log(`تم إنشاء الفئة بنجاح: ${category.name}`);
            return categoryWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في إنشاء الفئة: ${createCategoryDto.name}`, error);
            throw error;
        }
    }
    async findAll(includeInactive = false) {
        try {
            const cacheKey = includeInactive ? `${this.categoriesCacheKey}:all` : this.categoriesCacheKey;
            const cachedCategories = await this.cacheService.get(cacheKey);
            if (cachedCategories) {
                return cachedCategories;
            }
            const where = includeInactive ? {} : { isActive: true };
            const categories = await this.prisma.category.findMany({
                where,
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    children: {
                        select: {
                            id: true,
                            name: true,
                        },
                        where: { isActive: true },
                        orderBy: { name: 'asc' },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const categoriesWithDetails = [];
            for (const category of categories) {
                categoriesWithDetails.push(await this.buildCategoryWithDetails(category));
            }
            await this.cacheService.set(cacheKey, categoriesWithDetails, { ttl: 600 });
            return categoriesWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على الفئات', error);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const cacheKey = `${this.categoryCacheKey}:${id}`;
            const cachedCategory = await this.cacheService.get(cacheKey);
            if (cachedCategory) {
                return cachedCategory;
            }
            const category = await this.prisma.category.findUnique({
                where: { id },
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    children: {
                        select: {
                            id: true,
                            name: true,
                        },
                        where: { isActive: true },
                        orderBy: { name: 'asc' },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            if (!category) {
                throw new common_1.NotFoundException('الفئة غير موجودة');
            }
            const categoryWithDetails = await this.buildCategoryWithDetails(category);
            await this.cacheService.set(cacheKey, categoryWithDetails, { ttl: 1800 });
            return categoryWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على الفئة: ${id}`, error);
            throw error;
        }
    }
    async update(id, updateCategoryDto) {
        try {
            this.logger.log(`تحديث الفئة: ${id}`);
            const existingCategory = await this.prisma.category.findUnique({
                where: { id },
            });
            if (!existingCategory) {
                throw new common_1.NotFoundException('الفئة غير موجودة');
            }
            if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
                const categoryWithSameName = await this.prisma.category.findFirst({
                    where: { name: updateCategoryDto.name },
                });
                if (categoryWithSameName) {
                    throw new common_1.ConflictException('اسم الفئة موجود بالفعل');
                }
            }
            if (updateCategoryDto.parentId) {
                const parentCategory = await this.prisma.category.findUnique({
                    where: { id: updateCategoryDto.parentId },
                });
                if (!parentCategory) {
                    throw new common_1.NotFoundException('الفئة الأب غير موجودة');
                }
                if (updateCategoryDto.parentId === id) {
                    throw new common_1.BadRequestException('لا يمكن تحديد الفئة كأب لنفسها');
                }
                if (await this.wouldCreateCycle(id, updateCategoryDto.parentId)) {
                    throw new common_1.BadRequestException('تحديد هذه الفئة كأب سيؤدي إلى حلقة في التسلسل الهرمي');
                }
            }
            const category = await this.prisma.category.update({
                where: { id },
                data: {
                    name: updateCategoryDto.name,
                    description: updateCategoryDto.description,
                    parentId: updateCategoryDto.parentId,
                    imageUrl: updateCategoryDto.imageUrl,
                    isActive: updateCategoryDto.isActive,
                },
                include: {
                    parent: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    children: {
                        select: {
                            id: true,
                            name: true,
                        },
                        where: { isActive: true },
                        orderBy: { name: 'asc' },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
            });
            await this.invalidateCategoriesCache();
            await this.cacheService.delete(`${this.categoryCacheKey}:${id}`);
            const categoryWithDetails = await this.buildCategoryWithDetails(category);
            this.logger.log(`تم تحديث الفئة بنجاح: ${category.name}`);
            return categoryWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في تحديث الفئة: ${id}`, error);
            throw error;
        }
    }
    async remove(id) {
        try {
            this.logger.log(`حذف الفئة: ${id}`);
            const category = await this.prisma.category.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            products: true,
                            children: true,
                        },
                    },
                },
            });
            if (!category) {
                throw new common_1.NotFoundException('الفئة غير موجودة');
            }
            if (category._count.products > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف فئة مرتبطة بمنتجات');
            }
            if (category._count.children > 0) {
                throw new common_1.BadRequestException('لا يمكن حذف فئة تحتوي على فئات فرعية');
            }
            await this.prisma.category.delete({
                where: { id },
            });
            await this.invalidateCategoriesCache();
            await this.cacheService.delete(`${this.categoryCacheKey}:${id}`);
            this.logger.log(`تم حذف الفئة بنجاح: ${category.name}`);
            return { message: 'تم حذف الفئة بنجاح' };
        }
        catch (error) {
            this.logger.error(`فشل في حذف الفئة: ${id}`, error);
            throw error;
        }
    }
    async findRootCategories() {
        try {
            const categories = await this.prisma.category.findMany({
                where: {
                    parentId: null,
                    isActive: true,
                },
                include: {
                    children: {
                        select: {
                            id: true,
                            name: true,
                        },
                        where: { isActive: true },
                        orderBy: { name: 'asc' },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const categoriesWithDetails = [];
            for (const category of categories) {
                categoriesWithDetails.push(await this.buildCategoryWithDetails(category));
            }
            return categoriesWithDetails;
        }
        catch (error) {
            this.logger.error('فشل في الحصول على الفئات الجذر', error);
            throw error;
        }
    }
    async findSubCategories(parentId) {
        try {
            const categories = await this.prisma.category.findMany({
                where: {
                    parentId,
                    isActive: true,
                },
                include: {
                    children: {
                        select: {
                            id: true,
                            name: true,
                        },
                        where: { isActive: true },
                        orderBy: { name: 'asc' },
                    },
                    _count: {
                        select: {
                            products: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
            const categoriesWithDetails = [];
            for (const category of categories) {
                categoriesWithDetails.push(await this.buildCategoryWithDetails(category));
            }
            return categoriesWithDetails;
        }
        catch (error) {
            this.logger.error(`فشل في الحصول على الفئات الفرعية للفئة: ${parentId}`, error);
            throw error;
        }
    }
    async getCategoryStats() {
        try {
            const totalCategories = await this.prisma.category.count();
            const activeCategories = await this.prisma.category.count({
                where: { isActive: true },
            });
            const rootCategories = await this.prisma.category.count({
                where: { parentId: null },
            });
            const maxDepth = await this.getMaxCategoryDepth();
            const categoriesWithProducts = await this.prisma.category.findMany({
                include: {
                    _count: {
                        select: { products: true },
                    },
                },
            });
            const totalProducts = categoriesWithProducts.reduce((sum, cat) => sum + cat._count.products, 0);
            return {
                totalCategories,
                activeCategories,
                inactiveCategories: totalCategories - activeCategories,
                rootCategories,
                maxDepth,
                totalProducts,
                averageProductsPerCategory: totalCategories > 0
                    ? (totalProducts / totalCategories).toFixed(1)
                    : 0,
            };
        }
        catch (error) {
            this.logger.error('فشل في الحصول على إحصائيات الفئات', error);
            throw error;
        }
    }
    async buildCategoryWithDetails(category) {
        const level = await this.getCategoryLevel(category.id);
        const path = await this.getCategoryPath(category.id);
        return {
            id: category.id,
            name: category.name,
            description: category.description || undefined,
            parentId: category.parentId || undefined,
            imageUrl: category.imageUrl || undefined,
            isActive: category.isActive,
            parent: category.parent || undefined,
            children: category.children || [],
            productCount: category._count?.products || 0,
            level,
            path,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
    async getCategoryLevel(categoryId) {
        let level = 0;
        let currentId = categoryId;
        while (currentId) {
            const category = await this.prisma.category.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });
            if (!category?.parentId)
                break;
            currentId = category.parentId;
            level++;
        }
        return level;
    }
    async getCategoryPath(categoryId) {
        const path = [];
        let currentId = categoryId;
        while (currentId) {
            const category = await this.prisma.category.findUnique({
                where: { id: currentId },
                select: { id: true, name: true, parentId: true },
            });
            if (!category)
                break;
            path.unshift(category.name);
            currentId = category.parentId;
        }
        return path;
    }
    async wouldCreateCycle(categoryId, parentId) {
        let currentId = parentId;
        while (currentId) {
            if (currentId === categoryId) {
                return true;
            }
            const category = await this.prisma.category.findUnique({
                where: { id: currentId },
                select: { parentId: true },
            });
            currentId = category?.parentId ?? null;
        }
        return false;
    }
    async getMaxCategoryDepth() {
        const categories = await this.prisma.category.findMany({
            select: { id: true },
        });
        let maxDepth = 0;
        for (const category of categories) {
            const depth = await this.getCategoryLevel(category.id);
            maxDepth = Math.max(maxDepth, depth);
        }
        return maxDepth;
    }
    async invalidateCategoriesCache() {
        await this.cacheService.delete(this.categoriesCacheKey);
        await this.cacheService.delete(`${this.categoriesCacheKey}:all`);
        const categoryKeys = await this.cacheService.getKeys(`${this.categoryCacheKey}:*`);
        for (const key of categoryKeys) {
            await this.cacheService.delete(key);
        }
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = CategoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], CategoryService);
//# sourceMappingURL=category.service.js.map