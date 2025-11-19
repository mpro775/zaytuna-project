import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Box, Button, Collapse, IconButton, Typography } from '@mui/material';
import { WifiOff, Close, Refresh } from '@mui/icons-material';
import { pwaService, NetworkStatus } from '../../services/sync';
import { useTranslation } from 'react-i18next';

interface OfflineBannerProps {
  showRetry?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  showRetry = true,
  autoHide = true,
  hideDelay = 5000
}) => {
  const { t } = useTranslation();
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(pwaService.getNetworkStatus());
  const [showBanner, setShowBanner] = useState(!networkStatus.isOnline);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaService.onNetworkChange((status) => {
      setNetworkStatus(status);

      if (!status.isOnline) {
        setShowBanner(true);
        setDismissed(false);
      } else {
        if (autoHide) {
          setTimeout(() => {
            setShowBanner(false);
          }, hideDelay);
        }
      }
    });

    return unsubscribe;
  }, [autoHide, hideDelay]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const getConnectionMessage = (): string => {
    if (!networkStatus.isOnline) {
      return t('offline.no_connection', 'لا يوجد اتصال بالإنترنت');
    }

    if (networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g') {
      return t('offline.slow_connection', 'اتصال بطيء');
    }

    return '';
  };

  const isSlowConnection = networkStatus.effectiveType === 'slow-2g' ||
                          networkStatus.effectiveType === '2g' ||
                          (networkStatus.downlink && networkStatus.downlink < 1);

  if (!showBanner || dismissed || (networkStatus.isOnline && !isSlowConnection)) {
    return null;
  }

  return (
    <Collapse in={showBanner}>
      <Alert
        severity={networkStatus.isOnline ? 'warning' : 'error'}
        icon={<WifiOff />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showRetry && !networkStatus.isOnline && (
              <Button
                size="small"
                color="inherit"
                startIcon={<Refresh />}
                onClick={handleRetry}
              >
                {t('offline.retry', 'إعادة المحاولة')}
              </Button>
            )}
            <IconButton
              size="small"
              color="inherit"
              onClick={handleDismiss}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          boxShadow: 2,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <AlertTitle>
          {networkStatus.isOnline
            ? t('offline.slow_title', 'اتصال بطيء')
            : t('offline.offline_title', 'غير متصل')
          }
        </AlertTitle>

        <Typography variant="body2">
          {getConnectionMessage()}
        </Typography>

        {!networkStatus.isOnline && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('offline.offline_message',
                'يمكنك الاستمرار في العمل. سيتم مزامنة التغييرات عند عودة الاتصال.')}
            </Typography>
          </Box>
        )}

        {networkStatus.isOnline && isSlowConnection && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('offline.slow_message',
                'قد يستغرق تحميل البيانات وقتاً أطول. يُفضل الاتصال بشبكة أسرع لأفضل أداء.')}
            </Typography>
          </Box>
        )}
      </Alert>
    </Collapse>
  );
};
