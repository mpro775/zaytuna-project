import { SalesService } from './sales.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    createInvoice(createSalesInvoiceDto: CreateSalesInvoiceDto, req: any): Promise<import("./sales.service").SalesInvoiceWithDetails>;
    findAllInvoices(branchId?: string, customerId?: string, status?: string, paymentStatus?: string, limit?: number): Promise<import("./sales.service").SalesInvoiceWithDetails[]>;
    findOneInvoice(id: string): Promise<import("./sales.service").SalesInvoiceWithDetails>;
    updateInvoice(id: string, updateSalesInvoiceDto: UpdateSalesInvoiceDto): Promise<import("./sales.service").SalesInvoiceWithDetails>;
    cancelInvoice(id: string, reason: string, req: any): Promise<import("./sales.service").SalesInvoiceWithDetails>;
    addPayment(id: string, createPaymentDto: CreatePaymentDto, req: any): Promise<import("./sales.service").SalesInvoiceWithDetails>;
    getSalesStats(branchId?: string, startDate?: string, endDate?: string): Promise<{
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
    printInvoice(id: string): Promise<{
        printData: {
            title: string;
            date: string;
            invoice: import("./sales.service").SalesInvoiceWithDetails;
        };
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
    }>;
    getCustomerInvoices(customerId: string): Promise<import("./sales.service").SalesInvoiceWithDetails[]>;
    getBranchInvoices(branchId: string): Promise<import("./sales.service").SalesInvoiceWithDetails[]>;
}
