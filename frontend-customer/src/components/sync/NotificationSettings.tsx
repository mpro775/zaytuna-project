import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Chip,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Science as TestTubeIcon,
} from '@mui/icons-material';
import { notificationService, type NotificationSettings as NotificationSettingsType } from '../../services/sync';
import { useTranslation } from 'react-i18next';

interface NotificationSettingsProps {
  compact?: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  compact = false
}) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettingsType>(notificationService.getSettings());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const checkNotificationStatus = useCallback(async () => {
    const status = notificationService.getStatus();
    setPermissionStatus(status.permission);
    setIsSubscribed(status.isSubscribed);
    setSettings(status.settings);
  }, []);

  useEffect(() => {
    // Defer initial load to avoid cascading renders
    queueMicrotask(() => {
      checkNotificationStatus();
    });
  }, [checkNotificationStatus]);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const permission = await notificationService.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        await checkNotificationStatus();
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const success = await notificationService.subscribeToPush();
      if (success) {
        await checkNotificationStatus();
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const success = await notificationService.unsubscribeFromPush();
      if (success) {
        await checkNotificationStatus();
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
    setLoading(false);
  };

    const handleSettingsChange = async (newSettings: Partial<NotificationSettingsType>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await notificationService.updateSettings(updatedSettings);
  };

  const handleSendTestNotification = async () => {
    setLoading(true);
    try {
      await notificationService.sendTestNotification();
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
    setLoading(false);
  };

  const getPermissionStatusColor = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted': return 'success';
      case 'denied': return 'error';
      default: return 'warning';
    }
  };

  const getPermissionStatusText = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted': return t('notifications.permission.granted', 'مسموح');
      case 'denied': return t('notifications.permission.denied', 'ممنوع');
      default: return t('notifications.permission.default', 'لم يتم طلب الإذن');
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={permissionStatus === 'granted' ? <NotificationsIcon /> : <NotificationsOffIcon />}
          label={getPermissionStatusText(permissionStatus)}
          color={getPermissionStatusColor(permissionStatus)}
          size="small"
        />
        {isSubscribed && (
          <Chip
            label={t('notifications.subscribed', 'مشترك')}
            color="success"
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsIcon />
        {t('notifications.settings.title', 'إعدادات الإشعارات')}
      </Typography>

      {/* Permission Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('notifications.permission.title', 'حالة الإذن')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip
            icon={permissionStatus === 'granted' ? <NotificationsIcon /> : <NotificationsOffIcon />}
            label={getPermissionStatusText(permissionStatus)}
            color={getPermissionStatusColor(permissionStatus)}
          />

          {isSubscribed && (
            <Chip
              label={t('notifications.subscribed', 'مشترك في الإشعارات الدفعية')}
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {permissionStatus === 'default' && (
            <Button
              variant="contained"
              onClick={handleRequestPermission}
              disabled={loading}
            >
              {t('notifications.request_permission', 'طلب الإذن')}
            </Button>
          )}

          {permissionStatus === 'granted' && !isSubscribed && (
            <Button
              variant="contained"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {t('notifications.subscribe', 'الاشتراك في الإشعارات الدفعية')}
            </Button>
          )}

          {isSubscribed && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleUnsubscribe}
              disabled={loading}
            >
              {t('notifications.unsubscribe', 'إلغاء الاشتراك')}
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<TestTubeIcon />}
            onClick={handleSendTestNotification}
            disabled={loading || permissionStatus !== 'granted'}
          >
            {t('notifications.send_test', 'إرسال إشعار اختباري')}
          </Button>
        </Box>

        {testSent && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t('notifications.test_sent', 'تم إرسال الإشعار الاختباري بنجاح')}
          </Alert>
        )}
      </Paper>

      {/* Notification Types */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('notifications.settings.types', 'أنواع الإشعارات')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('notifications.settings.types_description', 'اختر أنواع الإشعارات التي تريد تلقيها')}
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(settings.types).map(([type, enabled]) => (
              <Grid size={{xs: 12, sm: 6}} key={type}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={(e) => handleSettingsChange({
                        types: { ...settings.types, [type]: e.target.checked }
                      })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {t(`notifications.types.${type}`, type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`notifications.types.${type}_description`,
                          type === 'sales' ? 'إشعارات المبيعات والفواتير' :
                          type === 'inventory' ? 'تنبيهات المخزون والمنتجات' :
                          type === 'system' ? 'تحديثات النظام والصيانة' :
                          'عروض وأخبار تسويقية'
                        )}
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', alignItems: 'flex-start' }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('notifications.settings.quiet_hours', 'الوقت الهادئ')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('notifications.settings.quiet_hours_description', 'تعطيل الإشعارات خلال هذه الفترة')}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.quietHours.enabled}
                onChange={(e) => handleSettingsChange({
                  quietHours: { ...settings.quietHours, enabled: e.target.checked }
                })}
                color="primary"
              />
            }
            label={t('notifications.settings.enable_quiet_hours', 'تفعيل الوقت الهادئ')}
          />

          {settings.quietHours.enabled && (
            <Box sx={{ mt: 2, pl: 4 }}>
              <Grid container spacing={2}>
                <Grid size={{xs: 12, sm: 6}}>
                  <TextField
                    label={t('notifications.settings.from', 'من')}
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) => handleSettingsChange({
                      quietHours: { ...settings.quietHours, start: e.target.value }
                    })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{xs: 12, sm: 6}}>
                  <TextField
                    label={t('notifications.settings.to', 'إلى')}
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) => handleSettingsChange({
                      quietHours: { ...settings.quietHours, end: e.target.value }
                    })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('notifications.settings.general', 'إعدادات عامة')}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => handleSettingsChange({ enabled: e.target.checked })}
                color="primary"
              />
            }
            label={t('notifications.settings.enable_all', 'تفعيل جميع الإشعارات')}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            {t('notifications.settings.note', 'ملاحظة: يمكنك دائماً تغيير هذه الإعدادات من إعدادات المتصفح')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
