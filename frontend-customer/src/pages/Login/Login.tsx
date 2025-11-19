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
} from '@mui/material';
import {
  Person,
  Lock,
  Security,
  Login as LoginIcon,
  VerifiedUser,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts';
import { Input } from '@/components/ui';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const {
    login,
    verifyTwoFactorCode,
    sendTwoFactorCode,
    isLoading,
    requiresTwoFactor,
    twoFactorMethod
  } = useAuth();
  const [error, setError] = React.useState<string>('');

  // Use useMemo to recreate schemas when language changes
  const loginSchema = React.useMemo(() => z.object({
    username: z.string().min(1, t('validation.required', 'هذا الحقل مطلوب')),
    password: z.string().min(6, t('validation.minLength', 'يجب أن يكون الطول أكثر من {{min}} أحرف', { min: 6 })),
  }), [t]);

  const twoFactorSchema = React.useMemo(() => z.object({
    twoFactorCode: z.string()
      .min(6, t('validation.minLength', 'يجب أن يكون الطول أكثر من {{min}} أحرف', { min: 6 }))
      .max(6, t('validation.maxLength', 'يجب أن يكون الطول أقل من {{max}} حرف', { max: 6 })),
  }), [t]);

  type LoginFormData = z.infer<typeof loginSchema>;
  type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      await login(data);
    } catch {
      setError('فشل تسجيل الدخول. يرجى التحقق من البيانات المدخلة.');
    }
  };

  const onTwoFactorSubmit = async (data: TwoFactorFormData) => {
    try {
      setError('');
      await verifyTwoFactorCode(data.twoFactorCode);
    } catch {
      setError('رمز الأمان غير صحيح. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleSendTwoFactorCode = async () => {
    if (!twoFactorMethod) return;

    try {
      if (twoFactorMethod === 'sms') {
        await sendTwoFactorCode('sms');
      } else if (twoFactorMethod === 'email') {
        await sendTwoFactorCode('email');
      }
    } catch {
      setError('فشل في إرسال رمز الأمان. يرجى المحاولة مرة أخرى.');
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
      <Container component="main" maxWidth="sm">
        <Fade in={true} timeout={800}>
          <Slide direction="up" in={true} timeout={600}>
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
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                },
              }}
            >
              {/* Logo/Brand Section */}
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  mb: 3,
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                }}
              >
                {requiresTwoFactor ? <VerifiedUser sx={{ fontSize: 40 }} /> : <LoginIcon sx={{ fontSize: 40 }} />}
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
                {requiresTwoFactor ? t('auth.twoFactor.title', 'التحقق من الهوية') : t('auth.login.title', 'تسجيل الدخول')}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  mb: 4,
                  textAlign: 'center',
                  maxWidth: '280px',
                  lineHeight: 1.5,
                }}
              >
                {requiresTwoFactor
                  ? t('auth.twoFactor.description', 'أدخل رمز الأمان المرسل إليك')
                  : t('app.description', 'أدخل بياناتك للوصول إلى حسابك')
                }
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
                  '& .MuiAlert-icon': {
                    fontSize: '1.2rem',
                  },
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {requiresTwoFactor ? (
            // 2FA Form
            <Box
              component="form"
              onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)}
              sx={{ mt: 1, width: '100%' }}
            >
              <Input
                margin="normal"
                required
                fullWidth
                id="twoFactorCode"
                label={t('auth.twoFactor.code', 'رمز الأمان')}
                placeholder="000000"
                autoFocus
                startIcon={<Security color="action" />}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                }}
                {...twoFactorForm.register('twoFactorCode')}
                error={!!twoFactorForm.formState.errors.twoFactorCode}
                helperText={twoFactorForm.formState.errors.twoFactorCode?.message || ''}
              />

              {twoFactorMethod && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 2,
                    mb: 1,
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Security sx={{ mr: 1, color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('auth.twoFactor.sentTo', 'تم إرسال الرمز إلى')} {twoFactorMethod === 'sms' ? t('auth.twoFactor.phone', 'رقم الهاتف') : t('auth.twoFactor.email', 'البريد الإلكتروني')}
                  </Typography>
                </Box>
              )}

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
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                disabled={isLoading}
              >
                {isLoading ? t('auth.twoFactor.verifying', 'جارٍ التحقق...') : t('auth.twoFactor.verify', 'تحقق')}
              </Button>

              {twoFactorMethod && (
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  onClick={handleSendTwoFactorCode}
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.50',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {t('auth.twoFactor.resend', 'إعادة إرسال الرمز')}
                </Button>
              )}
            </Box>
          ) : (
            // Login Form
            <Box
              component="form"
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              sx={{ mt: 1, width: '100%' }}
            >
              <Input
                margin="normal"
                required
                fullWidth
                id="username"
                label={t('auth.login.username', 'اسم المستخدم')}
                autoComplete="username"
                autoFocus
                startIcon={<Person color="action" />}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                }}
                {...loginForm.register('username')}
                error={!!loginForm.formState.errors.username}
                helperText={loginForm.formState.errors.username?.message || ''}
              />

              <Input
                margin="normal"
                required
                fullWidth
                label={t('auth.login.password', 'كلمة المرور')}
                type="password"
                id="password"
                autoComplete="current-password"
                showPasswordToggle
                startIcon={<Lock color="action" />}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                }}
                {...loginForm.register('password')}
                error={!!loginForm.formState.errors.password}
                helperText={loginForm.formState.errors.password?.message || ''}
              />

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
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                disabled={isLoading}
              >
                {isLoading ? t('auth.login.loggingIn', 'جارٍ تسجيل الدخول...') : t('auth.login.submit', 'تسجيل الدخول')}
              </Button>
            </Box>
          )}
            </Paper>
          </Slide>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
