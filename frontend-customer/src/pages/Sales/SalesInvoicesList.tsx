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
  Print as PrintIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSalesInvoices } from '@/services/sales';
import type { SalesFilters } from '@/services/sales';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SalesInvoicesList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  const [filters, setFilters] = useState<SalesFilters>({
    limit: 20,
    page: 1,
  });

  const {
    data: invoicesResponse,
    isLoading,
    error,
    refetch,
  } = useSalesInvoices(filters);

  const handleFilterChange = (newFilters: Partial<SalesFilters>) => {
    setFilters(prev => {
      const updated: SalesFilters = { ...prev };
      // Update properties, removing undefined/empty values
      if ('status' in newFilters) {
        if (newFilters.status) {
          updated.status = newFilters.status;
        } else {
          delete updated.status;
        }
      }
      if ('paymentStatus' in newFilters) {
        if (newFilters.paymentStatus) {
          updated.paymentStatus = newFilters.paymentStatus;
        } else {
          delete updated.paymentStatus;
        }
      }
      if ('page' in newFilters && newFilters.page !== undefined) {
        updated.page = newFilters.page;
      }
      if ('limit' in newFilters && newFilters.limit !== undefined) {
        updated.limit = newFilters.limit;
      }
      return updated;
    });
  };

  const handlePageChange = (_: unknown, page: number) => {
    handleFilterChange({ page: page + 1 });
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange({ limit: parseInt(e.target.value, 10), page: 1 });
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

  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'draft':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'pending':
        return 'error';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'draft':
        return t('sales.invoice.status.draft', 'مسودة');
      case 'confirmed':
        return t('sales.invoice.status.confirmed', 'مؤكدة');
      case 'cancelled':
        return t('sales.invoice.status.cancelled', 'ملغية');
      case 'refunded':
        return t('sales.invoice.status.refunded', 'مستردة');
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return t('sales.invoice.paymentStatus.pending', 'معلق');
      case 'partial':
        return t('sales.invoice.paymentStatus.partial', 'جزئي');
      case 'paid':
        return t('sales.invoice.paymentStatus.paid', 'مدفوع');
      case 'refunded':
        return t('sales.invoice.paymentStatus.refunded', 'مسترد');
      default:
        return status;
    }
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
          {t('sales.errors.loadFailed', 'خطأ في تحميل الفواتير')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.actions.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  const invoices = invoicesResponse?.data?.data || [];
  const pagination = invoicesResponse?.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('sales.invoices.title', 'فواتير المبيعات')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sales/invoices/new')}
          >
            {t('sales.invoices.newInvoice', 'فاتورة جديدة')}
          </Button>
          <Tooltip title={t('common.actions.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('sales.filters.title', 'الفلاتر')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              label={t('sales.filters.status', 'الحالة')}
              value={filters.status || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange(value ? { status: value } : {});
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="">
                <em>{t('sales.filters.allStatuses', 'جميع الحالات')}</em>
              </MenuItem>
              <MenuItem value="draft">{t('sales.invoice.status.draft', 'مسودة')}</MenuItem>
              <MenuItem value="confirmed">{t('sales.invoice.status.confirmed', 'مؤكدة')}</MenuItem>
              <MenuItem value="cancelled">{t('sales.invoice.status.cancelled', 'ملغية')}</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              label={t('sales.filters.paymentStatus', 'حالة الدفع')}
              value={filters.paymentStatus || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange(value ? { paymentStatus: value } : {});
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="">
                <em>{t('sales.filters.allPaymentStatuses', 'جميع حالات الدفع')}</em>
              </MenuItem>
              <MenuItem value="pending">{t('sales.invoice.paymentStatus.pending', 'معلق')}</MenuItem>
              <MenuItem value="partial">{t('sales.invoice.paymentStatus.partial', 'جزئي')}</MenuItem>
              <MenuItem value="paid">{t('sales.invoice.paymentStatus.paid', 'مدفوع')}</MenuItem>
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
                <TableCell>{t('sales.invoices.table.invoiceNumber', 'رقم الفاتورة')}</TableCell>
                <TableCell>{t('sales.invoices.table.date', 'التاريخ')}</TableCell>
                <TableCell>{t('sales.invoices.table.customer', 'العميل')}</TableCell>
                <TableCell align="right">{t('sales.invoices.table.totalAmount', 'المبلغ الإجمالي')}</TableCell>
                <TableCell align="center">{t('sales.invoices.table.status', 'الحالة')}</TableCell>
                <TableCell align="center">{t('sales.invoices.table.paymentStatus', 'حالة الدفع')}</TableCell>
                <TableCell align="center">{t('sales.invoices.table.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('sales.invoices.noInvoices', 'لا توجد فواتير')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                      >
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(invoice.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {invoice.customer?.name || t('sales.invoices.unknownCustomer', 'عميل غير محدد')}
                      </Typography>
                    </TableCell>
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
                        variant="outlined"
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
                      <Tooltip title={t('common.actions.view', 'عرض')}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.actions.print', 'طباعة')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            // TODO: Implement print functionality
                            window.open(`/sales/invoices/${invoice.id}/print`, '_blank');
                          }}
                          color="default"
                        >
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
            count={pagination.total || 0}
            page={(pagination.page || 1) - 1}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.limit || 20}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage={t('table.rowsPerPage', 'عدد الصفوف في الصفحة:')}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} ${t('table.of', 'من')} ${count}`
            }
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        )}
      </Paper>
    </Box>
  );
};

export default SalesInvoicesList;
