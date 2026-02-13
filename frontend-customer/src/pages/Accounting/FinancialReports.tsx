import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
} from '@mui/material';
import {
  AccountBalance as BalanceSheetIcon,
  TrendingUp as IncomeStatementIcon,
  Assessment as TrialBalanceIcon,
  Timeline as CashFlowIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ReportType {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const REPORT_TYPES: ReportType[] = [
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    nameAr: 'الميزانية العمومية',
    description: 'عرض المركز المالي للشركة في تاريخ محدد (الأصول، الخصوم، حقوق الملكية)',
    icon: <BalanceSheetIcon sx={{ fontSize: 48 }} />,
    path: '/accounting/reports/balance-sheet',
  },
  {
    id: 'income-statement',
    name: 'Income Statement',
    nameAr: 'قائمة الدخل',
    description: 'عرض الإيرادات والمصروفات وصافي الربح أو الخسارة لفترة محددة',
    icon: <IncomeStatementIcon sx={{ fontSize: 48 }} />,
    path: '/accounting/reports/income-statement',
  },
  {
    id: 'trial-balance',
    name: 'Trial Balance',
    nameAr: 'ميزان المراجعة',
    description: 'عرض أرصدة جميع الحسابات للتحقق من توازن الدفاتر',
    icon: <TrialBalanceIcon sx={{ fontSize: 48 }} />,
    path: '/accounting/reports/trial-balance',
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Statement',
    nameAr: 'قائمة التدفقات النقدية',
    description: 'عرض التدفقات النقدية من الأنشطة التشغيلية والاستثمارية والتمويلية',
    icon: <CashFlowIcon sx={{ fontSize: 48 }} />,
    path: '/accounting/reports/cash-flow',
  },
];

const FinancialReports: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedPeriod, setSelectedPeriod] = useState<string>('current-month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (period) {
      case 'current-month': {
        const start = new Date(year, month, 1).toISOString().split('T')[0] ?? '';
        const end = new Date(year, month + 1, 0).toISOString().split('T')[0] ?? '';
        setStartDate(start);
        setEndDate(end);
        break;
      }
      case 'last-month': {
        const start = new Date(year, month - 1, 1).toISOString().split('T')[0] ?? '';
        const end = new Date(year, month, 0).toISOString().split('T')[0] ?? '';
        setStartDate(start);
        setEndDate(end);
        break;
      }
      case 'current-quarter': {
        const quarterStart = Math.floor(month / 3) * 3;
        const start = new Date(year, quarterStart, 1).toISOString().split('T')[0] ?? '';
        const end = new Date(year, quarterStart + 3, 0).toISOString().split('T')[0] ?? '';
        setStartDate(start);
        setEndDate(end);
        break;
      }
      case 'current-year': {
        const start = new Date(year, 0, 1).toISOString().split('T')[0] ?? '';
        const end = new Date(year, 11, 31).toISOString().split('T')[0] ?? '';
        setStartDate(start);
        setEndDate(end);
        break;
      }
      case 'custom':
        // Keep current dates for custom
        break;
      default:
        break;
    }
  };

  const handleViewReport = (reportPath: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    navigate(`${reportPath}?${params.toString()}`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {t('accounting.reports.title', 'التقارير المالية')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('accounting.reports.description', 'اختر نوع التقرير والفترة الزمنية لعرض التقرير')}
        </Typography>
      </Box>

      {/* Period Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('accounting.reports.selectPeriod', 'اختر الفترة الزمنية')}
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('accounting.reports.period', 'الفترة')}
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
            >
              <MenuItem value="current-month">{t('accounting.reports.currentMonth', 'الشهر الحالي')}</MenuItem>
              <MenuItem value="last-month">{t('accounting.reports.lastMonth', 'الشهر الماضي')}</MenuItem>
              <MenuItem value="current-quarter">{t('accounting.reports.currentQuarter', 'الربع الحالي')}</MenuItem>
              <MenuItem value="current-year">{t('accounting.reports.currentYear', 'السنة الحالية')}</MenuItem>
              <MenuItem value="custom">{t('accounting.reports.custom', 'فترة مخصصة')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label={t('accounting.reports.startDate', 'من تاريخ')}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedPeriod('custom');
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label={t('accounting.reports.endDate', 'إلى تاريخ')}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedPeriod('custom');
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Report Types */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('accounting.reports.availableReports', 'التقارير المتاحة')}
      </Typography>
      <Grid container spacing={3}>
        {REPORT_TYPES.map((report) => (
          <Grid key={report.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {report.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {report.nameAr}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'center', py: 1.5 }}>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => handleViewReport(report.path)}
                >
                  {t('common.view', 'عرض')}
                </Button>
                <Button size="small" startIcon={<DownloadIcon />}>
                  {t('common.download', 'تحميل')}
                </Button>
                <Button size="small" startIcon={<PrintIcon />}>
                  {t('common.print', 'طباعة')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('accounting.reports.quickStats', 'إحصائيات سريعة')}
        </Typography>
        <Alert severity="info">
          {t('accounting.reports.selectPeriodFirst', 'اختر فترة زمنية ثم اختر نوع التقرير لعرض الإحصائيات')}
        </Alert>
      </Paper>
    </Box>
  );
};

export default FinancialReports;
