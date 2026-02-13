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
  Payment as PaymentIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  usePurchaseInvoices,
  type PurchasingFilters,
  type PurchaseInvoice,
} from '@/services/purchasing';

const PurchaseInvoicesList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<PurchasingFilters>({
    limit: 20,
    page: 1,
  });

  const { data: invoicesResponse, isLoading, error, refetch } = usePurchaseInvoices(filters);

  const handleFilterChange = (newFilters: Partial<PurchasingFilters>) => {
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
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> =
      {
        draft: 'warning',
        received: 'info',
        approved: 'primary',
        paid: 'success',
        cancelled: 'error',
      };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
      pending: 'error',
      partial: 'warning',
      paid: 'success',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: t('purchasing.status.draft', 'مسودة'),
      received: t('purchasing.status.received', 'تم الاستلام'),
      approved: t('purchasing.status.approved', 'معتمدة'),
      paid: t('purchasing.status.paid', 'مدفوعة'),
      cancelled: t('purchasing.status.cancelled', 'ملغية'),
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: t('purchasing.paymentStatus.pending', 'غير مدفوعة'),
      partial: t('purchasing.paymentStatus.partial', 'مدفوعة جزئياً'),
      paid: t('purchasing.paymentStatus.paid', 'مدفوعة'),
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
          {t('purchasing.loadError', 'خطأ في تحميل فواتير المشتريات')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  const invoices: PurchaseInvoice[] = invoicesResponse?.data?.data || invoicesResponse?.data || [];
  const pagination = invoicesResponse?.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('purchasing.invoices.title', 'فواتير المشتريات')}
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
            onClick={() => navigate('/purchasing/invoices/new')}
          >
            {t('purchasing.invoices.create', 'فاتورة مشتريات جديدة')}
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
              placeholder={t('purchasing.searchInvoicePlaceholder', 'رقم الفاتورة أو المورد...')}
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
              <MenuItem value="draft">{t('purchasing.status.draft', 'مسودة')}</MenuItem>
              <MenuItem value="received">{t('purchasing.status.received', 'تم الاستلام')}</MenuItem>
              <MenuItem value="approved">{t('purchasing.status.approved', 'معتمدة')}</MenuItem>
              <MenuItem value="paid">{t('purchasing.status.paid', 'مدفوعة')}</MenuItem>
              <MenuItem value="cancelled">{t('purchasing.status.cancelled', 'ملغية')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('purchasing.paymentStatus', 'حالة الدفع')}
              value={filters.paymentStatus || ''}
              onChange={e => handleFilterChange({ paymentStatus: e.target.value ?? '' })}
            >
              <MenuItem value="">{t('common.all', 'الكل')}</MenuItem>
              <MenuItem value="pending">
                {t('purchasing.paymentStatus.pending', 'غير مدفوعة')}
              </MenuItem>
              <MenuItem value="partial">
                {t('purchasing.paymentStatus.partial', 'مدفوعة جزئياً')}
              </MenuItem>
              <MenuItem value="paid">{t('purchasing.paymentStatus.paid', 'مدفوعة')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('purchasing.invoiceNumber', 'رقم الفاتورة')}</TableCell>
                <TableCell>{t('purchasing.supplier', 'المورد')}</TableCell>
                <TableCell>{t('purchasing.invoiceDate', 'تاريخ الفاتورة')}</TableCell>
                <TableCell>{t('purchasing.dueDate', 'تاريخ الاستحقاق')}</TableCell>
                <TableCell align="right">{t('purchasing.totalAmount', 'الإجمالي')}</TableCell>
                <TableCell align="center">{t('common.status', 'الحالة')}</TableCell>
                <TableCell align="center">{t('purchasing.paymentStatus', 'حالة الدفع')}</TableCell>
                <TableCell align="center">{t('common.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('purchasing.noInvoices', 'لا توجد فواتير مشتريات')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map(invoice => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{invoice.supplier?.name || '-'}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(invoice.totalAmount, invoice.currency?.code)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getPaymentStatusLabel(invoice.paymentStatus)}
                        color={getPaymentStatusColor(invoice.paymentStatus)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.view', 'عرض')}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/purchasing/invoices/${invoice.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {invoice.paymentStatus !== 'paid' && invoice.status === 'approved' && (
                        <Tooltip title={t('purchasing.addPayment', 'إضافة دفعة')}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => navigate(`/purchasing/invoices/${invoice.id}/pay`)}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title={t('common.print', 'طباعة')}>
                        <IconButton size="small">
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
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
            count={pagination.total || invoices.length}
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

export default PurchaseInvoicesList;
