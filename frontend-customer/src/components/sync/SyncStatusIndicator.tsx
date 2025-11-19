import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Tooltip,
  Popover,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
} from '@mui/material';
import {
  Sync as SyncIcon,
  SyncProblem as SyncProblemIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSync } from '../../contexts/SyncContext';
import { useTranslation } from 'react-i18next';

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  compact = false,
  showDetails = true,
}) => {
  const { t } = useTranslation();
  const { syncStats, webSocketStats, performSync, connectWebSocket, disconnectWebSocket } = useSync();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (showDetails) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await performSync();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleWebSocketToggle = () => {
    if (webSocketStats?.isConnected) {
      disconnectWebSocket();
    } else {
      connectWebSocket();
    }
  };

  const getSyncStatus = () => {
    if (!syncStats) return { status: 'unknown', icon: SyncProblemIcon, color: 'default' as const };

    if (syncStats.isSyncing) {
      return { status: 'syncing', icon: SyncIcon, color: 'primary' as const };
    }

    if (!syncStats.isOnline) {
      return { status: 'offline', icon: CloudOffIcon, color: 'error' as const };
    }

    const timeSinceLastSync = syncStats.lastSyncTime
      ? Date.now() - syncStats.lastSyncTime.getTime()
      : Infinity;

    if (timeSinceLastSync < 30000) { // أقل من 30 ثانية
      return { status: 'synced', icon: CloudDoneIcon, color: 'success' as const };
    } else if (timeSinceLastSync < 300000) { // أقل من 5 دقائق
      return { status: 'recent', icon: ScheduleIcon, color: 'warning' as const };
    } else {
      return { status: 'stale', icon: SyncProblemIcon, color: 'warning' as const };
    }
  };

  const getWebSocketStatus = () => {
    if (!webSocketStats) return { status: 'unknown', icon: WifiOffIcon, color: 'default' as const };

    if (webSocketStats.isConnected) {
      return { status: 'connected', icon: WifiIcon, color: 'success' as const };
    }

    if (webSocketStats.reconnectAttempts > 0) {
      return { status: 'reconnecting', icon: WifiOffIcon, color: 'warning' as const };
    }

    return { status: 'disconnected', icon: WifiOffIcon, color: 'error' as const };
  };

  const syncStatus = getSyncStatus();
  const wsStatus = getWebSocketStatus();

  const hasIssues = syncStatus.status === 'offline' || syncStatus.status === 'stale' ||
                   !wsStatus.status.includes('connected');

  const pendingOperations = syncStats?.pendingOperations || 0;

  if (compact) {
    return (
      <IconButton color="inherit" size="small">
        <Badge
          badgeContent={hasIssues ? '!' : null}
          color="error"
          variant="dot"
          invisible={!hasIssues}
        >
          <syncStatus.icon color={hasIssues ? 'error' : 'inherit'} />
        </Badge>
      </IconButton>
    );
  }

  return (
    <>
      <Tooltip title={t('sync.status.title', 'حالة المزامنة')}>
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{
            position: 'relative',
            '& .MuiBadge-badge': {
              backgroundColor: hasIssues ? '#f44336' : '#4caf50',
            },
          }}
        >
          <Badge
            badgeContent={pendingOperations > 0 ? pendingOperations : null}
            color="primary"
            max={99}
          >
            <Box sx={{ position: 'relative' }}>
              <syncStatus.icon
                color={hasIssues ? 'error' : 'inherit'}
                sx={{
                  animation: syncStats?.isSyncing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              {!wsStatus.status.includes('connected') && (
                <WifiOffIcon
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    fontSize: 12,
                    color: 'error.main',
                    backgroundColor: 'background.paper',
                    borderRadius: '50%',
                    padding: 0.2,
                  }}
                />
              )}
            </Box>
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>
            {t('sync.status.details', 'تفاصيل المزامنة')}
          </Typography>

          {/* حالة المزامنة */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <syncStatus.icon color={syncStatus.color} fontSize="small" />
              <Typography variant="subtitle2">
                {t('sync.status.sync', 'المزامنة')}
              </Typography>
              <Chip
                label={t(`sync.status.${syncStatus.status}`, syncStatus.status)}
                size="small"
                color={syncStatus.color}
                variant="outlined"
              />
            </Box>

            {syncStats?.isSyncing && (
              <Box sx={{ mb: 1 }}>
                <LinearProgress size="small" />
                <Typography variant="caption" color="text.secondary">
                  {t('sync.status.syncing', 'جاري المزامنة...')}
                </Typography>
              </Box>
            )}

            <List dense>
              <ListItem>
                <ListItemIcon>
                  {syncStats?.isOnline ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary={t('sync.status.online', 'متصل بالإنترنت')}
                  secondary={syncStats?.isOnline ?
                    t('sync.status.online_desc', 'التطبيق متصل بالخادم') :
                    t('sync.status.offline_desc', 'التطبيق غير متصل بالخادم')
                  }
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('sync.status.last_sync', 'آخر مزامنة')}
                  secondary={
                    syncStats?.lastSyncTime
                      ? new Intl.RelativeTimeFormat('ar', { numeric: 'auto' }).format(
                          Math.floor((syncStats.lastSyncTime.getTime() - Date.now()) / (1000 * 60)),
                          'minute'
                        )
                      : t('sync.status.never', 'لم تتم المزامنة بعد')
                  }
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <SyncIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('sync.status.pending', 'العمليات المعلقة')}
                  secondary={`${pendingOperations} ${t('sync.status.operations', 'عملية')}`}
                />
              </ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* حالة WebSocket */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <wsStatus.icon color={wsStatus.color} fontSize="small" />
              <Typography variant="subtitle2">
                {t('sync.status.websocket', 'الاتصال الفوري')}
              </Typography>
              <Chip
                label={t(`sync.status.ws.${wsStatus.status}`, wsStatus.status)}
                size="small"
                color={wsStatus.color}
                variant="outlined"
              />
            </Box>

            <List dense>
              <ListItem>
                <ListItemIcon>
                  {wsStatus.status.includes('connected') ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary={t('sync.status.realtime', 'التحديثات الفورية')}
                  secondary={
                    wsStatus.status.includes('connected')
                      ? t('sync.status.realtime_enabled', 'مفعل - ستتلقى التحديثات فوراً')
                      : t('sync.status.realtime_disabled', 'معطل - لن تتلقى التحديثات فوراً')
                  }
                />
              </ListItem>

              {webSocketStats?.lastConnected && (
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('sync.status.last_connection', 'آخر اتصال')}
                    secondary={
                      new Intl.RelativeTimeFormat('ar', { numeric: 'auto' }).format(
                        Math.floor((webSocketStats.lastConnected.getTime() - Date.now()) / (1000 * 60)),
                        'minute'
                      )
                    }
                  />
                </ListItem>
              )}

              {webSocketStats?.reconnectAttempts > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <ErrorIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('sync.status.reconnect_attempts', 'محاولات إعادة الاتصال')}
                    secondary={`${webSocketStats.reconnectAttempts} ${t('sync.status.attempts', 'محاولة')}`}
                  />
                </ListItem>
              )}
            </List>
          </Box>

          {/* رسائل الخطأ */}
          {hasIssues && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('sync.status.issues_detected', 'تم اكتشاف مشاكل في المزامنة')}
            </Alert>
          )}

          {/* أزرار التحكم */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleManualSync}
              disabled={isRefreshing || !syncStats?.isOnline}
              variant="outlined"
            >
              {t('sync.status.manual_sync', 'مزامنة يدوية')}
            </Button>

            <Button
              size="small"
              startIcon={wsStatus.status.includes('connected') ? <WifiOffIcon /> : <WifiIcon />}
              onClick={handleWebSocketToggle}
              variant="outlined"
            >
              {wsStatus.status.includes('connected')
                ? t('sync.status.disconnect_ws', 'قطع WebSocket')
                : t('sync.status.connect_ws', 'اتصال WebSocket')
              }
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};