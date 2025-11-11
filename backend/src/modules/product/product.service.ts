import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductWithDetails {
  id: string;
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  categoryId: string;
  basePrice: number;
  costPrice?: number;
  taxId?: string;
  isActive: boolean;
  trackInventory: boolean;
  reorderPoint?: number;
  imageUrl?: string;
  category: {
    id: string;
    name: string;
  };
  variantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly productsCacheKey = 'products';
  private readonly productCacheKey = 'product';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء منتج جديد
   */
  async create(createProductDto: CreateProductDto): Promise<ProductWithDetails> {
    try {
      this.logger.log(`إنشاء منتج جديد: ${createProductDto.name}`);

      // التحقق من عدم وجود الباركود
      if (createProductDto.barcode) {
        const existingProduct = await this.prisma.product.findUnique({
          where: { barcode: createProductDto.barcode },
        });

        if (existingProduct) {
          throw new ConflictException('الباركود موجود بالفعل');
        }
      }

      // التحقق من عدم وجود SKU
      if (createProductDto.sku) {
        const existingProduct = await this.prisma.product.findUnique({
          where: { sku: createProductDto.sku },
        });

        if (existingProduct) {
          throw new ConflictException('رمز SKU موجود بالفعل');
        }
      }

      // التحقق من وجود الفئة
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('الفئة غير موجودة');
      }

      // إنشاء المنتج
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

      // تحديث الكاش
      await this.invalidateProductsCache();

      const productWithDetails: ProductWithDetails = {
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
    } catch (error) {
      this.logger.error(`فشل في إنشاء المنتج: ${createProductDto.name}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جميع المنتجات
   */
  async findAll(categoryId?: string, search?: string): Promise<ProductWithDetails[]> {
    try {
      const cacheKey = categoryId
        ? `products:category:${categoryId}`
        : search
        ? `products:search:${search}`
        : this.productsCacheKey;

      // محاولة الحصول من الكاش أولاً
      const cachedProducts = await this.cacheService.get<ProductWithDetails[]>(cacheKey);
      if (cachedProducts) {
        return cachedProducts;
      }

      const where: any = { isActive: true };

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

      const productsWithDetails: ProductWithDetails[] = products.map(product => ({
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

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, productsWithDetails, { ttl: 600 });

      return productsWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على المنتجات', error);
      throw error;
    }
  }

  /**
   * الحصول على منتج بالمعرف
   */
  async findOne(id: string): Promise<ProductWithDetails> {
    try {
      const cacheKey = `${this.productCacheKey}:${id}`;
      const cachedProduct = await this.cacheService.get<ProductWithDetails>(cacheKey);

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
        throw new NotFoundException('المنتج غير موجود');
      }

      const productWithDetails: ProductWithDetails = {
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

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, productWithDetails, { ttl: 1800 });

      return productWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على المنتج: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث منتج
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductWithDetails> {
    try {
      this.logger.log(`تحديث المنتج: ${id}`);

      // التحقق من وجود المنتج
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new NotFoundException('المنتج غير موجود');
      }

      // التحقق من عدم تكرار الباركود
      if (updateProductDto.barcode && updateProductDto.barcode !== existingProduct.barcode) {
        const productWithSameBarcode = await this.prisma.product.findUnique({
          where: { barcode: updateProductDto.barcode },
        });

        if (productWithSameBarcode) {
          throw new ConflictException('الباركود موجود بالفعل');
        }
      }

      // التحقق من عدم تكرار SKU
      if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
        const productWithSameSku = await this.prisma.product.findUnique({
          where: { sku: updateProductDto.sku },
        });

        if (productWithSameSku) {
          throw new ConflictException('رمز SKU موجود بالفعل');
        }
      }

      // تحديث المنتج
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

      // تحديث الكاش
      await this.invalidateProductsCache();
      await this.cacheService.delete(`${this.productCacheKey}:${id}`);

      const productWithDetails: ProductWithDetails = {
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
    } catch (error) {
      this.logger.error(`فشل في تحديث المنتج: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف منتج
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`حذف المنتج: ${id}`);

      // التحقق من وجود المنتج
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
        throw new NotFoundException('المنتج غير موجود');
      }

      // التحقق من عدم وجود متغيرات مرتبطة
      if (product._count.variants > 0) {
        throw new BadRequestException('لا يمكن حذف منتج مرتبط بمتغيرات');
      }

      // حذف المنتج
      await this.prisma.product.delete({
        where: { id },
      });

      // تحديث الكاش
      await this.invalidateProductsCache();
      await this.cacheService.delete(`${this.productCacheKey}:${id}`);

      this.logger.log(`تم حذف المنتج بنجاح: ${product.name}`);
      return { message: 'تم حذف المنتج بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في حذف المنتج: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على المنتجات حسب الباركود أو SKU
   */
  async findByBarcodeOrSku(identifier: string): Promise<ProductWithDetails | null> {
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
    } catch (error) {
      this.logger.error(`فشل في البحث عن المنتج: ${identifier}`, error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المنتجات
   */
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
    } catch (error) {
      this.logger.error('فشل في الحصول على إحصائيات المنتجات', error);
      throw error;
    }
  }

  /**
   * إبطال كاش المنتجات
   */
  private async invalidateProductsCache(): Promise<void> {
    await this.cacheService.delete(this.productsCacheKey);
    // إبطال جميع الكاشات المتعلقة بالفئات والبحث
    const productKeys = await this.cacheService.getKeys('products:*');
    for (const key of productKeys) {
      await this.cacheService.delete(key);
    }
  }
}
