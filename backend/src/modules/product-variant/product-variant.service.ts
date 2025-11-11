import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

export interface ProductVariantWithDetails {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  price?: number;
  costPrice?: number;
  weight?: number;
  dimensions?: Record<string, any>;
  attributes?: Record<string, any>;
  imageUrl?: string;
  isActive: boolean;
  product: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductVariantService {
  private readonly logger = new Logger(ProductVariantService.name);
  private readonly variantsCacheKey = 'product_variants';
  private readonly variantCacheKey = 'product_variant';

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * إنشاء متغير منتج جديد
   */
  async create(createVariantDto: CreateProductVariantDto): Promise<ProductVariantWithDetails> {
    try {
      this.logger.log(`إنشاء متغير منتج جديد: ${createVariantDto.name}`);

      // التحقق من وجود المنتج
      const product = await this.prisma.product.findUnique({
        where: { id: createVariantDto.productId },
      });

      if (!product) {
        throw new NotFoundException('المنتج غير موجود');
      }

      // التحقق من عدم وجود SKU مكرر
      if (createVariantDto.sku) {
        const existingVariant = await this.prisma.productVariant.findUnique({
          where: { sku: createVariantDto.sku },
        });

        if (existingVariant) {
          throw new ConflictException('رمز SKU موجود بالفعل');
        }
      }

      // التحقق من عدم وجود باركود مكرر
      if (createVariantDto.barcode) {
        const existingVariant = await this.prisma.productVariant.findUnique({
          where: { barcode: createVariantDto.barcode },
        });

        if (existingVariant) {
          throw new ConflictException('الباركود موجود بالفعل');
        }
      }

      // إنشاء المتغير
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

      // تحديث الكاش
      await this.invalidateVariantsCache();

      const variantWithDetails: ProductVariantWithDetails = {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        sku: variant.sku || undefined,
        barcode: variant.barcode || undefined,
        price: variant.price ? Number(variant.price) : undefined,
        costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
        weight: variant.weight ? Number(variant.weight) : undefined,
        dimensions: variant.dimensions as Record<string, any> || undefined,
        attributes: variant.attributes as Record<string, any> || undefined,
        imageUrl: variant.imageUrl || undefined,
        isActive: variant.isActive,
        product: variant.product,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      };

      this.logger.log(`تم إنشاء متغير المنتج بنجاح: ${variant.name}`);
      return variantWithDetails;
    } catch (error) {
      this.logger.error(`فشل في إنشاء متغير المنتج: ${createVariantDto.name}`, error);
      throw error;
    }
  }

  /**
   * الحصول على جميع متغيرات المنتج
   */
  async findAll(productId?: string): Promise<ProductVariantWithDetails[]> {
    try {
      const cacheKey = productId ? `${this.variantsCacheKey}:product:${productId}` : this.variantsCacheKey;

      // محاولة الحصول من الكاش أولاً
      const cachedVariants = await this.cacheService.get<ProductVariantWithDetails[]>(cacheKey);
      if (cachedVariants) {
        return cachedVariants;
      }

      const where: any = { isActive: true };

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

      const variantsWithDetails: ProductVariantWithDetails[] = variants.map(variant => ({
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        sku: variant.sku || undefined,
        barcode: variant.barcode || undefined,
        price: variant.price ? Number(variant.price) : undefined,
        costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
        weight: variant.weight ? Number(variant.weight) : undefined,
        dimensions: variant.dimensions as Record<string, any> || undefined,
        attributes: variant.attributes as Record<string, any> || undefined,
        imageUrl: variant.imageUrl || undefined,
        isActive: variant.isActive,
        product: variant.product,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      }));

      // حفظ في الكاش لمدة 10 دقائق
      await this.cacheService.set(cacheKey, variantsWithDetails, { ttl: 600 });

      return variantsWithDetails;
    } catch (error) {
      this.logger.error('فشل في الحصول على متغيرات المنتج', error);
      throw error;
    }
  }

  /**
   * الحصول على متغير منتج بالمعرف
   */
  async findOne(id: string): Promise<ProductVariantWithDetails> {
    try {
      const cacheKey = `${this.variantCacheKey}:${id}`;
      const cachedVariant = await this.cacheService.get<ProductVariantWithDetails>(cacheKey);

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
        throw new NotFoundException('متغير المنتج غير موجود');
      }

      const variantWithDetails: ProductVariantWithDetails = {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        sku: variant.sku || undefined,
        barcode: variant.barcode || undefined,
        price: variant.price ? Number(variant.price) : undefined,
        costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
        weight: variant.weight ? Number(variant.weight) : undefined,
        dimensions: variant.dimensions as Record<string, any> || undefined,
        attributes: variant.attributes as Record<string, any> || undefined,
        imageUrl: variant.imageUrl || undefined,
        isActive: variant.isActive,
        product: variant.product,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      };

      // حفظ في الكاش لمدة 30 دقيقة
      await this.cacheService.set(cacheKey, variantWithDetails, { ttl: 1800 });

      return variantWithDetails;
    } catch (error) {
      this.logger.error(`فشل في الحصول على متغير المنتج: ${id}`, error);
      throw error;
    }
  }

