import React, { useState } from 'react';
import { useSalesInvoices } from '../../services/sales';
import { SalesFilters } from '../../services/sales';

/**
 * مثال على صفحة قائمة فواتير المبيعات
 * يوضح كيفية استخدام SalesService مع React Query
 */
const SalesInvoicesList: React.FC = () => {
  const [filters, setFilters] = useState<SalesFilters>({
    limit: 20,
  });

  // استخدام hook المبيعات
  const {
    data: invoicesResponse,
    isLoading,
    error,
    refetch,
  } = useSalesInvoices(filters);

  const handleFilterChange = (newFilters: Partial<SalesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (isLoading) {
    return <div>جاري تحميل الفواتير...</div>;
  }

  if (error) {
    return (
      <div>
        خطأ في تحميل الفواتير: {error.message}
        <button onClick={() => refetch()}>إعادة المحاولة</button>
      </div>
    );
  }

  const invoices = invoicesResponse?.data?.data || [];
  const pagination = invoicesResponse?.data;

  return (
    <div className="sales-invoices-list">
      <h1>فواتير المبيعات</h1>

      {/* فلترة */}
      <div className="filters">
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
        >
          <option value="">جميع الحالات</option>
          <option value="draft">مسودة</option>
          <option value="confirmed">مؤكدة</option>
          <option value="cancelled">ملغية</option>
        </select>

        <select
          value={filters.paymentStatus || ''}
          onChange={(e) => handleFilterChange({ paymentStatus: e.target.value || undefined })}
        >
          <option value="">جميع حالات الدفع</option>
          <option value="pending">معلق</option>
          <option value="partial">جزئي</option>
          <option value="paid">مدفوع</option>
        </select>
      </div>

      {/* جدول الفواتير */}
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>التاريخ</th>
            <th>العميل</th>
            <th>المبلغ الإجمالي</th>
            <th>الحالة</th>
            <th>حالة الدفع</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</td>
              <td>{invoice.customer?.name || 'عميل غير محدد'}</td>
              <td>{invoice.totalAmount} {invoice.currency?.code}</td>
              <td>
                <span className={`status status-${invoice.status}`}>
                  {invoice.status === 'draft' ? 'مسودة' :
                   invoice.status === 'confirmed' ? 'مؤكدة' :
                   invoice.status === 'cancelled' ? 'ملغية' : invoice.status}
                </span>
              </td>
              <td>
                <span className={`payment-status payment-${invoice.paymentStatus}`}>
                  {invoice.paymentStatus === 'pending' ? 'معلق' :
                   invoice.paymentStatus === 'partial' ? 'جزئي' :
                   invoice.paymentStatus === 'paid' ? 'مدفوع' : invoice.paymentStatus}
                </span>
              </td>
              <td>
                <button onClick={() => {/* Navigate to invoice details */}}>
                  عرض
                </button>
                <button onClick={() => {/* Print invoice */}}>
                  طباعة
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ترقيم الصفحات */}
      {pagination && (
        <div className="pagination">
          <span>
            عرض {((pagination.page || 1) - 1) * (pagination.limit || 20) + 1} إلى{' '}
            {Math.min((pagination.page || 1) * (pagination.limit || 20), pagination.total)} من أصل{' '}
            {pagination.total} فاتورة
          </span>
        </div>
      )}
    </div>
  );
};

export default SalesInvoicesList;
