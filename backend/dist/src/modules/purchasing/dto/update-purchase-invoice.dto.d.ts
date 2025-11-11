import { CreatePurchaseInvoiceDto } from './create-purchase-invoice.dto';
declare const UpdatePurchaseInvoiceDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePurchaseInvoiceDto>>;
export declare class UpdatePurchaseInvoiceDto extends UpdatePurchaseInvoiceDto_base {
    status?: string;
    paymentStatus?: string;
}
export {};
