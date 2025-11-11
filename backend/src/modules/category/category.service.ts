import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryWithDetails {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  parent?: {
    id: string;
    name: string;
  };
  children: Array<{
    id: string;
    name: string;
  }>;
  productCount: number;
  level: number;
  path: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  private readonly categoriesCacheKey = 'categories';
  private readonly categoryCacheKey = 'category';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء فئة جديدة
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryWithDetails> {
    try {
      this.logger.log(`إنشاء فئة جديدة: ${createCategoryDto.name}`);

      // التحقق من عدم وجود الفئة بنفس الاسم
      const existingCategory = await this.prisma.category.findFirst({
        where: { name: createCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('اسم الفئة موجود بالفعل');
      }

      // التحقق من وجود الفئة الأب (إذا تم تحديدها)
      if (createCategoryDto.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: createCategoryDto.parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException('الفئة الأب غير موجودة');
        }

        // منع إنشاء فئة فرعية لفئة غير نشطة
        if (!parentCategory.isActive) {
          throw new BadRequestException('لا يمكن إنشاء فئة فرعية لفئة غير نشطة');
        }
      }

      // إنشاء الفئة
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

      // تحديث الكاش
      await this.invalidateCategoriesCache();

      const categoryWithDetails = await this.buildCategoryWithDetails(category);

      this.logger.log(`تم إنشاء الفئة بنجاح: ${category.name}`);
      return categoryWithDetails;
    } catch (error) {
      this.logger.error(`فشل في إنشاء الفئة: ${createCategoryDto.name}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جميع الفئات
   */
  async findAll(includeInactive: boolean = false): Promise<CategoryWithDetails[]> {
    try {
      const cacheKey = includeInactive ? `${this.categoriesCacheKey}:all` : this.categoriesCacheKey;

      // محاولة الحصول من الكاش أولاً
      const cachedCategories = await this.cacheService.get<CategoryWithDetails[]>(cacheKey);
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

      const categoriesWithDetails: CategoryWithDetails[] = [];

      for (const category of categories) {
        categoriesWithDetails.push(await this.buildCategoryWithDetails(category));
      }

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, categoriesWithDetails, { ttl: 600 });

      return categoriesWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على الفئات', error);
      throw error;
    }
  }

  /**
   * الحصول على فئة بالمعرف
   */
  async findOne(id: string): Promise<CategoryWithDetails> {
    try {
      const cacheKey = `${this.categoryCacheKey}:${id}`;
      const cachedCategory = await this.cacheService.get<CategoryWithDetails>(cacheKey);

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
        throw new NotFoundException('الفئة غير موجودة');
      }

      const categoryWithDetails = await this.buildCategoryWithDetails(category);

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, categoryWithDetails, { ttl: 1800 });

      return categoryWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على الفئة: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث فئة
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryWithDetails> {
    try {
      this.logger.log(`تحديث الفئة: ${id}`);

      // التحقق من وجود الفئة
      const existingCategory = await this.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new NotFoundException('الفئة غير موجودة');
      }

      // التحقق من عدم تكرار الاسم
      if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
        const categoryWithSameName = await this.prisma.category.findFirst({
          where: { name: updateCategoryDto.name },
        });

        if (categoryWithSameName) {
          throw new ConflictException('اسم الفئة موجود بالفعل');
        }
      }

      // التحقق من وجود الفئة الأب (إذا تم تحديدها)
      if (updateCategoryDto.parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: updateCategoryDto.parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException('الفئة الأب غير موجودة');
        }

        // منع تحديد فئة كأب لنفسها
        if (updateCategoryDto.parentId === id) {
          throw new BadRequestException('لا يمكن تحديد الفئة كأب لنفسها');
        }

        // منع إنشاء حلقات في التسلسل الهرمي
        if (await this.wouldCreateCycle(id, updateCategoryDto.parentId)) {
          throw new BadRequestException('تحديد هذه الفئة كأب سيؤدي إلى حلقة في التسلسل الهرمي');
        }
      }

      // تحديث الفئة
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

      // تحديث الكاش
      await this.invalidateCategoriesCache();
      await this.cacheService.delete(`${this.categoryCacheKey}:${id}`);

      const categoryWithDetails = await this.buildCategoryWithDetails(category);

      this.logger.log(`تم تحديث الفئة بنجاح: ${category.name}`);
      return categoryWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث الفئة: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف فئة
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`حذف الفئة: ${id}`);

      // التحقق من وجود الفئة
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
        throw new NotFoundException('الفئة غير موجودة');
      }

      // التحقق من عدم وجود منتجات مرتبطة
      if (category._count.products > 0) {
        throw new BadRequestException('لا يمكن حذف فئة مرتبطة بمنتجات');
      }

      // التحقق من عدم وجود فئات فرعية
      if (category._count.children > 0) {
        throw new BadRequestException('لا يمكن حذف فئة تحتوي على فئات فرعية');
      }

      // حذف الفئة
      await this.prisma.category.delete({
        where: { id },
      });

      // تحديث الكاش
      await this.invalidateCategoriesCache();
      await this.cacheService.delete(`${this.categoryCacheKey}:${id}`);

      this.logger.log(`تم حذف الفئة بنجاح: ${category.name}`);
      return { message: 'تم حذف الفئة بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في حذف الفئة: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على الفئات الجذر (بدون أب)
   */
  async findRootCategories(): Promise<CategoryWithDetails[]> {
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

      const categoriesWithDetails: CategoryWithDetails[] = [];

      for (const category of categories) {
        categoriesWithDetails.push(await this.buildCategoryWithDetails(category));
      }

      return categoriesWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على الفئات الجذر', error);
      throw error;
    }
  }

  /**
   * الحصول على فئات فرعية لفئة معينة
   */
  async findSubCategories(parentId: string): Promise<CategoryWithDetails[]> {
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

      const categoriesWithDetails: CategoryWithDetails[] = [];

      for (const category of categories) {
        categoriesWithDetails.push(await this.buildCategoryWithDetails(category));
      }

      return categoriesWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على الفئات الفرعية للفئة: ${parentId}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الفئات
   */
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

      const totalProducts = categoriesWithProducts.reduce(
        (sum, cat) => sum + cat._count.products,
        0,
      );

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
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات الفئات', error);
      throw error;
    }
  }

  /**
   * بناء كائن فئة مع التفاصيل
   */
  private async buildCategoryWithDetails(category: any): Promise<CategoryWithDetails> {
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

  /**
   * الحصول على مستوى الفئة في التسلسل الهرمي
   */
  private async getCategoryLevel(categoryId: string): Promise<number> {
    let level = 0;
    let currentId = categoryId;

    while (currentId) {
      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!category?.parentId) break;

      currentId = category.parentId;
      level++;
    }

    return level;
  }

  /**
   * الحصول على مسار الفئة في التسلسل الهرمي
   */
  private async getCategoryPath(categoryId: string): Promise<string[]> {
    const path: string[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });

      if (!category) break;

      path.unshift(category.name);
      currentId = category.parentId;
    }

    return path;
  }

  /**
   * التحقق من وجود حلقة في التسلسل الهرمي
   */
  private async wouldCreateCycle(categoryId: string, parentId: string): Promise<boolean> {
    let currentId: string | null = parentId;

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

  /**
   * الحصول على أقصى عمق في التسلسل الهرمي
   */
  private async getMaxCategoryDepth(): Promise<number> {
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

  /**
   * إبطال كاش الفئات
   */
  private async invalidateCategoriesCache(): Promise<void> {
    await this.cacheService.delete(this.categoriesCacheKey);
    await this.cacheService.delete(`${this.categoriesCacheKey}:all`);
    // إبطال جميع كاشات الفئات الفردية
    const categoryKeys = await this.cacheService.getKeys(`${this.categoryCacheKey}:*`);
    for (const key of categoryKeys) {
      await this.cacheService.delete(key);
    }
  }
}
