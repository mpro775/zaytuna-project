import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCreateSalesInvoice } from '@/services/sales';
import type { CreateSalesInvoiceDto, CreateSalesInvoiceLineDto } from '@/services/sales/types';
import { useCustomers, useBranches, useWarehouses, useProducts } from '@/hooks';
import toast from 'react-hot-toast';

interface InvoiceLineForm {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

const TAX_RATE = 15;

const SalesInvoiceForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateSalesInvoice();

  const { customers } = useCustomers({ autoFetch: true });
  const { branches } = useBranches({ autoFetch: true });
  const { warehouses } = useWarehouses({ autoFetch: true });
  const { products } = useProducts({ autoFetch: true });

  const [customerId, setCustomerId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lines, setLines] = useState<InvoiceLineForm[]>([]);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<{
    id: string;
    name: string;
    sku: string;
    basePrice: number;
  } | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);

  const customersList = useMemo(() => customers ?? [], [customers]);
  const branchesList = useMemo(() => branches ?? [], [branches]);
  const warehousesList = useMemo(() => warehouses ?? [], [warehouses]);
  const productsList = useMemo(() => products ?? [], [products]);

  const defaultBranchId = useMemo(() => branchesList[0]?.id ?? '', [branchesList]);
  const defaultWarehouseId = useMemo(() => warehousesList[0]?.id ?? '', [warehousesList]);

  const [branchId, setBranchId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');

  const effectiveBranchId = branchId || defaultBranchId;
  const effectiveWarehouseId = warehouseId || defaultWarehouseId;

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    lines.forEach(line => {
      subtotal += line.quantity * line.unitPrice;
      totalDiscount += line.discountAmount * line.quantity;
    });
    const afterDiscount = subtotal - totalDiscount;
    const taxAmount = afterDiscount * (TAX_RATE / 100);
    const totalAmount = afterDiscount + taxAmount;
    return { subtotal, totalDiscount, taxAmount, totalAmount };
  }, [lines]);

  const handleAddLine = () => {
    if (!selectedProductForAdd || addQuantity <= 0) return;
    const existing = lines.find(l => l.productId === selectedProductForAdd.id);
    if (existing) {
      setLines(prev =>
        prev.map(l =>
          l.productId === selectedProductForAdd.id
            ? { ...l, quantity: l.quantity + addQuantity }
            : l
        )
      );
    } else {
      setLines(prev => [
        ...prev,
        {
          productId: selectedProductForAdd.id,
          productName: selectedProductForAdd.name,
          productSku: selectedProductForAdd.sku,
          quantity: addQuantity,
          unitPrice: selectedProductForAdd.basePrice,
          discountAmount: 0,
        },
      ]);
    }
    setSelectedProductForAdd(null);
    setAddQuantity(1);
  };

  const handleRemoveLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: keyof InvoiceLineForm, value: number) => {
    setLines(prev => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const handleSubmit = async (status: 'draft' | 'confirmed') => {
    if (lines.length === 0) {
      toast.error(t('sales.invoice.noLines', 'يجب إضافة صنف واحد على الأقل'));
      return;
    }

    const invoiceLines: CreateSalesInvoiceLineDto[] = lines.map(line => ({
      productVariantId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountAmount: line.discountAmount * line.quantity, // total discount for line
    }));

    const data: CreateSalesInvoiceDto = {
      branchId: effectiveBranchId || 'branch-1',
      warehouseId: effectiveWarehouseId || 'warehouse-1',
      currencyId: 'YER',
      lines: invoiceLines,
      status,
      ...(customerId && { customerId }),
      ...(notes && { notes }),
    };

    try {
      const result = await createMutation.mutateAsync(data);
      const responseData = result as { data?: { id: string }; id?: string };
      const invoice = responseData?.data ?? responseData;
      const id =
        typeof invoice === 'object' && invoice && 'id' in invoice ? invoice.id : responseData?.id;
      toast.success(
        status === 'draft'
          ? t('sales.invoice.savedDraft', 'تم حفظ الفاتورة كمسودة')
          : t('sales.invoice.confirmed', 'تم تأكيد الفاتورة')
      );
      if (id) {
        navigate(`/sales/invoices/${id}`);
      } else {
        navigate('/sales');
      }
    } catch {
      toast.error(t('sales.invoice.createFailed', 'فشل في إنشاء الفاتورة'));
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);

  const isLoading = createMutation.isPending;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {t('sales.invoice.new', 'فاتورة مبيعات جديدة')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('sales.invoice.details', 'تفاصيل الفاتورة')}
        </Typography>
        <Grid container spacing={2}>
          <Grid   size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              label={t('sales.invoice.branch', 'الفرع')}
              value={effectiveBranchId}
              onChange={e => setBranchId(e.target.value)}
            >
              {branchesList.map((b: { id: string; name: string }) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid   size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              label={t('sales.invoice.warehouse', 'المخزن')}
              value={effectiveWarehouseId}
              onChange={e => setWarehouseId(e.target.value)}
            >
              {warehousesList.map((w: { id: string; name: string }) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
            <Grid   size={{ xs: 12, sm: 6, md: 4 }}>
            <Autocomplete
              options={customersList}
              getOptionLabel={(opt: { name: string }) => opt.name || ''}
              value={customersList.find((c: { id: string }) => c.id === customerId) ?? null}
              onChange={(_, val) => setCustomerId(val?.id ?? '')}
              renderInput={params => (
                <TextField
                  id={params.id}
                  disabled={params.disabled}
                  fullWidth={params.fullWidth}
                  InputProps={params.InputProps}
                  inputProps={params.inputProps}
                  label={t('sales.invoice.customer', 'العميل')}
                />
              )}
            />
          </Grid>
          <Grid   size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label={t('sales.invoice.notes', 'ملاحظات')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('sales.invoice.addProduct', 'إضافة منتجات')}
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Autocomplete
              options={productsList}
              getOptionLabel={(opt: { name: string; sku?: string }) =>
                opt.name ? `${opt.name}${opt.sku ? ` (${opt.sku})` : ''}` : ''
              }
              value={selectedProductForAdd}
              onChange={(_, val) =>
                setSelectedProductForAdd(
                  val
                    ? {
                        id: val.id,
                        name: val.name,
                        sku: val.sku ?? '',
                        basePrice: val.basePrice ?? 0,
                      }
                    : null
                )
              }
              renderInput={params => (
                <TextField
                  id={params.id}
                  disabled={params.disabled}
                  fullWidth={params.fullWidth}
                  InputProps={params.InputProps}
                  inputProps={params.inputProps}
                  label={t('sales.invoice.product', 'المنتج')}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              type="number"
              label={t('sales.invoice.quantity', 'الكمية')}
              value={addQuantity}
              onChange={e => setAddQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddLine}
              disabled={!selectedProductForAdd}
            >
              {t('sales.invoice.add', 'إضافة')}
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('sales.invoice.product', 'المنتج')}</TableCell>
                <TableCell align="right">{t('sales.invoice.quantity', 'الكمية')}</TableCell>
                <TableCell align="right">{t('sales.invoice.unitPrice', 'سعر الوحدة')}</TableCell>
                <TableCell align="right">{t('sales.invoice.discount', 'الخصم')}</TableCell>
                <TableCell align="right">{t('sales.invoice.lineTotal', 'الإجمالي')}</TableCell>
                <TableCell align="center">{t('common.actions.delete', 'حذف')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={`${line.productId}-${index}`}>
                  <TableCell>
                    {line.productName}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {line.productSku}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={line.quantity}
                      onChange={e =>
                        handleUpdateLine(
                          index,
                          'quantity',
                          Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      inputProps={{ min: 1 }}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={line.unitPrice}
                      onChange={e =>
                        handleUpdateLine(
                          index,
                          'unitPrice',
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      inputProps={{ min: 0 }}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={line.discountAmount}
                      onChange={e =>
                        handleUpdateLine(
                          index,
                          'discountAmount',
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      inputProps={{ min: 0 }}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(
                      line.quantity * line.unitPrice - line.quantity * line.discountAmount
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => handleRemoveLine(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {lines.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t('sales.invoice.addProductsHint', 'أضف منتجات من الأعلى')}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} justifyContent="flex-end">
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1">
              {t('sales.invoice.subtotal', 'المجموع الفرعي')}: {formatCurrency(totals.subtotal)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body1">
              {t('sales.invoice.tax', 'الضريبة')} ({TAX_RATE}%): {formatCurrency(totals.taxAmount)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" fontWeight={700}>
              {t('sales.invoice.total', 'الإجمالي')}: {formatCurrency(totals.totalAmount)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/sales')}
          disabled={isLoading}
        >
          {t('common.actions.cancel', 'إلغاء')}
        </Button>
        <Button
          variant="outlined"
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={() => handleSubmit('draft')}
          disabled={isLoading || lines.length === 0}
        >
          {t('sales.invoice.saveDraft', 'حفظ كمسودة')}
        </Button>
        <Button
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={() => handleSubmit('confirmed')}
          disabled={isLoading || lines.length === 0}
        >
          {t('sales.invoice.confirm', 'تأكيد الفاتورة')}
        </Button>
      </Box>
    </Box>
  );
};

export default SalesInvoiceForm;
