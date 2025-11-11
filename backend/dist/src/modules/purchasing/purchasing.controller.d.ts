import { PurchasingService } from './purchasing.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { CreatePurchasePaymentDto } from './dto/create-purchase-payment.dto';
export declare class PurchasingController {
    private readonly purchasingService;
    constructor(purchasingService: PurchasingService);
    createSupplier(createSupplierDto: CreateSupplierDto): Promise<import("./purchasing.service").SupplierWithDetails>;
    findAllSuppliers(search?: string, isActive?: string, limit?: number): Promise<import("./purchasing.service").SupplierWithDetails[]>;
    findOneSupplier(id: string): Promise<import("./purchasing.service").SupplierWithDetails>;
    updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto): Promise<import("./purchasing.service").SupplierWithDetails>;
    removeSupplier(id: string): Promise<void>;
    createPurchaseOrder(createPurchaseOrderDto: CreatePurchaseOrderDto, req: any): Promise<import("./purchasing.service").PurchaseOrderWithDetails>;
    findAllPurchaseOrders(supplierId?: string, status?: string, limit?: number): Promise<import("./purchasing.service").PurchaseOrderWithDetails[]>;
    updatePurchaseOrderStatus(id: string, status: string, req: any): Promise<import("./purchasing.service").PurchaseOrderWithDetails>;
    createPurchaseInvoice(createPurchaseInvoiceDto: CreatePurchaseInvoiceDto, req: any): Promise<import("./purchasing.service").PurchaseInvoiceWithDetails>;
    createPurchasePayment(id: string, createPurchasePaymentDto: CreatePurchasePaymentDto, req: any): Promise<any>;
    getPurchasingStats(startDate?: string, endDate?: string): Promise<{
        suppliers: {
            total: number;
            active: number;
            inactive: number;
        };
        purchaseOrders: {
            total: number;
            approved: number;
            pending: number;
        };
        purchaseInvoices: {
            total: number;
            paid: number;
            unpaid: number;
        };
        financial: {
            totalPurchased: number;
            totalPaid: number;
            outstanding: number;
        };
    }>;
    getSupplierPurchaseOrders(supplierId: string): Promise<import("./purchasing.service").PurchaseOrderWithDetails[]>;
    getSupplierPurchaseInvoices(supplierId: string): {
        message: string;
    };
}
