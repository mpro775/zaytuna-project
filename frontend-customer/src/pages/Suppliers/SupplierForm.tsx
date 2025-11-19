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
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSupplier, useSuppliers } from '@/hooks';
import type { CreateSupplierDto, UpdateSupplierDto } from '@/services/suppliers';

const SupplierForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isRTL = i18n.dir() === 'rtl';
  const isEdit = id !== 'new' && !!id;

  // Hooks
  const {
    supplier,
    isLoading: isLoadingSupplier,
    updateSupplier,
  } = useSupplier(isEdit ? id : undefined);
  const { createSupplier, isCreating } = useSuppliers();

  // State
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('suppliers.validation.nameRequired', 'اسم المورد مطلوب'))
      .max(255, t('suppliers.validation.nameMaxLength', 'اسم المورد يجب ألا يزيد عن 255 حرف')),
    contactName: Yup.string().max(
      255,
      t('suppliers.validation.contactNameMaxLength', 'اسم جهة الاتصال يجب ألا يزيد عن 255 حرف')
    ),
    phone: Yup.string()
      .max(50, t('suppliers.validation.phoneMaxLength', 'رقم الهاتف يجب ألا يزيد عن 50 حرف'))
      .matches(/^[+]?[0-9\-\s()]*$/, t('suppliers.validation.phoneInvalid', 'رقم الهاتف غير صحيح')),
    email: Yup.string().email(t('suppliers.validation.emailInvalid', 'البريد الإلكتروني غير صحيح')),
    address: Yup.string().max(
      500,
      t('suppliers.validation.addressMaxLength', 'العنوان يجب ألا يزيد عن 500 حرف')
    ),
    taxNumber: Yup.string().max(
      50,
      t('suppliers.validation.taxNumberMaxLength', 'الرقم الضريبي يجب ألا يزيد عن 50 حرف')
    ),
    paymentTerms: Yup.string().max(
      255,
      t('suppliers.validation.paymentTermsMaxLength', 'شروط الدفع يجب ألا تزيد عن 255 حرف')
    ),
    isActive: Yup.boolean(),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      paymentTerms: '',
      isActive: true,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        setSubmitError(null);

        // Clean up empty values
        const cleanValues = {
          ...values,
          contactName: values.contactName || undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
          address: values.address || undefined,
          taxNumber: values.taxNumber || undefined,
          paymentTerms: values.paymentTerms || undefined,
        };

        if (isEdit && id) {
          await updateSupplier(cleanValues as UpdateSupplierDto);
          navigate('/suppliers');
        } else {
          await createSupplier(cleanValues as CreateSupplierDto);
          navigate('/suppliers');
        }
      } catch (error: any) {
        setSubmitError(error?.message || t('suppliers.errors.saveFailed', 'فشل في حفظ المورد'));
      }
    },
  });

  // Load supplier data for editing
  useEffect(() => {
    if (isEdit && supplier) {
      formik.setValues({
        name: supplier.name || '',
        contactName: supplier.contactName || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        taxNumber: supplier.taxNumber || '',
        paymentTerms: supplier.paymentTerms || '',
        isActive: supplier.isActive ?? true,
      });
    }
  }, [supplier, isEdit, formik]);

  // Loading state
  if (isEdit && isLoadingSupplier) {
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
        <MuiLink component={Link} to="/suppliers" underline="hover">
          {t('suppliers.title', 'إدارة الموردين')}
        </MuiLink>
        <Typography color="text.primary">
          {isEdit
            ? t('suppliers.editSupplier', 'تعديل المورد')
            : t('suppliers.addSupplier', 'إضافة مورد')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEdit
            ? t('suppliers.editSupplier', 'تعديل المورد')
            : t('suppliers.addSupplier', 'إضافة مورد')}
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
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('suppliers.sections.basicInfo', 'المعلومات الأساسية')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('suppliers.fields.name', 'اسم المورد')}
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
                label={t('suppliers.fields.contactName', 'اسم جهة الاتصال')}
                name="contactName"
                value={formik.values.contactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.contactName && formik.errors.contactName)}
                helperText={formik.touched.contactName && formik.errors.contactName}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('suppliers.fields.taxNumber', 'الرقم الضريبي')}
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
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('suppliers.sections.contactInfo', 'معلومات التواصل')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={t('suppliers.fields.phone', 'رقم الهاتف')}
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
                label={t('suppliers.fields.email', 'البريد الإلكتروني')}
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

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('suppliers.fields.address', 'العنوان')}
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

            {/* Business Information */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('suppliers.sections.businessInfo', 'المعلومات التجارية')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('suppliers.fields.paymentTerms', 'شروط الدفع')}
                name="paymentTerms"
                value={formik.values.paymentTerms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.paymentTerms && formik.errors.paymentTerms)}
                helperText={formik.touched.paymentTerms && formik.errors.paymentTerms}
                placeholder={t('suppliers.paymentTermsPlaceholder', 'مثال: 30 يوم، 50% مقدم، إلخ')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Settings */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('suppliers.sections.settings', 'الإعدادات')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={e => formik.setFieldValue('isActive', e.target.checked)}
                    name="isActive"
                  />
                }
                label={t('suppliers.fields.isActive', 'المورد نشط')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Actions */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/suppliers')}
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

export default SupplierForm;
