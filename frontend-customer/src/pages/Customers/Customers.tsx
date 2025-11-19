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
  Loyalty as LoyaltyIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@/hooks';
import type { Customer } from '@/services/customers';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Customers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  // State
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [loyaltyFilter, setLoyaltyFilter] = useState('');

  const {
    customers,
    totalCustomers,
    stats,
    isLoading,
    isRefetching,
    pagination,
    refetch,
    searchCustomers,
    filterByStatus,
    filterByLoyaltyTier,
    changePage,
    changePageSize,
    deleteCustomer,
    getTierColor,
    getTierLabel,
  } = useCustomers({
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
    searchCustomers(query);
  };

  const handleStatusFilter = (isActive: boolean | '') => {
    setStatusFilter(isActive);
    filterByStatus(isActive === '' ? undefined : isActive);
  };

  const handleLoyaltyFilter = (tier: string) => {
    setLoyaltyFilter(tier);
    filterByLoyaltyTier(tier || undefined);
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    setSelectedCustomers(prev =>
      checked
        ? [...prev, customerId]
        : prev.filter(id => id !== customerId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedCustomers(checked ? customers.map(c => c.id) : []);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteDialogOpen(true);
    // Store the customer to delete
    (window as any).customerToDelete = customer;
  };

  const confirmDeleteCustomer = () => {
    const customer = (window as any).customerToDelete;
    if (customer) {
      deleteCustomer(customer.id);
      setDeleteDialogOpen(false);
      delete (window as any).customerToDelete;
    }
  };

  const handleBulkDelete = () => {
    if (selectedCustomers.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    // Implement bulk delete logic
    selectedCustomers.forEach(customerId => deleteCustomer(customerId));
    setBulkDeleteDialogOpen(false);
    setSelectedCustomers([]);
  };

  const handleEditCustomer = (customer: Customer) => {
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleCreateCustomer = () => {
    navigate('/customers/new');
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
          {t('customers.title', 'إدارة العملاء')}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCustomer}
          sx={{ minWidth: 140 }}
        >
          {t('customers.actions.addCustomer', 'إضافة عميل')}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {stats.totalCustomers}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('customers.stats.total', 'إجمالي العملاء')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
            {stats.activeCustomers}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('customers.stats.active', 'عملاء نشطون')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(stats.averagePurchaseValue)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('customers.stats.averagePurchase', 'متوسط المشتريات')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
            {stats.totalLoyaltyPoints}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('customers.stats.loyaltyPoints', 'نقاط الولاء')}
          </Typography>
        </Paper>
      </Box>

      {/* Loyalty Tier Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('customers.loyaltyDistribution', 'توزيع مستويات الولاء')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${t('customers.tiers.platinum', 'بلاتيني')}: ${stats.topTierDistribution.platinum}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${t('customers.tiers.gold', 'ذهبي')}: ${stats.topTierDistribution.gold}`}
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`${t('customers.tiers.silver', 'فضي')}: ${stats.topTierDistribution.silver}`}
            color="info"
            variant="outlined"
          />
          <Chip
            label={`${t('customers.tiers.bronze', 'برونزي')}: ${stats.topTierDistribution.bronze}`}
            color="error"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('customers.search.placeholder', 'البحث في العملاء...')}
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
            label={t('customers.filters.status', 'الحالة')}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">
              <em>{t('customers.filters.allStatuses', 'جميع الحالات')}</em>
            </MenuItem>
            <MenuItem value="true">{t('customers.status.active', 'نشط')}</MenuItem>
            <MenuItem value="false">{t('customers.status.inactive', 'غير نشط')}</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label={t('customers.filters.loyaltyTier', 'مستوى الولاء')}
            value={loyaltyFilter}
            onChange={(e) => handleLoyaltyFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">
              <em>{t('customers.filters.allTiers', 'جميع المستويات')}</em>
            </MenuItem>
            <MenuItem value="platinum">{t('customers.tiers.platinum', 'بلاتيني')}</MenuItem>
            <MenuItem value="gold">{t('customers.tiers.gold', 'ذهبي')}</MenuItem>
            <MenuItem value="silver">{t('customers.tiers.silver', 'فضي')}</MenuItem>
            <MenuItem value="bronze">{t('customers.tiers.bronze', 'برونزي')}</MenuItem>
          </TextField>

          <Tooltip title={t('common.actions.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading || isRefetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Bulk Actions */}
        {selectedCustomers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('customers.selectedCount', '{{count}} عميل محدد', { count: selectedCustomers.length })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                {t('customers.actions.bulkDelete', 'حذف المحدد')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Customers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    indeterminate={selectedCustomers.length > 0 && selectedCustomers.length < customers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>{t('customers.table.name', 'اسم العميل')}</TableCell>
                <TableCell>{t('customers.table.contact', 'التواصل')}</TableCell>
                <TableCell>{t('customers.table.loyalty', 'الولاء')}</TableCell>
                <TableCell>{t('customers.table.purchases', 'المشتريات')}</TableCell>
                <TableCell>{t('customers.table.status', 'الحالة')}</TableCell>
                <TableCell>{t('customers.table.createdAt', 'تاريخ الإنشاء')}</TableCell>
                <TableCell align="center">{t('customers.table.actions', 'الإجراءات')}</TableCell>
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
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('customers.noCustomers', 'لا يوجد عملاء')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {customer.name}
                        </Typography>
                        {customer.taxNumber && (
                          <Typography variant="caption" color="text.secondary">
                            {t('customers.taxNumber', 'الرقم الضريبي')}: {customer.taxNumber}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{customer.phone}</Typography>
                          </Box>
                        )}
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{customer.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={getTierLabel(customer.loyaltyTier)}
                          color={getTierColor(customer.loyaltyTier)}
                          size="small"
                          icon={<LoyaltyIcon />}
                        />
                        {customer.loyaltyPoints && (
                          <Typography variant="caption" color="text.secondary">
                            {customer.loyaltyPoints} {t('customers.points', 'نقطة')}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShoppingCartIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {formatCurrency(customer.totalPurchases || 0)}
                          </Typography>
                          {customer.lastPurchaseDate && (
                            <Typography variant="caption" color="text.secondary">
                              {t('customers.lastPurchase', 'آخر شراء')}: {formatDate(customer.lastPurchaseDate)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={customer.isActive}
                            size="small"
                            disabled // Will implement toggle functionality
                          />
                        }
                        label={customer.isActive ? t('customers.status.active', 'نشط') : t('customers.status.inactive', 'غير نشط')}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(customer.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.actions.edit', 'تعديل')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditCustomer(customer)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.actions.delete', 'حذف')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCustomer(customer)}
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
          count={totalCustomers}
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

      {/* Delete Customer Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('customers.confirmDelete.title', 'تأكيد الحذف')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customers.confirmDelete.message', 'هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDeleteCustomer} color="error" variant="contained">
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
        <DialogTitle>{t('customers.confirmBulkDelete.title', 'تأكيد الحذف الجماعي')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('customers.confirmBulkDelete.message', 'هل أنت متأكد من حذف {{count}} عميل؟ لا يمكن التراجع عن هذا الإجراء.', {
              count: selectedCustomers.length,
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

export default Customers;
