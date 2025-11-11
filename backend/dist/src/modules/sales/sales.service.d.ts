import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
export interface SalesInvoiceWithDetails {
    id: string;
    invoiceNumber: string;
    branchId: string;
    customerId?: string;
    cashierId: string;
    warehouseId: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currencyId: string;
    taxId?: string;
    status: string;
    paymentStatus: string;
    notes?: string;
    dueDate?: Date;
    branch: {
        id: string;
        name: string;
        code: string;
    };
    customer?: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
    };
    cashier: {
        id: string;
        username: string;
    };
    warehouse: {
        id: string;
        name: string;
        code: string;
    };
    currency: {
        id: string;
        code: string;
        name: string;
        symbol?: string;
    };
    tax?: {
        id: string;
        name: string;
        rate: number;
    };
    lines: Array<{
        id: string;
        productVariantId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
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
        processedBy?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SalesService {
    private readonly prisma;
    private readonly cacheService;
    private readonly inventoryService;
    private readonly logger;
    private readonly salesInvoicesCacheKey;
    private readonly salesInvoiceCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService, inventoryService: InventoryService);
    create(createSalesInvoiceDto: CreateSalesInvoiceDto, userId: string): Promise<SalesInvoiceWithDetails>;
    findAll(branchId?: string, customerId?: string, status?: string, paymentStatus?: string, limit?: number): Promise<SalesInvoiceWithDetails[]>;
    findOne(id: string): Promise<SalesInvoiceWithDetails>;
    update(id: string, updateSalesInvoiceDto: UpdateSalesInvoiceDto): Promise<SalesInvoiceWithDetails>;
    addPayment(salesInvoiceId: string, createPaymentDto: CreatePaymentDto, userId: string): Promise<SalesInvoiceWithDetails>;
    cancel(id: string, reason: string, userId: string): Promise<SalesInvoiceWithDetails>;
    getSalesStats(branchId?: string, startDate?: Date, endDate?: Date): Promise<{
        totalInvoices: number;
        confirmedInvoices: number;
        cancelledInvoices: number;
        totalRevenue: number;
        totalTax: number;
        totalDiscount: number;
        pendingPayments: number;
        paidInvoices: number;
        averageInvoiceValue: number;
    }>;
    private buildSalesInvoiceWithDetails;
    private invalidateSalesCache;
}
