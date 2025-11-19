// Legacy exports (deprecated - use new exports below)
export { reportsApi } from './reports';
export type {
  KPIMetrics,
  SalesChartData,
  InventoryAlert,
  TopProduct,
  DashboardData,
  ActivityItem,
  DateRange,
  ReportsFilters,
} from './reports';

// New comprehensive exports
export { reportsApi as ReportsApi } from './reports';
export * from './hooks';
export type {
  SalesReport,
  InventoryReport,
  FinancialReport,
  DashboardData as DashboardOverview,
  ReportsFilters as ReportsFiltersV2,
  ExportOptions,
  ScheduledReportOptions,
  CustomReportOptions,
  AnalyticsOptions,
  PeriodComparisonOptions,
} from './reports';
