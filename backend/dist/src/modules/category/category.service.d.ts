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
export declare class CategoryService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly categoriesCacheKey;
    private readonly categoryCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    create(createCategoryDto: CreateCategoryDto): Promise<CategoryWithDetails>;
    findAll(includeInactive?: boolean): Promise<CategoryWithDetails[]>;
    findOne(id: string): Promise<CategoryWithDetails>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
    findRootCategories(): Promise<CategoryWithDetails[]>;
    findSubCategories(parentId: string): Promise<CategoryWithDetails[]>;
    getCategoryStats(): Promise<{
        totalCategories: number;
        activeCategories: number;
        inactiveCategories: number;
        rootCategories: number;
        maxDepth: number;
        totalProducts: number;
        averageProductsPerCategory: string | number;
    }>;
    private buildCategoryWithDetails;
    private getCategoryLevel;
    private getCategoryPath;
    private wouldCreateCycle;
    private getMaxCategoryDepth;
    private invalidateCategoriesCache;
}
