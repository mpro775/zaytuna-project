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
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useWarehouse, useWarehouses, useBranches } from '@/hooks';
import type { CreateWarehouseDto } from '@/services/warehouses';

const WarehouseForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isRTL = i18n.dir() === 'rtl';
  const isEdit = id !== 'new' && !!id;

  // Hooks
  const { warehouse, isLoading: isLoadingWarehouse, updateWarehouse } = useWarehouse(isEdit ? id : undefined);
  const { createWarehouse, isCreating } = useWarehouses();
  const { branches } = useBranches({ autoFetch: true });

  // State
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('warehouses.validation.nameRequired', 'اسم المخزن مطلوب'))
      .max(255, t('warehouses.validation.nameMaxLength', 'اسم المخزن يجب ألا يزيد عن 255 حرف')),
    code: Yup.string()
      .required(t('warehouses.validation.codeRequired', 'كود المخزن مطلوب'))
      .max(50, t('warehouses.validation.codeMaxLength', 'كود المخزن يجب ألا يزيد عن 50 حرف')),
    branchId: Yup.string()
      .required(t('warehouses.validation.branchRequired', 'الفرع مطلوب')),
    address: Yup.string().max(500, t('warehouses.validation.addressMaxLength', 'العنوان يجب ألا يزيد عن 500 حرف')),
    phone: Yup.string()
      .max(50, t('warehouses.validation.phoneMaxLength', 'رقم الهاتف يجب ألا يزيد عن 50 حرف'))
      .matches(/^[+]?[0-9\-\s()]*$/, t('warehouses.validation.phoneInvalid', 'رقم الهاتف غير صحيح')),
    email: Yup.string().email(t('warehouses.validation.emailInvalid', 'البريد الإلكتروني غير صحيح')),
    isActive: Yup.boolean(),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
      branchId: '',
      address: '',
      phone: '',
      email: '',
      isActive: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitError(null);

        if (isEdit && id) {
          await updateWarehouse(values);
          navigate('/warehouses');
        } else {
          await createWarehouse(values as CreateWarehouseDto);
          navigate('/warehouses');
        }
      } catch (error: any) {
        setSubmitError(error?.message || t('warehouses.errors.saveFailed', 'فشل في حفظ المخزن'));
      }
    },
  });

  // Load warehouse data for editing
  useEffect(() => {
    if (isEdit && warehouse) {
      formik.setValues({
        name: warehouse.name || '',
        code: warehouse.code || '',
        branchId: warehouse.branchId || '',
        address: warehouse.address || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        isActive: warehouse.isActive ?? true,
      });
    }
  }, [warehouse, isEdit, formik]);

  // Loading state
  if (isEdit && isLoadingWarehouse) {
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
        <MuiLink component={Link} to="/warehouses" underline="hover">
          {t('warehouses.title', 'إدارة المخازن')}
        </MuiLink>
        <Typography color="text.primary">
          {isEdit ? t('warehouses.editWarehouse', 'تعديل مخزن') : t('warehouses.addWarehouse', 'إضافة مخزن')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <WarehouseIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEdit ? t('warehouses.editWarehouse', 'تعديل مخزن') : t('warehouses.addWarehouse', 'إضافة مخزن')}
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
            <Grid   size={{xs: 12}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('warehouses.sections.basicInfo', 'المعلومات الأساسية')}
              </Typography>
            </Grid>

            <Grid   size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                label={t('warehouses.fields.name', 'اسم المخزن')}
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

            <Grid   size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                label={t('warehouses.fields.code', 'كود المخزن')}
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.code && formik.errors.code)}
                helperText={formik.touched.code && formik.errors.code}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid   size={{xs: 12, md: 6}}>
              <TextField
                select
                fullWidth
                label={t('warehouses.fields.branch', 'الفرع')}
                name="branchId"
                value={formik.values.branchId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.branchId && formik.errors.branchId)}
                helperText={formik.touched.branchId && formik.errors.branchId}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Contact Information */}
            <Grid   size={{xs: 12}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('warehouses.sections.contactInfo', 'معلومات التواصل')}
              </Typography>
            </Grid>

            <Grid   size={{xs: 12}}>
              <TextField
                fullWidth
                label={t('warehouses.fields.address', 'العنوان')}
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

            <Grid   size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                label={t('warehouses.fields.phone', 'رقم الهاتف')}
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(formik.touched.phone && formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            <Grid   size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                label={t('warehouses.fields.email', 'البريد الإلكتروني')}
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

            {/* Settings */}
            <Grid   size={{xs: 12}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('warehouses.sections.settings', 'الإعدادات')}
              </Typography>
            </Grid>

            <Grid   size={{xs: 12}}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                    name="isActive"
                  />
                }
                label={t('warehouses.fields.isActive', 'المخزن نشط')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Actions */}
            <Grid   size={{xs: 12}}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/warehouses')}
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
                    : t('common.actions.save', 'حفظ')
                  }
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default WarehouseForm;
