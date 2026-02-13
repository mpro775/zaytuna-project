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
  LinearProgress,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as DatabaseIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  CloudQueue as ApiIcon,
  Cached as CacheIcon,
  Folder as StorageIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: number | string;
  maxValue?: number;
  unit?: string;
  details?: string;
  icon: React.ReactNode;
}

// Mock data
const mockHealthMetrics: HealthMetric[] = [
  {
    name: 'قاعدة البيانات',
    status: 'healthy',
    value: 12,
    unit: 'ms',
    details: '45 اتصال نشط من 100',
    icon: <DatabaseIcon />,
  },
  {
    name: 'API Response Time',
    status: 'healthy',
    value: 45,
    unit: 'ms',
    details: 'متوسط آخر 5 دقائق',
    icon: <ApiIcon />,
  },
  {
    name: 'Redis Cache',
    status: 'healthy',
    value: 94,
    maxValue: 100,
    unit: '%',
    details: 'معدل الإصابة',
    icon: <CacheIcon />,
  },
  {
    name: 'استخدام CPU',
    status: 'warning',
    value: 72,
    maxValue: 100,
    unit: '%',
    details: 'متوسط آخر دقيقة',
    icon: <CpuIcon />,
  },
  {
    name: 'استخدام الذاكرة',
    status: 'healthy',
    value: 4.2,
    maxValue: 8,
    unit: 'GB',
    details: '4.2GB من 8GB',
    icon: <MemoryIcon />,
  },
  {
    name: 'مساحة التخزين',
    status: 'warning',
    value: 78,
    maxValue: 100,
    unit: '%',
    details: '78GB من 100GB',
    icon: <StorageIcon />,
  },
];

const SystemHealth: React.FC = () => {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 1500);
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon sx={{ color: 'success.main', fontSize: 40 }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 40 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 40 }} />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
    }
  };

  const getProgressColor = (
    value: number,
    maxValue: number = 100
  ): 'success' | 'warning' | 'error' => {
    const percentage = (value / maxValue) * 100;
    if (percentage > 90) return 'error';
    if (percentage > 70) return 'warning';
    return 'success';
  };

  const overallStatus = mockHealthMetrics.some(m => m.status === 'error')
    ? 'error'
    : mockHealthMetrics.some(m => m.status === 'warning')
      ? 'warning'
      : 'healthy';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('admin.systemHealth.title', 'صحة النظام')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.systemHealth.lastUpdated', 'آخر تحديث')}:{' '}
            {lastUpdated.toLocaleTimeString('ar-SA')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            icon={getStatusIcon(overallStatus)}
            label={
              overallStatus === 'healthy'
                ? t('admin.systemHealth.allSystemsOperational', 'جميع الأنظمة تعمل بشكل طبيعي')
                : overallStatus === 'warning'
                  ? t('admin.systemHealth.someIssues', 'بعض المشاكل تحتاج اهتمام')
                  : t('admin.systemHealth.criticalIssues', 'مشاكل حرجة!')
            }
            color={getStatusColor(overallStatus)}
            sx={{ px: 2 }}
          />
          <Tooltip title={t('common.refresh', 'تحديث')}>
            <IconButton onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alert for issues */}
      {overallStatus !== 'healthy' && (
        <Alert
          severity={overallStatus}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              {t('common.viewDetails', 'عرض التفاصيل')}
            </Button>
          }
        >
          {overallStatus === 'warning'
            ? t(
                'admin.systemHealth.warningAlert',
                'بعض المقاييس تقترب من الحدود القصوى. يرجى مراجعة التفاصيل.'
              )
            : t('admin.systemHealth.errorAlert', 'هناك مشاكل حرجة تحتاج تدخل فوري!')}
        </Alert>
      )}

      {/* Health Metrics Grid */}
      <Grid container spacing={3}>
        {mockHealthMetrics.map((metric, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: '100%',
                borderTop: 4,
                borderColor: `${getStatusColor(metric.status)}.main`,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: `${getStatusColor(metric.status)}.main` }}>{metric.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {metric.name}
                    </Typography>
                  </Box>
                  {getStatusIcon(metric.status)}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {typeof metric.value === 'number'
                      ? metric.value.toLocaleString('ar-SA')
                      : metric.value}
                    <Typography
                      component="span"
                      variant="h5"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      {metric.unit}
                    </Typography>
                  </Typography>
                </Box>

                {metric.maxValue && (
                  <Box sx={{ mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(Number(metric.value) / metric.maxValue) * 100}
                      color={getProgressColor(Number(metric.value), metric.maxValue)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                )}

                <Typography variant="body2" color="text.secondary">
                  {metric.details}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Additional Info */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Response Time History */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('admin.systemHealth.responseTimeHistory', 'سجل أوقات الاستجابة')}
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <Typography color="text.secondary">
                {t('admin.systemHealth.chartPlaceholder', 'الرسم البياني سيظهر هنا')}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Errors */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ErrorIcon color="error" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('admin.systemHealth.recentErrors', 'الأخطاء الأخيرة')}
              </Typography>
            </Box>
            <List dense sx={{ overflow: 'auto', maxHeight: 200 }}>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="تحذير: استخدام CPU مرتفع"
                  secondary="منذ 5 دقائق"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ErrorIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="خطأ: فشل الاتصال بخادم البريد"
                  secondary="منذ ساعة"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="تحذير: مساحة التخزين منخفضة"
                  secondary="منذ 3 ساعات"
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealth;
