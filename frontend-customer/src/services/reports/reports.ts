import { api } from '../api';
import type { ApiResponse } from '../api';

// Types based on backend/src/modules/reporting/reporting.service.ts

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
    lastPurchase: string;
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
    date: string;
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
    date: string;
    reference: string;
  }>;
}

export interface ReportsFilters {
  branchId?: string;
  customerId?: string;
  warehouseId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  date?: string;
  period?: 'daily' | 'weekly' | 'monthly';
  asOfDate?: string;
}

export interface ExportOptions {
  format: 'excel' | 'pdf';
  reportType: 'sales' | 'inventory';
  filters: ReportsFilters;
}

export interface ScheduledReportOptions {
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  branchId?: string;
}

export interface CustomReportOptions {
  reportType: string;
  filters: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
}

export interface AnalyticsOptions {
  metric: 'sales' | 'inventory' | 'customers' | 'financial';
  period: 'month' | 'quarter' | 'year';
  branchId?: string;
}

export interface PeriodComparisonOptions {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  branchId?: string;
}

// Helper types for dashboard and reports
export type KPIMetrics = {
  totalSales: number;
  totalInvoices: number;
  totalCustomers: number;
  lowStockItems: number;
  monthlySales: number;
  weeklySales: number;
  dailySales: number;
  salesGrowth: number;
};

export type SalesChartData = {
  period: string;
  sales: number;
  revenue: number;
  invoices: number;
};

export type InventoryAlert = {
  productVariantId: string;
  productId: string;
  productName: string;
  variantName: string;
  warehouseName: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  status: 'critical' | 'warning' | 'normal';
};

export type TopProduct = {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
};

export type ActivityItem = {
  type: 'sale' | 'purchase' | 'payment' | 'return';
  description: string;
  amount: number;
  date: string;
  reference: string;
};

