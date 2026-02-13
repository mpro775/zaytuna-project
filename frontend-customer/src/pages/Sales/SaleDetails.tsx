import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useSalesInvoice,
  useAddPayment,
  useCancelSalesInvoice,
  usePrintInvoice,
} from '@/services/sales';
import type { CreatePaymentDto, SalesInvoice, Payment } from '@/services/sales/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

const SaleDetails: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: invoiceData, isLoading, error } = useSalesInvoice(id ?? '');
  const addPaymentMutation = useAddPayment();
  const cancelMutation = useCancelSalesInvoice();
  const printMutation = usePrintInvoice();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const invoice: SalesInvoice | undefined = invoiceData?.data;
  const totalPaid = invoice?.payments?.reduce((sum: number, p: Payment) => sum + p.amount, 0) ?? 0;
  const remaining = (invoice?.totalAmount ?? 0) - totalPaid;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ar });

  const handleAddPayment = async () => {
    if (!id || paymentAmount <= 0) return;
    try {
      const data: CreatePaymentDto = {
        currencyId: 'YER',
        amount: paymentAmount,
        paymentMethod,
        ...(paymentNotes ? { notes: paymentNotes } : {}),
      };
      await addPaymentMutation.mutateAsync({ invoiceId: id, data });
      toast.success(t('sales.payment.added', 'تم إضافة الدفعة بنجاح'));
      setPaymentDialogOpen(false);
      setPaymentAmount(0);
      setPaymentNotes('');
    } catch {
      toast.error(t('sales.payment.addFailed', 'فشل في إضافة الدفعة'));
    }
  };

  const handleCancelInvoice = async () => {
    if (!id) return;
    if (!window.confirm(t('sales.invoice.cancelConfirm', 'هل أنت متأكد من إلغاء الفاتورة؟')))
      return;
    try {
      await cancelMutation.mutateAsync({ id, reason: 'إلغاء من المستخدم' });
      toast.success(t('sales.invoice.cancelled', 'تم إلغاء الفاتورة'));
      navigate('/sales');
    } catch {
      toast.error(t('sales.invoice.cancelFailed', 'فشل في إلغاء الفاتورة'));
    }
  };

  const handlePrint = async () => {
    if (!id) return;
    try {
      const result = await printMutation.mutateAsync(id);
      const printData = (result as { data?: unknown })?.data ?? result;
      if (printData && typeof printData === 'object') {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(JSON.stringify(printData, null, 2));
          w.print();
        }
      }
    } catch {
      toast.error(t('sales.invoice.printFailed', 'فشل في الطباعة'));
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invoice) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('sales.invoice.notFound', 'الفاتورة غير موجودة')}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/sales')}>
          {t('common.actions.back', 'رجوع')}
        </Button>
      </Box>
    );
  }

  const canCancel = invoice.status === 'draft' || invoice.status === 'confirmed';
  const canAddPayment = remaining > 0 && invoice.status !== 'cancelled';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/sales')}>
          {t('common.actions.back', 'رجوع')}
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canAddPayment && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setPaymentAmount(remaining);
                setPaymentDialogOpen(true);
              }}
            >
              {t('sales.payment.add', 'إضافة دفعة')}
            </Button>
          )}
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            {t('sales.invoice.print', 'طباعة')}
          </Button>
          {canCancel && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancelInvoice}
              disabled={cancelMutation.isPending}
            >
              {t('sales.invoice.cancel', 'إلغاء الفاتورة')}
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {t('sales.invoice.details', 'تفاصيل الفاتورة')} - {invoice.invoiceNumber}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sales.invoice.date', 'التاريخ')}
            </Typography>
            <Typography variant="body1">{formatDate(invoice.createdAt)}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sales.invoice.customer', 'العميل')}
            </Typography>
            <Typography variant="body1">
              {invoice.customer?.name ?? t('sales.invoice.walkIn', 'عميل نقدي')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sales.invoice.status', 'الحالة')}
            </Typography>
            <Box>
              <Chip
                label={invoice.status}
                size="small"
                color={
                  invoice.status === 'confirmed'
                    ? 'success'
                    : invoice.status === 'draft'
                      ? 'warning'
                      : 'default'
                }
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">
              {t('sales.invoice.paymentStatus', 'حالة الدفع')}
            </Typography>
            <Box>
              <Chip
                label={invoice.paymentStatus}
                size="small"
                color={
                  invoice.paymentStatus === 'paid'
                    ? 'success'
                    : invoice.paymentStatus === 'partial'
                      ? 'warning'
                      : 'default'
                }
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('sales.invoice.lines', 'سطور الفاتورة')}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('sales.invoice.product', 'المنتج')}</TableCell>
                <TableCell align="right">{t('sales.invoice.quantity', 'الكمية')}</TableCell>
                <TableCell align="right">{t('sales.invoice.unitPrice', 'سعر الوحدة')}</TableCell>
                <TableCell align="right">{t('sales.invoice.lineTotal', 'الإجمالي')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.lines?.map(
                (
                  line: {
                    id?: string;
                    productVariant?: { name: string };
                    quantity: number;
                    unitPrice: number;
                    lineTotal: number;
                  },
                  idx: number
                ) => (
                  <TableRow key={line.id ?? `line-${idx}`}>
                    <TableCell>{line.productVariant?.name ?? '-'}</TableCell>
                    <TableCell align="right">{line.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(line.unitPrice)}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(line.lineTotal ?? line.quantity * line.unitPrice)}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('sales.invoice.payments', 'المدفوعات')}
        </Typography>
        {invoice.payments?.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('sales.payment.date', 'التاريخ')}</TableCell>
                  <TableCell>{t('sales.payment.method', 'الطريقة')}</TableCell>
                  <TableCell align="right">{t('sales.payment.amount', 'المبلغ')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.payments.map((p: Payment) => (
                  <TableRow key={p.paymentDate + p.amount}>
                    <TableCell>{formatDate(p.paymentDate)}</TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('sales.payment.none', 'لا توجد مدفوعات')}
          </Typography>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
          <Typography variant="body1">
            {t('sales.invoice.total', 'الإجمالي')}: {formatCurrency(invoice.totalAmount)}
          </Typography>
          <Typography variant="body1">
            {t('sales.payment.paid', 'المدفوع')}: {formatCurrency(totalPaid)}
          </Typography>
          <Typography variant="body1" fontWeight={700}>
            {t('sales.payment.remaining', 'المتبقي')}: {formatCurrency(remaining)}
          </Typography>
        </Box>
      </Paper>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('sales.payment.add', 'إضافة دفعة')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="number"
                label={t('sales.payment.amount', 'المبلغ')}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label={t('sales.payment.method', 'طريقة الدفع')}
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="cash">{t('sales.payment.cash', 'نقدي')}</MenuItem>
                <MenuItem value="card">{t('sales.payment.card', 'بطاقة')}</MenuItem>
                <MenuItem value="bank_transfer">
                  {t('sales.payment.bankTransfer', 'تحويل بنكي')}
                </MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('sales.payment.notes', 'ملاحظات')}
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button
            variant="contained"
            onClick={handleAddPayment}
            disabled={addPaymentMutation.isPending || paymentAmount <= 0}
          >
            {addPaymentMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              t('common.actions.save', 'حفظ')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SaleDetails;
