import React from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  Container,
  Alert,
  Avatar,
  Fade,
  Slide,
  Grid,
} from '@mui/material';
import { Person, Lock, Email, Phone, AssignmentInd, Store } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui';
import { authApi, type RegisterData } from '@/services/auth';
import { toast } from 'react-hot-toast';

const Signup: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const signupSchema = React.useMemo(
    () =>
      z
        .object({
          username: z.string().min(1, t('validation.required', 'هذا الحقل مطلوب')),
          email: z
            .string()
            .min(1, t('validation.required', 'هذا الحقل مطلوب'))
            .email(t('validation.email', 'البريد الإلكتروني غير صحيح')),
          password: z
            .string()
            .min(
              6,
              t('validation.minLength', 'يجب أن يكون الطول أكثر من {{min}} أحرف', { min: 6 })
            ),
          confirmPassword: z
            .string()
            .min(
              6,
              t('validation.minLength', 'يجب أن يكون الطول أكثر من {{min}} أحرف', { min: 6 })
            ),
          phone: z.string().optional(),
          roleId: z.string().min(1, t('validation.required', 'هذا الحقل مطلوب')),
          branchId: z.string().optional(),
        })
        .refine(data => data.password === data.confirmPassword, {
          path: ['confirmPassword'],
          message: t('validation.passwordMismatch', 'كلمتا المرور غير متطابقتين'),
        }),
    [t]
  );

  type SignupFormData = z.infer<typeof signupSchema>;

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setError('');
    setIsSubmitting(true);

    const payload: RegisterData = {
      username: data.username,
      email: data.email,
      password: data.password,
      ...(data.phone && { phone: data.phone }),
      roleId: data.roleId,
      ...(data.branchId && { branchId: data.branchId }),
    };

    try {
      await authApi.register(payload);
      toast.success(t('auth.signup.success', 'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن.'));
      navigate('/login');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        t('auth.signup.error', 'فشل إنشاء الحساب، يرجى التحقق من البيانات والمحاولة مرة أخرى.');
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="md">
        <Fade in timeout={800}>
          <Slide direction="up" in timeout={600}>
            <Paper
              elevation={24}
              sx={{
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(46, 125, 50, 0.4)',
                }}
              >
                <AssignmentInd sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography
                component="h1"
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  textAlign: 'center',
                  mb: 1,
                }}
              >
                {t('auth.signup.title', 'إنشاء حساب جديد')}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 4,
                  textAlign: 'center',
                  maxWidth: '420px',
                  lineHeight: 1.5,
                }}
              >
                {t('auth.signup.description', 'قم بإدخال بياناتك لإنشاء حساب جديد في نظام زيتون.')}
              </Typography>

              {error && (
                <Fade in={!!error} timeout={300}>
                  <Alert
                    severity="error"
                    sx={{
                      width: '100%',
                      mb: 3,
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box
                component="form"
                onSubmit={form.handleSubmit(onSubmit)}
                sx={{ mt: 1, width: '100%' }}
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label={t('auth.signup.username', 'اسم المستخدم')}
                      autoComplete="username"
                      autoFocus
                      startIcon={<Person color="action" />}
                      {...form.register('username')}
                      error={!!form.formState.errors.username}
                      helperText={form.formState.errors.username?.message || ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label={t('auth.signup.email', 'البريد الإلكتروني')}
                      autoComplete="email"
                      startIcon={<Email color="action" />}
                      {...form.register('email')}
                      error={!!form.formState.errors.email}
                      helperText={form.formState.errors.email?.message || ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      margin="normal"
                      required
                      fullWidth
                      id="password"
                      label={t('auth.signup.password', 'كلمة المرور')}
                      type="password"
                      autoComplete="new-password"
                      showPasswordToggle
                      startIcon={<Lock color="action" />}
                      {...form.register('password')}
                      error={!!form.formState.errors.password}
                      helperText={form.formState.errors.password?.message || ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      margin="normal"
                      required
                      fullWidth
                      id="confirmPassword"
                      label={t('auth.signup.confirmPassword', 'تأكيد كلمة المرور')}
                      type="password"
                      autoComplete="new-password"
                      showPasswordToggle
                      startIcon={<Lock color="action" />}
                      {...form.register('confirmPassword')}
                      error={!!form.formState.errors.confirmPassword}
                      helperText={form.formState.errors.confirmPassword?.message || ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      margin="normal"
                      fullWidth
                      id="phone"
                      label={t('auth.signup.phone', 'رقم الجوال (اختياري)')}
                      autoComplete="tel"
                      startIcon={<Phone color="action" />}
                      {...form.register('phone')}
                      error={!!form.formState.errors.phone}
                      helperText={form.formState.errors.phone?.message || ''}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Input
                      margin="normal"
                      required
                      fullWidth
                      id="roleId"
                      label={t('auth.signup.roleId', 'معرف الدور (UUID من النظام)')}
                      placeholder="مثال: 550e8400-e29b-41d4-a716-446655440000"
                      startIcon={<AssignmentInd color="action" />}
                      {...form.register('roleId')}
                      error={!!form.formState.errors.roleId}
                      helperText={
                        form.formState.errors.roleId?.message ||
                        t(
                          'auth.signup.roleIdHint',
                          'يمكنك الحصول على معرف الدور من المسؤول عن النظام.'
                        )
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      margin="normal"
                      fullWidth
                      id="branchId"
                      label={t('auth.signup.branchId', 'معرف الفرع (اختياري - UUID)')}
                      placeholder="مثال: 550e8400-e29b-41d4-a716-446655440000"
                      startIcon={<Store color="action" />}
                      {...form.register('branchId')}
                      error={!!form.formState.errors.branchId}
                      helperText={form.formState.errors.branchId?.message || ''}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t('auth.signup.submitting', 'جارٍ إنشاء الحساب...')
                    : t('auth.signup.submit', 'إنشاء الحساب')}
                </Button>

                <Button
                  type="button"
                  fullWidth
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{
                    mt: 1,
                    textTransform: 'none',
                  }}
                >
                  {t('auth.signup.haveAccount', 'لديك حساب بالفعل؟ انتقل لتسجيل الدخول')}
                </Button>
              </Box>
            </Paper>
          </Slide>
        </Fade>
      </Container>
    </Box>
  );
};

export default Signup;