  /**
   * تحديث متغير منتج
   */
  async update(id: string, updateVariantDto: UpdateProductVariantDto): Promise<ProductVariantWithDetails> {
    try {
      this.logger.log(`تحديث متغير المنتج: ${id}`);

      // التحقق من وجود المتغير
      const existingVariant = await this.prisma.productVariant.findUnique({
        where: { id },
      });

      if (!existingVariant) {
        throw new NotFoundException('متغير المنتج غير موجود');
      }

      // التحقق من عدم تكرار SKU
      if (updateVariantDto.sku && updateVariantDto.sku !== existingVariant.sku) {
        const variantWithSameSku = await this.prisma.productVariant.findUnique({
          where: { sku: updateVariantDto.sku },
        });

        if (variantWithSameSku) {
          throw new ConflictException('رمز SKU موجود بالفعل');
        }
      }

      // التحقق من عدم تكرار الباركود
      if (updateVariantDto.barcode && updateVariantDto.barcode !== existingVariant.barcode) {
        const variantWithSameBarcode = await this.prisma.productVariant.findUnique({
          where: { barcode: updateVariantDto.barcode },
        });

        if (variantWithSameBarcode) {
          throw new ConflictException('الباركود موجود بالفعل');
        }
      }

      // تحديث المتغير
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

      // تحديث الكاش
      await this.invalidateVariantsCache();
      await this.cacheService.delete(`${this.variantCacheKey}:${id}`);

      const variantWithDetails: ProductVariantWithDetails = {
        id: variant.id,
        productId: variant.productId,
        name: variant.name,
        sku: variant.sku || undefined,
        barcode: variant.barcode || undefined,
        price: variant.price ? Number(variant.price) : undefined,
        costPrice: variant.costPrice ? Number(variant.costPrice) : undefined,
        weight: variant.weight ? Number(variant.weight) : undefined,
        dimensions: variant.dimensions as Record<string, any> || undefined,
        attributes: variant.attributes as Record<string, any> || undefined,
        imageUrl: variant.imageUrl || undefined,
        isActive: variant.isActive,
        product: variant.product,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      };

      this.logger.log(`تم تحديث متغير المنتج بنجاح: ${variant.name}`);
      return variantWithDetails;
    } catch (error) {
      this.logger.error(`فشل في تحديث متغير المنتج: ${id}`, error);
      throw error;
    }
  }

  /**
   * حذف متغير منتج
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      this.logger.log(`حذف متغير المنتج: ${id}`);

      // التحقق من وجود المتغير
      const variant = await this.prisma.productVariant.findUnique({
        where: { id },
      });

      if (!variant) {
        throw new NotFoundException('متغير المنتج غير موجود');
      }

      // حذف المتغير
      await this.prisma.productVariant.delete({
        where: { id },
      });

      // تحديث الكاش
      await this.invalidateVariantsCache();
      await this.cacheService.delete(`${this.variantCacheKey}:${id}`);

      this.logger.log(`تم حذف متغير المنتج بنجاح: ${variant.name}`);
      return { message: 'تم حذف متغير المنتج بنجاح' };
    } catch (error) {
      this.logger.error(`فشل في حذف متغير المنتج: ${id}`, error);
      throw error;
    }
  }

  /**
   * الحصول على متغيرات منتج حسب الباركود أو SKU
   */
  async findByBarcodeOrSku(identifier: string): Promise<ProductVariantWithDetails | null> {
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
        dimensions: variant.dimensions as Record<string, any> || undefined,
        attributes: variant.attributes as Record<string, any> || undefined,
        imageUrl: variant.imageUrl || undefined,
        isActive: variant.isActive,
        product: variant.product,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      };
    } catch (error) {
      this.logger.error(`فشل في البحث عن متغير المنتج: ${identifier}`, error);
      throw error;
    }
  }

  /**
   * إبطال كاش المتغيرات
   */
  private async invalidateVariantsCache(): Promise<void> {
    await this.cacheService.delete(this.variantsCacheKey);
    // إبطال جميع الكاشات المتعلقة بالمنتجات
    const variantKeys = await this.cacheService.getKeys(`${this.variantsCacheKey}:*`);
    for (const key of variantKeys) {
      await this.cacheService.delete(key);
    }
    // إبطال كاش المتغيرات الفردية
    const individualKeys = await this.cacheService.getKeys(`${this.variantCacheKey}:*`);
    for (const key of individualKeys) {
      await this.cacheService.delete(key);
    }
  }
}
