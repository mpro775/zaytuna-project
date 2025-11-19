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
  Email as EmailIcon,
  Phone as PhoneIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSuppliers } from '@/hooks';
import type { Supplier } from '@/services/suppliers';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Suppliers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  // State
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [balanceFilter, setBalanceFilter] = useState<boolean | ''>('');

  const {
    suppliers,
    totalSuppliers,
    stats,
    suppliersWithBalance,
    isLoading,
    isRefetching,
    pagination,
    refetch,
    searchSuppliers,
    filterByStatus,
    filterByOutstandingBalance,
    changePage,
    changePageSize,
    deleteSupplier,
  } = useSuppliers({
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
    searchSuppliers(query);
  };

  const handleStatusFilter = (isActive: boolean | '') => {
    setStatusFilter(isActive);
    filterByStatus(isActive === '' ? undefined : isActive);
  };

  const handleBalanceFilter = (hasBalance: boolean | '') => {
    setBalanceFilter(hasBalance);
    filterByOutstandingBalance(hasBalance === '' ? undefined : hasBalance);
  };

  const handleSelectSupplier = (supplierId: string, checked: boolean) => {
    setSelectedSuppliers(prev =>
      checked
        ? [...prev, supplierId]
        : prev.filter(id => id !== supplierId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedSuppliers(checked ? suppliers.map(s => s.id) : []);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setDeleteDialogOpen(true);
    // Store the supplier to delete
    (window as any).supplierToDelete = supplier;
  };

  const confirmDeleteSupplier = () => {
    const supplier = (window as any).supplierToDelete;
    if (supplier) {
      deleteSupplier(supplier.id);
      setDeleteDialogOpen(false);
      delete (window as any).supplierToDelete;
    }
  };

  const handleBulkDelete = () => {
    if (selectedSuppliers.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    // Implement bulk delete logic
    selectedSuppliers.forEach(supplierId => deleteSupplier(supplierId));
    setBulkDeleteDialogOpen(false);
    setSelectedSuppliers([]);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    navigate(`/suppliers/${supplier.id}/edit`);
  };

  const handleCreateSupplier = () => {
    navigate('/suppliers/new');
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
          {t('suppliers.title', 'إدارة الموردين')}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSupplier}
          sx={{ minWidth: 140 }}
        >
          {t('suppliers.actions.addSupplier', 'إضافة مورد')}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {stats.totalSuppliers}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('suppliers.stats.total', 'إجمالي الموردين')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
            {stats.activeSuppliers}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('suppliers.stats.active', 'موردون نشطون')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(stats.totalOutstandingBalance)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('suppliers.stats.outstandingBalance', 'الرصيد المستحق')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
            {suppliersWithBalance.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('suppliers.stats.withBalance', 'موردون برصيد')}
          </Typography>
        </Paper>
      </Box>

      {/* Outstanding Balance Alert */}
      {suppliersWithBalance.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light' }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'warning.dark' }}>
            {t('suppliers.outstandingBalanceAlert', 'تنبيه الأرصدة المستحقة')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('suppliers.outstandingBalanceMessage', 'يوجد {{count}} مورد لديهم أرصدة مستحقة تحتاج للمتابعة.', {
              count: suppliersWithBalance.length,
            })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {suppliersWithBalance.slice(0, 5).map((supplier) => (
              <Chip
                key={supplier.id}
                label={`${supplier.name}: ${formatCurrency(supplier.outstandingBalance || 0)}`}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
            {suppliersWithBalance.length > 5 && (
              <Chip
                label={`+${suppliersWithBalance.length - 5} ${t('suppliers.more', 'أخرى')}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('suppliers.search.placeholder', 'البحث في الموردين...')}
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
            label={t('suppliers.filters.status', 'الحالة')}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">
              <em>{t('suppliers.filters.allStatuses', 'جميع الحالات')}</em>
            </MenuItem>
            <MenuItem value="true">{t('suppliers.status.active', 'نشط')}</MenuItem>
            <MenuItem value="false">{t('suppliers.status.inactive', 'غير نشط')}</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label={t('suppliers.filters.balance', 'الرصيد')}
            value={balanceFilter}
            onChange={(e) => handleBalanceFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">
              <em>{t('suppliers.filters.allBalances', 'جميع الأرصدة')}</em>
            </MenuItem>
            <MenuItem value="true">{t('suppliers.filters.hasBalance', 'لديه رصيد')}</MenuItem>
            <MenuItem value="false">{t('suppliers.filters.noBalance', 'بدون رصيد')}</MenuItem>
          </TextField>

          <Tooltip title={t('common.actions.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading || isRefetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Bulk Actions */}
        {selectedSuppliers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('suppliers.selectedCount', '{{count}} مورد محدد', { count: selectedSuppliers.length })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                {t('suppliers.actions.bulkDelete', 'حذف المحدد')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Suppliers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
                    indeterminate={selectedSuppliers.length > 0 && selectedSuppliers.length < suppliers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>{t('suppliers.table.name', 'اسم المورد')}</TableCell>
                <TableCell>{t('suppliers.table.contact', 'التواصل')}</TableCell>
                <TableCell>{t('suppliers.table.paymentTerms', 'شروط الدفع')}</TableCell>
                <TableCell>{t('suppliers.table.financial', 'المعاملات المالية')}</TableCell>
                <TableCell>{t('suppliers.table.status', 'الحالة')}</TableCell>
                <TableCell>{t('suppliers.table.createdAt', 'تاريخ الإنشاء')}</TableCell>
                <TableCell align="center">{t('suppliers.table.actions', 'الإجراءات')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('common.loading', 'جارٍ التحميل...')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('suppliers.noSuppliers', 'لا يوجد موردون')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedSuppliers.includes(supplier.id)}
                        onChange={(e) => handleSelectSupplier(supplier.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {supplier.name}
                        </Typography>
                        {supplier.contactName && (
                          <Typography variant="caption" color="text.secondary">
                            {t('suppliers.contactPerson', 'الشخص المسؤول')}: {supplier.contactName}
                          </Typography>
                        )}
                        {supplier.taxNumber && (
                          <Typography variant="caption" color="text.secondary">
                            {t('suppliers.taxNumber', 'الرقم الضريبي')}: {supplier.taxNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {supplier.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{supplier.phone}</Typography>
                          </Box>
                        )}
                        {supplier.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{supplier.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {supplier.paymentTerms || t('suppliers.noPaymentTerms', 'غير محدد')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalanceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2">
                              {t('suppliers.outstandingBalance', 'مستحق')}: {formatCurrency(supplier.outstandingBalance || 0)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ShoppingCartIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Box>
                            <Typography variant="body2">
                              {t('suppliers.totalPurchases', 'المشتريات')}: {formatCurrency(supplier.totalPurchases || 0)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={supplier.isActive}
                            size="small"
                            disabled // Will implement toggle functionality
                          />
                        }
                        label={supplier.isActive ? t('suppliers.status.active', 'نشط') : t('suppliers.status.inactive', 'غير نشط')}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(supplier.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.actions.edit', 'تعديل')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditSupplier(supplier)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.actions.delete', 'حذف')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSupplier(supplier)}
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
          count={totalSuppliers}
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

      {/* Delete Supplier Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('suppliers.confirmDelete.title', 'تأكيد الحذف')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('suppliers.confirmDelete.message', 'هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDeleteSupplier} color="error" variant="contained">
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
        <DialogTitle>{t('suppliers.confirmBulkDelete.title', 'تأكيد الحذف الجماعي')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('suppliers.confirmBulkDelete.message', 'هل أنت متأكد من حذف {{count}} مورد؟ لا يمكن التراجع عن هذا الإجراء.', {
              count: selectedSuppliers.length,
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

export default Suppliers;
