import { useQuery, useMutation } from '@tanstack/react-query';
import { reportsApi, ReportsFilters, ExportOptions } from './reports';

// Query Keys
export const REPORTS_QUERY_KEYS = {
  all: ['reports'] as const,
  sales: () => [...REPORTS_QUERY_KEYS.all, 'sales'] as const,
  salesReport: (filters: ReportsFilters) => [...REPORTS_QUERY_KEYS.sales(), 'report', filters] as const,
  inventory: () => [...REPORTS_QUERY_KEYS.all, 'inventory'] as const,
  inventoryReport: (filters: ReportsFilters) => [...REPORTS_QUERY_KEYS.inventory(), 'report', filters] as const,
  financial: () => [...REPORTS_QUERY_KEYS.all, 'financial'] as const,
  balanceSheet: (asOfDate?: string) => [...REPORTS_QUERY_KEYS.financial(), 'balance-sheet', asOfDate] as const,
  dashboard: () => [...REPORTS_QUERY_KEYS.all, 'dashboard'] as const,
  dashboardOverview: (branchId?: string) => [...REPORTS_QUERY_KEYS.dashboard(), 'overview', branchId] as const,
};

/**
 * Sales Reports Hooks
 */
export const useSalesReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.salesReport(filters),
    queryFn: () => reportsApi.getSalesReport(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMonthlySalesReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.sales(), 'monthly', filters],
    queryFn: () => reportsApi.getMonthlySalesReport(filters),
    enabled: !!(filters.year && filters.month),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDailySalesReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.sales(), 'daily', filters],
    queryFn: () => reportsApi.getDailySalesReport(filters),
    enabled: !!filters.date,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Inventory Reports Hooks
 */
export const useInventoryReport = (filters: ReportsFilters = {}) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.inventoryReport(filters),
    queryFn: () => reportsApi.getInventoryReport(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useLowStockReport = (warehouseId?: string) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.inventory(), 'low-stock', warehouseId],
    queryFn: () => reportsApi.getLowStockReport(warehouseId),
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent for alerts
  });
};

export const useStockMovementsReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.inventory(), 'movements', filters],
    queryFn: () => reportsApi.getStockMovementsReport(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Financial Reports Hooks
 */
export const useBalanceSheetReport = (asOfDate?: string) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.balanceSheet(asOfDate),
    queryFn: () => reportsApi.getBalanceSheetReport(asOfDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProfitLossReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.financial(), 'profit-loss', filters],
    queryFn: () => reportsApi.getProfitLossReport(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCashFlowReport = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.financial(), 'cash-flow', filters],
    queryFn: () => reportsApi.getCashFlowReport(filters),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 10 * 60 * 1000,
  });
};

export const useComprehensiveFinancialReport = (asOfDate?: string) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.financial(), 'comprehensive', asOfDate],
    queryFn: () => reportsApi.getComprehensiveFinancialReport(asOfDate),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Dashboard Data Hooks
 */
export const useDashboardOverview = (branchId?: string) => {
  return useQuery({
    queryKey: REPORTS_QUERY_KEYS.dashboardOverview(branchId),
    queryFn: () => reportsApi.getDashboardOverview(branchId),
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes frequently
  });
};

export const useDashboardSalesData = (filters: ReportsFilters) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.dashboard(), 'sales', filters],
    queryFn: () => reportsApi.getDashboardSalesData(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDashboardInventoryData = (warehouseId?: string) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEYS.dashboard(), 'inventory', warehouseId],
    queryFn: () => reportsApi.getDashboardInventoryData(warehouseId),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Export Hooks
 */
export const useExportSalesReportToExcel = () => {
  return useMutation({
    mutationFn: (filters: ReportsFilters) => reportsApi.exportSalesReportToExcel(filters),
  });
};

export const useExportInventoryReportToExcel = () => {
  return useMutation({
    mutationFn: (warehouseId?: string) => reportsApi.exportInventoryReportToExcel(warehouseId),
  });
};

export const useExportSalesReportToPDF = () => {
  return useMutation({
    mutationFn: (filters: ReportsFilters) => reportsApi.exportSalesReportToPDF(filters),
  });
};

export const useExportInventoryReportToPDF = () => {
  return useMutation({
    mutationFn: (warehouseId?: string) => reportsApi.exportInventoryReportToPDF(warehouseId),
  });
};

/**
 * Utility function to download blob as file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
