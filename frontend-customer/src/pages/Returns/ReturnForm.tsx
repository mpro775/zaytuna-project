import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const ReturnForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/returns')}>
          {t('common.back', 'رجوع')}
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('returns.createReturn', 'إنشاء مرتجع جديد')}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('returns.createFromPOS', 'لإنشاء مرتجع، يرجى استخدام نقطة البيع (POS) أو البحث عن الفاتورة الأصلية من صفحة المبيعات.')}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/pos')}>
            {t('returns.goToPOS', 'الذهاب لنقطة البيع')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/sales')}>
            {t('returns.goToSales', 'الذهاب للمبيعات')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ReturnForm;
