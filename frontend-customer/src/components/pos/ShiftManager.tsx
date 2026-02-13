import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  AccessTime as TimeIcon,
  LocalAtm as CashIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { differenceInHours, differenceInMinutes } from 'date-fns';

import type { POSShift } from '@/services/pos';

interface ShiftManagerProps {
  currentShift: POSShift | null;
  isLoadingShift: boolean;
  onOpenShift: (openingCash: number) => Promise<void>;
  onCloseShift: (closingCash: number, notes?: string) => Promise<void>;
  isOpeningShift: boolean;
  isClosingShift: boolean;
}

const ShiftManager: React.FC<ShiftManagerProps> = ({
  currentShift,
  isLoadingShift,
  onOpenShift,
  onCloseShift,
  isOpeningShift,
  isClosingShift,
}) => {
  const { t } = useTranslation();
  const [openDialogType, setOpenDialogType] = useState<'open' | 'close' | null>(null);
  const [openingCash, setOpeningCash] = useState<string>('0');
  const [closingCash, setClosingCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const hours = differenceInHours(now, start);
    const minutes = differenceInMinutes(now, start) % 60;
    return `${hours} ساعة ${minutes} دقيقة`;
  };

  const handleOpenShift = async () => {
    const cash = parseFloat(openingCash);
    if (isNaN(cash) || cash < 0) {
      setError(t('pos.shift.invalidCash', 'أدخل مبلغ صحيح'));
      return;
    }

    try {
      await onOpenShift(cash);
      setOpenDialogType(null);
      setOpeningCash('0');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pos.shift.openError', 'خطأ في فتح الوردية'));
    }
  };

  const handleCloseShift = async () => {
    const cash = parseFloat(closingCash);
    if (isNaN(cash) || cash < 0) {
      setError(t('pos.shift.invalidCash', 'أدخل مبلغ صحيح'));
      return;
    }

    try {
      await onCloseShift(cash, notes || undefined);
      setOpenDialogType(null);
      setClosingCash('');
      setNotes('');
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('pos.shift.closeError', 'خطأ في إغلاق الوردية')
      );
    }
  };

  if (isLoadingShift) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">{t('pos.shift.loading', 'جاري التحميل...')}</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Shift Status Display */}
      {currentShift ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: 'success.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckIcon color="success" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('pos.shift.active', 'وردية نشطة')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <TimeIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                {formatDuration(currentShift.startTime)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary">
                {t('pos.shift.sales', 'المبيعات')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {formatCurrency(currentShift.totalSales)}
              </Typography>
            </Box>

            <Chip
              label={`${currentShift.totalTransactions} ${t('pos.shift.transactions', 'عملية')}`}
              size="small"
              color="primary"
            />

            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={() => setOpenDialogType('close')}
              size="small"
            >
              {t('pos.shift.close', 'إغلاق الوردية')}
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            bgcolor: 'warning.light',
            textAlign: 'center',
          }}
        >
          <WarningIcon sx={{ fontSize: 48, color: 'warning.dark', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {t('pos.shift.noActiveShift', 'لا توجد وردية نشطة')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('pos.shift.openShiftHint', 'يجب فتح وردية جديدة للبدء في البيع')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<StartIcon />}
            onClick={() => setOpenDialogType('open')}
            size="large"
          >
            {t('pos.shift.open', 'فتح وردية جديدة')}
          </Button>
        </Paper>
      )}

      {/* Open Shift Dialog */}
      <Dialog
        open={openDialogType === 'open'}
        onClose={() => setOpenDialogType(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StartIcon color="primary" />
            <Typography variant="h6">{t('pos.shift.openTitle', 'فتح وردية جديدة')}</Typography>
          </Box>
          <IconButton onClick={() => setOpenDialogType(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t(
                'pos.shift.openingCashHint',
                'أدخل المبلغ النقدي الموجود في الدرج عند بداية الوردية'
              )}
            </Typography>

            <TextField
              fullWidth
              label={t('pos.shift.openingCash', 'النقد الافتتاحي')}
              type="number"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              InputProps={{
                startAdornment: <CashIcon color="action" sx={{ mr: 1 }} />,
                endAdornment: <Typography color="text.secondary">ر.ي</Typography>,
              }}
              sx={{ mb: 2 }}
            />

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialogType(null)}>{t('common.cancel', 'إلغاء')}</Button>
          <Button
            variant="contained"
            onClick={handleOpenShift}
            disabled={isOpeningShift}
            startIcon={isOpeningShift ? <CircularProgress size={20} /> : <StartIcon />}
          >
            {isOpeningShift
              ? t('pos.shift.opening', 'جاري الفتح...')
              : t('pos.shift.open', 'فتح الوردية')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog
        open={openDialogType === 'close'}
        onClose={() => setOpenDialogType(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StopIcon color="error" />
            <Typography variant="h6">{t('pos.shift.closeTitle', 'إغلاق الوردية')}</Typography>
          </Box>
          <IconButton onClick={() => setOpenDialogType(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent>
          {currentShift && (
            <Box sx={{ py: 2 }}>
              {/* Shift Summary */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                  {t('pos.shift.summary', 'ملخص الوردية')}
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('pos.shift.duration', 'مدة الوردية')}
                      secondary={formatDuration(currentShift.startTime)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CashIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('pos.shift.openingCash', 'النقد الافتتاحي')}
                      secondary={formatCurrency(currentShift.openingCash)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('pos.shift.totalSales', 'إجمالي المبيعات')}
                      secondary={formatCurrency(currentShift.totalSales)}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <ReceiptIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('pos.shift.transactionCount', 'عدد العمليات')}
                      secondary={currentShift.totalTransactions}
                    />
                  </ListItem>

                  <Divider sx={{ my: 1 }} />

                  <ListItem>
                    <ListItemIcon>
                      <CashIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {t('pos.shift.expectedCash', 'النقد المتوقع')}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                          {formatCurrency(currentShift.expectedCash || 0)}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Paper>

              {/* Closing Cash Input */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('pos.shift.closingCashHint', 'عد النقد الموجود في الدرج وأدخل المبلغ الفعلي')}
              </Typography>

              <TextField
                fullWidth
                label={t('pos.shift.closingCash', 'النقد الفعلي')}
                type="number"
                value={closingCash}
                onChange={e => setClosingCash(e.target.value)}
                InputProps={{
                  startAdornment: <CashIcon color="action" sx={{ mr: 1 }} />,
                  endAdornment: <Typography color="text.secondary">ر.ي</Typography>,
                }}
                sx={{ mb: 2 }}
              />

              {/* Cash Difference Warning */}
              {closingCash && currentShift.expectedCash && (
                <Alert
                  severity={
                    Math.abs(parseFloat(closingCash) - currentShift.expectedCash) < 100
                      ? 'success'
                      : 'warning'
                  }
                  sx={{ mb: 2 }}
                >
                  {t('pos.shift.difference', 'الفرق')}:{' '}
                  <strong>
                    {formatCurrency(
                      parseFloat(closingCash || '0') - (currentShift.expectedCash || 0)
                    )}
                  </strong>
                </Alert>
              )}

              {/* Notes */}
              <TextField
                fullWidth
                label={t('pos.shift.notes', 'ملاحظات (اختياري)')}
                multiline
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button startIcon={<PrintIcon />} onClick={() => {}}>
            {t('pos.shift.printReport', 'طباعة التقرير')}
          </Button>
          <Box>
            <Button onClick={() => setOpenDialogType(null)} sx={{ mr: 1 }}>
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleCloseShift}
              disabled={isClosingShift || !closingCash}
              startIcon={isClosingShift ? <CircularProgress size={20} /> : <StopIcon />}
            >
              {isClosingShift
                ? t('pos.shift.closing', 'جاري الإغلاق...')
                : t('pos.shift.close', 'إغلاق الوردية')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShiftManager;
