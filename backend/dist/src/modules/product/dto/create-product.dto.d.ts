export declare class CreateProductDto {
    name: string;
    description?: string;
    barcode?: string;
    sku?: string;
    categoryId: string;
    basePrice: number;
    costPrice?: number;
    taxId?: string;
    trackInventory?: boolean;
    reorderPoint?: number;
    imageUrl?: string;
    isActive?: boolean;
}
