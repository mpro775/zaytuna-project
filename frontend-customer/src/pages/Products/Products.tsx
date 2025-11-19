import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Switch,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Category as CategoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks';
import { Product } from '@/services/products';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CategoryManager } from '@/components/ui';

const Products: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  // State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');

  const {
    products,
    totalProducts,
    categories,
    currentFilters,
    statistics,
    isLoading,
    isRefetching,
    pagination,
    refetch,
    searchProducts,
    filterByCategory,
    filterByStatus,
    changePage,
    changePageSize,
    sortProducts,
    deleteProduct,
    bulkDeleteProducts,
  } = useProducts({
    filters: {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  });

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchProducts(query);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setCategoryFilter(categoryId);
    filterByCategory(categoryId || undefined);
  };

  const handleStatusFilter = (isActive: boolean | '') => {
    setStatusFilter(isActive);
    filterByStatus(isActive === '' ? undefined : isActive);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev =>
      checked
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? products.map(p => p.id) : []);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeleteDialogOpen(true);
    // Store the product to delete
    (window as any).productToDelete = product;
  };

  const confirmDeleteProduct = () => {
    const product = (window as any).productToDelete;
    if (product) {
      deleteProduct(product.id);
      setDeleteDialogOpen(false);
      delete (window as any).productToDelete;
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteProducts(selectedProducts);
    setBulkDeleteDialogOpen(false);
    setSelectedProducts([]);
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleCreateProduct = () => {
    navigate('/products/new');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { label: t('products.stock.outOfStock', 'نفد المخزون'), color: 'error' as const };
    }
    if (product.currentStock <= product.reorderPoint) {
      return { label: t('products.stock.lowStock', 'مخزون منخفض'), color: 'warning' as const };
    }
    return { label: t('products.stock.inStock', 'متوفر'), color: 'success' as const };
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('products.title', 'إدارة المنتجات')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => setCategoryManagerOpen(true)}
            sx={{ minWidth: 140 }}
          >
            {t('categories.title', 'إدارة الفئات')}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProduct}
            sx={{ minWidth: 140 }}
          >
            {t('products.actions.addProduct', 'إضافة منتج')}
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {statistics.total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('products.stats.total', 'إجمالي المنتجات')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
            {statistics.active}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('products.stats.active', 'منتجات نشطة')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {statistics.lowStock}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('products.stats.lowStock', 'مخزون منخفض')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
            {statistics.outOfStock}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('products.stats.outOfStock', 'نفد المخزون')}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('products.search.placeholder', 'البحث في المنتجات...')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 250 }}
          />

          <TextField
            select
            size="small"
            label={t('products.filters.category', 'الفئة')}
            value={categoryFilter}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">
              <em>{t('products.filters.allCategories', 'جميع الفئات')}</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.displayName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label={t('products.filters.status', 'الحالة')}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">
              <em>{t('products.filters.allStatuses', 'جميع الحالات')}</em>
            </MenuItem>
            <MenuItem value="true">{t('products.status.active', 'نشط')}</MenuItem>
            <MenuItem value="false">{t('products.status.inactive', 'غير نشط')}</MenuItem>
          </TextField>

          <Tooltip title={t('common.actions.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading || isRefetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('products.selectedCount', '{{count}} منتج محدد', { count: selectedProducts.length })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                {t('products.actions.bulkDelete', 'حذف المحدد')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Products Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedProducts.length === products.length && products.length > 0}
                    indeterminate={selectedProducts.length > 0 && selectedProducts.length < products.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>{t('products.table.image', 'الصورة')}</TableCell>
                <TableCell>{t('products.table.name', 'اسم المنتج')}</TableCell>
                <TableCell>{t('products.table.category', 'الفئة')}</TableCell>
                <TableCell>{t('products.table.price', 'السعر')}</TableCell>
                <TableCell>{t('products.table.stock', 'المخزون')}</TableCell>
                <TableCell>{t('products.table.status', 'الحالة')}</TableCell>
                <TableCell>{t('products.table.createdAt', 'تاريخ الإنشاء')}</TableCell>
                <TableCell align="center">{t('products.table.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.loading', 'جارٍ التحميل...')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('products.noProducts', 'لا توجد منتجات')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <TableRow key={product.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={product.images.find(img => img.isPrimary)?.url}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        >
                          <ImageIcon />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                          {product.barcode && (
                            <Typography variant="caption" color="text.secondary">
                              {t('products.barcode', 'باركود')}: {product.barcode}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.category?.name || t('products.noCategory', 'بدون فئة')}
                          size="small"
                          variant="outlined"
                          icon={<CategoryIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(product.basePrice)}
                          </Typography>
                          {product.costPrice > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {t('products.costPrice', 'تكلفة')}: {formatCurrency(product.costPrice)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {product.currentStock} {product.unit}
                          </Typography>
                          <Chip
                            label={stockStatus.label}
                            color={stockStatus.color}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={product.isActive}
                              size="small"
                              disabled // Will implement toggle functionality
                            />
                          }
                          label={product.isActive ? t('products.status.active', 'نشط') : t('products.status.inactive', 'غير نشط')}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(product.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('common.actions.edit', 'تعديل')}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditProduct(product)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.actions.delete', 'حذف')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProduct(product)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalProducts}
          page={pagination.page - 1}
          onPageChange={(_, page) => changePage(page + 1)}
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={(e) => changePageSize(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage={t('table.rowsPerPage', 'عدد الصفوف في الصفحة:')}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} ${t('table.of', 'من')} ${count}`
          }
        />
      </Paper>

      {/* Delete Product Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('products.confirmDelete.title', 'تأكيد الحذف')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('products.confirmDelete.message', 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDeleteProduct} color="error" variant="contained">
            {t('common.actions.delete', 'حذف')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('products.confirmBulkDelete.title', 'تأكيد الحذف الجماعي')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('products.confirmBulkDelete.message', 'هل أنت متأكد من حذف {{count}} منتج؟ لا يمكن التراجع عن هذا الإجراء.', {
              count: selectedProducts.length,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmBulkDelete} color="error" variant="contained">
            {t('common.actions.delete', 'حذف')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Manager Dialog */}
      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />
    </Box>
  );
};

export default Products;
