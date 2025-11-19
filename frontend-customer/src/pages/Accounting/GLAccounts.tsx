import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useGLAccounts, useAccountingStats, type AccountingFilters, type GLAccount } from '@/services/accounting';

const GLAccounts: React.FC = () => {
  const [filters, setFilters] = useState<AccountingFilters>({
    includeInactive: false,
  });

  const {
    data: glAccountsResponse,
    isLoading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useGLAccounts(filters);

  const {
    data: statsResponse,
  } = useAccountingStats();

  const handleFilterChange = (newFilters: Partial<AccountingFilters>) => {
    setFilters((prev: AccountingFilters) => ({ ...prev, ...newFilters }));
  };

  const getAccountTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات',
    };
    return labels[type] || type;
  };

  const getAccountTypeColor = (type: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      asset: 'primary',
      liability: 'error',
      equity: 'success',
      revenue: 'info',
      expense: 'warning',
    };
    return colors[type] || 'default';
  };

  if (accountsLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (accountsError) {
    return (
      <Container maxWidth="xl">
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetchAccounts()}>
              إعادة المحاولة
            </Button>
          }
        >
          خطأ في تحميل الحسابات: {accountsError.message}
        </Alert>
      </Container>
    );
  }

  const glAccounts: GLAccount[] = glAccountsResponse?.data || [];
  const stats = statsResponse?.data;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          دليل الحسابات
        </Typography>
      </Box>

      {/* إحصائيات سريعة */}
      {stats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AccountBalanceIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي الحسابات
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.glAccounts.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircleIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    الحسابات النشطة
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.glAccounts.active}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AccountBalanceIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    إجمالي الأرصدة
                  </Typography>
                  <Typography variant="h5" component="div">
                    {(stats.balances.totalAssets + stats.balances.totalLiabilities + stats.balances.totalEquity).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* فلترة */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.includeInactive || false}
                onChange={(e) => handleFilterChange({ includeInactive: e.target.checked })}
              />
            }
            label="عرض الحسابات غير النشطة"
          />

          <TextField
            select
            label="نوع الحساب"
            value={filters.accountType || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setFilters((prev) => {
                  const newFilters = { ...prev };
                  delete newFilters.accountType;
                  return newFilters;
                });
              } else {
                handleFilterChange({ accountType: value });
              }
            }}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">جميع الأنواع</MenuItem>
            <MenuItem value="asset">أصول</MenuItem>
            <MenuItem value="liability">خصوم</MenuItem>
            <MenuItem value="equity">حقوق ملكية</MenuItem>
            <MenuItem value="revenue">إيرادات</MenuItem>
            <MenuItem value="expense">مصروفات</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetchAccounts()}
          >
            تحديث
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {/* Navigate to create account */}}
          >
            إضافة حساب جديد
          </Button>
        </Stack>
      </Paper>

      {/* جدول الحسابات */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>كود الحساب</TableCell>
              <TableCell>اسم الحساب</TableCell>
              <TableCell>النوع</TableCell>
              <TableCell align="right">الرصيد المدين</TableCell>
              <TableCell align="right">الرصيد الدائن</TableCell>
              <TableCell align="right">صافي الرصيد</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {glAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    لا توجد حسابات مطابقة للفلاتر المحددة
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              glAccounts.map((account: GLAccount) => (
                <TableRow key={account.id} hover>
                  <TableCell>{account.accountCode}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getAccountTypeLabel(account.accountType)}
                      color={getAccountTypeColor(account.accountType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {account.debitBalance.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {account.creditBalance.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={account.netBalance >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {account.netBalance.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={account.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        label={account.isActive ? 'نشط' : 'غير نشط'}
                        color={account.isActive ? 'success' : 'default'}
                        size="small"
                      />
                      {account.isSystem && (
                        <Chip label="نظام" color="info" size="small" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {/* Navigate to account details */}}
                      >
                        عرض
                      </Button>
                      {!account.isSystem && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {/* Navigate to edit account */}}
                          >
                            تحرير
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {/* Delete account */}}
                          >
                            حذف
                          </Button>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ملخص بالأنواع */}
      {stats?.glAccounts.byType && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            ملخص بالأنواع
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {Object.entries(stats.glAccounts.byType).map(([type, count]: [string, number]) => (
              <Box
                key={type}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                border={1}
                borderColor="divider"
                borderRadius={1}
              >
                <Typography variant="body1">
                  {getAccountTypeLabel(type)}
                </Typography>
                <Chip
                  label={String(count)}
                  color={getAccountTypeColor(type)}
                  size="small"
                />
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default GLAccounts;
