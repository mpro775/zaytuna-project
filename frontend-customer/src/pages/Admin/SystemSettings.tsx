import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Speed as PerformanceIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const SystemSettings: React.FC = () => {
  const { t } = useTranslation();

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'زيتون',
    defaultLanguage: 'ar',
    defaultCurrency: 'YER',
    timezone: 'Asia/Aden',
    maintenanceMode: false,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    ipWhitelist: '',
    enforceHttps: true,
  });

  // Backup Settings
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30,
    backupLocation: 'local',
  });

  // Performance Settings
  const [performanceSettings, setPerformanceSettings] = useState({
    enableCache: true,
    cacheTtl: 3600,
    enableCompression: true,
    maxUploadSize: 10,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
  });

  const handleSave = (section: string) => {
    toast.success(t('settings.saved', `تم حفظ إعدادات ${section}`));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('admin.settings.title', 'إعدادات النظام')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('admin.settings.subtitle', 'إدارة إعدادات النظام العامة والأمان والأداء')}
          </Typography>
        </Box>
      </Box>

      {/* Maintenance Mode Alert */}
      {generalSettings.maintenanceMode && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t(
            'admin.settings.maintenanceWarning',
            'وضع الصيانة مفعّل. المستخدمون لن يتمكنوا من الوصول للنظام.'
          )}
        </Alert>
      )}

      {/* General Settings */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.settings.general', 'الإعدادات العامة')}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('admin.settings.systemName', 'اسم النظام')}
                value={generalSettings.systemName}
                onChange={e =>
                  setGeneralSettings({ ...generalSettings, systemName: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('admin.settings.defaultCurrency', 'العملة الافتراضية')}
                value={generalSettings.defaultCurrency}
                onChange={e =>
                  setGeneralSettings({ ...generalSettings, defaultCurrency: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('admin.settings.timezone', 'المنطقة الزمنية')}
                value={generalSettings.timezone}
                onChange={e => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onChange={e =>
                      setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })
                    }
                    color="warning"
                  />
                }
                label={t('admin.settings.maintenanceMode', 'وضع الصيانة')}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('الإعدادات العامة')}
            >
              {t('common.save', 'حفظ')}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Security Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="error" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.settings.security', 'إعدادات الأمان')}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.sessionTimeout', 'مهلة الجلسة (دقائق)')}
                value={securitySettings.sessionTimeout}
                onChange={e =>
                  setSecuritySettings({
                    ...securitySettings,
                    sessionTimeout: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.maxLoginAttempts', 'أقصى محاولات تسجيل الدخول')}
                value={securitySettings.maxLoginAttempts}
                onChange={e =>
                  setSecuritySettings({
                    ...securitySettings,
                    maxLoginAttempts: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.passwordMinLength', 'أدنى طول كلمة المرور')}
                value={securitySettings.passwordMinLength}
                onChange={e =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordMinLength: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.requireTwoFactor}
                    onChange={e =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireTwoFactor: e.target.checked,
                      })
                    }
                  />
                }
                label={t('admin.settings.requireTwoFactor', 'إلزام المصادقة الثنائية')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securitySettings.enforceHttps}
                    onChange={e =>
                      setSecuritySettings({ ...securitySettings, enforceHttps: e.target.checked })
                    }
                  />
                }
                label={t('admin.settings.enforceHttps', 'إلزام HTTPS')}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('إعدادات الأمان')}
            >
              {t('common.save', 'حفظ')}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Backup Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon color="success" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.settings.backup', 'إعدادات النسخ الاحتياطي')}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={backupSettings.autoBackup}
                    onChange={e =>
                      setBackupSettings({ ...backupSettings, autoBackup: e.target.checked })
                    }
                  />
                }
                label={t('admin.settings.autoBackup', 'النسخ الاحتياطي التلقائي')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label={t('admin.settings.backupFrequency', 'تكرار النسخ')}
                value={backupSettings.backupFrequency}
                onChange={e =>
                  setBackupSettings({ ...backupSettings, backupFrequency: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                <option value="hourly">كل ساعة</option>
                <option value="daily">يومياً</option>
                <option value="weekly">أسبوعياً</option>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.backupRetention', 'فترة الاحتفاظ (أيام)')}
                value={backupSettings.backupRetention}
                onChange={e =>
                  setBackupSettings({
                    ...backupSettings,
                    backupRetention: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" startIcon={<BackupIcon />}>
              {t('admin.settings.backupNow', 'نسخ احتياطي الآن')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('إعدادات النسخ الاحتياطي')}
            >
              {t('common.save', 'حفظ')}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Performance Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PerformanceIcon color="info" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('admin.settings.performance', 'إعدادات الأداء')}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={performanceSettings.enableCache}
                    onChange={e =>
                      setPerformanceSettings({
                        ...performanceSettings,
                        enableCache: e.target.checked,
                      })
                    }
                  />
                }
                label={t('admin.settings.enableCache', 'تفعيل الذاكرة المؤقتة')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.cacheTtl', 'مدة الذاكرة المؤقتة (ثواني)')}
                value={performanceSettings.cacheTtl}
                onChange={e =>
                  setPerformanceSettings({
                    ...performanceSettings,
                    cacheTtl: parseInt(e.target.value),
                  })
                }
                disabled={!performanceSettings.enableCache}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={performanceSettings.enableCompression}
                    onChange={e =>
                      setPerformanceSettings({
                        ...performanceSettings,
                        enableCompression: e.target.checked,
                      })
                    }
                  />
                }
                label={t('admin.settings.enableCompression', 'تفعيل الضغط')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.maxUploadSize', 'أقصى حجم للرفع (MB)')}
                value={performanceSettings.maxUploadSize}
                onChange={e =>
                  setPerformanceSettings({
                    ...performanceSettings,
                    maxUploadSize: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.rateLimitRequests', 'حد الطلبات (Rate Limit)')}
                value={performanceSettings.rateLimitRequests}
                onChange={e =>
                  setPerformanceSettings({
                    ...performanceSettings,
                    rateLimitRequests: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label={t('admin.settings.rateLimitWindow', 'نافذة Rate Limit (ثواني)')}
                value={performanceSettings.rateLimitWindow}
                onChange={e =>
                  setPerformanceSettings({
                    ...performanceSettings,
                    rateLimitWindow: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" startIcon={<RefreshIcon />}>
              {t('admin.settings.clearCache', 'مسح الذاكرة المؤقتة')}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave('إعدادات الأداء')}
            >
              {t('common.save', 'حفظ')}
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default SystemSettings;