// Reports API service - linked to backend/src/modules/reporting/reporting.controller.ts
export const reportsApi = {
  // ========== SALES REPORTS ==========

  /**
   * تقرير المبيعات الشامل
   * GET /reporting/sales
   */
  async getSalesReport(filters: ReportsFilters): Promise<SalesReport> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate!);
    params.append('endDate', filters.endDate!);
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.customerId) params.append('customerId', filters.customerId);

    const response = await api.get<ApiResponse<SalesReport>>(`/reporting/sales?${params}`);
    return response.data.data;
  },

  /**
   * تقرير المبيعات الشهري
   * GET /reporting/sales/monthly
   */
  async getMonthlySalesReport(filters: ReportsFilters): Promise<SalesReport> {
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.branchId) params.append('branchId', filters.branchId);

    const response = await api.get<ApiResponse<SalesReport>>(`/reporting/sales/monthly?${params}`);
    return response.data.data;
  },

  /**
   * تقرير المبيعات اليومي
   * GET /reporting/sales/daily
   */
  async getDailySalesReport(filters: ReportsFilters): Promise<SalesReport> {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.branchId) params.append('branchId', filters.branchId);

    const response = await api.get<ApiResponse<SalesReport>>(`/reporting/sales/daily?${params}`);
    return response.data.data;
  },

  // ========== INVENTORY REPORTS ==========

  /**
   * تقرير المخزون الشامل
   * GET /reporting/inventory
   */
  async getInventoryReport(filters: ReportsFilters): Promise<InventoryReport> {
    const params = new URLSearchParams();
    if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);

    const response = await api.get<ApiResponse<InventoryReport>>(`/reporting/inventory?${params}`);
    return response.data.data;
  },

  /**
   * تقرير المخزون المنخفض
   * GET /reporting/inventory/low-stock
   */
  async getLowStockReport(warehouseId?: string): Promise<{
    lowStockAlerts: InventoryReport['lowStockAlerts'];
    summary: {
      totalLowStockItems: number;
      totalOutOfStockItems: number;
    };
  }> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId);

    const response = await api.get<ApiResponse<any>>(`/reporting/inventory/low-stock?${params}`);
    return response.data.data;
  },

  /**
   * تقرير حركات المخزون
   * GET /reporting/inventory/movements
   */
  async getStockMovementsReport(filters: ReportsFilters): Promise<{
    stockMovements: InventoryReport['stockMovements'];
    summary: InventoryReport['summary'];
  }> {
    const params = new URLSearchParams();
    if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<ApiResponse<any>>(`/reporting/inventory/movements?${params}`);
    return response.data.data;
  },

  // ========== FINANCIAL REPORTS ==========

  /**
   * الميزانية العمومية
   * GET /reporting/financial/balance-sheet
   */
  async getBalanceSheetReport(asOfDate?: string): Promise<FinancialReport['balanceSheet']> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await api.get<ApiResponse<FinancialReport['balanceSheet']>>(`/reporting/financial/balance-sheet?${params}`);
    return response.data.data;
  },

  /**
   * قائمة الدخل
   * GET /reporting/financial/profit-loss
   */
  async getProfitLossReport(filters: ReportsFilters): Promise<FinancialReport['profitLoss']> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate!);
    params.append('endDate', filters.endDate!);

    const response = await api.get<ApiResponse<FinancialReport['profitLoss']>>(`/reporting/financial/profit-loss?${params}`);
    return response.data.data;
  },

  /**
   * التدفق النقدي
   * GET /reporting/financial/cash-flow
   */
  async getCashFlowReport(filters: ReportsFilters): Promise<NonNullable<FinancialReport['cashFlow']>> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate!);
    params.append('endDate', filters.endDate!);

    const response = await api.get<ApiResponse<NonNullable<FinancialReport['cashFlow']>>>(`/reporting/financial/cash-flow?${params}`);
    return response.data.data;
  },

  /**
   * التقرير المالي الشامل
   * GET /reporting/financial/comprehensive
   */
  async getComprehensiveFinancialReport(asOfDate?: string): Promise<FinancialReport> {
    const params = new URLSearchParams();
    if (asOfDate) params.append('asOfDate', asOfDate);

    const response = await api.get<ApiResponse<FinancialReport>>(`/reporting/financial/comprehensive?${params}`);
    return response.data.data;
  },

  // ========== DASHBOARD DATA ==========

  /**
   * بيانات لوحة المؤشرات الرئيسية
   * GET /reporting/dashboard/overview
   */
  async getDashboardOverview(branchId?: string): Promise<DashboardData> {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);

    const response = await api.get<ApiResponse<DashboardData>>(`/reporting/dashboard/overview?${params}`);
    return response.data.data;
  },

  /**
   * بيانات المبيعات للوحة المؤشرات
   * GET /reporting/dashboard/sales
   */
  async getDashboardSalesData(filters: ReportsFilters): Promise<SalesReport> {
    const params = new URLSearchParams();
    params.append('period', filters.period || 'monthly');
    if (filters.branchId) params.append('branchId', filters.branchId);

    const response = await api.get<ApiResponse<SalesReport>>(`/reporting/dashboard/sales?${params}`);
    return response.data.data;
  },

  /**
   * بيانات المخزون للوحة المؤشرات
   * GET /reporting/dashboard/inventory
   */
  async getDashboardInventoryData(warehouseId?: string): Promise<{
    summary: InventoryReport['summary'];
    lowStockAlerts: InventoryReport['lowStockAlerts'];
    topMovingProducts: InventoryReport['topMovingProducts'];
  }> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId);

    const response = await api.get<ApiResponse<any>>(`/reporting/dashboard/inventory?${params}`);
    return response.data.data;
  },

  // ========== EXPORT FUNCTIONALITY ==========

  /**
   * تصدير تقرير المبيعات إلى Excel
   * GET /reporting/sales/export/excel
   */
  async exportSalesReportToExcel(filters: ReportsFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate!);
    params.append('endDate', filters.endDate!);
    if (filters.branchId) params.append('branchId', filters.branchId);

    const response = await api.get(`/reporting/sales/export/excel?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * تصدير تقرير المخزون إلى Excel
   * GET /reporting/inventory/export/excel
   */
  async exportInventoryReportToExcel(warehouseId?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId);

    const response = await api.get(`/reporting/inventory/export/excel?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * تصدير تقرير المبيعات إلى PDF
   * GET /reporting/sales/export/pdf
   */
  async exportSalesReportToPDF(filters: ReportsFilters): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate!);
    params.append('endDate', filters.endDate!);
    if (filters.branchId) params.append('branchId', filters.branchId);

    const response = await api.get(`/reporting/sales/export/pdf?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * تصدير تقرير المخزون إلى PDF
   * GET /reporting/inventory/export/pdf
   */
  async exportInventoryReportToPDF(warehouseId?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (warehouseId) params.append('warehouseId', warehouseId);

    const response = await api.get(`/reporting/inventory/export/pdf?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ========== SCHEDULED REPORTS ==========

  /**
   * إنشاء تقرير مجدول
   * GET /reporting/scheduled/:reportType
   */
  async generateScheduledReport(options: ScheduledReportOptions): Promise<{
    message: string;
    period: string;
  }> {
    const params = new URLSearchParams();
    params.append('frequency', options.frequency);
    if (options.branchId) params.append('branchId', options.branchId);

    const response = await api.get<ApiResponse<any>>(`/reporting/scheduled/${options.reportType}?${params}`);
    return response.data.data;
  },

  // ========== CUSTOM REPORTS ==========

  /**
   * تقرير مخصص
   * GET /reporting/custom
   */
  async getCustomReport(options: CustomReportOptions): Promise<{
    message: string;
    requestedType: string;
    filters: Record<string, any>;
  }> {
    const params = new URLSearchParams();
    params.append('reportType', options.reportType);
    params.append('filters', JSON.stringify(options.filters));
    if (options.groupBy) params.append('groupBy', options.groupBy);
    if (options.sortBy) params.append('sortBy', options.sortBy);

    const response = await api.get<ApiResponse<any>>(`/reporting/custom?${params}`);
    return response.data.data;
  },

  // ========== ANALYTICS ENDPOINTS ==========

  /**
   * تحليلات الأداء
   * GET /reporting/analytics/performance
   */
  async getPerformanceAnalytics(options: AnalyticsOptions): Promise<{
    message: string;
    metric: string;
    period: string;
    branchId?: string;
  }> {
    const params = new URLSearchParams();
    params.append('metric', options.metric);
    params.append('period', options.period);
    if (options.branchId) params.append('branchId', options.branchId);

    const response = await api.get<ApiResponse<any>>(`/reporting/analytics/performance?${params}`);
    return response.data.data;
  },

  /**
   * مقارنات الفترات
   * GET /reporting/analytics/comparison
   */
  async getPeriodComparison(options: PeriodComparisonOptions): Promise<{
    message: string;
    currentPeriod: string;
    previousPeriod: string;
    branchId?: string;
  }> {
    const params = new URLSearchParams();
    params.append('currentStart', options.currentStart);
    params.append('currentEnd', options.currentEnd);
    params.append('previousStart', options.previousStart);
    params.append('previousEnd', options.previousEnd);
    if (options.branchId) params.append('branchId', options.branchId);

    const response = await api.get<ApiResponse<any>>(`/reporting/analytics/comparison?${params}`);
    return response.data.data;
  },

  // ========== DASHBOARD HELPER METHODS ==========

  /**
   * مؤشرات الأداء الرئيسية
   * Extracts KPIs from dashboard overview
   */
  async getKPIMetrics(filters: ReportsFilters): Promise<KPIMetrics> {
    const dashboard = await this.getDashboardOverview(filters.branchId);
    return {
      totalSales: dashboard.overview.totalRevenue,
      totalInvoices: dashboard.overview.totalOrders,
      totalCustomers: dashboard.overview.totalCustomers,
      lowStockItems: dashboard.alerts.lowStockItems,
      monthlySales: dashboard.overview.totalRevenue,
      weeklySales: dashboard.overview.totalRevenue * 0.25, // Approximation
      dailySales: dashboard.overview.totalRevenue / 30, // Approximation
      salesGrowth: dashboard.overview.totalRevenueChange,
    };
  },

  /**
   * بيانات الرسم البياني للمبيعات
   * Extracts sales chart data from dashboard overview
   */
  async getSalesChartData(filters: ReportsFilters): Promise<SalesChartData[]> {
    const dashboard = await this.getDashboardOverview(filters.branchId);
    return dashboard.charts.revenueByPeriod.map(item => ({
      period: item.period,
      sales: item.revenue,
      revenue: item.revenue,
      invoices: item.orders,
    }));
  },

  /**
   * تنبيهات المخزون
   * GET /reporting/inventory/low-stock
   */
  async getInventoryAlerts(warehouseId?: string): Promise<InventoryAlert[]> {
    const report = await this.getLowStockReport(warehouseId);
    return report.lowStockAlerts.map(alert => ({
      ...alert,
      productId: alert.productVariantId, // Add productId for compatibility
      status: alert.currentStock === 0
        ? 'critical' as const
        : alert.currentStock <= alert.reorderPoint
        ? 'warning' as const
        : 'normal' as const,
    }));
  },

  /**
   * المنتجات الأكثر مبيعاً
   * Extracts top products from dashboard overview
   */
  async getTopProducts(filters: ReportsFilters, limit: number = 10): Promise<TopProduct[]> {
    const dashboard = await this.getDashboardOverview(filters.branchId);
    return dashboard.charts.topProducts.slice(0, limit);
  },

  /**
   * النشاط الأخير
   * Extracts recent activity from dashboard overview
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    const dashboard = await this.getDashboardOverview();
    return dashboard.recentActivity.slice(0, limit).map(activity => ({
      ...activity,
      date: typeof activity.date === 'string' ? activity.date : (activity.date as unknown as string).toString(),
    }));
  },

  /**
   * تحديث الكاش
   * Invalidates cache on server side (if endpoint exists)
   */
  async refreshCache(): Promise<void> {
    try {
      await api.post('/reporting/cache/refresh');
    } catch (error) {
      // Endpoint might not exist, silently fail
      console.warn('Cache refresh endpoint not available', error);
    }
  },
};

export default reportsApi;
