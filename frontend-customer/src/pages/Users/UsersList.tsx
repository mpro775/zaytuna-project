import React, { useState } from 'react';
import { useUsers, useUserStats, UsersFilters } from '../../services/users';

/**
 * مثال على صفحة قائمة المستخدمين
 * يوضح كيفية استخدام UsersService مع React Query
 */
const UsersList: React.FC = () => {
  const [filters, setFilters] = useState<UsersFilters>({
    isActive: true,
  });

  // استخدام hooks المستخدمين
  const {
    data: usersResponse,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers(filters);

  const {
    data: statsResponse,
    isLoading: statsLoading,
  } = useUserStats();

  const handleFilterChange = (newFilters: Partial<UsersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (usersLoading) {
    return <div>جاري تحميل المستخدمين...</div>;
  }

  if (usersError) {
    return (
      <div>
        خطأ في تحميل المستخدمين: {usersError.message}
        <button onClick={() => refetchUsers()}>إعادة المحاولة</button>
      </div>
    );
  }

  const users = usersResponse?.data?.data || [];
  const stats = statsResponse?.data?.data;

  return (
    <div className="users-list">
      <h1>إدارة المستخدمين</h1>

      {/* إحصائيات سريعة */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>إجمالي المستخدمين</h3>
            <span className="stat-number">{stats.total}</span>
          </div>
          <div className="stat-card">
            <h3>المستخدمون النشطون</h3>
            <span className="stat-number">{stats.active}</span>
          </div>
          <div className="stat-card">
            <h3>المستخدمون غير النشطين</h3>
            <span className="stat-number">{stats.inactive}</span>
          </div>
        </div>
      )}

      {/* فلترة */}
      <div className="filters">
        <select
          value={filters.isActive === undefined ? '' : filters.isActive.toString()}
          onChange={(e) => handleFilterChange({
            isActive: e.target.value === '' ? undefined : e.target.value === 'true'
          })}
        >
          <option value="">جميع الحالات</option>
          <option value="true">نشط</option>
          <option value="false">غير نشط</option>
        </select>

        <input
          type="text"
          placeholder="البحث بالاسم أو البريد الإلكتروني..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value || undefined })}
        />

        <button onClick={() => {/* Navigate to create user */}}>
          إضافة مستخدم جديد
        </button>
      </div>

      {/* جدول المستخدمين */}
      <table>
        <thead>
          <tr>
            <th>اسم المستخدم</th>
            <th>البريد الإلكتروني</th>
            <th>رقم الهاتف</th>
            <th>الدور</th>
            <th>الفرع</th>
            <th>الحالة</th>
            <th>آخر دخول</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.phone || '-'}</td>
              <td>{user.role?.name || 'غير محدد'}</td>
              <td>{user.branch?.name || 'غير محدد'}</td>
              <td>
                <span className={`status status-${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'نشط' : 'غير نشط'}
                </span>
              </td>
              <td>
                {user.lastLoginAt ?
                  new Date(user.lastLoginAt).toLocaleDateString('ar-SA') :
                  'لم يسجل دخول'
                }
              </td>
              <td>
                <button onClick={() => {/* Navigate to user details */}}>
                  عرض
                </button>
                <button onClick={() => {/* Navigate to edit user */}}>
                  تحرير
                </button>
                <button onClick={() => {/* Toggle user status */}}>
                  {user.isActive ? 'إلغاء تفعيل' : 'تفعيل'}
                </button>
                <button onClick={() => {/* Change password */}}>
                  تغيير كلمة المرور
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="no-data">
          لا توجد مستخدمين مطابقين للفلاتر المحددة
        </div>
      )}
    </div>
  );
};

export default UsersList;
