import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartIcon,
  Memory as MemoryIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSystemSettings } from '@/hooks';
import type { SystemSettings } from '@/services/settings';
import { MockModeToggle } from '@/components/ui/MockModeToggle';

export const SystemSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const {
    systemSettings,
    systemInfo,
    isLoading,
    isUpdating,
    isClearingCache,
    isRestarting,
    updateSystemSettings,
    clearCache,
    restartSystem,
    refetch,
  } = useSystemSettings();

  // Validation schema
  const validationSchema = Yup.object({
    backupEnabled: Yup.boolean(),
    backupFrequency: Yup.string().oneOf(['daily', 'weekly', 'monthly']),
    backupRetention: Yup.number().min(1).max(365),
    autoBackup: Yup.boolean(),
    backupTime: Yup.string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),

    cacheEnabled: Yup.boolean(),
    cacheTtl: Yup.number().min(60).max(86400),

    notificationsEnabled: Yup.boolean(),
    emailNotifications: Yup.boolean(),
    smsNotifications: Yup.boolean(),

    security: Yup.object({
      sessionTimeout: Yup.number().min(5).max(480),
      passwordMinLength: Yup.number().min(6).max(128),
      passwordRequireSpecialChars: Yup.boolean(),
      passwordRequireNumbers: Yup.boolean(),
      twoFactorEnabled: Yup.boolean(),
      loginAttempts: Yup.number().min(3).max(10),
    }),

    performance: Yup.object({
      enableOptimization: Yup.boolean(),
      maxConcurrentUsers: Yup.number().min(1).max(1000),
      rateLimitEnabled: Yup.boolean(),
      rateLimitMaxRequests: Yup.number().min(10).max(10000),
    }),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      backupEnabled: true,
      backupFrequency: 'daily' as const,
      backupRetention: 30,
      autoBackup: true,
      backupTime: '02:00',

      cacheEnabled: true,
      cacheTtl: 300,

      notificationsEnabled: true,
      emailNotifications: true,
      smsNotifications: false,

      security: {
        sessionTimeout: 60,
        passwordMinLength: 8,
        passwordRequireSpecialChars: true,
        passwordRequireNumbers: true,
        twoFactorEnabled: false,
        loginAttempts: 5,
      },

      performance: {
        enableOptimization: true,
        maxConcurrentUsers: 100,
        rateLimitEnabled: true,
        rateLimitMaxRequests: 1000,
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      await updateSystemSettings(values);
    },
  });

  // Load system settings
  React.useEffect(() => {
    if (systemSettings) {
      formik.setValues(systemSettings);
    }
  }, [systemSettings, formik]);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days} يوم ${hours} ساعة`;
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        {t('settings.system.title', 'إعدادات النظام')}
      </Typography>

      {/* System Information */}
      {systemInfo && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MemoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">{formatBytes(systemInfo.memoryUsage.used)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.system.memoryUsed', 'الذاكرة المستخدمة')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimeIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6">{formatUptime(systemInfo.uptime)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.system.uptime', 'وقت التشغيل')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h6">{systemInfo.activeUsers}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.system.activeUsers', 'المستخدمون النشطون')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">{systemInfo.version}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('settings.system.version', 'إصدار النظام')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Backup Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('settings.system.backup.title', 'إعدادات النسخ الاحتياطي')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.backupEnabled}
                  onChange={(e) => formik.setFieldValue('backupEnabled', e.target.checked)}
                  name="backupEnabled"
                />
              }
              label={t('settings.system.backup.enabled', 'تفعيل النسخ الاحتياطي')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.autoBackup}
                  onChange={(e) => formik.setFieldValue('autoBackup', e.target.checked)}
                  name="autoBackup"
                />
              }
              label={t('settings.system.backup.autoBackup', 'النسخ الاحتياطي التلقائي')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('settings.system.backup.frequency', 'تكرار النسخ الاحتياطي')}
              name="backupFrequency"
              value={formik.values.backupFrequency}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.backupEnabled}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="daily">{t('frequencies.daily', 'يومي')}</MenuItem>
              <MenuItem value="weekly">{t('frequencies.weekly', 'أسبوعي')}</MenuItem>
              <MenuItem value="monthly">{t('frequencies.monthly', 'شهري')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('settings.system.backup.retention', 'مدة الاحتفاظ (أيام)')}
              name="backupRetention"
              type="number"
              value={formik.values.backupRetention}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.backupEnabled}
              inputProps={{ min: 1, max: 365 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('settings.system.backup.time', 'وقت النسخ الاحتياطي')}
              name="backupTime"
              type="time"
              value={formik.values.backupTime}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.backupEnabled}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Cache Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.system.cache.title', 'إعدادات الكاش')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.cacheEnabled}
                  onChange={(e) => formik.setFieldValue('cacheEnabled', e.target.checked)}
                  name="cacheEnabled"
                />
              }
              label={t('settings.system.cache.enabled', 'تفعيل الكاش')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.system.cache.ttl', 'وقت البقاء (ثواني)')}
              name="cacheTtl"
              type="number"
              value={formik.values.cacheTtl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.cacheEnabled}
              inputProps={{ min: 60, max: 86400 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Mock Data Mode */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.system.mockData.title', 'وضع البيانات الوهمية')}
            </Typography>
            <Paper sx={{ p: 3 }}>
              <MockModeToggle />
            </Paper>
          </Grid>

          {/* System Actions */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.system.actions.title', 'إجراءات النظام')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={isClearingCache ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={() => clearCache()}
              disabled={isClearingCache}
              color="warning"
            >
              {isClearingCache
                ? t('settings.system.actions.clearingCache', 'جارٍ مسح الكاش...')
                : t('settings.system.actions.clearCache', 'مسح الكاش')
              }
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={isRestarting ? <CircularProgress size={20} /> : <RestartIcon />}
              onClick={() => restartSystem()}
              disabled={isRestarting}
              color="error"
            >
              {isRestarting
                ? t('settings.system.actions.restarting', 'جارٍ إعادة التشغيل...')
                : t('settings.system.actions.restart', 'إعادة تشغيل النظام')
              }
            </Button>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={isUpdating ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={isUpdating}
              >
                {isUpdating
                  ? t('settings.saving', 'جارٍ الحفظ...')
                  : t('settings.save', 'حفظ الإعدادات')
                }
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
