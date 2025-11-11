import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
export declare class ProductVariantController {
    private readonly productVariantService;
    constructor(productVariantService: ProductVariantService);
    create(createProductVariantDto: CreateProductVariantDto): Promise<import("./product-variant.service").ProductVariantWithDetails>;
    findAll(productId?: string): Promise<import("./product-variant.service").ProductVariantWithDetails[]>;
    findByBarcodeOrSku(identifier: string): Promise<import("./product-variant.service").ProductVariantWithDetails | null>;
    findOne(id: string): Promise<import("./product-variant.service").ProductVariantWithDetails>;
    update(id: string, updateProductVariantDto: UpdateProductVariantDto): Promise<import("./product-variant.service").ProductVariantWithDetails>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
