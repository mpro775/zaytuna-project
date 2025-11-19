import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Done as DoneIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { notificationService, type NotificationHistoryItem, type NotificationSettings } from '@/services/sync';

interface NotificationListProps {
  compact?: boolean;
  maxItems?: number;
  showSettings?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  compact = false,
  maxItems = 10,
  showSettings = true,
}) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());

  const loadNotifications = React.useCallback(() => {
    const history = notificationService.getHistory(maxItems);
    setNotifications(history);
    setSettings(notificationService.getSettings());
  }, [maxItems]);

  useEffect(() => {
    // Sync external notification service data to component state
    // Defer initial load to avoid cascading renders
    queueMicrotask(() => {
      loadNotifications();
    });

    // تحديث دوري للإشعارات
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // كل 30 ثانية

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleDeleteNotification = (notificationId: string) => {
    // للآن نحذف من القائمة المحلية فقط
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleClearAll = () => {
    notificationService.clearHistory();
    setNotifications([]);
  };

  const handleSettingsChange = async (newSettings: Partial<NotificationSettings>) => {
    await notificationService.updateSettings(newSettings);
    setSettings(notificationService.getSettings());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sales':
        return '💰';
      case 'inventory':
        return '📦';
      case 'system':
        return '⚙️';
      case 'marketing':
        return '📢';
      default:
        return '🔔';
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'sales':
        return 'success';
      case 'inventory':
        return 'warning';
      case 'system':
        return 'info';
      case 'marketing':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('notifications.just_now', 'الآن');
    if (diffInMinutes < 60) return t('notifications.minutes_ago', 'منذ {{count}} دقيقة', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('notifications.hours_ago', 'منذ {{count}} ساعة', { count: diffInHours });

    return timestamp.toLocaleDateString('ar-SA');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (compact) {
    return (
      <Box>
        <IconButton color="inherit">
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsActiveIcon />
          </Badge>
          <Typography variant="h6">
            {t('notifications.title', 'الإشعارات')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {showSettings && (
            <IconButton size="small" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          )}
          {notifications.length > 0 && (
            <Button size="small" onClick={handleClearAll}>
              {t('notifications.clear_all', 'مسح الكل')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {t('notifications.no_notifications', 'لا توجد إشعارات')}
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%' }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getNotificationIcon(notification.data?.type || 'default')}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" component="span">
                        {notification.title}
                      </Typography>
                      {notification.data?.type && (
                        <Chip
                          label={String(t(`notifications.types.${notification.data.type}`, notification.data.type as string))}
                          size="small"
                          color={getNotificationTypeColor(notification.data.type)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                        {notification.body}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                        <Box>
                          {!notification.read && (
                            <IconButton size="small" onClick={() => handleMarkAsRead(notification.id)}>
                              <DoneIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => handleDeleteNotification(notification.id)}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>

              {index < notifications.length - 1 && <Divider variant="inset" />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('notifications.settings.title', 'إعدادات الإشعارات')}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Notification Types */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('notifications.settings.types', 'أنواع الإشعارات')}
              </Typography>

              {Object.entries(settings.types).map(([type, enabled]) => (
                <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <input
                    type="checkbox"
                    checked={enabled as boolean}
                    onChange={(e) => handleSettingsChange({
                      types: { ...settings.types, [type]: e.target.checked }
                    })}
                  />
                  <Typography variant="body2">
                    {t(`notifications.types.${type}`, type)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Quiet Hours */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('notifications.settings.quiet_hours', 'الوقت الهادئ')}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => handleSettingsChange({
                    quietHours: { ...settings.quietHours, enabled: e.target.checked }
                  })}
                />
                <Typography variant="body2">
                  {t('notifications.settings.enable_quiet_hours', 'تفعيل الوقت الهادئ')}
                </Typography>
              </Box>

              {settings.quietHours.enabled && (
                <Box sx={{ display: 'flex', gap: 2, ml: 3 }}>
                  <Box>
                    <Typography variant="caption">
                      {t('notifications.settings.from', 'من')}
                    </Typography>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => handleSettingsChange({
                        quietHours: { ...settings.quietHours, start: e.target.value }
                      })}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption">
                      {t('notifications.settings.to', 'إلى')}
                    </Typography>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => handleSettingsChange({
                        quietHours: { ...settings.quietHours, end: e.target.value }
                      })}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            {t('common.close', 'إغلاق')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
