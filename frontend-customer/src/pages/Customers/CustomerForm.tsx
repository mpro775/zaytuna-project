import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Person as PersonIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useCustomer, useCustomers } from '@/hooks';
import type { CreateCustomerDto, UpdateCustomerDto } from '@/services/customers';

const CustomerForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isRTL = i18n.dir() === 'rtl';
  const isEdit = id !== 'new' && !!id;

  // Hooks
  const {
    customer,
    isLoading: isLoadingCustomer,
    updateCustomer,
  } = useCustomer(isEdit ? id : undefined);
  const { createCustomer, isCreating } = useCustomers();

  // State
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('customers.validation.nameRequired', 'اسم العميل مطلوب'))
      .max(255, t('customers.validation.nameMaxLength', 'اسم العميل يجب ألا يزيد عن 255 حرف')),
    phone: Yup.string()
      .max(50, t('customers.validation.phoneMaxLength', 'رقم الهاتف يجب ألا يزيد عن 50 حرف'))
      .matches(/^[0-9\-\s]*$/, t('customers.validation.phoneInvalid', 'رقم الهاتف غير صحيح')),
    email: Yup.string().email(t('customers.validation.emailInvalid', 'البريد الإلكتروني غير صحيح')),
    address: Yup.string().max(
      500,
      t('customers.validation.addressMaxLength', 'العنوان يجب ألا يزيد عن 500 حرف')
    ),
    taxNumber: Yup.string().max(
      50,
      t('customers.validation.taxNumberMaxLength', 'الرقم الضريبي يجب ألا يزيد عن 50 حرف')
    ),
    creditLimit: Yup.number()
      .min(0, t('customers.validation.creditLimitMin', 'حد الائتمان يجب أن يكون موجب'))
      .max(999999999, t('customers.validation.creditLimitMax', 'حد الائتمان كبير جداً')),
    birthday: Yup.date().max(
      new Date(),
      t('customers.validation.birthdayInvalid', 'تاريخ الميلاد غير صحيح')
    ),
    gender: Yup.string().oneOf(
      ['male', 'female', 'other'],
      t('customers.validation.genderInvalid', 'الجنس غير صحيح')
    ),
    marketingConsent: Yup.boolean(),
    isActive: Yup.boolean(),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      creditLimit: 0,
      birthday: '',
      gender: '' as 'male' | 'female' | 'other' | '',
      marketingConsent: false,
      isActive: true,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        setSubmitError(null);

        // Clean up empty values
        const cleanValues = {
          ...values,
          phone: values.phone || undefined,
          email: values.email || undefined,
          address: values.address || undefined,
          taxNumber: values.taxNumber || undefined,
          creditLimit: values.creditLimit || undefined,
          birthday: values.birthday || undefined,
          gender: values.gender || undefined,
        };

        if (isEdit && id) {
          await updateCustomer(cleanValues as UpdateCustomerDto);
          navigate('/customers');
        } else {
          await createCustomer(cleanValues as CreateCustomerDto);
          navigate('/customers');
        }
      } catch (error: any) {
        setSubmitError(error?.message || t('customers.errors.saveFailed', 'فشل في حفظ العميل'));
      }
    },
  });

  // Load customer data for editing
  useEffect(() => {
    if (isEdit && customer) {
      formik.setValues({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        taxNumber: customer.taxNumber || '',
        creditLimit: customer.creditLimit || 0,
        birthday: customer.birthday || '',
        gender: customer.gender || '',
        marketingConsent: customer.marketingConsent || false,
        isActive: customer.isActive ?? true,
      });
    }
  }, [customer, isEdit, formik]);

  // Loading state
  if (isEdit && isLoadingCustomer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }} dir={isRTL ? 'rtl' : 'ltr'}>
        <MuiLink component={Link} to="/customers" underline="hover">
          {t('customers.title', 'إدارة العملاء')}
        </MuiLink>
        <Typography color="text.primary">
          {isEdit
            ? t('customers.editCustomer', 'تعديل العميل')
            : t('customers.addCustomer', 'إضافة عميل')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEdit
            ? t('customers.editCustomer', 'تعديل العميل')
            : t('customers.addCustomer', 'إضافة عميل')}
        </Typography>
      </Box>

      {/* Error Alert */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      {/* Form */}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('customers.sections.basicInfo', 'المعلومات الأساسية')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.name', 'اسم العميل')}
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.name && formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.taxNumber', 'الرقم الضريبي')}
                name="taxNumber"
                value={formik.values.taxNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.taxNumber && formik.errors.taxNumber)}
                helperText={formik.touched.taxNumber && formik.errors.taxNumber}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Contact Information */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('customers.sections.contactInfo', 'معلومات التواصل')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.phone', 'رقم الهاتف')}
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.phone && formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.email', 'البريد الإلكتروني')}
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.email && formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.address', 'العنوان')}
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.address && formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                multiline
                rows={3}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Personal Information */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('customers.sections.personalInfo', 'المعلومات الشخصية')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.birthday', 'تاريخ الميلاد')}
                name="birthday"
                type="date"
                value={formik.values.birthday}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.birthday && formik.errors.birthday)}
                helperText={formik.touched.birthday && formik.errors.birthday}
                InputLabelProps={{
                  shrink: true,
                }}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('customers.fields.gender', 'الجنس')}</FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel
                    value="male"
                    control={<Radio />}
                    label={t('customers.gender.male', 'ذكر')}
                  />
                  <FormControlLabel
                    value="female"
                    control={<Radio />}
                    label={t('customers.gender.female', 'أنثى')}
                  />
                  <FormControlLabel
                    value="other"
                    control={<Radio />}
                    label={t('customers.gender.other', 'أخرى')}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Financial Information */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('customers.sections.financialInfo', 'المعلومات المالية')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('customers.fields.creditLimit', 'حد الائتمان')}
                name="creditLimit"
                type="number"
                value={formik.values.creditLimit}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.creditLimit && formik.errors.creditLimit)}
                helperText={formik.touched.creditLimit && formik.errors.creditLimit}
                InputProps={{
                  endAdornment: (
                    <Typography variant="body2" color="text.secondary">
                      ريال
                    </Typography>
                  ),
                }}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Settings */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('customers.sections.settings', 'الإعدادات')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.marketingConsent}
                    onChange={e => formik.setFieldValue('marketingConsent', e.target.checked)}
                    name="marketingConsent"
                  />
                }
                label={t('customers.fields.marketingConsent', 'موافقة على الرسائل التسويقية')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={e => formik.setFieldValue('isActive', e.target.checked)}
                    name="isActive"
                  />
                }
                label={t('customers.fields.isActive', 'العميل نشط')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Actions */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/customers')}
                  disabled={isCreating}
                >
                  {t('common.actions.cancel', 'إلغاء')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isCreating ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={isCreating}
                >
                  {isCreating
                    ? t('common.actions.saving', 'جارٍ الحفظ...')
                    : t('common.actions.save', 'حفظ')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CustomerForm;
