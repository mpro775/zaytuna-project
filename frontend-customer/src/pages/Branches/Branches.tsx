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
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBranches } from '@/hooks';
import type { Branch } from '@/services/branches';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Branches: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  // State
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');

  const {
    branches,
    totalBranches,
    stats,
    isLoading,
    isRefetching,
    pagination,
    refetch,
    searchBranches,
    filterByStatus,
    changePage,
    changePageSize,
    deleteBranch,
  } = useBranches({
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
    searchBranches(query);
  };

  const handleStatusFilter = (isActive: boolean | '') => {
    setStatusFilter(isActive);
    filterByStatus(isActive === '' ? undefined : isActive);
  };

  const handleSelectBranch = (branchId: string, checked: boolean) => {
    setSelectedBranches(prev =>
      checked
        ? [...prev, branchId]
        : prev.filter(id => id !== branchId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedBranches(checked ? branches.map(b => b.id) : []);
  };

  const handleDeleteBranch = (branch: Branch) => {
    setDeleteDialogOpen(true);
    // Store the branch to delete
    (window as any).branchToDelete = branch;
  };

  const confirmDeleteBranch = () => {
    const branch = (window as any).branchToDelete;
    if (branch) {
      deleteBranch(branch.id);
      setDeleteDialogOpen(false);
      delete (window as any).branchToDelete;
    }
  };

  const handleBulkDelete = () => {
    if (selectedBranches.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    // Implement bulk delete logic
    selectedBranches.forEach(branchId => deleteBranch(branchId));
    setBulkDeleteDialogOpen(false);
    setSelectedBranches([]);
  };

  const handleEditBranch = (branch: Branch) => {
    navigate(`/branches/${branch.id}/edit`);
  };

  const handleCreateBranch = () => {
    navigate('/branches/new');
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ar });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {t('branches.title', 'إدارة الفروع')}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateBranch}
          sx={{ minWidth: 140 }}
        >
          {t('branches.actions.addBranch', 'إضافة فرع')}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {stats.totalBranches}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('branches.stats.total', 'إجمالي الفروع')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
            {stats.activeBranches}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('branches.stats.active', 'فروع نشطة')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {stats.totalWarehouses}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('branches.stats.warehouses', 'إجمالي المخازن')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
            {stats.totalUsers}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('branches.stats.users', 'إجمالي المستخدمين')}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('branches.search.placeholder', 'البحث في الفروع...')}
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
            label={t('branches.filters.status', 'الحالة')}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value === '' ? '' : e.target.value === 'true')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">
              <em>{t('branches.filters.allStatuses', 'جميع الحالات')}</em>
            </MenuItem>
            <MenuItem value="true">{t('branches.status.active', 'نشط')}</MenuItem>
            <MenuItem value="false">{t('branches.status.inactive', 'غير نشط')}</MenuItem>
          </TextField>

          <Tooltip title={t('common.actions.refresh', 'تحديث')}>
            <IconButton onClick={() => refetch()} disabled={isLoading || isRefetching}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Bulk Actions */}
        {selectedBranches.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('branches.selectedCount', '{{count}} فرع محدد', { count: selectedBranches.length })}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleBulkDelete}
                startIcon={<DeleteIcon />}
              >
                {t('branches.actions.bulkDelete', 'حذف المحدد')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Branches Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedBranches.length === branches.length && branches.length > 0}
                    indeterminate={selectedBranches.length > 0 && selectedBranches.length < branches.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>{t('branches.table.code', 'الكود')}</TableCell>
                <TableCell>{t('branches.table.name', 'اسم الفرع')}</TableCell>
                <TableCell>{t('branches.table.contact', 'التواصل')}</TableCell>
                <TableCell>{t('branches.table.stats', 'الإحصائيات')}</TableCell>
                <TableCell>{t('branches.table.status', 'الحالة')}</TableCell>
                <TableCell>{t('branches.table.createdAt', 'تاريخ الإنشاء')}</TableCell>
                <TableCell align="center">{t('branches.table.actions', 'الإجراءات')}</TableCell>
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
              ) : branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('branches.noBranches', 'لا توجد فروع')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedBranches.includes(branch.id)}
                        onChange={(e) => handleSelectBranch(branch.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={branch.code}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {branch.name}
                        </Typography>
                        {branch.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {branch.address}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {branch.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{branch.phone}</Typography>
                          </Box>
                        )}
                        {branch.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">{branch.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          icon={<WarehouseIcon />}
                          label={`${branch.warehousesCount || 0}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<PeopleIcon />}
                          label={`${branch.usersCount || 0}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={branch.isActive}
                            size="small"
                            disabled // Will implement toggle functionality
                          />
                        }
                        label={branch.isActive ? t('branches.status.active', 'نشط') : t('branches.status.inactive', 'غير نشط')}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(branch.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.actions.edit', 'تعديل')}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditBranch(branch)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.actions.delete', 'حذف')}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteBranch(branch)}
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
          count={totalBranches}
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

      {/* Delete Branch Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogTitle>{t('branches.confirmDelete.title', 'تأكيد الحذف')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('branches.confirmDelete.message', 'هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.actions.cancel', 'إلغاء')}
          </Button>
          <Button onClick={confirmDeleteBranch} color="error" variant="contained">
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
        <DialogTitle>{t('branches.confirmBulkDelete.title', 'تأكيد الحذف الجماعي')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('branches.confirmBulkDelete.message', 'هل أنت متأكد من حذف {{count}} فرع؟ لا يمكن التراجع عن هذا الإجراء.', {
              count: selectedBranches.length,
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

export default Branches;
