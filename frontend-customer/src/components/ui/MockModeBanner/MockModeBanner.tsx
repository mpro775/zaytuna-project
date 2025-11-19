/**
 * Mock Mode Banner
 * Displays a banner when mock data mode is enabled
 */

import React from 'react';
import { Box, Alert, AlertTitle, IconButton } from '@mui/material';
import { Close as CloseIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { isMockModeEnabled } from '@/config/mock.config';

export const MockModeBanner: React.FC = () => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = React.useState(false);
  const mockEnabled = isMockModeEnabled();

  if (!mockEnabled || dismissed) {
    return null;
  }

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: 1300 }}>
      <Alert
        severity="warning"
        icon={<WarningIcon />}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setDismissed(true)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          borderRadius: 0,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle>وضع البيانات الوهمية مفعّل</AlertTitle>
        يتم استخدام بيانات وهمية للتجريب. جميع التغييرات محفوظة محلياً ولن تؤثر على البيانات الحقيقية.
      </Alert>
    </Box>
  );
};

export default MockModeBanner;

