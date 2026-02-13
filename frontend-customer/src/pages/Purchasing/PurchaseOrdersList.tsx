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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as ApproveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  usePurchaseOrders,
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
  useDeletePurchaseOrder,
  type PurchasingFilters,
  type PurchaseOrder,
} from '@/services/purchasing';
import toast from 'react-hot-toast';

const PurchaseOrdersList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<PurchasingFilters>({
    limit: 20,
    page: 1,
  });

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: ordersResponse, isLoading, error, refetch } = usePurchaseOrders(filters);
  const approveMutation = useApprovePurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();

  const handleFilterChange = (newFilters: Partial<PurchasingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (_: unknown, page: number) => {
    setFilters(prev => ({ ...prev, page: page + 1 }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }));
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success(t('purchasing.orderApproved', 'تم اعتماد أمر الشراء'));
    } catch {
      toast.error(t('purchasing.approveError', 'خطأ في اعتماد أمر الشراء'));
    }
  };

  const handleCancelClick = (id: string) => {
    setSelectedOrderId(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedOrderId || !cancelReason) return;
    try {
      await cancelMutation.mutateAsync({ id: selectedOrderId, reason: cancelReason });
      toast.success(t('purchasing.orderCancelled', 'تم إلغاء أمر الشراء'));
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedOrderId(null);
    } catch {
      toast.error(t('purchasing.cancelError', 'خطأ في إلغاء أمر الشراء'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('purchasing.confirmDelete', 'هل أنت متأكد من حذف أمر الشراء؟'))) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('purchasing.orderDeleted', 'تم حذف أمر الشراء'));
    } catch {
      toast.error(t('purchasing.deleteError', 'خطأ في حذف أمر الشراء'));
    }
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
        approved: 'info',
        ordered: 'primary',
        received: 'success',
        cancelled: 'error',
      };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: t('purchasing.status.draft', 'مسودة'),
      approved: t('purchasing.status.approved', 'معتمد'),
      ordered: t('purchasing.status.ordered', 'تم الطلب'),
      received: t('purchasing.status.received', 'تم الاستلام'),
      cancelled: t('purchasing.status.cancelled', 'ملغي'),
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
          {t('purchasing.loadError', 'خطأ في تحميل أوامر الشراء')}: {error.message}
        </Alert>
        <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => refetch()}>
          {t('common.retry', 'إعادة المحاولة')}
        </Button>
      </Box>
    );
  }

  const orders: PurchaseOrder[] = ordersResponse?.data?.data || ordersResponse?.data || [];
  const pagination = ordersResponse?.data;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('purchasing.orders.title', 'أوامر الشراء')}
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
            onClick={() => navigate('/purchasing/orders/new')}
          >
            {t('purchasing.orders.create', 'أمر شراء جديد')}
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
              placeholder={t('purchasing.searchPlaceholder', 'رقم الأمر أو المورد...')}
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
              <MenuItem value="approved">{t('purchasing.status.approved', 'معتمد')}</MenuItem>
              <MenuItem value="ordered">{t('purchasing.status.ordered', 'تم الطلب')}</MenuItem>
              <MenuItem value="received">{t('purchasing.status.received', 'تم الاستلام')}</MenuItem>
              <MenuItem value="cancelled">{t('purchasing.status.cancelled', 'ملغي')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('purchasing.orderNumber', 'رقم الأمر')}</TableCell>
                <TableCell>{t('purchasing.supplier', 'المورد')}</TableCell>
                <TableCell>{t('purchasing.warehouse', 'المخزن')}</TableCell>
                <TableCell>{t('purchasing.expectedDate', 'تاريخ التوريد المتوقع')}</TableCell>
                <TableCell>{t('common.status', 'الحالة')}</TableCell>
                <TableCell>{t('purchasing.itemsCount', 'عدد الأصناف')}</TableCell>
                <TableCell align="center">{t('common.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('purchasing.noOrders', 'لا توجد أوامر شراء')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(order.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.supplier?.name || '-'}</TableCell>
                    <TableCell>{order.warehouse?.name || '-'}</TableCell>
                    <TableCell>
                      {order.expectedDate ? formatDate(order.expectedDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{order.lines?.length || 0}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.view', 'عرض')}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/purchasing/orders/${order.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {order.status === 'draft' && (
                        <>
                          <Tooltip title={t('common.edit', 'تحرير')}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/purchasing/orders/${order.id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('purchasing.approve', 'اعتماد')}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(order.id)}
                              disabled={approveMutation.isPending}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('common.delete', 'حذف')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(order.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {['draft', 'approved', 'ordered'].includes(order.status) && (
                        <Tooltip title={t('common.cancel', 'إلغاء')}>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleCancelClick(order.id)}
                          >
                            <CancelIcon />
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
            count={pagination.total || orders.length}
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

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('purchasing.cancelOrder', 'إلغاء أمر الشراء')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('purchasing.cancelReason', 'سبب الإلغاء')}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            multiline
            rows={3}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>{t('common.close', 'إغلاق')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelConfirm}
            disabled={!cancelReason || cancelMutation.isPending}
          >
            {cancelMutation.isPending
              ? t('common.processing', 'جاري...')
              : t('common.confirm', 'تأكيد')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrdersList;
