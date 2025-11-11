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
export declare class ProductService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly productsCacheKey;
    private readonly productCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(createProductDto: CreateProductDto): Promise<ProductWithDetails>;
    findAll(categoryId?: string, search?: string): Promise<ProductWithDetails[]>;
    findOne(id: string): Promise<ProductWithDetails>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<ProductWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findByBarcodeOrSku(identifier: string): Promise<ProductWithDetails | null>;
    getProductStats(): Promise<{
        totalProducts: number;
        activeProducts: number;
        inactiveProducts: number;
        totalVariants: number;
        activeVariants: number;
        inactiveVariants: number;
        totalCategories: number;
        averageProductsPerCategory: string | number;
    }>;
    private invalidateProductsCache;
}
