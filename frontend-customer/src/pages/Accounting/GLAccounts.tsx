import React, { useState } from 'react';
import { useGLAccounts, useAccountingStats, AccountingFilters } from '../../services/accounting';

/**
 * مثال على صفحة دليل الحسابات
 * يوضح كيفية استخدام AccountingService مع React Query
 */
const GLAccounts: React.FC = () => {
  const [filters, setFilters] = useState<AccountingFilters>({
    includeInactive: false,
  });

  // استخدام hooks المحاسبة
  const {
    data: glAccountsResponse,
    isLoading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useGLAccounts(filters);

  const {
    data: statsResponse,
    isLoading: statsLoading,
  } = useAccountingStats();

  const handleFilterChange = (newFilters: Partial<AccountingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (accountsLoading) {
    return <div>جاري تحميل دليل الحسابات...</div>;
  }

  if (accountsError) {
    return (
      <div>
        خطأ في تحميل الحسابات: {accountsError.message}
        <button onClick={() => refetchAccounts()}>إعادة المحاولة</button>
      </div>
    );
  }

  const glAccounts = glAccountsResponse?.data?.data || [];
  const stats = statsResponse?.data?.data;

  return (
    <div className="gl-accounts">
      <h1>دليل الحسابات</h1>

      {/* إحصائيات سريعة */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>إجمالي الحسابات</h3>
            <span className="stat-number">{stats.glAccounts.total}</span>
          </div>

          <div className="stat-card">
            <h3>الحسابات النشطة</h3>
            <span className="stat-number">{stats.glAccounts.active}</span>
          </div>

          <div className="stat-card">
            <h3>إجمالي الأرصدة</h3>
            <span className="stat-number">
              {stats.balances.totalAssets + stats.balances.totalLiabilities + stats.balances.totalEquity}
            </span>
          </div>
        </div>
      )}

      {/* فلترة */}
      <div className="filters">
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.includeInactive || false}
              onChange={(e) => handleFilterChange({ includeInactive: e.target.checked })}
            />
            عرض الحسابات غير النشطة
          </label>
        </div>

        <div className="filter-group">
          <label>نوع الحساب:</label>
          <select
            value={filters.accountType || ''}
            onChange={(e) => handleFilterChange({ accountType: e.target.value || undefined })}
          >
            <option value="">جميع الأنواع</option>
            <option value="asset">أصول</option>
            <option value="liability">خصوم</option>
            <option value="equity">حقوق ملكية</option>
            <option value="revenue">إيرادات</option>
            <option value="expense">مصروفات</option>
          </select>
        </div>

        <button onClick={() => {/* Navigate to create account */}}>
          إضافة حساب جديد
        </button>
      </div>

      {/* جدول الحسابات */}
      <table>
        <thead>
          <tr>
            <th>كود الحساب</th>
            <th>اسم الحساب</th>
            <th>النوع</th>
            <th>الرصيد المدين</th>
            <th>الرصيد الدائن</th>
            <th>صافي الرصيد</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {glAccounts.map((account) => (
            <tr key={account.id}>
              <td>{account.accountCode}</td>
              <td>{account.name}</td>
              <td>
                <span className={`account-type account-${account.accountType}`}>
                  {account.accountType === 'asset' ? 'أصول' :
                   account.accountType === 'liability' ? 'خصوم' :
                   account.accountType === 'equity' ? 'حقوق ملكية' :
                   account.accountType === 'revenue' ? 'إيرادات' :
                   account.accountType === 'expense' ? 'مصروفات' : account.accountType}
                </span>
              </td>
              <td className="debit">{account.debitBalance.toLocaleString()}</td>
              <td className="credit">{account.creditBalance.toLocaleString()}</td>
              <td className={`net-balance ${account.netBalance >= 0 ? 'positive' : 'negative'}`}>
                {account.netBalance.toLocaleString()}
              </td>
              <td>
                <span className={`status ${account.isActive ? 'active' : 'inactive'}`}>
                  {account.isActive ? 'نشط' : 'غير نشط'}
                </span>
                {account.isSystem && (
                  <span className="system-badge">نظام</span>
                )}
              </td>
              <td>
                <button onClick={() => {/* Navigate to account details */}}>
                  عرض
                </button>
                {!account.isSystem && (
                  <>
                    <button onClick={() => {/* Navigate to edit account */}}>
                      تحرير
                    </button>
                    <button onClick={() => {/* Delete account */}}>
                      حذف
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {glAccounts.length === 0 && (
        <div className="no-data">
          لا توجد حسابات مطابقة للفلاتر المحددة
        </div>
      )}

      {/* ملخص بالأنواع */}
      <div className="accounts-summary">
        <h2>ملخص بالأنواع</h2>
        {stats?.glAccounts.byType && (
          <div className="type-breakdown">
            {Object.entries(stats.glAccounts.byType).map(([type, count]) => (
              <div key={type} className="type-item">
                <span className="type-name">
                  {type === 'asset' ? 'أصول' :
                   type === 'liability' ? 'خصوم' :
                   type === 'equity' ? 'حقوق ملكية' :
                   type === 'revenue' ? 'إيرادات' :
                   type === 'expense' ? 'مصروفات' : type}
                </span>
                <span className="type-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GLAccounts;
