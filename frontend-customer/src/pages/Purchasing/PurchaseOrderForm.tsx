import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  usePurchaseOrder,
  type CreatePurchaseOrderDto,
} from '@/services/purchasing';
import { useSuppliers, useWarehouses, useProducts } from '@/hooks';
import type { Supplier } from '@/services/suppliers';
import type { Warehouse } from '@/services/warehouses/warehouses';
import type { Product } from '@/services/products';

interface FormData {
  supplierId: string;
  warehouseId: string;
  expectedDate: string;
  notes: string;
  lines: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}

const PurchaseOrderForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: order, isLoading: orderLoading } = usePurchaseOrder(id || '');
  const { suppliers = [] } = useSuppliers({});
  const { warehouses = [] } = useWarehouses({});
  const { products = [] } = useProducts({});

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      supplierId: '',
      warehouseId: '',
      expectedDate: '',
      notes: '',
      lines: [{ productId: '', quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const watchedLines = useWatch({ control, name: 'lines', defaultValue: [] }) ?? [];

  // Calculate totals
  const totalAmount = watchedLines.reduce((sum, line) => {
    return sum + (line.quantity || 0) * (line.unitCost || 0);
  }, 0);

  // Load order data for edit mode
  useEffect(() => {
    if (isEdit && order) {
      reset({
        supplierId: order.supplierId,
        warehouseId: order.warehouseId,
        expectedDate: ((order.expectedDate ?? '').split('T')[0]) ?? '',
        notes: order.notes ?? '',
        lines: order.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
        })),
      });
    }
  }, [isEdit, order, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: CreatePurchaseOrderDto = {
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        ...(data.expectedDate ? { expectedDate: data.expectedDate } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
        lines: data.lines.filter((line) => line.productId),
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data: payload });
        toast.success(t('purchasing.orderUpdated', 'تم تحديث أمر الشراء'));
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t('purchasing.orderCreated', 'تم إنشاء أمر الشراء'));
      }

      navigate('/purchasing/orders');
    } catch {
      toast.error(t('common.error', 'حدث خطأ'));
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isEdit && orderLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/purchasing/orders')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {isEdit
            ? t('purchasing.editOrder', 'تحرير أمر الشراء')
            : t('purchasing.createOrder', 'إنشاء أمر شراء جديد')}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('purchasing.basicInfo', 'المعلومات الأساسية')}
          </Typography>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="supplierId"
                control={control}
                rules={{ required: t('validation.required', 'هذا الحقل مطلوب') }}
                render={({ field }) => (
                  <Autocomplete
                    options={suppliers}
                    getOptionLabel={(option: Supplier) => option.name || ''}
                    value={suppliers.find((s: Supplier) => s.id === field.value) ?? null}
                    onChange={(_, newValue) => field.onChange(newValue?.id ?? '')}
                    renderInput={(params) => (
                      <TextField
                        id={params.id}
                        disabled={params.disabled}
                        fullWidth={params.fullWidth}
                        InputProps={params.InputProps}
                        inputProps={params.inputProps}
                        label={t('purchasing.supplier', 'المورد')}
                        error={!!errors.supplierId}
                        helperText={errors.supplierId?.message}
                        required
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="warehouseId"
                control={control}
                rules={{ required: t('validation.required', 'هذا الحقل مطلوب') }}
                render={({ field }) => (
                  <Autocomplete
                    options={warehouses}
                    getOptionLabel={(option: Warehouse) => option.name || ''}
                    value={warehouses.find((w: Warehouse) => w.id === field.value) ?? null}
                    onChange={(_, newValue) => field.onChange(newValue?.id ?? '')}
                    renderInput={(params) => (
                      <TextField
                        id={params.id}
                        disabled={params.disabled}
                        fullWidth={params.fullWidth}
                        InputProps={params.InputProps}
                        inputProps={params.inputProps}
                        label={t('purchasing.warehouse', 'المخزن')}
                        error={!!errors.warehouseId}
                        helperText={errors.warehouseId?.message}
                        required
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="expectedDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label={t('purchasing.expectedDate', 'تاريخ التوريد المتوقع')}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label={t('common.notes', 'ملاحظات')}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Order Lines */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {t('purchasing.orderLines', 'أصناف الأمر')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}
            >
              {t('purchasing.addLine', 'إضافة صنف')}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '40%' }}>{t('purchasing.product', 'المنتج')}</TableCell>
                  <TableCell sx={{ width: '15%' }}>{t('purchasing.quantity', 'الكمية')}</TableCell>
                  <TableCell sx={{ width: '20%' }}>{t('purchasing.unitCost', 'سعر الوحدة')}</TableCell>
                  <TableCell sx={{ width: '15%' }}>{t('purchasing.lineTotal', 'الإجمالي')}</TableCell>
                  <TableCell sx={{ width: '10%' }} align="center">{t('common.actions', '')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller
                        name={`lines.${index}.productId`}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: f }) => (
                          <Autocomplete
                            options={products}
                            getOptionLabel={(option: Product) =>
                              `${option.name}${option.sku ? ` (${option.sku})` : ''}`
                            }
                            value={products.find((p: Product) => p.id === f.value) ?? null}
                            onChange={(_, newValue) => f.onChange(newValue?.id ?? '')}
                            renderInput={(params) => (
                              <TextField
                                id={params.id}
                                disabled={params.disabled}
                                fullWidth={params.fullWidth}
                                InputProps={params.InputProps}
                                inputProps={params.inputProps}
                                size="small"
                                placeholder={t('purchasing.selectProduct', 'اختر منتج')}
                              />
                            )}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`lines.${index}.quantity`}
                        control={control}
                        rules={{ required: true, min: 1 }}
                        render={({ field: f }) => (
                          <TextField
                            {...f}
                            size="small"
                            type="number"
                            inputProps={{ min: 1 }}
                            onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`lines.${index}.unitCost`}
                        control={control}
                        rules={{ required: true, min: 0 }}
                        render={({ field: f }) => (
                          <TextField
                            {...f}
                            size="small"
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency((watchedLines[index]?.quantity || 0) * (watchedLines[index]?.unitCost || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {fields.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />

          {/* Total */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Paper variant="outlined" sx={{ p: 2, minWidth: 200 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">{t('purchasing.total', 'الإجمالي')}:</Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/purchasing/orders')}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'إلغاء')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t('common.saving', 'جاري الحفظ...')
              : isEdit
                ? t('common.update', 'تحديث')
                : t('common.save', 'حفظ')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default PurchaseOrderForm;
