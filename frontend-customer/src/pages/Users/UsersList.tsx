import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  PersonOff as PersonOffIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUsers, useUserStats, useToggleUserStatus, type UsersFilters } from '@/services/users';
import { Table, type Column, type Action } from '@/components/ui/Table';
import { KPICard } from '@/components/ui';
import type { User } from '@/services/users';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const UsersList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  const [filters, setFilters] = useState<UsersFilters>({
    isActive: true,
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Hooks
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

  const toggleStatusMutation = useToggleUserStatus();

  // Extract data
  const users = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
  const stats = statsResponse?.data;

  // Handlers
  const handleFilterChange = (newFilters: Partial<UsersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0); // Reset to first page when filters change
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleStatusMutation.mutateAsync(userId);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleViewUser = (userId: string) => {
    navigate(`/users/${userId}`);
  };

  const handleEditUser = (userId: string) => {
    navigate(`/users/${userId}/edit`);
  };

  const handleCreateUser = () => {
    navigate('/users/new');
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return t('users.noLogin', 'لم يسجل دخول');
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', isRTL ? { locale: ar } : {});
  };

  // Table columns
  const columns: Column<User & Record<string, unknown>>[] = [
    {
      id: 'username',
      label: t('users.username', 'اسم المستخدم'),
      minWidth: 150,
      render: (_value: unknown, row: User) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon fontSize="small" color="action" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.username}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'email',
      label: t('users.email', 'البريد الإلكتروني'),
      minWidth: 200,
      render: (_value: unknown, row: User) => (
        <Typography variant="body2">{row.email}</Typography>
      ),
    },
    {
      id: 'phone',
      label: t('users.phone', 'رقم الهاتف'),
      minWidth: 120,
      render: (_value: unknown, row: User) => (
        <Typography variant="body2">{row.phone || '-'}</Typography>
      ),
    },
    {
      id: 'role',
      label: t('users.role', 'الدور'),
      minWidth: 150,
      render: (_value: unknown, row: User) => (
        <Chip
          label={row.role?.name || t('users.undefined', 'غير محدد')}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      id: 'branch',
      label: t('users.branch', 'الفرع'),
      minWidth: 150,
      render: (_value: unknown, row: User) => (
        <Typography variant="body2">
          {row.branch?.name || t('users.undefined', 'غير محدد')}
        </Typography>
      ),
    },
    {
      id: 'isActive',
      label: t('users.status', 'الحالة'),
      align: 'center',
      minWidth: 100,
      render: (_value: unknown, row: User) => (
        <Chip
          label={row.isActive ? t('users.active', 'نشط') : t('users.inactive', 'غير نشط')}
          size="small"
          color={row.isActive ? 'success' : 'default'}
          variant="filled"
        />
      ),
    },
    {
      id: 'lastLoginAt',
      label: t('users.lastLogin', 'آخر دخول'),
      align: 'center',
      minWidth: 150,
      render: (_value: unknown, row: User) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(row.lastLoginAt)}
        </Typography>
      ),
    },
  ];

  // Table actions
  const actions: Action<User & Record<string, unknown>>[] = [
    {
      id: 'view',
      label: t('common.actions.view', 'عرض'),
      icon: <VisibilityIcon fontSize="small" />,
      onClick: (row) => handleViewUser(row.id),
      color: 'info',
    },
    {
      id: 'edit',
      label: t('common.actions.edit', 'تحرير'),
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => handleEditUser(row.id),
      color: 'primary',
    },
    {
      id: 'toggle',
      label: t('users.toggle', 'تبديل الحالة'),
      icon: <PersonIcon fontSize="small" />,
      onClick: (row) => handleToggleStatus(row.id),
      color: 'warning',
    },
    {
      id: 'password',
      label: t('users.changePassword', 'تغيير كلمة المرور'),
      icon: <LockIcon fontSize="small" />,
      onClick: (row) => navigate(`/users/${row.id}/change-password`),
      color: 'secondary',
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('users.title', 'إدارة المستخدمين')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('common.actions.refresh', 'تحديث')}>
              <IconButton
                onClick={() => refetchUsers()}
                disabled={usersLoading}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
              sx={{ minWidth: 150 }}
            >
              {t('users.addUser', 'إضافة مستخدم جديد')}
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 3,
              }}
            >
              <KPICard
                title={t('users.stats.total', 'إجمالي المستخدمين')}
                value={stats.total}
                icon={<PeopleIcon />}
                color="primary"
                loading={statsLoading}
              />
              <KPICard
                title={t('users.stats.active', 'المستخدمون النشطون')}
                value={stats.active}
                icon={<PersonIcon />}
                color="success"
                loading={statsLoading}
              />
              <KPICard
                title={t('users.stats.inactive', 'المستخدمون غير النشطين')}
                value={stats.inactive}
                icon={<PersonOffIcon />}
                color="secondary"
                loading={statsLoading}
              />
            </Box>
          </Box>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <TextField
              select
              label={t('users.filters.status', 'الحالة')}
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => {
                const value = e.target.value === '' ? undefined : e.target.value === 'true';
                handleFilterChange(value !== undefined ? { isActive: value } : {});
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">{t('users.filters.allStatuses', 'جميع الحالات')}</MenuItem>
              <MenuItem value="true">{t('users.active', 'نشط')}</MenuItem>
              <MenuItem value="false">{t('users.inactive', 'غير نشط')}</MenuItem>
            </TextField>

            <TextField
              label={t('users.filters.search', 'البحث')}
              placeholder={t('users.filters.searchPlaceholder', 'اسم المستخدم أو البريد الإلكتروني...')}
              value={filters.search || ''}
              onChange={(e) => {
                const value = e.target.value || undefined;
                handleFilterChange(value !== undefined ? { search: value } : {});
              }}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <TextField
              select
              label={t('users.filters.role', 'الدور')}
              value={filters.roleId || ''}
              onChange={(e) => {
                const value = e.target.value || undefined;
                handleFilterChange(value !== undefined ? { roleId: value } : {});
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">{t('users.filters.allRoles', 'جميع الأدوار')}</MenuItem>
              {/* TODO: Add roles from API */}
            </TextField>

            <TextField
              select
              label={t('users.filters.branch', 'الفرع')}
              value={filters.branchId || ''}
              onChange={(e) => {
                const value = e.target.value || undefined;
                handleFilterChange(value !== undefined ? { branchId: value } : {});
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">{t('users.filters.allBranches', 'جميع الفروع')}</MenuItem>
              {/* TODO: Add branches from API */}
            </TextField>
          </Box>
        </Paper>

        {/* Error State */}
        {usersError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {t('users.errors.loadFailed', 'خطأ في تحميل المستخدمين')}: {usersError.message}
            <Button
              size="small"
              onClick={() => refetchUsers()}
              sx={{ ml: 2 }}
            >
              {t('common.actions.retry', 'إعادة المحاولة')}
            </Button>
          </Alert>
        )}

        {/* Users Table */}
        <Paper sx={{ p: 3 }}>
          <Table
            columns={columns}
            data={users as (User & Record<string, unknown>)[]}
            loading={usersLoading}
            emptyMessage={t('users.noUsers', 'لا توجد مستخدمين مطابقين للفلاتر المحددة')}
            actions={actions}
            stickyHeader
            maxHeight={600}
            pagination={{
              page,
              rowsPerPage,
              total: users.length,
              onPageChange: setPage,
              onRowsPerPageChange: (newRowsPerPage) => {
                setRowsPerPage(newRowsPerPage);
                setPage(0);
              },
            }}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default UsersList;
