import type { Response } from 'express';
import { ReportingService } from './reporting.service';
export declare class ReportingController {
    private readonly reportingService;
    constructor(reportingService: ReportingService);
    getSalesReport(startDate: string, endDate: string, branchId?: string, customerId?: string): Promise<import("./reporting.service").SalesReport>;
    getMonthlySalesReport(year?: number, month?: number, branchId?: string): Promise<import("./reporting.service").SalesReport>;
    getDailySalesReport(date?: string, branchId?: string): Promise<import("./reporting.service").SalesReport>;
    getInventoryReport(warehouseId?: string, categoryId?: string): Promise<import("./reporting.service").InventoryReport>;
    getLowStockReport(warehouseId?: string): Promise<{
        lowStockAlerts: {
            productVariantId: string;
            productName: string;
            variantName: string;
            warehouseName: string;
            currentStock: number;
            minStock: number;
            reorderPoint: number;
        }[];
        summary: {
            totalLowStockItems: number;
            totalOutOfStockItems: number;
        };
    }>;
    getStockMovementsReport(warehouseId?: string, startDate?: string, endDate?: string): Promise<{
        stockMovements: {
            date: Date;
            productName: string;
            movementType: string;
            quantity: number;
            warehouseName: string;
            reason: string;
        }[];
        summary: {
            totalItems: number;
            totalValue: number;
            lowStockItems: number;
            outOfStockItems: number;
            overStockItems: number;
        };
    }>;
    getBalanceSheetReport(asOfDate?: string): Promise<{
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
    }>;
    getProfitLossReport(startDate: string, endDate: string): Promise<{
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
    }>;
    getCashFlowReport(startDate: string, endDate: string): Promise<{
        operatingActivities: number;
        investingActivities: number;
        financingActivities: number;
        netCashFlow: number;
    } | undefined>;
    getComprehensiveFinancialReport(asOfDate?: string): Promise<import("./reporting.service").FinancialReport>;
    getDashboardOverview(branchId?: string): Promise<import("./reporting.service").DashboardData>;
    getDashboardSalesData(period?: 'daily' | 'weekly' | 'monthly', branchId?: string): Promise<import("./reporting.service").SalesReport>;
    getDashboardInventoryData(warehouseId?: string): Promise<{
        summary: {
            totalItems: number;
            totalValue: number;
            lowStockItems: number;
            outOfStockItems: number;
            overStockItems: number;
        };
        lowStockAlerts: {
            productVariantId: string;
            productName: string;
            variantName: string;
            warehouseName: string;
            currentStock: number;
            minStock: number;
            reorderPoint: number;
        }[];
        topMovingProducts: {
            productId: string;
            productName: string;
            totalIn: number;
            totalOut: number;
            netMovement: number;
            currentStock: number;
        }[];
    }>;
    exportSalesReportToExcel(res: Response, startDate: string, endDate: string, branchId?: string): Promise<void>;
    exportInventoryReportToExcel(res: Response, warehouseId?: string): Promise<void>;
    exportSalesReportToPDF(res: Response, startDate: string, endDate: string, branchId?: string): Promise<void>;
    exportInventoryReportToPDF(res: Response, warehouseId?: string): Promise<void>;
    generateScheduledReport(frequency: 'daily' | 'weekly' | 'monthly', branchId?: string): Promise<{
        message: string;
        period: string;
    }>;
    getCustomReport(reportType: string, filters: string, groupBy?: string, sortBy?: string): {
        message: string;
        requestedType: string;
        filters: any;
    };
    getPerformanceAnalytics(metric: 'sales' | 'inventory' | 'customers' | 'financial', period?: 'month' | 'quarter' | 'year', branchId?: string): {
        message: string;
        metric: "sales" | "inventory" | "customers" | "financial";
        period: "year" | "month" | "quarter";
        branchId: string | undefined;
    };
    getPeriodComparison(currentStart: string, currentEnd: string, previousStart: string, previousEnd: string, branchId?: string): {
        message: string;
        currentPeriod: string;
        previousPeriod: string;
        branchId: string | undefined;
    };
}
