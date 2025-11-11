import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreatePurchasePaymentDto } from './dto/create-purchase-payment.dto';
export interface SupplierWithDetails {
    id: string;
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    paymentTerms?: string;
    isActive: boolean;
    purchaseOrdersCount: number;
    purchaseInvoicesCount: number;
    totalPurchased: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PurchaseOrderWithDetails {
    id: string;
    orderNumber: string;
    supplierId: string;
    warehouseId: string;
    requestedBy: string;
    expectedDate?: Date;
    notes?: string;
    status: string;
    supplier: {
        id: string;
        name: string;
        contactName?: string;
        phone?: string;
        email?: string;
    };
    warehouse: {
        id: string;
        name: string;
        code: string;
    };
    requester: {
        id: string;
        username: string;
    };
    lines: Array<{
        id: string;
        productId: string;
        quantity: number;
        unitCost: number;
        receivedQuantity: number;
        product: {
            id: string;
            name: string;
            sku?: string;
        };
    }>;
    purchaseInvoicesCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface PurchaseInvoiceWithDetails {
    id: string;
    invoiceNumber: string;
    supplierId: string;
    warehouseId: string;
    receivedBy: string;
    purchaseOrderId?: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currencyId: string;
    invoiceDate: Date;
    dueDate?: Date;
    status: string;
    paymentStatus: string;
    notes?: string;
    supplier: {
        id: string;
        name: string;
        contactName?: string;
        phone?: string;
        email?: string;
    };
    warehouse: {
        id: string;
        name: string;
        code: string;
    };
    receiver: {
        id: string;
        username: string;
    };
    purchaseOrder?: {
        id: string;
        orderNumber: string;
    };
    currency: {
        id: string;
        code: string;
        name: string;
        symbol?: string;
    };
    lines: Array<{
        id: string;
        productVariantId: string;
        warehouseId: string;
        quantity: number;
        unitCost: number;
        discountAmount: number;
        taxAmount: number;
        lineTotal: number;
        productVariant: {
            id: string;
            name: string;
            sku?: string;
            barcode?: string;
            product: {
                id: string;
                name: string;
            };
        };
    }>;
    payments: Array<{
        id: string;
        amount: number;
        paymentMethod: string;
        referenceNumber?: string;
        paymentDate: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PurchasingService {
    private readonly prisma;
    private readonly cacheService;
    private readonly inventoryService;
    private readonly logger;
    private readonly suppliersCacheKey;
    private readonly supplierCacheKey;
    private readonly purchaseOrdersCacheKey;
    private readonly purchaseOrderCacheKey;
    private readonly purchaseInvoicesCacheKey;
    private readonly purchaseInvoiceCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService, inventoryService: InventoryService);
    createSupplier(createSupplierDto: CreateSupplierDto): Promise<SupplierWithDetails>;
    findAllSuppliers(search?: string, isActive?: boolean, limit?: number): Promise<SupplierWithDetails[]>;
    findOneSupplier(id: string): Promise<SupplierWithDetails>;
    updateSupplier(id: string, updateSupplierDto: UpdateSupplierDto): Promise<SupplierWithDetails>;
    removeSupplier(id: string): Promise<void>;
    createPurchaseOrder(createPurchaseOrderDto: CreatePurchaseOrderDto, userId: string): Promise<PurchaseOrderWithDetails>;
    findAllPurchaseOrders(supplierId?: string, status?: string, limit?: number): Promise<PurchaseOrderWithDetails[]>;
    updatePurchaseOrderStatus(id: string, status: string, userId: string): Promise<PurchaseOrderWithDetails>;
    createPurchaseInvoice(createPurchaseInvoiceDto: CreatePurchaseInvoiceDto, userId: string): Promise<PurchaseInvoiceWithDetails>;
    createPurchasePayment(invoiceId: string, createPurchasePaymentDto: CreatePurchasePaymentDto, userId: string): Promise<any>;
    getPurchasingStats(startDate?: Date, endDate?: Date): Promise<{
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
    private buildSupplierWithDetails;
    private buildPurchaseOrderWithDetails;
    private buildPurchaseInvoiceWithDetails;
    private invalidateSuppliersCache;
    private invalidatePurchaseOrdersCache;
    private invalidatePurchaseInvoicesCache;
}
