import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  TrendingUp as SalesIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { arSA, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useDashboard } from './Dashboard.hooks';
import { KPICard, SalesChart, InventoryAlerts } from '@/components/ui';

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const {
    kpis,
    salesChart,
    inventoryAlerts,
    isLoading,
    isRefetching,
    error,
    setDateRange,
    setBranch,
    refresh,
    forceRefresh,
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Mock branches data - in real app this would come from API
  const branches = [
    { id: '', name: t('dashboard.allBranches', 'جميع الفروع') },
    { id: '1', name: t('branch.main', 'الفرع الرئيسي') },
    { id: '2', name: t('branch.secondary', 'الفرع الثانوي') },
  ];

  const handleDateRangeApply = () => {
    if (startDate && endDate) {
      setDateRange(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setBranch(branchId || undefined);
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleForceRefresh = async () => {
    await forceRefresh();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{
        p: { xs: 2, md: 3 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 2,
        mt: 1
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          p: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}>
              {t('dashboard.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {t('dashboard.subtitle', 'نظرة شاملة على أداء عملك')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              background: isLoading || isRefetching ? 'rgba(255,152,0,0.1)' : 'rgba(76,175,80,0.1)',
              border: `1px solid ${isLoading || isRefetching ? '#ff9800' : '#4caf50'}`
            }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isLoading || isRefetching ? '#ff9800' : '#4caf50',
                animation: isLoading || isRefetching ? 'pulse 2s infinite' : 'none'
              }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {isLoading || isRefetching ? t('common.loading', 'جاري التحديث...') : t('common.updated', 'محدث')}
              </Typography>
            </Box>

            <Tooltip title={t('common.actions.refresh', 'تحديث')}>
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                sx={{
                  background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1976d2 0%, #00bcd4 100%)',
                    transform: 'scale(1.05)'
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                minWidth: 140,
                borderRadius: 2,
                border: '2px solid',
                borderColor: showFilters ? 'primary.main' : 'rgba(0,0,0,0.12)',
                background: showFilters ? 'rgba(33,150,243,0.04)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: 'primary.main',
                  background: 'rgba(33,150,243,0.08)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {t('common.actions.filter', 'فلترة')}
            </Button>
          </Box>
        </Box>

        {/* Filters Panel */}
        {showFilters && (
          <Paper sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #2196f3 0%, #21cbf3 50%, #4caf50 100%)'
            }
          }}>
            <Typography variant="h6" sx={{
              mb: 3,
              fontWeight: 700,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <DateRangeIcon sx={{ fontSize: '1.5rem' }} />
              {t('dashboard.filters.title', 'فلاتر البيانات')}
            </Typography>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={isRTL ? arSA : enUS}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid   size={{xs: 12, sm: 6, md: 3}}>
                  <DatePicker
                    label={t('dashboard.filters.startDate', 'تاريخ البداية')}
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>

                <Grid   size={{xs: 12, sm: 6, md: 3}}>
                  <DatePicker
                    label={t('dashboard.filters.endDate', 'تاريخ النهاية')}
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </Grid>

                <Grid   size={{xs: 12, sm: 6, md: 3}}>
                  <TextField
                    select
                    label={t('dashboard.filters.branch', 'الفرع')}
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    fullWidth
                    size="small"
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid   size={{xs: 12, sm: 6, md: 3}}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleDateRangeApply}
                      startIcon={<DateRangeIcon />}
                      sx={{ flex: 1 }}
                    >
                      {t('common.actions.apply', 'تطبيق')}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleForceRefresh}
                      disabled={isLoading}
                      sx={{ minWidth: 120 }}
                    >
                      {t('dashboard.forceRefresh', 'تحديث كامل')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
            <Typography variant="body1" color="error.contrastText">
              {t('dashboard.error', 'حدث خطأ في تحميل البيانات')}: {error.message}
            </Typography>
          </Paper>
        )}

        {/* KPI Cards */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" sx={{
            mb: 3,
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'center'
          }}>
            {t('dashboard.kpis.title', 'المؤشرات الرئيسية')}
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{xs: 12, sm: 6, md: 3}} className="dashboard-card">
              <KPICard
                title={t('dashboard.kpis.totalSales', 'إجمالي المبيعات')}
                value={kpis?.totalSales || 0}
                icon={<SalesIcon />}
                color="primary"
                format="currency"
                loading={isLoading}
                trend={kpis?.salesGrowth ? {
                  value: kpis.salesGrowth,
                  label: t('dashboard.trend.monthly', 'شهري'),
                  direction: kpis.salesGrowth > 0 ? 'up' : kpis.salesGrowth < 0 ? 'down' : 'flat',
                } : { value: 0, direction: 'flat' }}
              />
            </Grid>

            <Grid size={{xs: 12, sm: 6, md: 3}} className="dashboard-card">
              <KPICard
                title={t('dashboard.kpis.totalOrders', 'إجمالي الطلبات')}
                value={kpis?.totalInvoices || 0}
                icon={<OrdersIcon />}
                color="secondary"
                loading={isLoading}
              />
            </Grid>

            <Grid size={{xs: 12, sm: 6, md: 3}} className="dashboard-card">
              <KPICard
                title={t('dashboard.kpis.totalCustomers', 'إجمالي العملاء')}
                value={kpis?.totalCustomers || 0}
                icon={<CustomersIcon />}
                color="success"
                loading={isLoading}
              />
            </Grid>

            <Grid size={{xs: 12, sm: 6, md: 3}} className="dashboard-card">
              <KPICard
                title={t('dashboard.kpis.lowStockItems', 'منتجات منخفضة المخزون')}
                value={kpis?.lowStockItems || 0}
                icon={<InventoryIcon />}
                color="warning"
                loading={isLoading}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Charts and Alerts */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h5" sx={{
            mb: 3,
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'center'
          }}>
            {t('dashboard.analytics.title', 'التحليلات والتقارير')}
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{xs: 12, lg: 8}}>
              <Paper sx={{
                p: 4,
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.15)'
                }
              }}>
                <SalesChart
                  data={salesChart || []}
                  title={t('dashboard.charts.sales.title', 'اتجاهات المبيعات')}
                  height={350}
                  loading={isLoading}
                />
              </Paper>
            </Grid>

            <Grid size={{xs: 12, lg: 4}}>
              <Paper sx={{
                p: 4,
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.15)'
                }
              }}>
                <InventoryAlerts
                  alerts={inventoryAlerts || []}
                  maxItems={5}
                  loading={isLoading}
                />
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Additional Stats */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{
            mb: 3,
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'center'
          }}>
            {t('dashboard.stats.title', 'الإحصائيات الزمنية')}
          </Typography>
          <Grid container spacing={4}>
            <Grid size={{xs: 12, md: 4}}>
              <Paper sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(33,150,243,0.05) 0%, rgba(33,203,243,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(33,150,243,0.1)',
                boxShadow: '0 8px 32px rgba(33,150,243,0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 16px 48px rgba(33,150,243,0.2)',
                  borderColor: 'primary.main'
                }
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white'
                }}>
                  <DateRangeIcon sx={{ fontSize: '1.5rem' }} />
                </Box>
                <Typography variant="h6" color="primary.main" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('dashboard.stats.dailySales', 'مبيعات اليوم')}
                </Typography>
                <Typography variant="h3" sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {kpis?.dailySales ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'YER',
                    minimumFractionDigits: 0,
                  }).format(kpis.dailySales) : 'YER 0'}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
              <Paper sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(156,39,176,0.05) 0%, rgba(233,30,99,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(156,39,176,0.1)',
                boxShadow: '0 8px 32px rgba(156,39,176,0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 16px 48px rgba(156,39,176,0.2)',
                  borderColor: 'secondary.main'
                }
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white'
                }}>
                  <DateRangeIcon sx={{ fontSize: '1.5rem' }} />
                </Box>
                <Typography variant="h6" color="secondary.main" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('dashboard.stats.weeklySales', 'مبيعات الأسبوع')}
                </Typography>
                <Typography variant="h3" sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {kpis?.weeklySales ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'YER',
                    minimumFractionDigits: 0,
                  }).format(kpis.weeklySales) : 'YER 0'}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
              <Paper sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(76,175,80,0.05) 0%, rgba(139,195,74,0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(76,175,80,0.1)',
                boxShadow: '0 8px 32px rgba(76,175,80,0.1)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 16px 48px rgba(76,175,80,0.2)',
                  borderColor: 'success.main'
                }
              }}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white'
                }}>
                  <DateRangeIcon sx={{ fontSize: '1.5rem' }} />
                </Box>
                <Typography variant="h6" color="success.main" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('dashboard.stats.monthlySales', 'مبيعات الشهر')}
                </Typography>
                <Typography variant="h3" sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {kpis?.monthlySales ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'YER',
                    minimumFractionDigits: 0,
                  }).format(kpis.monthlySales) : 'YER 0'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
