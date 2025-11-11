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
export declare class ProductVariantService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly variantsCacheKey;
    private readonly variantCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(createVariantDto: CreateProductVariantDto): Promise<ProductVariantWithDetails>;
    findAll(productId?: string): Promise<ProductVariantWithDetails[]>;
    findOne(id: string): Promise<ProductVariantWithDetails>;
    update(id: string, updateVariantDto: UpdateProductVariantDto): Promise<ProductVariantWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findByBarcodeOrSku(identifier: string): Promise<ProductVariantWithDetails | null>;
    private invalidateVariantsCache;
}
