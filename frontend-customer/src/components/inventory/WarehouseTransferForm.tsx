import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useInventoryStore } from '@/store';
import type { StockItem, TransferStockDto } from '@/services/inventory';

interface WarehouseTransferFormProps {
  open: boolean;
  onClose: () => void;
  stockItem?: StockItem | null;
}

interface FormValues {
  fromWarehouseId: string;
  toWarehouseId: string;
  productVariantId: string;
  quantity: number;
  notes: string;
}

const WarehouseTransferForm: React.FC<WarehouseTransferFormProps> = ({
  open,
  onClose,
  stockItem,
}) => {
  const { t } = useTranslation();
  const { transferStock, isLoading } = useInventoryStore();

  const [warehouses] = useState([
    { id: '1', name: 'المخزن الرئيسي', code: 'MAIN' },
    { id: '2', name: 'المخزن الثانوي', code: 'SEC' },
  ]); // Mock data - should come from API

  const [productVariants] = useState([
    { id: '1', name: 'متغير 1', productName: 'منتج 1', sku: 'SKU001' },
    { id: '2', name: 'متغير 2', productName: 'منتج 2', sku: 'SKU002' },
  ]); // Mock data - should come from API

  const validationSchema = Yup.object({
    fromWarehouseId: Yup.string().required(t('validation.required', 'هذا الحقل مطلوب')),
    toWarehouseId: Yup.string()
      .required(t('validation.required', 'هذا الحقل مطلوب'))
      .notOneOf([Yup.ref('fromWarehouseId')], t('inventory.transfer.sameWarehouse', 'لا يمكن النقل لنفس المخزن')),
    productVariantId: Yup.string().required(t('validation.required', 'هذا الحقل مطلوب')),
    quantity: Yup.number()
      .required(t('validation.required', 'هذا الحقل مطلوب'))
      .positive(t('validation.positive', 'يجب أن تكون الكمية موجبة'))
      .max(stockItem?.quantity || 999999, t('inventory.transfer.insufficientStock', 'الكمية المتاحة غير كافية')),
    notes: Yup.string().max(500, t('validation.maxLength', 'يجب ألا يزيد عن 500 حرف')),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      fromWarehouseId: stockItem?.warehouseId || '',
      toWarehouseId: '',
      productVariantId: stockItem?.productVariantId || '',
      quantity: 0,
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const transferData: TransferStockDto = {
          fromWarehouseId: values.fromWarehouseId,
          toWarehouseId: values.toWarehouseId,
          productVariantId: values.productVariantId,
          quantity: values.quantity,
          notes: values.notes || undefined,
        };

        await transferStock(transferData);
        onClose();
      } catch (error) {
        // Error is handled by the store
      }
    },
  });

  useEffect(() => {
    if (open && stockItem) {
      formik.setValues({
        fromWarehouseId: stockItem.warehouseId,
        toWarehouseId: '',
        productVariantId: stockItem.productVariantId,
        quantity: 0,
        notes: '',
      });
    } else if (open && !stockItem) {
      formik.resetForm();
    }
  }, [open, stockItem]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const availableWarehouses = warehouses.filter(w => w.id !== formik.values.fromWarehouseId);
  const selectedFromWarehouse = warehouses.find(w => w.id === formik.values.fromWarehouseId);
  const selectedToWarehouse = warehouses.find(w => w.id === formik.values.toWarehouseId);
  const selectedProductVariant = productVariants.find(p => p.id === formik.values.productVariantId);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' },
      }}
    >
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('inventory.transfer.title', 'نقل المخزون بين المخازن')}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {t('inventory.transfer.info', 'سيتم نقل الكمية المحددة من المخزن المصدر إلى المخزن الوجهة وسيتم تسجيل حركة النقل تلقائياً.')}
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {/* From Warehouse */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>
                    {t('inventory.transfer.fromWarehouse', 'المخزن المصدر')}
                  </InputLabel>
                  <Select
                    name="fromWarehouseId"
                    value={formik.values.fromWarehouseId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('inventory.transfer.fromWarehouse', 'المخزن المصدر')}
                    error={formik.touched.fromWarehouseId && Boolean(formik.errors.fromWarehouseId)}
                    disabled={!!stockItem} // Can't change if opened from specific stock item
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.fromWarehouseId && formik.errors.fromWarehouseId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formik.errors.fromWarehouseId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* To Warehouse */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>
                    {t('inventory.transfer.toWarehouse', 'المخزن الوجهة')}
                  </InputLabel>
                  <Select
                    name="toWarehouseId"
                    value={formik.values.toWarehouseId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('inventory.transfer.toWarehouse', 'المخزن الوجهة')}
                    error={formik.touched.toWarehouseId && Boolean(formik.errors.toWarehouseId)}
                  >
                    {availableWarehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.toWarehouseId && formik.errors.toWarehouseId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formik.errors.toWarehouseId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Product Variant */}
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>
                    {t('inventory.transfer.productVariant', 'متغير المنتج')}
                  </InputLabel>
                  <Select
                    name="productVariantId"
                    value={formik.values.productVariantId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('inventory.transfer.productVariant', 'متغير المنتج')}
                    error={formik.touched.productVariantId && Boolean(formik.errors.productVariantId)}
                    disabled={!!stockItem} // Can't change if opened from specific stock item
                  >
                    {productVariants.map((variant) => (
                      <MenuItem key={variant.id} value={variant.id}>
                        {variant.productName} - {variant.name}
                        {variant.sku && ` (${variant.sku})`}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.productVariantId && formik.errors.productVariantId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formik.errors.productVariantId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="quantity"
                  label={t('inventory.transfer.quantity', 'الكمية المراد نقلها')}
                  type="number"
                  size="small"
                  value={formik.values.quantity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                  helperText={formik.touched.quantity && formik.errors.quantity}
                  InputProps={{
                    inputProps: { min: 0.01, step: 0.01 },
                  }}
                />
                {stockItem && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {t('inventory.transfer.available', 'المتاح')}: {stockItem.quantity}
                  </Typography>
                )}
              </Grid>

              {/* Notes */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="notes"
                  label={t('inventory.transfer.notes', 'ملاحظات النقل')}
                  multiline
                  rows={3}
                  size="small"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.notes && Boolean(formik.errors.notes)}
                  helperText={formik.touched.notes && formik.errors.notes}
                  placeholder={t('inventory.transfer.notesPlaceholder', 'أسباب النقل أو ملاحظات إضافية...')}
                />
              </Grid>

              {/* Transfer Summary */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    {t('inventory.transfer.summary', 'ملخص النقل')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('inventory.transfer.from', 'من')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedFromWarehouse?.name} ({selectedFromWarehouse?.code})
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('inventory.transfer.to', 'إلى')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedToWarehouse?.name} ({selectedToWarehouse?.code})
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('inventory.transfer.product', 'المنتج')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedProductVariant?.productName} - {selectedProductVariant?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        {t('inventory.transfer.quantity', 'الكمية')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formik.values.quantity}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={isLoading}
          >
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formik.isValid}
            startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
          >
            {t('inventory.transfer.confirm', 'تأكيد النقل')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WarehouseTransferForm;
