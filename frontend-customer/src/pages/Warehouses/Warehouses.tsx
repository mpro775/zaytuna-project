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
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useWarehouses } from '@/hooks';
import type { Warehouse } from '@/services/inventory';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Warehouses: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  // State
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [branchFilter, setBranchFilter] = useState('');

  const {
    warehouses,
    totalWarehouses,
    stats,
    isLoading,
    isRefetching,
    pagination,
    refetch,
    searchWarehouses,
    filterByStatus,
    filterByBranch,
    changePage,
    changePageSize,
    deleteWarehouse,
  } = useWarehouses({
    filters: {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  });

  // Get unique branches for filter
  const branches = Array.from(
    new Set(warehouses.map(w => w.branch?.id).filter(Boolean))
  ).map(branchId => {
    const warehouse = warehouses.find(w => w.branch?.id === branchId);
    return warehouse?.branch;
  }).filter(Boolean);

  // Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchWarehouses(query);
  };

  const handleStatusFilter = (isActive: boolean | '') => {
    setStatusFilter(isActive);
    filterByStatus(isActive === '' ? undefined : isActive);
  };

  const handleBranchFilter = (branchId: string) => {
    setBranchFilter(branchId);
    filterByBranch(branchId);
  };

  const handleSelectWarehouse = (warehouseId: string, checked: boolean) => {
    setSelectedWarehouses(prev =>
      checked
        ? [...prev, warehouseId]
        : prev.filter(id => id !== warehouseId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedWarehouses(checked ? warehouses.map(w => w.id) : []);
  };

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    setDeleteDialogOpen(true);
    // Store the warehouse to delete
    (window as any).warehouseToDelete = warehouse;
  };

  const confirmDeleteWarehouse = () => {
    const warehouse = (window as any).warehouseToDelete;
    if (warehouse) {
      deleteWarehouse(warehouse.id);
      setDeleteDialogOpen(false);
      delete (window as any).warehouseToDelete;
    }
  };

  const handleBulkDelete = () => {
    if (selectedWarehouses.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    // Implement bulk delete logic
    selectedWarehouses.forEach(warehouseId => deleteWarehouse(warehouseId));
    setBulkDeleteDialogOpen(false);
    setSelectedWarehouses([]);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    navigate(`/warehouses/${warehouse.id}/edit`);
  };

  const handleCreateWarehouse = () => {
    navigate('/warehouses/new');
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('warehouses.title', 'إدارة المخازن')}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateWarehouse}
          sx={{ minWidth: 140 }}
        >
          {t('warehouses.actions.addWarehouse', 'إضافة مخزن')}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {stats.totalWarehouses}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('warehouses.stats.total', 'إجمالي المخازن')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
            {stats.activeWarehouses}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('warehouses.stats.active', 'مخازن نشطة')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(stats.totalStockValue)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('warehouses.stats.stockValue', 'قيمة المخزون')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
            {stats.lowStockAlerts + stats.outOfStockAlerts}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('warehouses.stats.alerts', 'تنبيهات المخزون')}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('warehouses.search.placeholder', 'البحث في المخازن...')}
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
            label={t('warehouses.filters.branch', 'الفرع')}
            value={branchFilter}
            onChange={(e) => handleBranchFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">
              <em>{t('warehouses.filters.allBranches', 'جميع الفروع')}</em>
            </MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch!.id} value={branch!.id}>
                {branch!.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label={t('warehouses.filters.status', 'الحالة')}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">
              <em>{t('warehouses.filters.allStatuses', 'جميع الحالات')}</em>
            </MenuItem>
            <MenuItem value="true">{t('warehouses.status.active', 'نشط')}</MenuItem>
            <MenuItem value="false">{t('warehouses.status.inactive', 'غير نشط')}</MenuItem>
          </TextField>

          <Tooltip title={t('common.actions.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading || isRefetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Bulk Actions */}
        {selectedWarehouses.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('warehouses.selectedCount', '{{count}} مخزن محدد', { count: selectedWarehouses.length })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                {t('warehouses.actions.bulkDelete', 'حذف المحدد')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Warehouses Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedWarehouses.length === warehouses.length && warehouses.length > 0}
                    indeterminate={selectedWarehouses.length > 0 && selectedWarehouses.length < warehouses.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>{t('warehouses.table.code', 'الكود')}</TableCell>
                <TableCell>{t('warehouses.table.name', 'اسم المخزن')}</TableCell>
                <TableCell>{t('warehouses.table.branch', 'الفرع')}</TableCell>
                <TableCell>{t('warehouses.table.contact', 'التواصل')}</TableCell>
                <TableCell>{t('warehouses.table.stock', 'المخزون')}</TableCell>
                <TableCell>{t('warehouses.table.status', 'الحالة')}</TableCell>
                <TableCell>{t('warehouses.table.createdAt', 'تاريخ الإنشاء')}</TableCell>
                <TableCell align="center">{t('warehouses.table.actions', 'الإجراءات')}</TableCell>
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
              ) : warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('warehouses.noWarehouses', 'لا توجد مخازن')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedWarehouses.includes(warehouse.id)}
                        onChange={(e) => handleSelectWarehouse(warehouse.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={warehouse.code}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {warehouse.name}
                        </Typography>
                        {warehouse.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {warehouse.address}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {warehouse.branch && (
                        <Chip
                          icon={<BusinessIcon />}
                          label={warehouse.branch.name}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {warehouse.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{warehouse.phone}</Typography>
                          </Box>
                        )}
                        {warehouse.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{warehouse.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={<InventoryIcon />}
                          label={`${warehouse.totalStock || 0}`}
                          size="small"
                          variant="outlined"
                        />
                        {(warehouse.lowStockItems || 0) > 0 && (
                          <Chip
                            label={`${warehouse.lowStockItems}`}
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={warehouse.isActive}
                            size="small"
                            disabled // Will implement toggle functionality
                          />
                        }
                        label={warehouse.isActive ? t('warehouses.status.active', 'نشط') : t('warehouses.status.inactive', 'غير نشط')}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(warehouse.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.actions.edit', 'تعديل')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditWarehouse(warehouse)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.actions.delete', 'حذف')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteWarehouse(warehouse)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalWarehouses}
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

      {/* Delete Warehouse Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('warehouses.confirmDelete.title', 'تأكيد الحذف')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('warehouses.confirmDelete.message', 'هل أنت متأكد من حذف هذا المخزن؟ لا يمكن التراجع عن هذا الإجراء.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDeleteWarehouse} color="error" variant="contained">
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
        <DialogTitle>{t('warehouses.confirmBulkDelete.title', 'تأكيد الحذف الجماعي')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('warehouses.confirmBulkDelete.message', 'هل أنت متأكد من حذف {{count}} مخزن؟ لا يمكن التراجع عن هذا الإجراء.', {
              count: selectedWarehouses.length,
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
    </Box>
  );
};

export default Warehouses;
