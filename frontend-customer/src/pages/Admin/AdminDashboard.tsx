import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Store as BranchesIcon,
  ShoppingCart as SalesIcon,
  AttachMoney as RevenueIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
 
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Assessment as ReportsIcon,
  Timeline as ActivityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Mock data - في الواقع ستأتي من API
const mockSystemStats = {
  users: { total: 156, active: 142, newThisMonth: 23 },
  companies: { total: 12, active: 11 },
  branches: { total: 45, active: 43 },
  transactions: { today: 1234, thisMonth: 34567 },
  revenue: { today: 4567890, thisMonth: 123456789 },
};

const mockSystemHealth = {
  database: { status: 'healthy', latency: 12, connections: 45 },
  api: { status: 'healthy', responseTime: 45 },
  cache: { status: 'healthy', hitRate: 94 },
  storage: { status: 'warning', used: 78, total: 100 },
};

const mockRecentActivities = [
  { id: '1', type: 'user_login', user: 'أحمد محمد', timestamp: new Date(), details: 'تسجيل دخول من الفرع الرئيسي' },
  { id: '2', type: 'sale', user: 'سارة علي', timestamp: new Date(Date.now() - 300000), details: 'فاتورة مبيعات #12345' },
  { id: '3', type: 'backup', user: 'النظام', timestamp: new Date(Date.now() - 3600000), details: 'نسخة احتياطية تلقائية' },
  { id: '4', type: 'error', user: 'النظام', timestamp: new Date(Date.now() - 7200000), details: 'خطأ في مزامنة البيانات' },
];

const mockAlerts = [
  { id: '1', type: 'warning', message: 'مساحة التخزين تقترب من الحد الأقصى (78%)', timestamp: new Date() },
  { id: '2', type: 'info', message: 'تحديث جديد متاح للنظام v2.5.0', timestamp: new Date(Date.now() - 86400000) },
  { id: '3', type: 'error', message: 'فشل النسخ الاحتياطي الأخير', timestamp: new Date(Date.now() - 172800000) },
];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 4 } : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
          </Typography>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {change >= 0 ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: change >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}
              >
                {Math.abs(change)}% من الشهر الماضي
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

