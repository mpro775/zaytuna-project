import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  QrCodeScanner as BarcodeIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { POSProduct, POSFilters } from '@/services/pos';

interface ProductGridProps {
  products: POSProduct[];
  categories: { id: string; name: string; productCount: number }[];
  isLoading: boolean;
  error?: Error | null;
  onProductSelect: (product: POSProduct) => void;
  onBarcodeSearch: (barcode: string) => void;
  filters: POSFilters;
  onFilterChange: (filters: POSFilters) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  isLoading,
  error,
  onProductSelect,
  onBarcodeSearch,
  filters,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  const [barcodeMode, setBarcodeMode] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode scanner input
  useEffect(() => {
    if (barcodeMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeMode]);

  // Keyboard shortcut for barcode mode (F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setBarcodeMode(true);
      } else if (e.key === 'Escape') {
        setBarcodeMode(false);
      } else if (e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = (e.target as HTMLFormElement).barcode.value;
    if (barcode) {
      onBarcodeSearch(barcode);
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rest = Object.fromEntries(
      Object.entries(filters).filter(([k]) => k !== 'search')
    ) as Omit<POSFilters, 'search'>;
    onFilterChange({
      ...rest,
      ...(e.target.value ? { search: e.target.value } : {}),
    });
  };

  const handleCategoryChange = (_: React.SyntheticEvent, categoryId: string) => {
    const rest = Object.fromEntries(
      Object.entries(filters).filter(([k]) => k !== 'categoryId')
    ) as Omit<POSFilters, 'categoryId'>;
    onFilterChange({
      ...rest,
      ...(categoryId !== 'all' ? { categoryId } : {}),
    });
  };

  const getStockColor = (quantity: number): 'success' | 'warning' | 'error' => {
    if (quantity > 10) return 'success';
    if (quantity > 0) return 'warning';
    return 'error';
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {t('pos.errors.loadProducts', 'خطأ في تحميل المنتجات')}: {error.message}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search & Barcode Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Search Field */}
          <TextField
            inputRef={searchInputRef}
            fullWidth
            size="small"
            placeholder={t('pos.searchProducts', 'ابحث عن منتج... (F3)')}
            value={filters.search || ''}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />

          {/* Barcode Toggle */}
          <Tooltip title={t('pos.barcodeMode', 'وضع الباركود (F2)')}>
            <IconButton
              color={barcodeMode ? 'primary' : 'default'}
              onClick={() => setBarcodeMode(!barcodeMode)}
              sx={{
                bgcolor: barcodeMode ? 'primary.light' : 'transparent',
                '&:hover': { bgcolor: barcodeMode ? 'primary.main' : 'action.hover' },
              }}
            >
              <BarcodeIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Barcode Input (Hidden when not in barcode mode) */}
        {barcodeMode && (
          <Box
            component="form"
            onSubmit={handleBarcodeSubmit}
            sx={{
              mb: 2,
              p: 2,
              bgcolor: 'primary.light',
              borderRadius: 1,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.8 },
              },
            }}
          >
            <TextField
              inputRef={barcodeInputRef}
              name="barcode"
              fullWidth
              size="small"
              placeholder={t('pos.scanBarcode', 'امسح الباركود أو أدخله يدوياً...')}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BarcodeIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'primary.contrastText' }}>
              {t('pos.barcodeHint', 'اضغط ESC للخروج من وضع الباركود')}
            </Typography>
          </Box>
        )}

        {/* Categories Tabs */}
        <Tabs
          value={filters.categoryId || 'all'}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 'auto',
              px: 2,
            },
          }}
        >
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon fontSize="small" />
                <span>{t('pos.allProducts', 'الكل')}</span>
                <Badge badgeContent={products.length} color="primary" max={999} />
              </Box>
            }
          />
          {categories.map((category) => (
            <Tab
              key={category.id}
              value={category.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{category.name}</span>
                  <Badge badgeContent={category.productCount} color="secondary" max={999} />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Products Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('pos.noProducts', 'لا توجد منتجات')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filters.search || filters.categoryId
                ? t('pos.tryDifferentSearch', 'جرب بحث مختلف أو فئة أخرى')
                : t('pos.addProductsFirst', 'أضف منتجات من صفحة إدارة المنتجات')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                <Card
                  onClick={() => onProductSelect(product)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease-in-out',
                    border: 2,
                    borderColor: 'transparent',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: 'primary.main',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                    opacity: product.stockQuantity <= 0 && product.trackInventory ? 0.6 : 1,
                  }}
                >
                  {/* Product Image */}
                  <CardMedia
                    component="div"
                    sx={{
                      height: 100,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {product.imageUrl ? (
                      <Box
                        component="img"
                        src={product.imageUrl}
                        alt={product.name}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <InventoryIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                    )}

                    {/* Stock Badge */}
                    <Chip
                      size="small"
                      icon={<InventoryIcon sx={{ fontSize: 14 }} />}
                      label={product.trackInventory ? product.stockQuantity : '∞'}
                      color={product.trackInventory ? getStockColor(product.stockQuantity) : 'default'}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />

                    {/* Quick Access Star */}
                    {product.categoryName && (
                      <Chip
                        size="small"
                        label={product.categoryName}
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: 'rgba(255,255,255,0.9)',
                        }}
                      />
                    )}
                  </CardMedia>

                  <CardContent sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    {/* Product Name */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: 40,
                        lineHeight: 1.3,
                      }}
                    >
                      {product.name}
                    </Typography>

                    {/* Barcode */}
                    {product.barcode && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {product.barcode}
                      </Typography>
                    )}

                    {/* Price */}
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        mt: 1,
                        fontSize: '1rem',
                      }}
                    >
                      {new Intl.NumberFormat('ar-SA', {
                        style: 'currency',
                        currency: 'YER',
                        minimumFractionDigits: 0,
                      }).format(product.price)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ProductGrid;
