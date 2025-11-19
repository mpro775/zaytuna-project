import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useCompanySettings } from '@/hooks';
import type { CompanySettings } from '@/services/settings';
import { toast } from 'react-hot-toast';

export const CompanySettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    companySettings,
    isLoading,
    isUpdating,
    isUploadingLogo,
    updateCompanySettings,
    uploadLogo,
  } = useCompanySettings();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('settings.validation.companyNameRequired', 'اسم الشركة مطلوب'))
      .max(255, t('settings.validation.companyNameMaxLength', 'اسم الشركة يجب ألا يزيد عن 255 حرف')),
    description: Yup.string().max(1000, t('settings.validation.descriptionMaxLength', 'الوصف يجب ألا يزيد عن 1000 حرف')),
    address: Yup.string()
      .required(t('settings.validation.addressRequired', 'العنوان مطلوب'))
      .max(500, t('settings.validation.addressMaxLength', 'العنوان يجب ألا يزيد عن 500 حرف')),
    phone: Yup.string()
      .required(t('settings.validation.phoneRequired', 'رقم الهاتف مطلوب'))
      .matches(/^[\+]?[0-9\-\s\(\)]*$/, t('settings.validation.phoneInvalid', 'رقم الهاتف غير صحيح')),
    email: Yup.string()
      .required(t('settings.validation.emailRequired', 'البريد الإلكتروني مطلوب'))
      .email(t('settings.validation.emailInvalid', 'البريد الإلكتروني غير صحيح')),
    taxNumber: Yup.string().max(50, t('settings.validation.taxNumberMaxLength', 'الرقم الضريبي يجب ألا يزيد عن 50 حرف')),
    currency: Yup.string().required(t('settings.validation.currencyRequired', 'العملة مطلوبة')),
    timezone: Yup.string().required(t('settings.validation.timezoneRequired', 'المنطقة الزمنية مطلوبة')),
    language: Yup.string().required(t('settings.validation.languageRequired', 'اللغة مطلوبة')),
    fiscalYearStart: Yup.string()
      .required(t('settings.validation.fiscalYearRequired', 'بداية السنة المالية مطلوبة'))
      .matches(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, t('settings.validation.fiscalYearInvalid', 'صيغة تاريخ غير صحيحة')),
    dateFormat: Yup.string().required(t('settings.validation.dateFormatRequired', 'صيغة التاريخ مطلوبة')),
    timeFormat: Yup.string().required(t('settings.validation.timeFormatRequired', 'صيغة الوقت مطلوبة')),
    numberFormat: Yup.string().required(t('settings.validation.numberFormatRequired', 'صيغة الأرقام مطلوبة')),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      taxNumber: '',
      currency: 'YER',
      timezone: 'Asia/Aden',
      language: 'ar',
      fiscalYearStart: '01-01',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      numberFormat: 'ar-SA',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitError(null);
        await updateCompanySettings(values);
      } catch (error: any) {
        setSubmitError(error?.message || t('settings.errors.companyUpdateFailed', 'فشل في تحديث إعدادات الشركة'));
      }
    },
  });

  // Load company settings
  React.useEffect(() => {
    if (companySettings) {
      formik.setValues({
        name: companySettings.name || '',
        description: companySettings.description || '',
        address: companySettings.address || '',
        phone: companySettings.phone || '',
        email: companySettings.email || '',
        taxNumber: companySettings.taxNumber || '',
        currency: companySettings.currency || 'YER',
        timezone: companySettings.timezone || 'Asia/Aden',
        language: companySettings.language || 'ar',
        fiscalYearStart: companySettings.fiscalYearStart || '01-01',
        dateFormat: companySettings.dateFormat || 'DD/MM/YYYY',
        timeFormat: companySettings.timeFormat || 'HH:mm',
        numberFormat: companySettings.numberFormat || 'ar-SA',
      });

      if (companySettings.logo) {
        setLogoPreview(companySettings.logo);
      }
    }
  }, [companySettings, formik]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast.error(t('settings.errors.invalidLogoType', 'نوع الملف غير مدعوم'));
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(t('settings.errors.logoTooLarge', 'حجم الملف كبير جداً'));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      try {
        await uploadLogo(file);
      } catch (error) {
        // Reset preview on error
        setLogoPreview(companySettings?.logo || null);
      }
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
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
        {t('settings.company.title', 'إعدادات الشركة')}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Logo Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('settings.company.logo', 'شعار الشركة')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={logoPreview || undefined}
                  sx={{ width: 120, height: 120, cursor: 'pointer' }}
                  onClick={handleLogoClick}
                >
                  <BusinessIcon sx={{ fontSize: 60 }} />
                </Avatar>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="outlined"
                  startIcon={isUploadingLogo ? <CircularProgress size={20} /> : <UploadIcon />}
                  onClick={handleLogoClick}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo
                    ? t('settings.uploading', 'جارٍ الرفع...')
                    : t('settings.company.uploadLogo', 'رفع شعار جديد')
                  }
                </Button>

                <Typography variant="caption" color="text.secondary">
                  {t('settings.company.logoHint', 'PNG أو JPG أو GIF، الحد الأقصى 5 ميجابايت')}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('settings.company.basicInfo', 'المعلومات الأساسية')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.company.name', 'اسم الشركة')}
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.company.taxNumber', 'الرقم الضريبي')}
              name="taxNumber"
              value={formik.values.taxNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.taxNumber && Boolean(formik.errors.taxNumber)}
              helperText={formik.touched.taxNumber && formik.errors.taxNumber}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('settings.company.description', 'وصف الشركة')}
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              multiline
              rows={3}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.company.contactInfo', 'معلومات التواصل')}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('settings.company.address', 'العنوان')}
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              multiline
              rows={2}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.company.phone', 'رقم الهاتف')}
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.company.email', 'البريد الإلكتروني')}
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Regional Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.company.regionalSettings', 'الإعدادات الإقليمية')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label={t('settings.company.currency', 'العملة')}
              name="currency"
              value={formik.values.currency}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.currency && Boolean(formik.errors.currency)}
              helperText={formik.touched.currency && formik.errors.currency}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="YER">{t('currencies.YER', 'ريال يمني (YER)')}</MenuItem>
              <MenuItem value="USD">{t('currencies.USD', 'دولار أمريكي (USD)')}</MenuItem>
              <MenuItem value="EUR">{t('currencies.EUR', 'يورو (EUR)')}</MenuItem>
              <MenuItem value="SAR">{t('currencies.SAR', 'ريال سعودي (SAR)')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label={t('settings.company.timezone', 'المنطقة الزمنية')}
              name="timezone"
              value={formik.values.timezone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.timezone && Boolean(formik.errors.timezone)}
              helperText={formik.touched.timezone && formik.errors.timezone}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="Asia/Aden">{t('timezones.Asia/Aden', 'آسيا/عدن')}</MenuItem>
              <MenuItem value="Asia/Riyadh">{t('timezones.Asia/Riyadh', 'آسيا/الرياض')}</MenuItem>
              <MenuItem value="Europe/London">{t('timezones.Europe/London', 'أوروبا/لندن')}</MenuItem>
              <MenuItem value="America/New_York">{t('timezones.America/New_York', 'أمريكا/نيويورك')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label={t('settings.company.language', 'اللغة')}
              name="language"
              value={formik.values.language}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.language && Boolean(formik.errors.language)}
              helperText={formik.touched.language && formik.errors.language}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="ar">{t('languages.ar', 'العربية')}</MenuItem>
              <MenuItem value="en">{t('languages.en', 'الإنجليزية')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('settings.company.fiscalYearStart', 'بداية السنة المالية')}
              name="fiscalYearStart"
              value={formik.values.fiscalYearStart}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fiscalYearStart && Boolean(formik.errors.fiscalYearStart)}
              helperText={formik.touched.fiscalYearStart && formik.errors.fiscalYearStart}
              placeholder="MM-DD"
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          {/* Format Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
              {t('settings.company.formatSettings', 'إعدادات التنسيق')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('settings.company.dateFormat', 'صيغة التاريخ')}
              name="dateFormat"
              value={formik.values.dateFormat}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.dateFormat && Boolean(formik.errors.dateFormat)}
              helperText={formik.touched.dateFormat && formik.errors.dateFormat}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="DD/MM/YYYY">{t('dateFormats.DD/MM/YYYY', 'يوم/شهر/سنة')}</MenuItem>
              <MenuItem value="MM/DD/YYYY">{t('dateFormats.MM/DD/YYYY', 'شهر/يوم/سنة')}</MenuItem>
              <MenuItem value="YYYY-MM-DD">{t('dateFormats.YYYY-MM-DD', 'سنة-شهر-يوم')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('settings.company.timeFormat', 'صيغة الوقت')}
              name="timeFormat"
              value={formik.values.timeFormat}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.timeFormat && Boolean(formik.errors.timeFormat)}
              helperText={formik.touched.timeFormat && formik.errors.timeFormat}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="HH:mm">{t('timeFormats.HH:mm', '24 ساعة')}</MenuItem>
              <MenuItem value="hh:mm A">{t('timeFormats.hh:mm A', '12 ساعة')}</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label={t('settings.company.numberFormat', 'صيغة الأرقام')}
              name="numberFormat"
              value={formik.values.numberFormat}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.numberFormat && Boolean(formik.errors.numberFormat)}
              helperText={formik.touched.numberFormat && formik.errors.numberFormat}
              required
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="ar-SA">{t('numberFormats.ar-SA', 'عربي (السعودية)')}</MenuItem>
              <MenuItem value="en-US">{t('numberFormats.en-US', 'إنجليزي (أمريكا)')}</MenuItem>
              <MenuItem value="ar-YE">{t('numberFormats.ar-YE', 'عربي (اليمن)')}</MenuItem>
            </TextField>
          </Grid>

          {/* Actions */}
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
