declare class ReturnLineDto {
    productVariantId: string;
    quantity: number;
    unitPrice?: number;
    discountAmount?: number;
    taxAmount?: number;
    lineTotal?: number;
    reason?: string;
}
export declare class CreateReturnDto {
    returnNumber?: string;
    salesInvoiceId: string;
    warehouseId: string;
    reason: string;
    lines: ReturnLineDto[];
    status?: string;
    notes?: string;
}
export {};
