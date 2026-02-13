import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Receipt as ApplyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useCreditNotes, type CreditNotesFilters, type CreditNote } from '@/services/returns';

const CreditNotesList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<CreditNotesFilters>({
    limit: 20,
    page: 1,
  });

  const { data: creditNotesResponse, isLoading, error, refetch } = useCreditNotes(filters);

  const handleFilterChange = (newFilters: Partial<CreditNotesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (_: unknown, page: number) => {
    setFilters(prev => ({ ...prev, page: page + 1 }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }));
  };

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currencyCode || 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      active: 'success',
      used: 'primary',
      expired: 'warning',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: t('creditNotes.status.active', 'نشط'),
      used: t('creditNotes.status.used', 'مستخدم'),
      expired: t('creditNotes.status.expired', 'منتهي'),
      cancelled: t('creditNotes.status.cancelled', 'ملغي'),
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('creditNotes.loadError', 'خطأ في تحميل إشعارات الدائن')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  const creditNotes: CreditNote[] =
    creditNotesResponse?.data?.data || creditNotesResponse?.data || [];
  const pagination = creditNotesResponse?.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('creditNotes.title', 'إشعارات الدائن')}
        </Typography>
        <Tooltip title={t('common.refresh', 'تحديث')}>
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('common.filters', 'الفلاتر')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('common.search', 'البحث')}
              value={filters.search || ''}
              onChange={e => handleFilterChange({ search: e.target.value ?? '' })}
              placeholder={t('creditNotes.searchPlaceholder', 'رقم الإشعار أو العميل...')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('common.status', 'الحالة')}
              value={filters.status || ''}
              onChange={e => handleFilterChange({ status: e.target.value ?? '' })}
            >
              <MenuItem value="">{t('common.all', 'الكل')}</MenuItem>
              <MenuItem value="active">{t('creditNotes.status.active', 'نشط')}</MenuItem>
              <MenuItem value="used">{t('creditNotes.status.used', 'مستخدم')}</MenuItem>
              <MenuItem value="expired">{t('creditNotes.status.expired', 'منتهي')}</MenuItem>
              <MenuItem value="cancelled">{t('creditNotes.status.cancelled', 'ملغي')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Credit Notes Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('creditNotes.number', 'رقم الإشعار')}</TableCell>
                <TableCell>{t('creditNotes.customer', 'العميل')}</TableCell>
                <TableCell>{t('creditNotes.relatedReturn', 'المرتجع')}</TableCell>
                <TableCell align="right">
                  {t('creditNotes.originalAmount', 'المبلغ الأصلي')}
                </TableCell>
                <TableCell align="right">{t('creditNotes.remainingAmount', 'المتبقي')}</TableCell>
                <TableCell>{t('creditNotes.usage', 'الاستخدام')}</TableCell>
                <TableCell>{t('creditNotes.expiryDate', 'تاريخ الانتهاء')}</TableCell>
                <TableCell align="center">{t('common.status', 'الحالة')}</TableCell>
                <TableCell align="center">{t('common.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {creditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('creditNotes.noCreditNotes', 'لا توجد إشعارات دائن')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                creditNotes.map(note => {
                  const usedPercentage = ((note.amount - note.remainingAmount) / note.amount) * 100;

                  return (
                    <TableRow key={note.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {note.creditNoteNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(note.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>{note.customer?.name || '-'}</TableCell>
                      <TableCell>{note.return?.returnNumber || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatCurrency(note.amount, note.currency?.code)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                          color={note.remainingAmount > 0 ? 'success.main' : 'text.secondary'}
                        >
                          {formatCurrency(note.remainingAmount, note.currency?.code)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={usedPercentage}
                            sx={{ width: 60, height: 6, borderRadius: 1 }}
                          />
                          <Typography variant="caption">{Math.round(usedPercentage)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {note.expiryDate ? (
                          <Typography
                            variant="body2"
                            color={
                              new Date(note.expiryDate) < new Date() ? 'error' : 'text.primary'
                            }
                          >
                            {formatDate(note.expiryDate)}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(note.status)}
                          color={getStatusColor(note.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('common.view', 'عرض')}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/credit-notes/${note.id}`)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>

                        {note.status === 'active' && note.remainingAmount > 0 && (
                          <Tooltip title={t('creditNotes.apply', 'تطبيق على فاتورة')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/credit-notes/${note.id}/apply`)}
                            >
                              <ApplyIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total || creditNotes.length}
            page={(pagination.page || 1) - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.limit || 20}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage={t('table.rowsPerPage', 'عدد الصفوف:')}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} ${t('table.of', 'من')} ${count}`
            }
          />
        )}
      </Paper>
    </Box>
  );
};

export default CreditNotesList;
