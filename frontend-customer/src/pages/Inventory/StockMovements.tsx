import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useInventoryStore } from '@/store';
import { Table, Column } from '@/components/ui/Table';
import type { StockMovement } from '@/services/inventory';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const StockMovements: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    warehouseId: '',
    productVariantId: '',
    movementType: '',
    search: '',
    limit: 50,
  });

  const {
    stockMovements,
    isLoading,
    error,
    fetchStockMovements,
  } = useInventoryStore();

  // Mock data for filters - should come from API
  const warehouses = [
    { id: '', name: t('inventory.allWarehouses', 'جميع المخازن') },
    { id: '1', name: 'المخزن الرئيسي' },
    { id: '2', name: 'المخزن الثانوي' },
  ];

  const movementTypes = [
    { value: '', label: t('inventory.allMovementTypes', 'جميع أنواع الحركات') },
    { value: 'in', label: t('inventory.movementTypes.in', 'وارد') },
    { value: 'out', label: t('inventory.movementTypes.out', 'صادر') },
    { value: 'adjustment', label: t('inventory.movementTypes.adjustment', 'تعديل') },
    { value: 'transfer', label: t('inventory.movementTypes.transfer', 'نقل') },
  ];

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    const filterParams = {
      warehouseId: filters.warehouseId || undefined,
      productVariantId: filters.productVariantId || undefined,
      limit: filters.limit,
    };
    await fetchStockMovements(filterParams);
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    loadMovements();
  };

  const handleClearFilters = () => {
    setFilters({
      warehouseId: '',
      productVariantId: '',
      movementType: '',
      search: '',
      limit: 50,
    });
    loadMovements();
  };

  const handleExport = () => {
    // Export functionality - will be implemented later
    console.log('Export movements');
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'error';
      case 'adjustment':
        return 'warning';
      case 'transfer':
        return 'info';
      default:
        return 'default';
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return t('inventory.movementTypes.in', 'وارد');
      case 'out':
        return t('inventory.movementTypes.out', 'صادر');
      case 'adjustment':
        return t('inventory.movementTypes.adjustment', 'تعديل');
      case 'transfer':
        return t('inventory.movementTypes.transfer', 'نقل');
      default:
        return type;
    }
  };

  const columns: Column<StockMovement>[] = [
    {
      id: 'createdAt',
      label: t('inventory.movements.date', 'التاريخ'),
      align: 'center',
      minWidth: 150,
      render: (value: string) => (
        <Typography variant="body2">
          {format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: isRTL ? ar : undefined })}
        </Typography>
      ),
    },
    {
      id: 'warehouse',
      label: t('inventory.movements.warehouse', 'المخزن'),
      minWidth: 150,
      render: (value: any, row: StockMovement) => (
        <Box>
          <Typography variant="body2">{row.warehouse.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.warehouse.code}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'productVariant',
      label: t('inventory.movements.product', 'المنتج'),
      minWidth: 200,
      render: (value: any, row: StockMovement) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.productVariant.product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.productVariant.name}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'movementType',
      label: t('inventory.movements.type', 'نوع الحركة'),
      align: 'center',
      minWidth: 120,
      render: (value: string) => (
        <Chip
          label={getMovementTypeLabel(value)}
          size="small"
          color={getMovementTypeColor(value) as any}
          variant="filled"
        />
      ),
    },
    {
      id: 'quantity',
      label: t('inventory.movements.quantity', 'الكمية'),
      align: 'center',
      minWidth: 100,
      render: (value: number, row: StockMovement) => {
        const isPositive = ['in', 'adjustment'].includes(row.movementType) && value > 0;
        const isNegative = ['out', 'transfer'].includes(row.movementType) && value < 0;

        return (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.primary',
            }}
          >
            {isPositive ? '+' : ''}{value}
          </Typography>
        );
      },
    },
    {
      id: 'referenceType',
      label: t('inventory.movements.reference', 'المرجع'),
      align: 'center',
      minWidth: 120,
      render: (value: string | undefined, row: StockMovement) => {
        if (!value) return '-';

        let label = value;
        switch (value) {
          case 'sales':
            label = t('inventory.references.sales', 'مبيعات');
            break;
          case 'purchase':
            label = t('inventory.references.purchase', 'مشتريات');
            break;
          case 'adjustment':
            label = t('inventory.references.adjustment', 'تعديل');
            break;
          case 'transfer':
            label = t('inventory.references.transfer', 'نقل');
            break;
        }

        return (
          <Box>
            <Typography variant="body2">{label}</Typography>
            {row.referenceId && (
              <Typography variant="caption" color="text.secondary">
                #{row.referenceId}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'reason',
      label: t('inventory.movements.reason', 'السبب'),
      minWidth: 150,
      render: (value: string | undefined) => (
        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'performedBy',
      label: t('inventory.movements.performedBy', 'المنفذ'),
      align: 'center',
      minWidth: 120,
      render: (value: string | undefined) => (
        <Typography variant="body2">
          {value || t('inventory.movements.system', 'النظام')}
        </Typography>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('inventory.movements.title', 'حركات المخزون')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{ minWidth: 120 }}
            >
              {t('common.actions.export', 'تصدير')}
            </Button>

            <Tooltip title={t('common.actions.refresh', 'تحديث')}>
              <IconButton
                onClick={loadMovements}
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
              {t('inventory.movements.filters.title', 'فلاتر الحركات')}
            </Typography>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label={t('inventory.filters.warehouse', 'المخزن')}
                  value={filters.warehouseId}
                  onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
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

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  label={t('inventory.movements.filters.movementType', 'نوع الحركة')}
                  value={filters.movementType}
                  onChange={(e) => handleFilterChange('movementType', e.target.value)}
                  fullWidth
                  size="small"
                >
                  {movementTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label={t('inventory.filters.search', 'البحث في المنتجات')}
                  placeholder={t('inventory.movements.filters.searchPlaceholder', 'اسم المنتج أو المرجع...')}
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleApplyFilters}
                    sx={{ flex: 1 }}
                  >
                    {t('common.actions.apply', 'تطبيق')}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    sx={{ minWidth: 100 }}
                  >
                    {t('common.actions.clear', 'مسح')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Error State */}
        {error && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
            <Typography variant="body1" color="error.contrastText">
              {t('inventory.movements.error', 'حدث خطأ في تحميل الحركات')}: {error}
            </Typography>
          </Paper>
        )}

        {/* Movements Table */}
        <Paper sx={{ p: 3 }}>
          <Table
            columns={columns}
            data={stockMovements}
            loading={isLoading}
            emptyMessage={t('inventory.movements.noData', 'لا توجد حركات مخزون')}
            stickyHeader
            maxHeight={600}
            pagination={{
              page: 0,
              rowsPerPage: filters.limit,
              total: stockMovements.length,
              onPageChange: () => {}, // Will be implemented with proper pagination
              onRowsPerPageChange: (rowsPerPage) => handleFilterChange('limit', rowsPerPage),
            }}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default StockMovements;
