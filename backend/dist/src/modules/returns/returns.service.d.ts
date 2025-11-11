import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
export interface ReturnWithDetails {
    id: string;
    returnNumber: string;
    salesInvoiceId: string;
    customerId?: string;
    cashierId: string;
    warehouseId: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currencyId: string;
    reason: string;
    status: string;
    refundStatus: string;
    notes?: string;
    salesInvoice: {
        id: string;
        invoiceNumber: string;
        totalAmount: number;
        customer?: {
            id: string;
            name: string;
        };
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
    lines: Array<{
        id: string;
        productVariantId: string;
        warehouseId: string;
        quantity: number;
        unitPrice: number;
        discountAmount: number;
        taxAmount: number;
        lineTotal: number;
        reason?: string;
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
    creditNotes: Array<{
        id: string;
        creditNoteNumber: string;
        amount: number;
        remainingAmount: number;
        status: string;
        expiryDate?: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ReturnsService {
    private readonly prisma;
    private readonly cacheService;
    private readonly inventoryService;
    private readonly logger;
    private readonly returnsCacheKey;
    private readonly returnCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService, inventoryService: InventoryService);
    create(createReturnDto: CreateReturnDto, userId: string): Promise<ReturnWithDetails>;
    findAll(salesInvoiceId?: string, customerId?: string, status?: string, refundStatus?: string, limit?: number): Promise<ReturnWithDetails[]>;
    findOne(id: string): Promise<ReturnWithDetails>;
    update(id: string, updateReturnDto: UpdateReturnDto): Promise<ReturnWithDetails>;
    createCreditNote(returnId: string, createCreditNoteDto: CreateCreditNoteDto, userId: string): Promise<any>;
    cancel(id: string, reason: string, userId: string): Promise<ReturnWithDetails>;
    getReturnsStats(startDate?: Date, endDate?: Date): Promise<{
        totalReturns: number;
        confirmedReturns: number;
        cancelledReturns: number;
        totalReturnValue: number;
        totalCreditNotes: number;
        refundedReturns: number;
        pendingRefunds: number;
        averageReturnValue: number;
    }>;
    private buildReturnWithDetails;
    private invalidateReturnsCache;
}
