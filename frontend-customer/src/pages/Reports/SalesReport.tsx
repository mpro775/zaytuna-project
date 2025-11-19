import React, { useState, useMemo } from 'react';
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
  Card,
  CardContent,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSalesReport, useExportSalesReportToExcel, useExportSalesReportToPDF, downloadBlob } from '@/services/reports';
import type { ReportsFilters } from '@/services/reports';
import { useBranches, useCustomers } from '@/hooks';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SalesReport: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  // Calculate initial dates outside render
  const initialDates = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0]!,
      endDate: today.toISOString().split('T')[0]!,
    };
  }, []);

  const [filters, setFilters] = useState<ReportsFilters>({
    startDate: initialDates.startDate,
    endDate: initialDates.endDate,
  });

  // Fetch branches and customers for filters
  const { branches } = useBranches({ autoFetch: true });
  const { customers } = useCustomers({ autoFetch: true });

  // Sales report query
  const {
    data: salesReport,
    isLoading,
    error,
    refetch,
  } = useSalesReport(filters);

  const exportToExcel = useExportSalesReportToExcel();
  const exportToPDF = useExportSalesReportToPDF();

  const handleFilterChange = (newFilters: Partial<ReportsFilters>) => {
    setFilters(prev => {
      const updated: ReportsFilters = { ...prev };
      // Update properties, removing undefined/empty values
      if ('branchId' in newFilters) {
        if (newFilters.branchId) {
          updated.branchId = newFilters.branchId;
        } else {
          delete updated.branchId;
        }
      }
      if ('customerId' in newFilters) {
        if (newFilters.customerId) {
          updated.customerId = newFilters.customerId;
        } else {
          delete updated.customerId;
        }
      }
      if ('startDate' in newFilters && newFilters.startDate) {
        updated.startDate = newFilters.startDate;
      }
      if ('endDate' in newFilters && newFilters.endDate) {
        updated.endDate = newFilters.endDate;
      }
      return updated;
    });
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportToExcel.mutateAsync(filters);
      downloadBlob(blob, `تقرير-المبيعات-${filters.startDate}-إلى-${filters.endDate}.xlsx`);
    } catch (error) {
      console.error('فشل في تصدير Excel:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await exportToPDF.mutateAsync(filters);
      downloadBlob(blob, `تقرير-المبيعات-${filters.startDate}-إلى-${filters.endDate}.pdf`);
    } catch (error) {
      console.error('فشل في تصدير PDF:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
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
          {t('reports.errors.loadFailed', 'خطأ في تحميل التقرير')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.actions.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('reports.sales.title', 'تقرير المبيعات')}
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('reports.filters.title', 'الفلاتر')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('reports.filters.startDate', 'من تاريخ')}
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label={t('reports.filters.endDate', 'إلى تاريخ')}
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('reports.filters.branch', 'الفرع')}
              value={filters.branchId || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange(value ? { branchId: value } : {});
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="">
                <em>{t('reports.filters.allBranches', 'جميع الفروع')}</em>
              </MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('reports.filters.customer', 'العميل')}
              value={filters.customerId || ''}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange(value ? { customerId: value } : {});
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="">
                <em>{t('reports.filters.allCustomers', 'جميع العملاء')}</em>
              </MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Export Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={exportToExcel.isPending ? <CircularProgress size={20} /> : <ExcelIcon />}
            onClick={handleExportExcel}
            disabled={exportToExcel.isPending}
          >
            {exportToExcel.isPending
              ? t('reports.export.exporting', 'جاري التصدير...')
              : t('reports.export.excel', 'تصدير Excel')}
          </Button>

          <Button
            variant="outlined"
            startIcon={exportToPDF.isPending ? <CircularProgress size={20} /> : <PdfIcon />}
            onClick={handleExportPDF}
            disabled={exportToPDF.isPending}
          >
            {exportToPDF.isPending
              ? t('reports.export.exporting', 'جاري التصدير...')
              : t('reports.export.pdf', 'تصدير PDF')}
          </Button>
        </Box>
      </Paper>

      {salesReport && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('reports.summary.totalSales', 'إجمالي المبيعات')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {salesReport.summary.totalSales}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('reports.summary.totalRevenue', 'إجمالي الإيرادات')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency(salesReport.summary.totalRevenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('reports.summary.averageOrderValue', 'متوسط قيمة الطلب')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {formatCurrency(salesReport.summary.averageOrderValue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('reports.summary.totalInvoices', 'عدد الفواتير')}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {salesReport.summary.totalInvoices}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Selling Products */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.topProducts.title', 'أفضل المنتجات مبيعاً')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('reports.topProducts.product', 'المنتج')}</TableCell>
                    <TableCell align="right">{t('reports.topProducts.quantity', 'الكمية المباعة')}</TableCell>
                    <TableCell align="right">{t('reports.topProducts.revenue', 'الإيرادات')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesReport.summary.topSellingProducts.map((product, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{product.productName}</TableCell>
                      <TableCell align="right">{product.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Sales by Branch */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.byBranch.title', 'المبيعات بالفرع')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('reports.byBranch.branch', 'الفرع')}</TableCell>
                    <TableCell align="right">{t('reports.byBranch.sales', 'المبيعات')}</TableCell>
                    <TableCell align="right">{t('reports.byBranch.revenue', 'الإيرادات')}</TableCell>
                    <TableCell align="right">{t('reports.byBranch.invoices', 'الفواتير')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesReport.byBranch.map((branch, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{branch.branchName}</TableCell>
                      <TableCell align="right">{branch.sales}</TableCell>
                      <TableCell align="right">{formatCurrency(branch.revenue)}</TableCell>
                      <TableCell align="right">{branch.invoices}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Sales by Customer */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.byCustomer.title', 'المبيعات بالعميل')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('reports.byCustomer.customer', 'العميل')}</TableCell>
                    <TableCell align="right">{t('reports.byCustomer.sales', 'المبيعات')}</TableCell>
                    <TableCell align="right">{t('reports.byCustomer.revenue', 'الإيرادات')}</TableCell>
                    <TableCell align="right">{t('reports.byCustomer.invoices', 'الفواتير')}</TableCell>
                    <TableCell align="right">{t('reports.byCustomer.lastPurchase', 'آخر شراء')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesReport.byCustomer.map((customer, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{customer.customerName}</TableCell>
                      <TableCell align="right">{customer.sales}</TableCell>
                      <TableCell align="right">{formatCurrency(customer.revenue)}</TableCell>
                      <TableCell align="right">{customer.invoices}</TableCell>
                      <TableCell align="right">{formatDate(customer.lastPurchase)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Payment Methods */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.paymentMethods.title', 'طرق الدفع')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('reports.paymentMethods.method', 'طريقة الدفع')}</TableCell>
                    <TableCell align="right">{t('reports.paymentMethods.amount', 'المبلغ')}</TableCell>
                    <TableCell align="right">{t('reports.paymentMethods.count', 'العدد')}</TableCell>
                    <TableCell align="right">{t('reports.paymentMethods.percentage', 'النسبة المئوية')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesReport.byPaymentMethod.map((method, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{method.method}</TableCell>
                      <TableCell align="right">{formatCurrency(method.amount)}</TableCell>
                      <TableCell align="right">{method.count}</TableCell>
                      <TableCell align="right">{method.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default SalesReport;
