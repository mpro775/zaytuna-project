export declare class CreateProductVariantDto {
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
    isActive?: boolean;
}
