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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  CheckCircle as ConfirmIcon,
  Payment as RefundIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useReturns, type ReturnsFilters, type Return } from '@/services/returns';

const ReturnsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ReturnsFilters>({
    limit: 20,
    page: 1,
  });

  const { data: returnsResponse, isLoading, error, refetch } = useReturns(filters);

  const handleFilterChange = (newFilters: Partial<ReturnsFilters>) => {
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
      draft: 'warning',
      confirmed: 'primary',
      cancelled: 'error',
      refunded: 'success',
    };
    return colors[status] || 'default';
  };

  const getRefundStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
      pending: 'error',
      partial: 'warning',
      refunded: 'success',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: t('returns.status.draft', 'مسودة'),
      confirmed: t('returns.status.confirmed', 'مؤكد'),
      cancelled: t('returns.status.cancelled', 'ملغي'),
      refunded: t('returns.status.refunded', 'مسترد'),
    };
    return labels[status] || status;
  };

  const getRefundStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: t('returns.refundStatus.pending', 'معلق'),
      partial: t('returns.refundStatus.partial', 'جزئي'),
      refunded: t('returns.refundStatus.refunded', 'مسترد'),
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
          {t('returns.loadError', 'خطأ في تحميل المرتجعات')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  const returns: Return[] = returnsResponse?.data?.data || returnsResponse?.data || [];
  const pagination = returnsResponse?.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('returns.title', 'المرتجعات')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('common.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/returns/new')}
          >
            {t('returns.create', 'مرتجع جديد')}
          </Button>
        </Box>
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
              placeholder={t('returns.searchPlaceholder', 'رقم المرتجع أو العميل...')}
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
              <MenuItem value="draft">{t('returns.status.draft', 'مسودة')}</MenuItem>
              <MenuItem value="confirmed">{t('returns.status.confirmed', 'مؤكد')}</MenuItem>
              <MenuItem value="refunded">{t('returns.status.refunded', 'مسترد')}</MenuItem>
              <MenuItem value="cancelled">{t('returns.status.cancelled', 'ملغي')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('returns.refundStatus', 'حالة الاسترداد')}
              value={filters.refundStatus || ''}
              onChange={e => handleFilterChange({ refundStatus: e.target.value ?? '' })}
            >
              <MenuItem value="">{t('common.all', 'الكل')}</MenuItem>
              <MenuItem value="pending">{t('returns.refundStatus.pending', 'معلق')}</MenuItem>
              <MenuItem value="partial">{t('returns.refundStatus.partial', 'جزئي')}</MenuItem>
              <MenuItem value="refunded">{t('returns.refundStatus.refunded', 'مسترد')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Returns Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('returns.returnNumber', 'رقم المرتجع')}</TableCell>
                <TableCell>{t('returns.originalInvoice', 'الفاتورة الأصلية')}</TableCell>
                <TableCell>{t('returns.customer', 'العميل')}</TableCell>
                <TableCell>{t('returns.reason', 'السبب')}</TableCell>
                <TableCell align="right">{t('returns.totalAmount', 'المبلغ')}</TableCell>
                <TableCell align="center">{t('common.status', 'الحالة')}</TableCell>
                <TableCell align="center">{t('returns.refundStatus', 'حالة الاسترداد')}</TableCell>
                <TableCell align="center">{t('common.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('returns.noReturns', 'لا توجد مرتجعات')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                returns.map(ret => (
                  <TableRow key={ret.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {ret.returnNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(ret.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>{ret.salesInvoice?.invoiceNumber || '-'}</TableCell>
                    <TableCell>{ret.customer?.name || '-'}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ret.reason}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(ret.totalAmount, ret.currency?.code)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(ret.status)}
                        color={getStatusColor(ret.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getRefundStatusLabel(ret.refundStatus)}
                        color={getRefundStatusColor(ret.refundStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.view', 'عرض')}>
                        <IconButton size="small" onClick={() => navigate(`/returns/${ret.id}`)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {ret.status === 'draft' && (
                        <Tooltip title={t('returns.confirm', 'تأكيد')}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => navigate(`/returns/${ret.id}/confirm`)}
                          >
                            <ConfirmIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {ret.status === 'confirmed' && ret.refundStatus !== 'refunded' && (
                        <Tooltip title={t('returns.processRefund', 'معالجة الاسترداد')}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/returns/${ret.id}/refund`)}
                          >
                            <RefundIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total || returns.length}
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

export default ReturnsList;
