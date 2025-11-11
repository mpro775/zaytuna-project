import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
export interface SalesReport {
    summary: {
        totalSales: number;
        totalRevenue: number;
        totalTax: number;
        totalDiscount: number;
        totalInvoices: number;
        averageOrderValue: number;
        topSellingProducts: Array<{
            productId: string;
            productName: string;
            quantity: number;
            revenue: number;
        }>;
    };
    byPeriod: Array<{
        period: string;
        sales: number;
        revenue: number;
        invoices: number;
    }>;
    byBranch: Array<{
        branchId: string;
        branchName: string;
        sales: number;
        revenue: number;
        invoices: number;
    }>;
    byCustomer: Array<{
        customerId: string;
        customerName: string;
        sales: number;
        revenue: number;
        invoices: number;
        lastPurchase: Date;
    }>;
    byPaymentMethod: Array<{
        method: string;
        amount: number;
        count: number;
        percentage: number;
    }>;
}
export interface InventoryReport {
    summary: {
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        outOfStockItems: number;
        overStockItems: number;
    };
    byWarehouse: Array<{
        warehouseId: string;
        warehouseName: string;
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
    }>;
    lowStockAlerts: Array<{
        productVariantId: string;
        productName: string;
        variantName: string;
        warehouseName: string;
        currentStock: number;
        minStock: number;
        reorderPoint: number;
    }>;
    stockMovements: Array<{
        date: Date;
        productName: string;
        movementType: string;
        quantity: number;
        warehouseName: string;
        reason: string;
    }>;
    topMovingProducts: Array<{
        productId: string;
        productName: string;
        totalIn: number;
        totalOut: number;
        netMovement: number;
        currentStock: number;
    }>;
}
export interface FinancialReport {
    balanceSheet: {
        assets: {
            currentAssets: number;
            fixedAssets: number;
            totalAssets: number;
        };
        liabilities: {
            currentLiabilities: number;
            longTermLiabilities: number;
            totalLiabilities: number;
        };
        equity: {
            capital: number;
            retainedEarnings: number;
            totalEquity: number;
        };
        totalLiabilitiesAndEquity: number;
    };
    profitLoss: {
        revenue: {
            salesRevenue: number;
            otherIncome: number;
            totalRevenue: number;
        };
        expenses: {
            costOfGoodsSold: number;
            operatingExpenses: number;
            totalExpenses: number;
        };
        netProfit: number;
        grossMargin: number;
        netMargin: number;
    };
    cashFlow?: {
        operatingActivities: number;
        investingActivities: number;
        financingActivities: number;
        netCashFlow: number;
    };
}
export interface DashboardData {
    overview: {
        totalRevenue: number;
        totalRevenueChange: number;
        totalOrders: number;
        totalOrdersChange: number;
        totalCustomers: number;
        totalCustomersChange: number;
        averageOrderValue: number;
        averageOrderValueChange: number;
    };
    charts: {
        revenueByPeriod: Array<{
            period: string;
            revenue: number;
            orders: number;
        }>;
        salesByCategory: Array<{
            category: string;
            revenue: number;
            percentage: number;
        }>;
        topProducts: Array<{
            productId: string;
            productName: string;
            revenue: number;
            quantity: number;
        }>;
        customerGrowth: Array<{
            period: string;
            customers: number;
        }>;
    };
    alerts: {
        lowStockItems: number;
        overduePayments: number;
        pendingOrders: number;
        expiringProducts: number;
    };
    recentActivity: Array<{
        type: 'sale' | 'purchase' | 'payment' | 'return';
        description: string;
        amount: number;
        date: Date;
        reference: string;
    }>;
}
export declare class ReportingService {
    private readonly prisma;
    private readonly cacheService;
    private readonly logger;
    private readonly reportsCacheKey;
    constructor(prisma: PrismaService, cacheService: CacheService);
    getSalesReport(startDate: Date, endDate: Date, branchId?: string, customerId?: string): Promise<SalesReport>;
    getInventoryReport(warehouseId?: string, categoryId?: string): Promise<InventoryReport>;
    getFinancialReport(asOfDate: Date, includeCashFlow?: boolean): Promise<FinancialReport>;
    getDashboardData(branchId?: string): Promise<DashboardData>;
    exportReportToExcel(reportType: string, filters: any): Promise<Buffer>;
    exportReportToPDF(reportType: string, filters: any): Promise<Buffer>;
    private calculateBalanceSheet;
    private calculateProfitLoss;
    private calculateCashFlow;
    private invalidateReportsCache;
}
