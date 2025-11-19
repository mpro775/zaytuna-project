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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Backup as BackupIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useBackupSettings } from '@/hooks';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const BackupSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const {
    backupSettings,
    backupHistory,
    isLoading,
    isUpdating,
    isCreatingBackup,
    updateBackupSettings,
    createManualBackup,
    refetchHistory,
  } = useBackupSettings();

  // Validation schema
  const validationSchema = Yup.object({
    enabled: Yup.boolean(),
    frequency: Yup.string().oneOf(['daily', 'weekly', 'monthly']),
    time: Yup.string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    retention: Yup.number().min(1).max(365),
    autoBackup: Yup.boolean(),
    includeDatabase: Yup.boolean(),
    includeFiles: Yup.boolean(),
    includeLogs: Yup.boolean(),
    compressionEnabled: Yup.boolean(),
    encryptionEnabled: Yup.boolean(),
    destinations: Yup.object({
      local: Yup.boolean(),
      s3: Yup.boolean(),
      ftp: Yup.boolean(),
    }),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      enabled: true,
      frequency: 'daily' as const,
      time: '02:00',
      retention: 30,
      autoBackup: true,
      includeDatabase: true,
      includeFiles: true,
      includeLogs: false,
      compressionEnabled: true,
      encryptionEnabled: true,
      destinations: {
        local: true,
        s3: false,
        ftp: false,
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      await updateBackupSettings(values);
    },
  });

  // Load backup settings
  React.useEffect(() => {
    if (backupSettings) {
      formik.setValues(backupSettings);
    }
  }, [backupSettings, formik]);

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ar });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('backup.status.completed', 'مكتمل');
      case 'failed': return t('backup.status.failed', 'فاشل');
      case 'in_progress': return t('backup.status.inProgress', 'قيد التنفيذ');
      default: return status;
    }
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
        {t('settings.backup.title', 'إعدادات النسخ الاحتياطي')}
      </Typography>

      {/* Manual Backup */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('settings.backup.manualBackup', 'النسخ الاحتياطي اليدوي')}
        </Typography>

        <Button
          variant="contained"
          startIcon={isCreatingBackup ? <CircularProgress size={20} /> : <BackupIcon />}
          onClick={() => createManualBackup()}
          disabled={isCreatingBackup}
          color="primary"
        >
          {isCreatingBackup
            ? t('settings.backup.creatingBackup', 'جارٍ إنشاء النسخة الاحتياطية...')
            : t('settings.backup.createManualBackup', 'إنشاء نسخة احتياطية يدوية')
          }
        </Button>
      </Paper>

      {/* Backup History */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('settings.backup.history.title', 'سجل النسخ الاحتياطي')}
        </Typography>

        {backupHistory.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('settings.backup.history.noBackups', 'لا توجد نسخ احتياطية')}
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('settings.backup.history.date', 'التاريخ')}</TableCell>
                  <TableCell>{t('settings.backup.history.type', 'النوع')}</TableCell>
                  <TableCell>{t('settings.backup.history.size', 'الحجم')}</TableCell>
                  <TableCell>{t('settings.backup.history.status', 'الحالة')}</TableCell>
                  <TableCell>{t('settings.backup.history.actions', 'الإجراءات')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backupHistory.slice(0, 10).map((backup: any) => (
                  <TableRow key={backup.id}>
                    <TableCell>{formatDate(backup.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={backup.type === 'manual' ? t('backup.type.manual', 'يدوي') : t('backup.type.auto', 'تلقائي')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{backup.size || t('backup.size.unknown', 'غير معروف')}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(backup.status)}
                        color={getStatusColor(backup.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {backup.status === 'completed' && (
                        <>
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                              // Implement download
                              console.log('Download backup:', backup.id);
                            }}
                          >
                            {t('common.actions.download', 'تحميل')}
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            color="error"
                            onClick={() => {
                              // Implement delete
                              console.log('Delete backup:', backup.id);
                            }}
                            sx={{ ml: 1 }}
                          >
                            {t('common.actions.delete', 'حذف')}
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Backup Configuration */}
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('settings.backup.configuration.title', 'إعدادات النسخ الاحتياطي')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.enabled}
                  onChange={(e) => formik.setFieldValue('enabled', e.target.checked)}
                  name="enabled"
                />
              }
              label={t('settings.backup.configuration.enabled', 'تفعيل النسخ الاحتياطي')}
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
                  disabled={!formik.values.enabled}
                />
              }
              label={t('settings.backup.configuration.autoBackup', 'النسخ الاحتياطي التلقائي')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('settings.backup.configuration.frequency', 'التكرار')}
              name="frequency"
              value={formik.values.frequency}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.enabled}
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
              label={t('settings.backup.configuration.time', 'الوقت')}
              name="time"
              type="time"
              value={formik.values.time}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.enabled}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('settings.backup.configuration.retention', 'مدة الاحتفاظ (أيام)')}
              name="retention"
              type="number"
              value={formik.values.retention}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={!formik.values.enabled}
              inputProps={{ min: 1, max: 365 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Content to Include */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.backup.content.title', 'المحتوى المراد نسخه احتياطياً')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.includeDatabase}
                  onChange={(e) => formik.setFieldValue('includeDatabase', e.target.checked)}
                  name="includeDatabase"
                />
              }
              label={t('settings.backup.content.database', 'قاعدة البيانات')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.includeFiles}
                  onChange={(e) => formik.setFieldValue('includeFiles', e.target.checked)}
                  name="includeFiles"
                />
              }
              label={t('settings.backup.content.files', 'الملفات')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.includeLogs}
                  onChange={(e) => formik.setFieldValue('includeLogs', e.target.checked)}
                  name="includeLogs"
                />
              }
              label={t('settings.backup.content.logs', 'السجلات')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Options */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.backup.options.title', 'خيارات إضافية')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.compressionEnabled}
                  onChange={(e) => formik.setFieldValue('compressionEnabled', e.target.checked)}
                  name="compressionEnabled"
                />
              }
              label={t('settings.backup.options.compression', 'الضغط المفعل')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.encryptionEnabled}
                  onChange={(e) => formik.setFieldValue('encryptionEnabled', e.target.checked)}
                  name="encryptionEnabled"
                />
              }
              label={t('settings.backup.options.encryption', 'التشفير المفعل')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Destinations */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.backup.destinations.title', 'وجهات النسخ الاحتياطي')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.destinations.local}
                  onChange={(e) => formik.setFieldValue('destinations.local', e.target.checked)}
                  name="destinations.local"
                />
              }
              label={t('settings.backup.destinations.local', 'التخزين المحلي')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.destinations.s3}
                  onChange={(e) => formik.setFieldValue('destinations.s3', e.target.checked)}
                  name="destinations.s3"
                />
              }
              label={t('settings.backup.destinations.s3', 'Amazon S3')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.destinations.ftp}
                  onChange={(e) => formik.setFieldValue('destinations.ftp', e.target.checked)}
                  name="destinations.ftp"
                />
              }
              label={t('settings.backup.destinations.ftp', 'FTP/SFTP')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
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
