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
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as PostIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useJournalEntries } from '@/services/accounting';
import type { AccountingFilters } from '@/services/accounting/types';

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  sourceModule?: string;
  status: 'draft' | 'posted' | 'reversed';
  isSystem: boolean;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
  createdAt: string;
}

interface JournalEntryLine {
  id: string;
  lineNumber: number;
  debitAccount: { id: string; accountCode: string; name: string };
  creditAccount: { id: string; accountCode: string; name: string };
  amount: number;
  description?: string;
}

const JournalEntries: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<AccountingFilters>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const { data: entriesResponse, isLoading, error, refetch } = useJournalEntries(filters);

  const handleFilterChange = (newFilters: Partial<AccountingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      posted: 'success',
      reversed: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: t('accounting.status.draft', 'مسودة'),
      posted: t('accounting.status.posted', 'مرحّل'),
      reversed: t('accounting.status.reversed', 'معكوس'),
    };
    return labels[status] || status;
  };

  const getSourceModuleLabel = (module?: string): string => {
    if (!module) return '-';
    const labels: Record<string, string> = {
      sales: t('accounting.module.sales', 'المبيعات'),
      purchasing: t('accounting.module.purchasing', 'المشتريات'),
      inventory: t('accounting.module.inventory', 'المخزون'),
      payment: t('accounting.module.payment', 'المدفوعات'),
      manual: t('accounting.module.manual', 'يدوي'),
    };
    return labels[module] || module;
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
          {t('accounting.loadError', 'خطأ في تحميل القيود')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  const entries: JournalEntry[] = entriesResponse?.data || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('accounting.journalEntries.title', 'القيود اليومية')}
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
            onClick={() => navigate('/accounting/journal-entries/new')}
          >
            {t('accounting.journalEntries.create', 'قيد جديد')}
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
              onChange={e => handleFilterChange({ search: e.target.value || '' })}
              placeholder={t('accounting.searchPlaceholder', 'رقم القيد أو الوصف...')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              select
              label={t('common.status', 'الحالة')}
              value={filters.status || ''}
              onChange={e => handleFilterChange({ status: e.target.value || '' })}
            >
              <MenuItem value="">{t('common.all', 'الكل')}</MenuItem>
              <MenuItem value="draft">{t('accounting.status.draft', 'مسودة')}</MenuItem>
              <MenuItem value="posted">{t('accounting.status.posted', 'مرحّل')}</MenuItem>
              <MenuItem value="reversed">{t('accounting.status.reversed', 'معكوس')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label={t('accounting.startDate', 'من تاريخ')}
              value={filters.startDate || ''}
              onChange={e => handleFilterChange({ startDate: e.target.value || '' })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label={t('accounting.endDate', 'إلى تاريخ')}
              value={filters.endDate || ''}
              onChange={e => handleFilterChange({ endDate: e.target.value || '' })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Journal Entries Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40}></TableCell>
                <TableCell>{t('accounting.entryNumber', 'رقم القيد')}</TableCell>
                <TableCell>{t('accounting.entryDate', 'التاريخ')}</TableCell>
                <TableCell>{t('accounting.description', 'البيان')}</TableCell>
                <TableCell>{t('accounting.sourceModule', 'المصدر')}</TableCell>
                <TableCell align="right">{t('accounting.debit', 'مدين')}</TableCell>
                <TableCell align="right">{t('accounting.credit', 'دائن')}</TableCell>
                <TableCell align="center">{t('common.status', 'الحالة')}</TableCell>
                <TableCell align="center">{t('common.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('accounting.noEntries', 'لا توجد قيود')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map(entry => (
                  <React.Fragment key={entry.id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleRowExpand(entry.id)}>
                          {expandedRows.has(entry.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {entry.entryNumber}
                        </Typography>
                        {entry.isSystem && (
                          <Chip
                            label={t('accounting.system', 'نظام')}
                            size="small"
                            color="info"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(entry.entryDate)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {entry.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSourceModuleLabel(entry.sourceModule)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(entry.totalDebit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(entry.totalCredit)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusLabel(entry.status)}
                          color={getStatusColor(entry.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('common.view', 'عرض')}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/accounting/journal-entries/${entry.id}`)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>

                        {entry.status === 'draft' && !entry.isSystem && (
                          <Tooltip title={t('accounting.post', 'ترحيل')}>
                            <IconButton size="small" color="success">
                              <PostIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row - Entry Lines */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 0 }}>
                        <Collapse in={expandedRows.has(entry.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2, px: 4, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              {t('accounting.entryLines', 'سطور القيد')}
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>#</TableCell>
                                  <TableCell>{t('accounting.debitAccount', 'حساب مدين')}</TableCell>
                                  <TableCell>
                                    {t('accounting.creditAccount', 'حساب دائن')}
                                  </TableCell>
                                  <TableCell align="right">
                                    {t('accounting.amount', 'المبلغ')}
                                  </TableCell>
                                  <TableCell>{t('accounting.lineDescription', 'البيان')}</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {entry.lines?.map(line => (
                                  <TableRow key={line.id}>
                                    <TableCell>{line.lineNumber}</TableCell>
                                    <TableCell>
                                      {line.debitAccount?.accountCode} - {line.debitAccount?.name}
                                    </TableCell>
                                    <TableCell>
                                      {line.creditAccount?.accountCode} - {line.creditAccount?.name}
                                    </TableCell>
                                    <TableCell align="right">
                                      {formatCurrency(line.amount)}
                                    </TableCell>
                                    <TableCell>{line.description || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={entries.length}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage={t('table.rowsPerPage', 'عدد الصفوف:')}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} ${t('table.of', 'من')} ${count}`
          }
        />
      </Paper>
    </Box>
  );
};

export default JournalEntries;
