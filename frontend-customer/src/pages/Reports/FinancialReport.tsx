import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
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
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useComprehensiveFinancialReport } from '@/services/reports';

const FinancialReport: React.FC = () => {
  const { t } = useTranslation();

  const [asOfDate, setAsOfDate] = useState<string>(() => new Date().toISOString().split('T')[0]!);

  const {
    data: financialReport,
    isLoading,
    error,
    refetch,
  } = useComprehensiveFinancialReport(asOfDate);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">{t('common.error', 'حدث خطأ')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('reports.financial.title', 'التقرير المالي')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            label={t('reports.financial.asOfDate', 'اعتباراً من')}
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 180 }}
          />
          <Box
            component="span"
            onClick={() => refetch()}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <RefreshIcon />
            <Typography variant="body2">{t('common.actions.refresh', 'تحديث')}</Typography>
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : financialReport ? (
        <>
          {/* Balance Sheet */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.financial.balanceSheet', 'الميزانية العمومية')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('reports.financial.assets', 'الأصول')}
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.currentAssets', 'الأصول المتداولة')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.balanceSheet.assets.currentAssets)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.fixedAssets', 'الأصول الثابتة')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.balanceSheet.assets.fixedAssets)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t('reports.financial.totalAssets', 'إجمالي الأصول')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(financialReport.balanceSheet.assets.totalAssets)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('reports.financial.liabilities', 'الالتزامات')}
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.currentLiabilities', 'التزامات قصيرة الأجل')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              financialReport.balanceSheet.liabilities.currentLiabilities
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.longTermLiabilities', 'التزامات طويلة الأجل')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              financialReport.balanceSheet.liabilities.longTermLiabilities
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t('reports.financial.totalLiabilities', 'إجمالي الالتزامات')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(
                              financialReport.balanceSheet.liabilities.totalLiabilities
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      {t('reports.financial.equity', 'حقوق الملكية')}
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>{t('reports.financial.capital', 'رأس المال')}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.balanceSheet.equity.capital)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.retainedEarnings', 'الأرباح المحتجزة')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.balanceSheet.equity.retainedEarnings)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t('reports.financial.totalEquity', 'إجمالي حقوق الملكية')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(financialReport.balanceSheet.equity.totalEquity)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {t(
                                'reports.financial.totalLiabilitiesAndEquity',
                                'إجمالي الالتزامات وحقوق الملكية'
                              )}
                              :{' '}
                              {formatCurrency(
                                financialReport.balanceSheet.totalLiabilitiesAndEquity
                              )}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Profit & Loss */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.financial.profitLoss', 'قائمة الدخل')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('reports.financial.revenue', 'الإيرادات')}
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.salesRevenue', 'إيرادات المبيعات')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.profitLoss.revenue.salesRevenue)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.otherIncome', 'إيرادات أخرى')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.profitLoss.revenue.otherIncome)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t('reports.financial.totalRevenue', 'إجمالي الإيرادات')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(financialReport.profitLoss.revenue.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('reports.financial.expenses', 'المصروفات')}
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.costOfGoodsSold', 'تكلفة البضاعة المباعة')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.profitLoss.expenses.costOfGoodsSold)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.operatingExpenses', 'المصروفات التشغيلية')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(financialReport.profitLoss.expenses.operatingExpenses)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {t('reports.financial.totalExpenses', 'إجمالي المصروفات')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(financialReport.profitLoss.expenses.totalExpenses)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                            {t('reports.financial.netProfit', 'صافي الربح')}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {formatCurrency(financialReport.profitLoss.netProfit)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.grossMargin', 'هامش الربح الإجمالي')}
                          </TableCell>
                          <TableCell align="right">
                            {financialReport.profitLoss.grossMargin}%
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            {t('reports.financial.netMargin', 'هامش الربح الصافي')}
                          </TableCell>
                          <TableCell align="right">
                            {financialReport.profitLoss.netMargin}%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* Cash Flow */}
          {financialReport.cashFlow && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('reports.financial.cashFlow', 'التدفق النقدي')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('reports.financial.activity', 'النشاط')}</TableCell>
                      <TableCell align="right">{t('reports.financial.amount', 'المبلغ')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {t('reports.financial.operatingActivities', 'الأنشطة التشغيلية')}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(financialReport.cashFlow.operatingActivities)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {t('reports.financial.investingActivities', 'الأنشطة الاستثمارية')}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(financialReport.cashFlow.investingActivities)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {t('reports.financial.financingActivities', 'الأنشطة التمويلية')}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(financialReport.cashFlow.financingActivities)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('reports.financial.netCashFlow', 'صافي التدفق النقدي')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatCurrency(financialReport.cashFlow.netCashFlow)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : null}
    </Box>
  );
};

export default FinancialReport;
