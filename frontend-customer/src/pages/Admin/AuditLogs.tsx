import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  user?: { id: string; username: string };
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AuditFilters {
  search?: string;
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'CREATE',
    entityType: 'SalesInvoice',
    entityId: 'inv-123',
    userId: 'user-1',
    user: { id: 'user-1', username: 'أحمد محمد' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    changes: { status: { old: null, new: 'draft' } },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    action: 'UPDATE',
    entityType: 'Product',
    entityId: 'prod-456',
    userId: 'user-2',
    user: { id: 'user-2', username: 'سارة علي' },
    ipAddress: '192.168.1.101',
    changes: { price: { old: 100, new: 120 }, name: { old: 'منتج أ', new: 'منتج أ - محدث' } },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3',
    action: 'DELETE',
    entityType: 'Customer',
    entityId: 'cust-789',
    userId: 'user-1',
    user: { id: 'user-1', username: 'أحمد محمد' },
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '4',
    action: 'LOGIN',
    entityType: 'User',
    userId: 'user-3',
    user: { id: 'user-3', username: 'محمد خالد' },
    ipAddress: '192.168.1.102',
    metadata: { browser: 'Chrome', os: 'Windows' },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();

  const [filters, setFilters] = useState<AuditFilters>({
    limit: 20,
    page: 1,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (newFilters: Partial<AuditFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (_: unknown, page: number) => {
    setFilters(prev => ({ ...prev, page: page + 1 }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }));
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: ar });
  };

  const getActionColor = (
    action: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> =
      {
        CREATE: 'success',
        UPDATE: 'info',
        DELETE: 'error',
        LOGIN: 'primary',
        LOGOUT: 'default',
        EXPORT: 'warning',
      };
    return colors[action] || 'default';
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      CREATE: t('audit.action.create', 'إنشاء'),
      UPDATE: t('audit.action.update', 'تحديث'),
      DELETE: t('audit.action.delete', 'حذف'),
      LOGIN: t('audit.action.login', 'تسجيل دخول'),
      LOGOUT: t('audit.action.logout', 'تسجيل خروج'),
      EXPORT: t('audit.action.export', 'تصدير'),
      VIEW: t('audit.action.view', 'عرض'),
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (entityType: string): string => {
    const labels: Record<string, string> = {
      User: t('audit.entity.user', 'مستخدم'),
      Product: t('audit.entity.product', 'منتج'),
      Customer: t('audit.entity.customer', 'عميل'),
      SalesInvoice: t('audit.entity.salesInvoice', 'فاتورة مبيعات'),
      PurchaseInvoice: t('audit.entity.purchaseInvoice', 'فاتورة مشتريات'),
      Payment: t('audit.entity.payment', 'دفعة'),
      JournalEntry: t('audit.entity.journalEntry', 'قيد يومية'),
    };
    return labels[entityType] || entityType;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('audit.title', 'سجل المراجعة')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('audit.subtitle', 'تتبع جميع العمليات والتغييرات في النظام')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={t('common.refresh', 'تحديث')}>
            <IconButton onClick={() => setIsLoading(true)} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />}>
            {t('common.export', 'تصدير')}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('common.filters', 'الفلاتر')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              label={t('common.search', 'البحث')}
              value={filters.search || ''}
              onChange={e => handleFilterChange({ search: e.target.value ?? '' })}
              placeholder={t('audit.searchPlaceholder', 'معرف الكيان...')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              select
              label={t('audit.action', 'الإجراء')}
              value={filters.action || ''}
              onChange={e => handleFilterChange({ action: e.target.value ?? '' })}
            >
              <MenuItem value="">{t('common.all', 'الكل')}</MenuItem>
              <MenuItem value="CREATE">{t('audit.action.create', 'إنشاء')}</MenuItem>
              <MenuItem value="UPDATE">{t('audit.action.update', 'تحديث')}</MenuItem>
              <MenuItem value="DELETE">{t('audit.action.delete', 'حذف')}</MenuItem>
              <MenuItem value="LOGIN">{t('audit.action.login', 'تسجيل دخول')}</MenuItem>
              <MenuItem value="LOGOUT">{t('audit.action.logout', 'تسجيل خروج')}</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              select
              label={t('audit.entityType', 'نوع الكيان')}
              value={filters.entityType || ''}
              onChange={e => handleFilterChange({ entityType: e.target.value ?? '' })}
            >
              <MenuItem value="">{t('common.all', 'الكل')}</MenuItem>
              <MenuItem value="User">{t('audit.entity.user', 'مستخدم')}</MenuItem>
              <MenuItem value="Product">{t('audit.entity.product', 'منتج')}</MenuItem>
              <MenuItem value="Customer">{t('audit.entity.customer', 'عميل')}</MenuItem>
              <MenuItem value="SalesInvoice">
                {t('audit.entity.salesInvoice', 'فاتورة مبيعات')}
              </MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label={t('audit.startDate', 'من تاريخ')}
              value={filters.startDate || ''}
              onChange={e => handleFilterChange({ startDate: e.target.value ?? '' })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label={t('audit.endDate', 'إلى تاريخ')}
              value={filters.endDate || ''}
              onChange={e => handleFilterChange({ endDate: e.target.value ?? '' })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Logs Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('audit.timestamp', 'التاريخ والوقت')}</TableCell>
                <TableCell>{t('audit.user', 'المستخدم')}</TableCell>
                <TableCell>{t('audit.action', 'الإجراء')}</TableCell>
                <TableCell>{t('audit.entityType', 'نوع الكيان')}</TableCell>
                <TableCell>{t('audit.entityId', 'معرف الكيان')}</TableCell>
                <TableCell>{t('audit.ipAddress', 'عنوان IP')}</TableCell>
                <TableCell align="center">{t('common.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockAuditLogs.map(log => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2">{formatDate(log.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {log.user?.username || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getActionLabel(log.action)}
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getEntityTypeLabel(log.entityType)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.entityId || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.ipAddress || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('common.viewDetails', 'عرض التفاصيل')}>
                      <IconButton size="small" onClick={() => handleViewDetails(log)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={mockAuditLogs.length}
          page={(filters.page || 1) - 1}
          onPageChange={handlePageChange}
          rowsPerPage={filters.limit || 20}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage={t('table.rowsPerPage', 'عدد الصفوف:')}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} ${t('table.of', 'من')} ${count}`
          }
        />
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('audit.details', 'تفاصيل سجل المراجعة')}</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('audit.timestamp', 'التاريخ والوقت')}
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedLog.createdAt)}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('audit.user', 'المستخدم')}
                  </Typography>
                  <Typography variant="body1">{selectedLog.user?.username || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('audit.action', 'الإجراء')}
                  </Typography>
                  <Box>
                    <Chip
                      label={getActionLabel(selectedLog.action)}
                      color={getActionColor(selectedLog.action)}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('audit.entityType', 'نوع الكيان')}
                  </Typography>
                  <Typography variant="body1">
                    {getEntityTypeLabel(selectedLog.entityType)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('audit.ipAddress', 'عنوان IP')}
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {selectedLog.ipAddress || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('audit.userAgent', 'User Agent')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {selectedLog.userAgent || '-'}
                  </Typography>
                </Grid>
              </Grid>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    {t('audit.changes', 'التغييرات')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>{t('common.close', 'إغلاق')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
