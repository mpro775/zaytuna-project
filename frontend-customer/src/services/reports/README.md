# خدمة التقارير - Reports Service

خدمة شاملة لإدارة جميع أنواع التقارير مرتبطة بـ Backend APIs في `backend/src/modules/reporting/reporting.controller.ts`.

## الملفات

- `reports.ts` - خدمة التقارير مع جميع دوال API
- `hooks.ts` - React Query hooks للتكامل مع المكونات
- `README.md` - هذا الملف

## APIs المدعومة

### تقارير المبيعات (Sales Reports)
- `GET /reporting/sales` - تقرير المبيعات الشامل
- `GET /reporting/sales/monthly` - تقرير المبيعات الشهري
- `GET /reporting/sales/daily` - تقرير المبيعات اليومي

### تقارير المخزون (Inventory Reports)
- `GET /reporting/inventory` - تقرير المخزون الشامل
- `GET /reporting/inventory/low-stock` - تقرير المخزون المنخفض
- `GET /reporting/inventory/movements` - تقرير حركات المخزون

### التقارير المالية (Financial Reports)
- `GET /reporting/financial/balance-sheet` - الميزانية العمومية
- `GET /reporting/financial/profit-loss` - قائمة الدخل
- `GET /reporting/financial/cash-flow` - التدفق النقدي
- `GET /reporting/financial/comprehensive` - التقرير المالي الشامل

### لوحة المؤشرات (Dashboard)
- `GET /reporting/dashboard/overview` - بيانات لوحة المؤشرات الرئيسية
- `GET /reporting/dashboard/sales` - بيانات المبيعات للوحة المؤشرات
- `GET /reporting/dashboard/inventory` - بيانات المخزون للوحة المؤشرات

### التصدير (Export)
- `GET /reporting/sales/export/excel` - تصدير تقرير المبيعات إلى Excel
- `GET /reporting/inventory/export/excel` - تصدير تقرير المخزون إلى Excel
- `GET /reporting/sales/export/pdf` - تصدير تقرير المبيعات إلى PDF
- `GET /reporting/inventory/export/pdf` - تصدير تقرير المخزون إلى PDF

### التقارير المجدولة والتحليلات
- `GET /reporting/scheduled/:reportType` - إنشاء تقرير مجدول
- `GET /reporting/custom` - تقرير مخصص
- `GET /reporting/analytics/performance` - تحليلات الأداء
- `GET /reporting/analytics/comparison` - مقارنات الفترات

## استخدام الخدمة

### استخدام مباشر للخدمة

```typescript
import { ReportsApi } from '@/services/reports';

// الحصول على تقرير المبيعات
const salesReport = await ReportsApi.getSalesReport({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  branchId: 'branch-uuid',
});

// تصدير تقرير إلى Excel
const excelBlob = await ReportsApi.exportSalesReportToExcel({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

// الحصول على بيانات لوحة المؤشرات
const dashboardData = await ReportsApi.getDashboardOverview('branch-uuid');
```

### استخدام React Query Hooks

```typescript
import {
  useSalesReport,
  useDashboardOverview,
  useExportSalesReportToExcel,
  downloadBlob,
} from '@/services/reports';

function ReportsDashboard() {
  // تقرير المبيعات
  const { data: salesReport, isLoading } = useSalesReport({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  });

  // بيانات لوحة المؤشرات
  const { data: dashboard } = useDashboardOverview();

  // تصدير Excel
  const exportExcel = useExportSalesReportToExcel();

  const handleExport = async () => {
    const blob = await exportExcel.mutateAsync({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    downloadBlob(blob, 'sales-report.xlsx');
  };

  // ... باقي الكود
}
```

## أنواع البيانات

### SalesReport
```typescript
interface SalesReport {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    totalInvoices: number;
    averageOrderValue: number;
    topSellingProducts: ProductSummary[];
  };
  byPeriod: PeriodData[];
  byBranch: BranchData[];
  byCustomer: CustomerData[];
  byPaymentMethod: PaymentMethodData[];
}
```

### InventoryReport
```typescript
interface InventoryReport {
  summary: InventorySummary;
  byWarehouse: WarehouseData[];
  lowStockAlerts: LowStockAlert[];
  stockMovements: StockMovement[];
  topMovingProducts: TopMovingProduct[];
}
```

### FinancialReport
```typescript
interface FinancialReport {
  balanceSheet: BalanceSheet;
  profitLoss: ProfitLoss;
  cashFlow?: CashFlow;
}
```

### DashboardData
```typescript
interface DashboardData {
  overview: DashboardOverview;
  charts: DashboardCharts;
  alerts: DashboardAlerts;
  recentActivity: ActivityItem[];
}
```

## معالجة الأخطاء

جميع دوال الخدمة ترجع `ApiResponse<T>` والتي تحتوي على:
- `data`: البيانات المطلوبة
- `success`: حالة النجاح
- `message`: رسالة إضافية (اختيارية)

## التكامل مع الباك إند

- مرتبطة مباشرة بـ `backend/src/modules/reporting/reporting.controller.ts`
- تستخدم نفس أنواع البيانات الموجودة في `reporting.service.ts`
- تدعم جميع endpoints المتاحة في الباك إند
- متوافقة مع نظام الصلاحيات (`reporting.*` permissions)

## أمثلة الاستخدام

انظر إلى `frontend-customer/src/pages/Reports/SalesReport.tsx` لمثال كامل على استخدام الخدمة في مكون React.

## ملاحظات مهمة

- **الصلاحيات**: تأكد من أن المستخدم لديه الصلاحيات المطلوبة:
  - `reporting.sales.read` - لتقارير المبيعات
  - `reporting.inventory.read` - لتقارير المخزون
  - `reporting.financial.read` - للتقارير المالية
  - `reporting.dashboard.read` - لبيانات لوحة المؤشرات
  - `reporting.export` - للتصدير

- **التواريخ**: جميع التواريخ يجب أن تكون بتنسيق ISO (YYYY-MM-DD)

- **التصدير**: يتم إرجاع ملفات Excel و PDF كـ Blob للتنزيل

- **التخزين المؤقت**: البيانات تُحفظ مؤقتاً لفترات مختلفة حسب نوع التقرير

- **الفلترة**: معظم التقارير تدعم فلترة بالفرع، المخزن، العميل، إلخ
