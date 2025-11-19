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
import { useBranch, useBranches } from '@/hooks';
import type { CreateBranchDto, UpdateBranchDto } from '@/services/branches';

const BranchForm: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isRTL = i18n.dir() === 'rtl';
  const isEdit = id !== 'new' && !!id;

  // Hooks
  const { branch, isLoading: isLoadingBranch, updateBranch } = useBranch(isEdit ? id : undefined);
  const { createBranch, isCreating } = useBranches();

  // State
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('branches.validation.nameRequired', 'اسم الفرع مطلوب'))
      .max(255, t('branches.validation.nameMaxLength', 'اسم الفرع يجب ألا يزيد عن 255 حرف')),
    code: Yup.string()
      .required(t('branches.validation.codeRequired', 'كود الفرع مطلوب'))
      .max(50, t('branches.validation.codeMaxLength', 'كود الفرع يجب ألا يزيد عن 50 حرف')),
    address: Yup.string().max(500, t('branches.validation.addressMaxLength', 'العنوان يجب ألا يزيد عن 500 حرف')),
    phone: Yup.string()
      .max(50, t('branches.validation.phoneMaxLength', 'رقم الهاتف يجب ألا يزيد عن 50 حرف'))
      .matches(/^[0-9\-\s]*$/, t('branches.validation.phoneInvalid', 'رقم الهاتف غير صحيح')),
    email: Yup.string().email(t('branches.validation.emailInvalid', 'البريد الإلكتروني غير صحيح')),
    isActive: Yup.boolean(),
  });

  // Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      code: '',
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
          await updateBranch(values as UpdateBranchDto);
          navigate('/branches');
        } else {
          await createBranch(values as CreateBranchDto);
          navigate('/branches');
        }
      } catch (error: any) {
        setSubmitError(error?.message || t('branches.errors.saveFailed', 'فشل في حفظ الفرع'));
      }
    },
  });

  // Load branch data for editing
  useEffect(() => {
    if (isEdit && branch) {
      formik.setValues({
        name: branch.name || '',
        code: branch.code || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        isActive: branch.isActive ?? true,
      });
    }
  }, [branch, isEdit, formik]);

  // Loading state
  if (isEdit && isLoadingBranch) {
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
        <MuiLink component={Link} to="/branches" underline="hover">
          {t('branches.title', 'إدارة الفروع')}
        </MuiLink>
        <Typography color="text.primary">
          {isEdit ? t('branches.editBranch', 'تعديل فرع') : t('branches.addBranch', 'إضافة فرع')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BusinessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEdit ? t('branches.editBranch', 'تعديل فرع') : t('branches.addBranch', 'إضافة فرع')}
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
            <Grid   size={{xs: 12, md: 6}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('branches.sections.basicInfo', 'المعلومات الأساسية')}
              </Typography>
            </Grid>

            <Grid   size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                label={t('branches.fields.name', 'اسم الفرع')}
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
                label={t('branches.fields.code', 'كود الفرع')}
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

            {/* Contact Information */}
            <Grid   size={{xs: 12, md: 6}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('branches.sections.contactInfo', 'معلومات التواصل')}
              </Typography>
            </Grid>

                  <Grid   size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                label={t('branches.fields.address', 'العنوان')}
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
                label={t('branches.fields.phone', 'رقم الهاتف')}
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
                label={t('branches.fields.email', 'البريد الإلكتروني')}
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
            <Grid   size={{xs: 12, md: 6}}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, mt: 2 }}>
                {t('branches.sections.settings', 'الإعدادات')}
              </Typography>
            </Grid>

            <Grid   size={{xs: 12, md: 6}}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.isActive}
                    onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                    name="isActive"
                  />
                }
                label={t('branches.fields.isActive', 'الفرع نشط')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </Grid>

            {/* Actions */}
              <Grid   size={{xs: 12, md: 6}}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/branches')}
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

export default BranchForm;
