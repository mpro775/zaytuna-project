import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts, useProduct } from '@/hooks';

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب').max(100, 'اسم المنتج طويل جداً'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().min(1, 'رمز المنتج مطلوب').max(50, 'رمز المنتج طويل جداً'),
  categoryId: z.string().min(1, 'الفئة مطلوبة'),
  basePrice: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
  costPrice: z.number().min(0, 'تكلفة الشراء يجب أن تكون أكبر من أو تساوي صفر'),
  reorderPoint: z.number().min(0, 'نقطة إعادة الطلب يجب أن تكون أكبر من أو تساوي صفر'),
  unit: z.string().min(1, 'وحدة القياس مطلوبة'),
  isActive: z.boolean(),
  variants: z.array(z.object({
    name: z.string().min(1, 'اسم المتغير مطلوب'),
    value: z.string().min(1, 'قيمة المتغير مطلوبة'),
    priceModifier: z.number(),
    stock: z.number().min(0, 'المخزون يجب أن يكون أكبر من أو يساوي صفر'),
  })).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  mode: 'create' | 'edit';
}

const ProductForm: React.FC<ProductFormProps> = ({ mode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const { categories, createProduct, updateProduct, uploadProductImage, deleteProductImage } = useProducts();
  const { product, isLoading: isLoadingProduct } = useProduct(mode === 'edit' ? id : undefined);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      barcode: '',
      sku: '',
      categoryId: '',
      basePrice: 0,
      costPrice: 0,
      reorderPoint: 0,
      unit: 'قطعة',
      isActive: true,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  // Load product data for editing
  useEffect(() => {
    if (mode === 'edit' && product) {
      reset({
        name: product.name,
        description: product.description || '',
        barcode: product.barcode || '',
        sku: product.sku,
        categoryId: product.categoryId,
        basePrice: product.basePrice,
        costPrice: product.costPrice,
        reorderPoint: product.reorderPoint,
        unit: product.unit,
        isActive: product.isActive,
        variants: product.variants || [],
      });
      setExistingImages(product.images || []);
    }
  }, [product, mode, reset]);

  // Generate SKU automatically
  useEffect(() => {
    const name = watch('name');
    if (mode === 'create' && name && !watch('sku')) {
      const generatedSku = name
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .toUpperCase()
        .substring(0, 20);
      setValue('sku', generatedSku);
    }
  }, [watch('name'), mode, setValue]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      let productId: string;

      if (mode === 'create') {
        const productData: any = {
          ...data,
          branchId: 'default-branch', // TODO: Get from user context
        };

        if (data.description) {
          productData.description = data.description;
        }
        if (data.barcode) {
          productData.barcode = data.barcode;
        }
        const filteredVariants = data.variants?.filter(v => v.name && v.value);
        if (filteredVariants && filteredVariants.length > 0) {
          productData.variants = filteredVariants;
        }

        const newProduct = await createProduct(productData);
        productId = newProduct.id;
      } else {
        const updateData: any = {
          ...data,
        };

        if (data.description) {
          updateData.description = data.description;
        }
        if (data.barcode) {
          updateData.barcode = data.barcode;
        }
        const filteredVariants = data.variants?.filter(v => v.name && v.value);
        if (filteredVariants && filteredVariants.length > 0) {
          updateData.variants = filteredVariants;
        }

        await updateProduct({
          id: id!,
          data: updateData
        });
        productId = id!;
      }

      // Upload new images
      for (const image of images) {
        await uploadProductImage({
          productId,
          file: image,
          isPrimary: images.indexOf(image) === 0 && existingImages.length === 0,
        });
      }

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      const image = existingImages[index];
      if (image) {
        deleteProductImage({ productId: id!, imageId: image.id });
        setExistingImages(prev => prev.filter((_, i) => i !== index));
      }
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addVariant = () => {
    append({ name: '', value: '', priceModifier: 0, stock: 0 });
  };

  if (mode === 'edit' && isLoadingProduct) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>{t('common.loading', 'جارٍ التحميل...')}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        {mode === 'create'
          ? t('products.form.createTitle', 'إضافة منتج جديد')
          : t('products.form.editTitle', 'تعديل المنتج')
        }
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('products.form.basicInfo', 'المعلومات الأساسية')}
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('products.form.name', 'اسم المنتج')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('products.form.sku', 'رمز المنتج (SKU)')}
                    error={!!errors.sku}
                    helperText={errors.sku?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('products.form.category', 'الفئة')}
                    error={!!errors.categoryId}
                    helperText={errors.categoryId?.message}
                    required
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.displayName}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('products.form.barcode', 'الباركود')}
                    error={!!errors.barcode}
                    helperText={errors.barcode?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label={t('products.form.description', 'الوصف')}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* Pricing Information */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                {t('products.form.pricing', 'معلومات التسعير')}
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="basePrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label={t('products.form.basePrice', 'السعر الأساسي')}
                    error={!!errors.basePrice}
                    helperText={errors.basePrice?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="costPrice"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label={t('products.form.costPrice', 'تكلفة الشراء')}
                    error={!!errors.costPrice}
                    helperText={errors.costPrice?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name="reorderPoint"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label={t('products.form.reorderPoint', 'نقطة إعادة الطلب')}
                    error={!!errors.reorderPoint}
                    helperText={errors.reorderPoint?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    required
                  />
                )}
              />
            </Grid>

            {/* Inventory Information */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                {t('products.form.inventory', 'معلومات المخزون')}
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('products.form.unit', 'وحدة القياس')}
                    error={!!errors.unit}
                    helperText={errors.unit?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        checked={field.value}
                      />
                    }
                    label={t('products.form.isActive', 'المنتج نشط')}
                  />
                )}
              />
            </Grid>

            {/* Variants */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                {t('products.form.variants', 'المتغيرات')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {fields.map((field, index) => (
                <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name={`variants.${index}.name` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={t('products.form.variantName', 'اسم المتغير')}
                            error={!!errors.variants?.[index]?.name}
                            helperText={errors.variants?.[index]?.name?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name={`variants.${index}.value` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={t('products.form.variantValue', 'قيمة المتغير')}
                            error={!!errors.variants?.[index]?.value}
                            helperText={errors.variants?.[index]?.value?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name={`variants.${index}.priceModifier` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label={t('products.form.priceModifier', 'تعديل السعر')}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Controller
                        name={`variants.${index}.stock` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            type="number"
                            label={t('products.form.variantStock', 'المخزون')}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <IconButton onClick={() => remove(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addVariant}
                sx={{ mt: 1 }}
              >
                {t('products.form.addVariant', 'إضافة متغير')}
              </Button>
            </Grid>

            {/* Images */}
            <Grid size={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                {t('products.form.images', 'الصور')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {t('products.form.existingImages', 'الصور الموجودة')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {existingImages.map((image, index) => (
                      <Box key={image.id} sx={{ position: 'relative' }}>
                        <Avatar
                          src={image.url}
                          variant="rounded"
                          sx={{ width: 80, height: 80 }}
                        />
                        {image.isPrimary && (
                          <Chip
                            label={t('products.form.primary', 'رئيسية')}
                            size="small"
                            color="primary"
                            sx={{ position: 'absolute', top: 4, right: 4 }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => removeImage(index, true)}
                          sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'rgba(255,255,255,0.8)' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* New Images */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('products.form.newImages', 'صور جديدة')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {images.map((image, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <Avatar
                        src={URL.createObjectURL(image)}
                        variant="rounded"
                        sx={{ width: 80, height: 80 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeImage(index)}
                        sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'rgba(255,255,255,0.8)' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}

                  <Box
                    component="label"
                    sx={{
                      width: 80,
                      height: 80,
                      border: '2px dashed',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <AddPhotoIcon color="primary" />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Actions */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/products')}
                  disabled={isSubmitting}
                >
                  {t('common.actions.cancel', 'إلغاء')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? t('common.actions.saving', 'جارٍ الحفظ...')
                    : t('common.actions.save', 'حفظ')
                  }
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ProductForm;
