import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    create(createCategoryDto: CreateCategoryDto): Promise<import("./category.service").CategoryWithDetails>;
    findAll(includeInactive?: boolean): Promise<import("./category.service").CategoryWithDetails[]>;
    findRootCategories(): Promise<import("./category.service").CategoryWithDetails[]>;
    getCategoryStats(): Promise<{
        totalCategories: number;
        activeCategories: number;
        inactiveCategories: number;
        rootCategories: number;
        maxDepth: number;
        totalProducts: number;
        averageProductsPerCategory: string | number;
    }>;
    findOne(id: string): Promise<import("./category.service").CategoryWithDetails>;
    findSubCategories(id: string): Promise<import("./category.service").CategoryWithDetails[]>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<import("./category.service").CategoryWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
