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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { StockItem, CreateStockItemDto, UpdateStockItemDto } from '@/services/inventory';
import { useInventoryStore } from '@/store';

interface StockItemFormProps {
  open: boolean;
  onClose: () => void;
  stockItem?: StockItem | null;
  mode: 'create' | 'edit';
}

interface FormValues {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
  minStock: number;
  maxStock: number;
}

const StockItemForm: React.FC<StockItemFormProps> = ({
  open,
  onClose,
  stockItem,
  mode,
}) => {
  const { t } = useTranslation();
  const { createStockItem, updateStockItem, isLoading } = useInventoryStore();

  const [warehouses] = useState([
    { id: '1', name: 'المخزن الرئيسي', code: 'MAIN' },
    { id: '2', name: 'المخزن الثانوي', code: 'SEC' },
  ]); // Mock data - should come from API

  const [productVariants] = useState([
    { id: '1', name: 'متغير 1', productName: 'منتج 1', sku: 'SKU001' },
    { id: '2', name: 'متغير 2', productName: 'منتج 2', sku: 'SKU002' },
  ]); // Mock data - should come from API

  const validationSchema = Yup.object({
    warehouseId: Yup.string().required(t('validation.required', 'هذا الحقل مطلوب')),
    productVariantId: Yup.string().required(t('validation.required', 'هذا الحقل مطلوب')),
    quantity: Yup.number()
      .min(0, t('validation.min', 'يجب أن تكون القيمة أكبر من أو تساوي 0'))
      .required(t('validation.required', 'هذا الحقل مطلوب')),
    minStock: Yup.number()
      .min(0, t('validation.min', 'يجب أن تكون القيمة أكبر من أو تساوي 0'))
      .required(t('validation.required', 'هذا الحقل مطلوب')),
    maxStock: Yup.number()
      .min(1, t('validation.min', 'يجب أن تكون القيمة أكبر من 0'))
      .when('minStock', ([minStock], schema) => {
        const minValue = typeof minStock === 'number' ? minStock : 0;
        return schema.min(minValue, t('validation.maxGreaterThanMin', 'يجب أن يكون الحد الأقصى أكبر من الحد الأدنى'));
      })
      .required(t('validation.required', 'هذا الحقل مطلوب')),
  });

  const formik = useFormik<FormValues>({
    initialValues: {
      warehouseId: stockItem?.warehouseId || '',
      productVariantId: stockItem?.productVariantId || '',
      quantity: stockItem?.quantity || 0,
      minStock: stockItem?.minStock || 0,
      maxStock: stockItem?.maxStock || 1000,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (mode === 'create') {
          const createData: CreateStockItemDto = {
            warehouseId: values.warehouseId,
            productVariantId: values.productVariantId,
            quantity: values.quantity,
            minStock: values.minStock,
            maxStock: values.maxStock,
          };
          await createStockItem(createData);
        } else if (stockItem) {
          const updateData: UpdateStockItemDto = {
            minStock: values.minStock,
            maxStock: values.maxStock,
          };
          await updateStockItem(stockItem.id, updateData);
        }

        onClose();
      } catch  {
        // Error is handled by the store
      }
    },
  });

  useEffect(() => {
    if (open && stockItem && mode === 'edit') {
      formik.setValues({
        warehouseId: stockItem.warehouseId,
        productVariantId: stockItem.productVariantId,
        quantity: stockItem.quantity,
        minStock: stockItem.minStock,
        maxStock: stockItem.maxStock,
      });
    } else if (open && mode === 'create') {
      formik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stockItem, mode]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const title = mode === 'create'
    ? t('inventory.form.createTitle', 'إضافة عنصر مخزون جديد')
    : t('inventory.form.editTitle', 'تعديل عنصر المخزون');

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
            {title}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              {/* Warehouse Selection */}
              <Grid size={{xs: 12, md: 6}}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>
                    {t('inventory.form.warehouse', 'المخزن')}
                  </InputLabel>
                  <Select
                    name="warehouseId"
                    value={formik.values.warehouseId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('inventory.form.warehouse', 'المخزن')}
                    error={(formik.touched.warehouseId && Boolean(formik.errors.warehouseId)) || false}
                    disabled={mode === 'edit'} // Can't change warehouse when editing
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.warehouseId && formik.errors.warehouseId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formik.errors.warehouseId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Product Variant Selection */}
              <Grid size={{xs: 12, md: 6}}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>
                    {t('inventory.form.productVariant', 'متغير المنتج')}
                  </InputLabel>
                  <Select
                    name="productVariantId"
                    value={formik.values.productVariantId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('inventory.form.productVariant', 'متغير المنتج')}
                    error={(formik.touched.productVariantId && Boolean(formik.errors.productVariantId)) || false}
                    disabled={mode === 'edit'} // Can't change product variant when editing
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
              <Grid size={{xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  name="quantity"
                  label={t('inventory.form.quantity', 'الكمية')}
                  type="number"
                  size="small"
                  value={formik.values.quantity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={(formik.touched.quantity && Boolean(formik.errors.quantity)) || false}
                  helperText={formik.touched.quantity && formik.errors.quantity}
                  disabled={mode === 'edit'} // Can't change quantity when editing, use adjust stock instead
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                  }}
                />
                {mode === 'edit' && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {t('inventory.form.quantityEditNote', 'استخدم تعديل المخزون لتغيير الكمية')}
                  </Typography>
                )}
              </Grid>

              {/* Min Stock */}
              <Grid size={{xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  name="minStock"
                  label={t('inventory.form.minStock', 'الحد الأدنى')}
                  type="number"
                  size="small"
                  value={formik.values.minStock}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={(formik.touched.minStock && Boolean(formik.errors.minStock)) || false}
                  helperText={formik.touched.minStock && formik.errors.minStock}
                  InputProps={{
                    inputProps: { min: 0, step: 1 },
                  }}
                />
              </Grid>

              {/* Max Stock */}
              <Grid size={{xs: 12, md: 6}}>
                <TextField
                  fullWidth
                  name="maxStock"
                  label={t('inventory.form.maxStock', 'الحد الأقصى')}
                  type="number"
                  size="small"
                  value={formik.values.maxStock}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={(formik.touched.maxStock && Boolean(formik.errors.maxStock)) || false}
                  helperText={formik.touched.maxStock && formik.errors.maxStock}
                  InputProps={{
                    inputProps: { min: 1, step: 1 },
                  }}
                />
              </Grid>

              {/* Status Preview */}
              <Grid size={{xs: 12, md: 6}}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    {t('inventory.form.statusPreview', 'معاينة الحالة')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2">
                      {t('inventory.form.currentQuantity', 'الكمية الحالية')}: {formik.values.quantity}
                    </Typography>
                    <Typography variant="body2">
                      {t('inventory.form.stockRange', 'نطاق المخزون')}: {formik.values.minStock} - {formik.values.maxStock}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: formik.values.quantity === 0 ? 'error.main' :
                               formik.values.quantity <= formik.values.minStock ? 'warning.main' :
                               formik.values.quantity >= formik.values.maxStock ? 'warning.main' : 'success.main',
                        fontWeight: 600,
                      }}
                    >
                      {t('inventory.form.status', 'الحالة')}:
                      {formik.values.quantity === 0 ? t('inventory.status.outOfStock', ' نفد المخزون') :
                       formik.values.quantity <= formik.values.minStock ? t('inventory.status.lowStock', ' مخزون منخفض') :
                       formik.values.quantity >= formik.values.maxStock ? t('inventory.status.overStock', ' مخزون زائد') :
                       t('inventory.status.normal', ' طبيعي')}
                    </Typography>
                  </Box>
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
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
          >
            {mode === 'create'
              ? t('common.actions.create', 'إنشاء')
              : t('common.actions.save', 'حفظ')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default StockItemForm;
