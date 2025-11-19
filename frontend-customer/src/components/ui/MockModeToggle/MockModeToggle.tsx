/**
 * Mock Mode Toggle
 * Toggle component for enabling/disabling mock data mode
 */

import React, { useState } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Button,
} from '@mui/material';
import { Warning as WarningIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { isMockModeEnabled, setMockMode } from '@/config/mock.config';

export const MockModeToggle: React.FC = () => {
  const [enabled, setEnabled] = useState(isMockModeEnabled());
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setShowWarning(true);
    setEnabled(newValue);
  };

  const handleConfirm = () => {
    setMockMode(enabled);
    // setMockMode will reload the page
  };

  const handleCancel = () => {
    setEnabled(isMockModeEnabled());
    setShowWarning(false);
  };

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={handleToggle}
            color="warning"
          />
        }
        label={
          <Box>
            <Typography variant="body1" fontWeight={500}>
              تفعيل وضع البيانات الوهمية
            </Typography>
            <Typography variant="caption" color="text.secondary">
              استخدام بيانات وهمية للتجريب والعرض
            </Typography>
          </Box>
        }
      />

      {showWarning && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mt: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleCancel}
              >
                إلغاء
              </Button>
              <Button
                color="inherit"
                size="small"
                onClick={handleConfirm}
                startIcon={<RefreshIcon />}
              >
                تأكيد وإعادة التحميل
              </Button>
            </Box>
          }
        >
          سيتم إعادة تحميل الصفحة لتطبيق التغييرات. جميع التغييرات في البيانات الوهمية محفوظة محلياً.
        </Alert>
      )}

      {enabled && !showWarning && (
        <Alert severity="info" sx={{ mt: 2 }}>
          وضع البيانات الوهمية مفعّل حالياً. جميع الطلبات تستخدم البيانات الوهمية.
        </Alert>
      )}
    </Box>
  );
};

export default MockModeToggle;

