declare class SalesInvoiceLineDto {
    productVariantId: string;
    quantity: number;
    unitPrice?: number;
    discountAmount?: number;
    taxAmount?: number;
    lineTotal?: number;
}
export declare class CreateSalesInvoiceDto {
    invoiceNumber?: string;
    branchId: string;
    customerId?: string;
    warehouseId: string;
    currencyId: string;
    taxId?: string;
    lines: SalesInvoiceLineDto[];
    status?: string;
    notes?: string;
    dueDate?: string;
}
export {};