interface HealthIndicatorProps {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  details: string;
  value?: number;
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ name, status, details, value }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
    }
  };

  return (
    <ListItem>
      <ListItemIcon>{getStatusIcon()}</ListItemIcon>
      <ListItemText
        primary={name}
        secondary={details}
        primaryTypographyProps={{ fontWeight: 600 }}
      />
      <ListItemSecondaryAction>
        {value !== undefined && (
          <Chip
            label={`${value}%`}
            size="small"
            color={getStatusColor()}
            variant="outlined"
          />
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login':
        return <UsersIcon sx={{ color: 'info.main' }} />;
      case 'sale':
        return <SalesIcon sx={{ color: 'success.main' }} />;
      case 'backup':
        return <BackupIcon sx={{ color: 'primary.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <ActivityIcon sx={{ color: 'grey.500' }} />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('admin.dashboard.title', 'لوحة التحكم الإدارية')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.dashboard.subtitle', 'نظرة عامة على حالة النظام والإحصائيات')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('common.refresh', 'تحديث')}>
            <IconButton onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<ReportsIcon />} onClick={() => navigate('/admin/reports')}>
            {t('admin.reports', 'التقارير')}
          </Button>
          <Button variant="contained" startIcon={<SecurityIcon />} onClick={() => navigate('/admin/security')}>
            {t('admin.security', 'الأمان')}
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {mockAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {mockAlerts.slice(0, 2).map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.type as 'info' | 'warning' | 'error'}
              sx={{ mb: 1 }}
              action={
                <Button color="inherit" size="small">
                  {t('common.view', 'عرض')}
                </Button>
              }
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.stats.totalUsers', 'إجمالي المستخدمين')}
            value={mockSystemStats.users.total}
            change={15}
            icon={<UsersIcon />}
            color="primary.main"
            onClick={() => navigate('/users')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.stats.activeBranches', 'الفروع النشطة')}
            value={mockSystemStats.branches.active}
            icon={<BranchesIcon />}
            color="secondary.main"
            onClick={() => navigate('/branches')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.stats.todayTransactions', 'عمليات اليوم')}
            value={mockSystemStats.transactions.today}
            change={8}
            icon={<SalesIcon />}
            color="success.main"
            onClick={() => navigate('/sales')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('admin.stats.todayRevenue', 'إيرادات اليوم')}
            value={formatCurrency(mockSystemStats.revenue.today)}
            change={12}
            icon={<RevenueIcon />}
            color="warning.main"
            onClick={() => navigate('/reports')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('admin.systemHealth.title', 'صحة النظام')}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/admin/system-health')}
              >
                {t('common.details', 'التفاصيل')}
              </Button>
            </Box>
            <List dense>
              <HealthIndicator
                name={t('admin.systemHealth.database', 'قاعدة البيانات')}
                status={mockSystemHealth.database.status as 'healthy' | 'warning' | 'error'}
                details={`${mockSystemHealth.database.latency}ms - ${mockSystemHealth.database.connections} اتصال`}
              />
              <HealthIndicator
                name={t('admin.systemHealth.api', 'API')}
                status={mockSystemHealth.api.status as 'healthy' | 'warning' | 'error'}
                details={`وقت الاستجابة: ${mockSystemHealth.api.responseTime}ms`}
              />
              <HealthIndicator
                name={t('admin.systemHealth.cache', 'الذاكرة المؤقتة')}
                status={mockSystemHealth.cache.status as 'healthy' | 'warning' | 'error'}
                details={`معدل الإصابة: ${mockSystemHealth.cache.hitRate}%`}
                value={mockSystemHealth.cache.hitRate}
              />
              <HealthIndicator
                name={t('admin.systemHealth.storage', 'التخزين')}
                status={mockSystemHealth.storage.status as 'healthy' | 'warning' | 'error'}
                details={`${mockSystemHealth.storage.used}GB من ${mockSystemHealth.storage.total}GB`}
                value={mockSystemHealth.storage.used}
              />
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('admin.recentActivities.title', 'النشاط الأخير')}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/admin/audit-logs')}
              >
                {t('common.viewAll', 'عرض الكل')}
              </Button>
            </Box>
            <List dense>
              {mockRecentActivities.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
                  <ListItemText
                    primary={activity.details}
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{activity.user}</span>
                        <span>{format(activity.timestamp, 'HH:mm', { locale: ar })}</span>
                      </Box>
                    }
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              {t('admin.quickActions.title', 'إجراءات سريعة')}
            </Typography>
            <Grid container spacing={1}>
              {[
                { icon: <UsersIcon />, label: t('admin.quickActions.manageUsers', 'إدارة المستخدمين'), path: '/users', color: 'primary' },
                { icon: <BranchesIcon />, label: t('admin.quickActions.manageBranches', 'إدارة الفروع'), path: '/branches', color: 'secondary' },
                { icon: <BackupIcon />, label: t('admin.quickActions.backup', 'نسخ احتياطي'), path: '/admin/backup', color: 'success' },
                { icon: <SecurityIcon />, label: t('admin.quickActions.security', 'إعدادات الأمان'), path: '/admin/security', color: 'error' },
                { icon: <ReportsIcon />, label: t('admin.quickActions.reports', 'التقارير'), path: '/reports', color: 'warning' },
                { icon: <DashboardIcon />, label: t('admin.quickActions.settings', 'الإعدادات'), path: '/admin/settings', color: 'info' },
              ].map((action, index) => (
                <Grid key={index} size={{ xs: 6 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={() => navigate(action.path)}
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      borderColor: `${action.color}.main`,
                      color: `${action.color}.main`,
                      '&:hover': {
                        borderColor: `${action.color}.dark`,
                        bgcolor: `${action.color}.lighter`,
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Monthly Overview */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {t('admin.monthlyOverview.title', 'نظرة شهرية')}
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                {mockSystemStats.transactions.thisMonth.toLocaleString('ar-SA')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.monthlyOverview.transactions', 'عملية هذا الشهر')}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.dark' }}>
                {formatCurrency(mockSystemStats.revenue.thisMonth)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.monthlyOverview.revenue', 'إيرادات هذا الشهر')}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                {mockSystemStats.users.newThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.monthlyOverview.newUsers', 'مستخدم جديد')}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'info.dark' }}>
                99.9%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('admin.monthlyOverview.uptime', 'وقت التشغيل')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
