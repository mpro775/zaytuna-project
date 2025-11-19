import React, { useState } from 'react';
import { useSalesReport, useExportSalesReportToExcel, useExportSalesReportToPDF, downloadBlob } from '../../services/reports';
import { ReportsFilters } from '../../services/reports';

/**
 * مثال على صفحة تقرير المبيعات
 * يوضح كيفية استخدام ReportsApi مع React Query
 */
const SalesReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportsFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });

  // استخدام hooks التقارير
  const {
    data: salesReport,
    isLoading,
    error,
    refetch,
  } = useSalesReport(filters);

  const exportToExcel = useExportSalesReportToExcel();
  const exportToPDF = useExportSalesReportToPDF();

  const handleFilterChange = (newFilters: Partial<ReportsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportToExcel.mutateAsync(filters);
      downloadBlob(blob, `تقرير-المبيعات-${filters.startDate}-إلى-${filters.endDate}.xlsx`);
    } catch (error) {
      console.error('فشل في تصدير Excel:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportToPDF.mutateAsync(filters);
      downloadBlob(blob, `تقرير-المبيعات-${filters.startDate}-إلى-${filters.endDate}.pdf`);
    } catch (error) {
      console.error('فشل في تصدير PDF:', error);
    }
  };

  if (isLoading) {
    return <div>جاري تحميل تقرير المبيعات...</div>;
  }

  if (error) {
    return (
      <div>
        خطأ في تحميل التقرير: {error.message}
        <button onClick={() => refetch()}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="sales-report">
      <h1>تقرير المبيعات</h1>

      {/* فلترة التاريخ */}
      <div className="filters">
        <div className="filter-group">
          <label>من تاريخ:</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange({ startDate: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>إلى تاريخ:</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange({ endDate: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>الفرع:</label>
          <select
            value={filters.branchId || ''}
            onChange={(e) => handleFilterChange({ branchId: e.target.value || undefined })}
          >
            <option value="">جميع الفروع</option>
            {/* يمكن إضافة خيارات الفروع من API */}
          </select>
        </div>

        <div className="filter-group">
          <label>العميل:</label>
          <select
            value={filters.customerId || ''}
            onChange={(e) => handleFilterChange({ customerId: e.target.value || undefined })}
          >
            <option value="">جميع العملاء</option>
            {/* يمكن إضافة خيارات العملاء من API */}
          </select>
        </div>
      </div>

      {/* أزرار التصدير */}
      <div className="export-buttons">
        <button
          onClick={handleExportExcel}
          disabled={exportToExcel.isPending}
        >
          {exportToExcel.isPending ? 'جاري التصدير...' : 'تصدير Excel'}
        </button>

        <button
          onClick={handleExportPDF}
          disabled={exportToPDF.isPending}
        >
          {exportToPDF.isPending ? 'جاري التصدير...' : 'تصدير PDF'}
        </button>
      </div>

      {salesReport && (
        <>
          {/* الملخص */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>إجمالي المبيعات</h3>
              <span className="value">{salesReport.summary.totalSales}</span>
            </div>

            <div className="summary-card">
              <h3>إجمالي الإيرادات</h3>
              <span className="value">{salesReport.summary.totalRevenue.toLocaleString()}</span>
            </div>

            <div className="summary-card">
              <h3>متوسط قيمة الطلب</h3>
              <span className="value">{salesReport.summary.averageOrderValue.toLocaleString()}</span>
            </div>

            <div className="summary-card">
              <h3>عدد الفواتير</h3>
              <span className="value">{salesReport.summary.totalInvoices}</span>
            </div>
          </div>

          {/* أفضل المنتجات مبيعاً */}
          <div className="top-products">
            <h2>أفضل المنتجات مبيعاً</h2>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية المباعة</th>
                  <th>الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.summary.topSellingProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{product.productName}</td>
                    <td>{product.quantity}</td>
                    <td>{product.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* المبيعات بالفرع */}
          <div className="sales-by-branch">
            <h2>المبيعات بالفرع</h2>
            <table>
              <thead>
                <tr>
                  <th>الفرع</th>
                  <th>المبيعات</th>
                  <th>الإيرادات</th>
                  <th>الفواتير</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.byBranch.map((branch, index) => (
                  <tr key={index}>
                    <td>{branch.branchName}</td>
                    <td>{branch.sales}</td>
                    <td>{branch.revenue.toLocaleString()}</td>
                    <td>{branch.invoices}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* المبيعات بالعميل */}
          <div className="sales-by-customer">
            <h2>المبيعات بالعميل</h2>
            <table>
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>المبيعات</th>
                  <th>الإيرادات</th>
                  <th>الفواتير</th>
                  <th>آخر شراء</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.byCustomer.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.customerName}</td>
                    <td>{customer.sales}</td>
                    <td>{customer.revenue.toLocaleString()}</td>
                    <td>{customer.invoices}</td>
                    <td>{new Date(customer.lastPurchase).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* طرق الدفع */}
          <div className="payment-methods">
            <h2>طرق الدفع</h2>
            <table>
              <thead>
                <tr>
                  <th>طريقة الدفع</th>
                  <th>المبلغ</th>
                  <th>العدد</th>
                  <th>النسبة المئوية</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.byPaymentMethod.map((method, index) => (
                  <tr key={index}>
                    <td>{method.method}</td>
                    <td>{method.amount.toLocaleString()}</td>
                    <td>{method.count}</td>
                    <td>{method.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReport;
