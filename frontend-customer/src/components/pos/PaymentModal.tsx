import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalAtm as CashIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Smartphone as WalletIcon,
  Schedule as CreditIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Backspace as BackspaceIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Cart, Payment, PaymentMethod } from '@/services/pos';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  cart: Cart;
  onComplete: (payments: Payment[], printReceipt: boolean) => Promise<void>;
  isProcessing: boolean;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', nameAr: 'نقداً', icon: 'cash', type: 'cash', isActive: true },
  { id: 'card', name: 'Card', nameAr: 'بطاقة', icon: 'card', type: 'card', isActive: true },
  { id: 'bank', name: 'Bank Transfer', nameAr: 'تحويل بنكي', icon: 'bank', type: 'bank_transfer', isActive: true },
  { id: 'wallet', name: 'Digital Wallet', nameAr: 'محفظة إلكترونية', icon: 'wallet', type: 'digital_wallet', isActive: true },
  { id: 'credit', name: 'Credit', nameAr: 'آجل', icon: 'credit', type: 'credit', isActive: true },
];

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  cart,
  onComplete,
  isProcessing,
}) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]!);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [printReceipt, setPrintReceipt] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Calculate totals
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const remaining = useMemo(() => cart.grandTotal - totalPaid, [cart.grandTotal, totalPaid]);
  const change = useMemo(() => Math.max(0, totalPaid - cart.grandTotal), [totalPaid, cart.grandTotal]);

  // Reset state when modal opens - use requestAnimationFrame to avoid sync setState in effect
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        setPayments([]);
        setSelectedMethod(PAYMENT_METHODS[0]!);
        setInputAmount('');
        setReference('');
        setError(null);
        setIsComplete(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Auto-fill exact amount for convenience
  useEffect(() => {
    if (open && payments.length === 0 && remaining > 0) {
      const id = requestAnimationFrame(() => setInputAmount(remaining.toString()));
      return () => cancelAnimationFrame(id);
    }
  }, [open, remaining, payments.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <CashIcon />;
      case 'card':
        return <CardIcon />;
      case 'bank_transfer':
        return <BankIcon />;
      case 'digital_wallet':
        return <WalletIcon />;
      case 'credit':
        return <CreditIcon />;
      default:
        return <CashIcon />;
    }
  };

  const handleNumpadClick = (value: string) => {
    if (value === 'clear') {
      setInputAmount('');
    } else if (value === 'backspace') {
      setInputAmount((prev) => prev.slice(0, -1));
    } else if (value === '.') {
      if (!inputAmount.includes('.')) {
        setInputAmount((prev) => prev + '.');
      }
    } else {
      setInputAmount((prev) => prev + value);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setInputAmount(amount.toString());
  };

  const handleExactAmount = () => {
    setInputAmount(remaining.toString());
  };

  const handleAddPayment = () => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      setError(t('pos.payment.invalidAmount', 'أدخل مبلغ صحيح'));
      return;
    }

    // For credit payments, must have customer
    if (selectedMethod.type === 'credit' && !cart.customerId) {
      setError(t('pos.payment.customerRequired', 'يجب اختيار عميل للدفع الآجل'));
      return;
    }

    const payment: Payment = {
      methodId: selectedMethod.id,
      methodType: selectedMethod.type,
      amount,
      ...(reference ? { reference } : {}),
    };

    setPayments((prev) => [...prev, payment]);
    setInputAmount('');
    setReference('');
    setError(null);
  };

  const handleRemovePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (remaining > 0.01) { // Allow small floating point differences
      setError(t('pos.payment.insufficientPayment', 'المبلغ المدفوع أقل من الإجمالي'));
      return;
    }

    try {
      await onComplete(payments, printReceipt);
      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pos.payment.error', 'حدث خطأ أثناء معالجة الدفع'));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: 700 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('pos.payment.title', 'الدفع')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isProcessing}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {isComplete ? (
          // Success State
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 4,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {t('pos.payment.success', 'تمت العملية بنجاح!')}
            </Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 3 }}>
              {formatCurrency(cart.grandTotal)}
            </Typography>

            {change > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: 'warning.light',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {t('pos.payment.changeLabel', 'الباقي')}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                  {formatCurrency(change)}
                </Typography>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => {}}>
                {t('pos.payment.printReceipt', 'طباعة الإيصال')}
              </Button>
              <Button variant="outlined" startIcon={<EmailIcon />} onClick={() => {}}>
                {t('pos.payment.emailReceipt', 'إرسال بالبريد')}
              </Button>
              <Button variant="contained" onClick={onClose} sx={{ px: 4 }}>
                {t('pos.payment.newSale', 'عملية جديدة')}
              </Button>
            </Box>
          </Box>
        ) : (
          // Payment Form
          <Grid container sx={{ height: '100%' }}>
            {/* Left Side - Payment Methods & Numpad */}
            <Grid size={{ xs: 12, md: 7 }} sx={{ p: 2, borderLeft: 1, borderColor: 'divider' }}>
              {/* Payment Methods */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t('pos.payment.selectMethod', 'اختر طريقة الدفع')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                {PAYMENT_METHODS.map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedMethod.id === method.id ? 'contained' : 'outlined'}
                    startIcon={getMethodIcon(method.type)}
                    onClick={() => setSelectedMethod(method)}
                    sx={{ minWidth: 120 }}
                  >
                    {method.nameAr}
                  </Button>
                ))}
              </Box>

              {/* Amount Display */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: 'grey.50',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('pos.payment.enterAmount', 'أدخل المبلغ')}
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: inputAmount ? 'primary.main' : 'grey.400',
                  }}
                >
                  {inputAmount || '0'} <small style={{ fontSize: '0.5em' }}>ر.ي</small>
                </Typography>
              </Paper>

              {/* Quick Amounts */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" size="small" onClick={handleExactAmount} color="success">
                  {t('pos.payment.exact', 'المبلغ الصحيح')}
                </Button>
                {QUICK_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickAmount(amount)}
                  >
                    {amount.toLocaleString()}
                  </Button>
                ))}
              </Box>

              {/* Numpad */}
              <Grid container spacing={1}>
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'].map((num) => (
                  <Grid key={num} size={{ xs: 4 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleNumpadClick(num)}
                      sx={{
                        py: 2,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}
                    >
                      {num}
                    </Button>
                  </Grid>
                ))}
                <Grid size={{ xs: 4 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    onClick={() => handleNumpadClick('backspace')}
                    sx={{ py: 2 }}
                  >
                    <BackspaceIcon />
                  </Button>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleAddPayment}
                    disabled={!inputAmount || parseFloat(inputAmount) <= 0}
                    sx={{ py: 2, fontSize: '1.1rem', fontWeight: 700 }}
                  >
                    {t('pos.payment.addPayment', 'إضافة دفعة')}
                  </Button>
                </Grid>
              </Grid>

              {/* Reference Field (for non-cash) */}
              {selectedMethod.type !== 'cash' && (
                <TextField
                  fullWidth
                  label={t('pos.payment.reference', 'رقم المرجع / الإيصال')}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  sx={{ mt: 2 }}
                  size="small"
                />
              )}
            </Grid>

            {/* Right Side - Summary */}
            <Grid size={{ xs: 12, md: 5 }} sx={{ bgcolor: 'grey.50', p: 2, display: 'flex', flexDirection: 'column' }}>
              {/* Invoice Summary */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                  {t('pos.payment.invoiceSummary', 'ملخص الفاتورة')}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('pos.payment.items', 'عدد المنتجات')}</Typography>
                  <Typography variant="body2">{cart.items.length}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('pos.subtotal', 'المجموع الفرعي')}</Typography>
                  <Typography variant="body2">{formatCurrency(cart.subtotal)}</Typography>
                </Box>

                {cart.totalDiscount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="success.main">{t('pos.discount', 'الخصم')}</Typography>
                    <Typography variant="body2" color="success.main">-{formatCurrency(cart.totalDiscount)}</Typography>
                  </Box>
                )}

                {cart.totalTax > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{t('pos.tax', 'الضريبة')}</Typography>
                    <Typography variant="body2">{formatCurrency(cart.totalTax)}</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('pos.total', 'الإجمالي')}</Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    {formatCurrency(cart.grandTotal)}
                  </Typography>
                </Box>
              </Paper>

              {/* Payments List */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                  {t('pos.payment.payments', 'المدفوعات')}
                </Typography>

                {payments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    {t('pos.payment.noPayments', 'لم تتم إضافة مدفوعات بعد')}
                  </Typography>
                ) : (
                  <Box>
                    {payments.map((payment, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getMethodIcon(payment.methodType)}
                          <Typography variant="body2">
                            {PAYMENT_METHODS.find((m) => m.id === payment.methodId)?.nameAr}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                          <IconButton size="small" onClick={() => handleRemovePayment(index)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>

              {/* Payment Status */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: remaining <= 0 ? 'success.light' : 'warning.light',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{t('pos.payment.paid', 'المدفوع')}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalPaid)}
                  </Typography>
                </Box>

                {remaining > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="warning.dark">{t('pos.payment.remaining', 'المتبقي')}</Typography>
                    <Typography variant="h6" color="warning.dark" sx={{ fontWeight: 700 }}>
                      {formatCurrency(remaining)}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" color="success.dark">{t('pos.payment.change', 'الباقي')}</Typography>
                    <Typography variant="h6" color="success.dark" sx={{ fontWeight: 700 }}>
                      {formatCurrency(change)}
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Error Message */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {/* Print Receipt Option */}
              <Button
                variant={printReceipt ? 'contained' : 'outlined'}
                startIcon={<PrintIcon />}
                onClick={() => setPrintReceipt(!printReceipt)}
                sx={{ mb: 2 }}
                color={printReceipt ? 'primary' : 'inherit'}
              >
                {printReceipt
                  ? t('pos.payment.printEnabled', 'طباعة الإيصال ✓')
                  : t('pos.payment.printDisabled', 'بدون طباعة')}
              </Button>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      {!isComplete && (
        <>
          <Divider />
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Button onClick={onClose} disabled={isProcessing}>
              {t('common.cancel', 'إلغاء')}
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleComplete}
              disabled={isProcessing || remaining > 0.01}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              sx={{ minWidth: 200, py: 1.5, fontWeight: 700 }}
            >
              {isProcessing
                ? t('pos.payment.processing', 'جاري المعالجة...')
                : t('pos.payment.complete', 'إتمام العملية')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default PaymentModal;
