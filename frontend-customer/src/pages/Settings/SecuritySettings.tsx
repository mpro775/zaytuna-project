import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSecuritySettings } from '@/hooks';

export const SecuritySettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const {
    securitySettings,
    isLoading,
    isUpdating,
    updateSecuritySettings,
  } = useSecuritySettings();

  // Validation schema
  const validationSchema = Yup.object({
    passwordPolicy: Yup.object({
      minLength: Yup.number().min(6).max(128),
      requireUppercase: Yup.boolean(),
      requireLowercase: Yup.boolean(),
      requireNumbers: Yup.boolean(),
      requireSpecialChars: Yup.boolean(),
      expirationDays: Yup.number().min(0).max(365),
    }),
    sessionManagement: Yup.object({
      timeout: Yup.number().min(5).max(480),
      maxConcurrentSessions: Yup.number().min(1).max(10),
      forceLogoutOnPasswordChange: Yup.boolean(),
    }),
    twoFactorAuth: Yup.object({
      enabled: Yup.boolean(),
      required: Yup.boolean(),
    }),
    loginSecurity: Yup.object({
      maxAttempts: Yup.number().min(3).max(10),
      lockoutDuration: Yup.number().min(1).max(1440),
    }),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expirationDays: 90,
      },
      sessionManagement: {
        timeout: 60,
        maxConcurrentSessions: 3,
        forceLogoutOnPasswordChange: true,
      },
      twoFactorAuth: {
        enabled: false,
        required: false,
      },
      loginSecurity: {
        maxAttempts: 5,
        lockoutDuration: 30,
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      await updateSecuritySettings(values);
    },
  });

  // Load security settings
  React.useEffect(() => {
    if (securitySettings) {
      formik.setValues(securitySettings);
    }
  }, [securitySettings, formik]);

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
        {t('settings.security.title', 'إعدادات الأمان')}
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Password Policy */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('settings.security.passwordPolicy.title', 'سياسة كلمات المرور')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.security.passwordPolicy.minLength', 'الحد الأدنى للطول')}
              name="passwordPolicy.minLength"
              type="number"
              value={formik.values.passwordPolicy.minLength}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 6, max: 128 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.security.passwordPolicy.expirationDays', 'فترة الصلاحية (أيام)')}
              name="passwordPolicy.expirationDays"
              type="number"
              value={formik.values.passwordPolicy.expirationDays}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 0, max: 365 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.passwordPolicy.requireUppercase}
                  onChange={(e) => formik.setFieldValue('passwordPolicy.requireUppercase', e.target.checked)}
                />
              }
              label={t('settings.security.passwordPolicy.requireUppercase', 'يتطلب أحرف كبيرة')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.passwordPolicy.requireLowercase}
                  onChange={(e) => formik.setFieldValue('passwordPolicy.requireLowercase', e.target.checked)}
                />
              }
              label={t('settings.security.passwordPolicy.requireLowercase', 'يتطلب أحرف صغيرة')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.passwordPolicy.requireNumbers}
                  onChange={(e) => formik.setFieldValue('passwordPolicy.requireNumbers', e.target.checked)}
                />
              }
              label={t('settings.security.passwordPolicy.requireNumbers', 'يتطلب أرقام')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.passwordPolicy.requireSpecialChars}
                  onChange={(e) => formik.setFieldValue('passwordPolicy.requireSpecialChars', e.target.checked)}
                />
              }
              label={t('settings.security.passwordPolicy.requireSpecialChars', 'يتطلب رموز خاصة')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Session Management */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.security.sessionManagement.title', 'إدارة الجلسات')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('settings.security.sessionManagement.timeout', 'مهلة الجلسة (دقائق)')}
              name="sessionManagement.timeout"
              type="number"
              value={formik.values.sessionManagement.timeout}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 5, max: 480 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('settings.security.sessionManagement.maxConcurrentSessions', 'الحد الأقصى للجلسات المتزامنة')}
              name="sessionManagement.maxConcurrentSessions"
              type="number"
              value={formik.values.sessionManagement.maxConcurrentSessions}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 1, max: 10 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.sessionManagement.forceLogoutOnPasswordChange}
                  onChange={(e) => formik.setFieldValue('sessionManagement.forceLogoutOnPasswordChange', e.target.checked)}
                />
              }
              label={t('settings.security.sessionManagement.forceLogoutOnPasswordChange', 'إجبار تسجيل الخروج عند تغيير كلمة المرور')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Two-Factor Authentication */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.security.twoFactorAuth.title', 'المصادقة الثنائية')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.twoFactorAuth.enabled}
                  onChange={(e) => formik.setFieldValue('twoFactorAuth.enabled', e.target.checked)}
                />
              }
              label={t('settings.security.twoFactorAuth.enabled', 'تفعيل المصادقة الثنائية')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.twoFactorAuth.required}
                  onChange={(e) => formik.setFieldValue('twoFactorAuth.required', e.target.checked)}
                  disabled={!formik.values.twoFactorAuth.enabled}
                />
              }
              label={t('settings.security.twoFactorAuth.required', 'المصادقة الثنائية مطلوبة')}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Login Security */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.security.loginSecurity.title', 'أمان تسجيل الدخول')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.security.loginSecurity.maxAttempts', 'الحد الأقصى للمحاولات')}
              name="loginSecurity.maxAttempts"
              type="number"
              value={formik.values.loginSecurity.maxAttempts}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 3, max: 10 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.security.loginSecurity.lockoutDuration', 'مدة القفل (دقائق)')}
              name="loginSecurity.lockoutDuration"
              type="number"
              value={formik.values.loginSecurity.lockoutDuration}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 1, max: 1440 }}
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
