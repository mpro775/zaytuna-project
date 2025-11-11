declare class PurchaseInvoiceLineDto {
    productVariantId: string;
    quantity: number;
    unitCost: number;
    discountAmount?: number;
    taxAmount?: number;
    lineTotal?: number;
}
export declare class CreatePurchaseInvoiceDto {
    invoiceNumber?: string;
    supplierId: string;
    warehouseId: string;
    purchaseOrderId?: string;
    currencyId: string;
    invoiceDate: string;
    lines: PurchaseInvoiceLineDto[];
    dueDate?: string;
    status?: string;
    notes?: string;
}
export {};
