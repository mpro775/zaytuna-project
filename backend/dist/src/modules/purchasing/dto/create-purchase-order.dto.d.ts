declare class PurchaseOrderLineDto {
    productId: string;
    quantity: number;
    unitCost: number;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    warehouseId: string;
    lines: PurchaseOrderLineDto[];
    expectedDate?: string;
    notes?: string;
}
export {};
