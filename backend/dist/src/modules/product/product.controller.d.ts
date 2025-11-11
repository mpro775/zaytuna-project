import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    create(createProductDto: CreateProductDto): Promise<import("./product.service").ProductWithDetails>;
    findAll(categoryId?: string, search?: string): Promise<import("./product.service").ProductWithDetails[]>;
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
    findByBarcodeOrSku(identifier: string): Promise<import("./product.service").ProductWithDetails | null>;
    findOne(id: string): Promise<import("./product.service").ProductWithDetails>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<import("./product.service").ProductWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
