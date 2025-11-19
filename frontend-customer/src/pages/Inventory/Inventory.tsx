import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown as LowStockIcon,
  TrendingUp as OverStockIcon,
  ShoppingCart as MovementIcon,
  TransferWithinAStation as TransferIcon,
  Add as AddIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useInventoryStore } from '@/store';
import { KPICard } from '@/components/ui';
import { InventoryTable, StockItemForm, WarehouseTransferForm } from '@/components/inventory';
import type { StockItem } from '@/services/inventory';

const Inventory: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [formModal, setFormModal] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    stockItem?: StockItem | null;
  }>({
    open: false,
    mode: 'create',
    stockItem: null,
  });

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    stockItem?: StockItem | null;
  }>({
    open: false,
    stockItem: null,
  });

  const {
    stockItems,
    lowStockAlerts,
    inventoryStats,
    isLoading,
    error,
    fetchStockItems,
    fetchLowStockAlerts,
    fetchInventoryStats,
  } = useInventoryStore();

  // Mock warehouses data - in real app this would come from API
  const warehouses = [
    { id: '', name: t('inventory.allWarehouses', 'جميع المخازن') },
    { id: '1', name: t('warehouse.main', 'المخزن الرئيسي') },
    { id: '2', name: t('warehouse.secondary', 'المخزن الثانوي') },
  ];

  useEffect(() => {
    // Load initial data
    fetchInventoryStats();
    fetchLowStockAlerts();
    fetchStockItems();
  }, [fetchInventoryStats, fetchLowStockAlerts, fetchStockItems]);

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    fetchStockItems(warehouseId || undefined);
  };

  const handleRefresh = () => {
    fetchInventoryStats();
    fetchLowStockAlerts();
    fetchStockItems(selectedWarehouse || undefined);
  };

  const handleViewMovements = () => {
    navigate('/inventory/movements');
  };

  const handleViewReports = () => {
    // Navigate to reports page - will be implemented later
    console.log('Navigate to reports');
  };

  const handleEditStockItem = (stockItem: StockItem) => {
    setFormModal({
      open: true,
      mode: 'edit',
      stockItem,
    });
  };

  const handleDeleteStockItem = (stockItem: StockItem) => {
    // Open delete confirmation - will be implemented later
    console.log('Delete stock item:', stockItem);
  };

  const handleAdjustStock = (stockItem: StockItem) => {
    // Open adjust stock modal - will be implemented later
    console.log('Adjust stock for item:', stockItem);
  };

  const handleViewMovementsForItem = (stockItem: StockItem) => {
    navigate('/inventory/movements', {
      state: {
        productVariantId: stockItem.productVariantId,
        warehouseId: stockItem.warehouseId,
      },
    });
  };

  const handleTransferStock = (stockItem?: StockItem) => {
    setTransferModal({
      open: true,
      stockItem: stockItem || null,
    });
  };

  const handleAddStockItem = () => {
    setFormModal({
      open: true,
      mode: 'create',
      stockItem: null,
    });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('inventory.title', 'إدارة المخزون')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddStockItem}
              sx={{ minWidth: 140 }}
            >
              {t('inventory.actions.addStockItem', 'إضافة عنصر مخزون')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<TransferIcon />}
              onClick={handleTransferStock}
              sx={{ minWidth: 140 }}
            >
              {t('inventory.actions.transfer', 'نقل مخزون')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<MovementIcon />}
              onClick={handleViewMovements}
              sx={{ minWidth: 140 }}
            >
              {t('inventory.actions.movements', 'حركات المخزون')}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ReportsIcon />}
              onClick={handleViewReports}
              sx={{ minWidth: 120 }}
            >
              {t('inventory.actions.reports', 'التقارير')}
            </Button>

            <Tooltip title={t('common.actions.refresh', 'تحديث')}>
              <IconButton
                onClick={handleRefresh}
                disabled={isLoading}
                color="primary"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              {t('common.actions.filter', 'فلترة')}
            </Button>
          </Box>
        </Box>

        {/* Filters Panel */}
        {showFilters && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('inventory.filters.title', 'فلاتر المخزون')}
            </Typography>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label={t('inventory.filters.warehouse', 'المخزن')}
                  value={selectedWarehouse}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label={t('inventory.filters.status', 'الحالة')}
                  value=""
                  onChange={() => {}}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">
                    {t('inventory.filters.allStatuses', 'جميع الحالات')}
                  </MenuItem>
                  <MenuItem value="low_stock">
                    {t('inventory.status.lowStock', 'مخزون منخفض')}
                  </MenuItem>
                  <MenuItem value="out_of_stock">
                    {t('inventory.status.outOfStock', 'نفد المخزون')}
                  </MenuItem>
                  <MenuItem value="over_stock">
                    {t('inventory.status.overStock', 'مخزون زائد')}
                  </MenuItem>
                  <MenuItem value="normal">
                    {t('inventory.status.normal', 'مخزون طبيعي')}
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label={t('inventory.filters.search', 'البحث في المنتجات')}
                  placeholder={t('inventory.filters.searchPlaceholder', 'اسم المنتج أو الباركود...')}
                  fullWidth
                  size="small"
                  onChange={() => {}}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>{t('common.errors.title', 'خطأ')}</AlertTitle>
            {error}
          </Alert>
        )}

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('inventory.kpis.totalItems', 'إجمالي العناصر')}
              value={inventoryStats?.totalItems || 0}
              icon={<InventoryIcon />}
              color="primary"
              loading={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('inventory.kpis.totalValue', 'إجمالي القيمة')}
              value={inventoryStats?.totalValue || 0}
              icon={<WarehouseIcon />}
              color="success"
              format="currency"
              loading={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('inventory.kpis.lowStockItems', 'مخزون منخفض')}
              value={inventoryStats?.lowStockItems || 0}
              icon={<LowStockIcon />}
              color="warning"
              loading={isLoading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title={t('inventory.kpis.outOfStockItems', 'نفد المخزون')}
              value={inventoryStats?.outOfStockItems || 0}
              icon={<WarningIcon />}
              color="error"
              loading={isLoading}
            />
          </Grid>
        </Grid>

        {/* Alerts and Stats */}
        <Grid container spacing={3}>
          {/* Low Stock Alerts */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('inventory.alerts.lowStock.title', 'تنبيهات المخزون المنخفض')}
                </Typography>
              </Box>

              {lowStockAlerts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('inventory.alerts.lowStock.noAlerts', 'لا توجد تنبيهات مخزون منخفض حالياً')}
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {lowStockAlerts.slice(0, 5).map((alert) => (
                    <Box
                      key={alert.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 1,
                        bgcolor: 'warning.light',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {alert.productVariant.product.name} - {alert.productVariant.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.warehouse.name} • الكمية: {alert.quantity}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${alert.quantity} / ${alert.maxStock}`}
                        size="small"
                        color="warning"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Inventory Overview */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('inventory.overview.title', 'نظرة عامة على المخزون')}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                      {inventoryStats?.totalItems ? (
                        inventoryStats.totalItems - (inventoryStats.lowStockItems + inventoryStats.outOfStockItems)
                      ) : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('inventory.overview.healthyStock', 'مخزون صحي')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                      {inventoryStats?.overStockItems || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('inventory.overview.overStock', 'مخزون زائد')}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {t('inventory.overview.totalMovements', 'إجمالي الحركات اليوم')}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {inventoryStats?.totalMovements || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('inventory.quickActions.title', 'إجراءات سريعة')}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddStockItem}
                sx={{ py: 1.5 }}
              >
                {t('inventory.quickActions.addItem', 'إضافة عنصر')}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TransferIcon />}
                onClick={() => handleTransferStock()}
                sx={{ py: 1.5 }}
              >
                {t('inventory.quickActions.transfer', 'نقل مخزون')}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MovementIcon />}
                onClick={handleViewMovements}
                sx={{ py: 1.5 }}
              >
                {t('inventory.quickActions.viewMovements', 'عرض الحركات')}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ReportsIcon />}
                onClick={handleViewReports}
                sx={{ py: 1.5 }}
              >
                {t('inventory.quickActions.generateReport', 'إنشاء تقرير')}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Inventory Table */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('inventory.table.title', 'عناصر المخزون')}
          </Typography>

          <InventoryTable
            data={stockItems}
            loading={isLoading}
            onEdit={handleEditStockItem}
            onDelete={handleDeleteStockItem}
            onAdjustStock={handleAdjustStock}
            onViewMovements={handleViewMovementsForItem}
            onTransfer={handleTransferStock}
          />
        </Paper>

        {/* Stock Item Form Modal */}
        <StockItemForm
          open={formModal.open}
          onClose={() => setFormModal({ open: false, mode: 'create', stockItem: null })}
          stockItem={formModal.stockItem}
          mode={formModal.mode}
        />

        {/* Warehouse Transfer Form Modal */}
        <WarehouseTransferForm
          open={transferModal.open}
          onClose={() => setTransferModal({ open: false, stockItem: null })}
          stockItem={transferModal.stockItem}
        />
      </Box>
    </Container>
  );
};

export default Inventory;
