import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  AccountBalance as FinancialIcon,
  TrendingUp as SalesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDashboardOverview } from '@/services/reports';

const ReportsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: dashboardData } = useDashboardOverview();

  const overview = dashboardData?.overview;
  const alerts = dashboardData?.alerts;

  const reportCards = [
    {
      titleKey: 'reports.sales.title',
      defaultTitle: 'تقرير المبيعات',
      descriptionKey: 'reports.sales.description',
      defaultDescription: 'تحليل المبيعات والإيرادات والفواتير',
      path: '/reports/sales',
      icon: <SalesIcon sx={{ fontSize: 48 }} />,
      color: '#2e7d32',
    },
    {
      titleKey: 'reports.inventory.title',
      defaultTitle: 'تقرير المخزون',
      descriptionKey: 'reports.inventory.description',
      defaultDescription: 'تحليل المخزون والمنتجات والحركات',
      path: '/reports/inventory',
      icon: <InventoryIcon sx={{ fontSize: 48 }} />,
      color: '#1565c0',
    },
    {
      titleKey: 'reports.financial.title',
      defaultTitle: 'التقرير المالي',
      descriptionKey: 'reports.financial.description',
      defaultDescription: 'الميزانية العمومية وقائمة الدخل والتدفق النقدي',
      path: '/reports/financial',
      icon: <FinancialIcon sx={{ fontSize: 48 }} />,
      color: '#6a1b9a',
    },
  ];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {t('reports.dashboard.title', 'لوحة التقارير')}
      </Typography>

      {/* Quick Stats */}
      {overview && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('reports.dashboard.quickStats', 'إحصائيات سريعة')}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('reports.dashboard.totalRevenue', 'إجمالي الإيرادات')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(overview.totalRevenue)}
                </Typography>
                {overview.totalRevenueChange > 0 && (
                  <Typography variant="caption" color="success.main">
                    +{overview.totalRevenueChange}%
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('reports.dashboard.totalOrders', 'إجمالي الطلبات')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {overview.totalOrders.toLocaleString('ar-SA')}
                </Typography>
                {overview.totalOrdersChange > 0 && (
                  <Typography variant="caption" color="success.main">
                    +{overview.totalOrdersChange}%
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('reports.dashboard.totalCustomers', 'إجمالي العملاء')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {overview.totalCustomers.toLocaleString('ar-SA')}
                </Typography>
                {overview.totalCustomersChange > 0 && (
                  <Typography variant="caption" color="success.main">
                    +{overview.totalCustomersChange}%
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('reports.dashboard.averageOrderValue', 'متوسط قيمة الطلب')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(overview.averageOrderValue)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Alerts */}
      {alerts && (alerts.lowStockItems > 0 || alerts.overduePayments > 0 || alerts.pendingOrders > 0) && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t('reports.dashboard.alerts', 'تنبيهات')}
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {alerts.lowStockItems > 0 && (
              <li>{t('reports.dashboard.lowStockAlert', 'منتجات منخفضة المخزون')}: {alerts.lowStockItems}</li>
            )}
            {alerts.overduePayments > 0 && (
              <li>{t('reports.dashboard.overduePayments', 'مدفوعات متأخرة')}: {alerts.overduePayments}</li>
            )}
            {alerts.pendingOrders > 0 && (
              <li>{t('reports.dashboard.pendingOrders', 'طلبات معلقة')}: {alerts.pendingOrders}</li>
            )}
          </Box>
        </Paper>
      )}

      {/* Report Cards */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('reports.dashboard.availableReports', 'التقارير المتاحة')}
      </Typography>
      <Grid container spacing={3}>
        {reportCards.map((card) => (
          <Grid key={card.path} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                onClick={() => navigate(card.path)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent>
                  <Box sx={{ color: card.color, mb: 2 }}>{card.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {t(card.titleKey, card.defaultTitle)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(card.descriptionKey, card.defaultDescription)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportsDashboard;
