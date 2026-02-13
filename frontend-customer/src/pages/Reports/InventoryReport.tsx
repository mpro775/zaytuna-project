import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useInventoryReport } from '@/services/reports';
import { useWarehouses } from '@/hooks';
import type { ReportsFilters } from '@/services/reports';

const InventoryReport: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [filters, setFilters] = useState<ReportsFilters>({});

  const { data: inventoryReport, isLoading, error, refetch } = useInventoryReport(filters);
  const { warehouses } = useWarehouses({ autoFetch: true });

  const handleFilterChange = (newFilters: Partial<ReportsFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      if (newFilters.warehouseId === '') delete updated.warehouseId;
      return updated;
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error">{t('common.error', 'حدث خطأ')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('reports.inventory.title', 'تقرير المخزون')}
        </Typography>
        <Box
          component="span"
          onClick={() => refetch()}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <RefreshIcon />
          <Typography variant="body2">{t('common.actions.refresh', 'تحديث')}</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('reports.filters.title', 'الفلاتر')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              select
              label={t('reports.inventory.warehouse', 'المخزن')}
              value={filters.warehouseId || ''}
              onChange={e => handleFilterChange({ warehouseId: e.target.value ?? '' })}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <MenuItem value="">
                <em>{t('reports.inventory.allWarehouses', 'جميع المخازن')}</em>
              </MenuItem>
              {(warehouses || []).map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : inventoryReport ? (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.inventory.totalItems', 'إجمالي المنتجات')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {inventoryReport.summary.totalItems.toLocaleString('ar-SA')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.inventory.totalValue', 'القيمة الإجمالية')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {formatCurrency(inventoryReport.summary.totalValue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.inventory.lowStock', 'منخفض المخزون')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {inventoryReport.summary.lowStockItems}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.inventory.outOfStock', 'نفد من المخزون')}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {inventoryReport.summary.outOfStockItems}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* By Warehouse */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('reports.inventory.byWarehouse', 'حسب المخزن')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('reports.inventory.warehouse', 'المخزن')}</TableCell>
                    <TableCell align="right">{t('reports.inventory.totalItems', 'إجمالي المنتجات')}</TableCell>
                    <TableCell align="right">{t('reports.inventory.totalValue', 'القيمة')}</TableCell>
                    <TableCell align="right">{t('reports.inventory.lowStock', 'منخفض المخزون')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryReport.byWarehouse.map((wh) => (
                    <TableRow key={wh.warehouseId}>
                      <TableCell>{wh.warehouseName}</TableCell>
                      <TableCell align="right">{wh.totalItems.toLocaleString('ar-SA')}</TableCell>
                      <TableCell align="right">{formatCurrency(wh.totalValue)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={wh.lowStockItems}
                          color={wh.lowStockItems > 0 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Low Stock Alerts */}
          {inventoryReport.lowStockAlerts.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('reports.inventory.lowStockAlerts', 'تنبيهات انخفاض المخزون')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('reports.inventory.product', 'المنتج')}</TableCell>
                      <TableCell>{t('reports.inventory.warehouse', 'المخزن')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.currentStock', 'الكمية الحالية')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.minStock', 'الحد الأدنى')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.reorderPoint', 'نقطة إعادة الطلب')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryReport.lowStockAlerts.map((alert) => (
                      <TableRow key={alert.productVariantId}>
                        <TableCell>{alert.productName}</TableCell>
                        <TableCell>{alert.warehouseName}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={alert.currentStock}
                            color={alert.currentStock < alert.minStock ? 'error' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{alert.minStock}</TableCell>
                        <TableCell align="right">{alert.reorderPoint}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Top Moving Products */}
          {inventoryReport.topMovingProducts?.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('reports.inventory.topMovingProducts', 'أكثر المنتجات حركة')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('reports.inventory.product', 'المنتج')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.totalIn', 'إجمالي الداخل')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.totalOut', 'إجمالي الخارج')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.netMovement', 'صافي الحركة')}</TableCell>
                      <TableCell align="right">{t('reports.inventory.currentStock', 'الكمية الحالية')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryReport.topMovingProducts.map((p) => (
                      <TableRow key={p.productId}>
                        <TableCell>{p.productName}</TableCell>
                        <TableCell align="right">{p.totalIn}</TableCell>
                        <TableCell align="right">{p.totalOut}</TableCell>
                        <TableCell align="right">{p.netMovement}</TableCell>
                        <TableCell align="right">{p.currentStock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : null}
    </Box>
  );
};

export default InventoryReport;
