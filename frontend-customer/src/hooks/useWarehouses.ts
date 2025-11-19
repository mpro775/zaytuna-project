import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { warehousesApi } from '@/services/warehouses';
import type {
  Warehouse,
  WarehouseFilters,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  TransferStockDto,
  WarehousesResponse,
  WarehouseStats,
  StockItem,
} from '@/services/warehouses';
import { toast } from 'react-hot-toast';

export interface UseWarehousesOptions {
  filters?: WarehouseFilters;
  autoFetch?: boolean;
}

export const useWarehouses = (options: UseWarehousesOptions = {}) => {
  const { filters = {}, autoFetch = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState<WarehouseFilters>(filters);

  // Warehouses query
  const {
    data: warehousesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['warehouses', currentFilters],
    queryFn: () => warehousesApi.getWarehouses(currentFilters),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Stats query
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['warehouse-stats'],
    queryFn: () => warehousesApi.getWarehouseStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create warehouse mutation
  const createMutation = useMutation({
    mutationFn: warehousesApi.createWarehouse,
    onSuccess: (newWarehouse) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      toast.success(t('warehouses.messages.created', 'تم إنشاء المخزن بنجاح'));
      return newWarehouse;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.createFailed', 'فشل في إنشاء المخزن');
      toast.error(message);
    },
  });

  // Update warehouse mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseDto }) =>
      warehousesApi.updateWarehouse(id, data),
    onSuccess: (updatedWarehouse) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', updatedWarehouse.id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      toast.success(t('warehouses.messages.updated', 'تم تحديث المخزن بنجاح'));
      return updatedWarehouse;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.updateFailed', 'فشل في تحديث المخزن');
      toast.error(message);
    },
  });

  // Delete warehouse mutation
  const deleteMutation = useMutation({
    mutationFn: warehousesApi.deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      toast.success(t('warehouses.messages.deleted', 'تم حذف المخزن بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.deleteFailed', 'فشل في حذف المخزن');
      toast.error(message);
    },
  });

  // Transfer stock mutation
  const transferStockMutation = useMutation({
    mutationFn: warehousesApi.transferStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success(t('warehouses.messages.stockTransferred', 'تم نقل المخزون بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.transferFailed', 'فشل في نقل المخزون');
      toast.error(message);
    },
  });

  // Switch warehouse mutation
  const switchWarehouseMutation = useMutation({
    mutationFn: warehousesApi.switchToWarehouse,
    onSuccess: (warehouseId) => {
      // Update local storage and invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-context'] });
      toast.success(t('warehouses.messages.switched', 'تم تبديل المخزن بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.switchFailed', 'فشل في تبديل المخزن');
      toast.error(message);
    },
  });

  // Computed values
  const warehouses = warehousesData?.data || [];
  const totalWarehouses = warehousesData?.total || 0;
  const stats = statsData || {
    totalWarehouses: 0,
    activeWarehouses: 0,
    inactiveWarehouses: 0,
    totalStockValue: 0,
    lowStockAlerts: 0,
    outOfStockAlerts: 0,
  };

  // Update filters
  const updateFilters = (newFilters: Partial<WarehouseFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Search warehouses
  const searchWarehouses = (query: string) => {
    updateFilters({ search: query, page: 1 });
  };

  // Filter by status
  const filterByStatus = (isActive?: boolean) => {
    updateFilters({ isActive, page: 1 });
  };

  // Filter by branch
  const filterByBranch = (branchId: string) => {
    updateFilters({ branchId, page: 1 });
  };

  // Change page
  const changePage = (page: number) => {
    updateFilters({ page });
  };

  // Change page size
  const changePageSize = (limit: number) => {
    updateFilters({ limit, page: 1 });
  };

  // Sort warehouses
  const sortWarehouses = (sortBy: WarehouseFilters['sortBy'], sortOrder: WarehouseFilters['sortOrder'] = 'asc') => {
    updateFilters({ sortBy, sortOrder });
  };

  // Get current selected warehouse
  const currentWarehouseId = warehousesApi.getCurrentWarehouse();
  const currentWarehouse = useMemo(() => {
    return warehouses.find(warehouse => warehouse.id === currentWarehouseId) || null;
  }, [warehouses, currentWarehouseId]);

  return {
    // Data
    warehouses,
    totalWarehouses,
    currentWarehouse,
    currentWarehouseId,
    stats,

    // Loading states
    isLoading,
    isRefetching,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isTransferring: transferStockMutation.isPending,
    isSwitching: switchWarehouseMutation.isPending,

    // Error
    error,

    // Pagination info
    pagination: {
      page: warehousesData?.page || 1,
      limit: warehousesData?.limit || 10,
      totalPages: warehousesData?.totalPages || 0,
      hasNextPage: (warehousesData?.page || 1) < (warehousesData?.totalPages || 0),
      hasPrevPage: (warehousesData?.page || 1) > 1,
    },

    // Actions
    refetch,
    updateFilters,
    searchWarehouses,
    filterByStatus,
    filterByBranch,
    changePage,
    changePageSize,
    sortWarehouses,

    // CRUD operations
    createWarehouse: createMutation.mutate,
    updateWarehouse: updateMutation.mutate,
    deleteWarehouse: deleteMutation.mutate,
    transferStock: transferStockMutation.mutate,
    switchToWarehouse: switchWarehouseMutation.mutate,
  };
};

// Hook for single warehouse
export const useWarehouse = (id: string | undefined) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: warehouse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehousesApi.getWarehouse(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Get stock items by warehouse
  const {
    data: stockItems,
    isLoading: isLoadingStock,
    refetch: refetchStock,
  } = useQuery({
    queryKey: ['warehouse-stock', id],
    queryFn: () => warehousesApi.getStockItemsByWarehouse(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update warehouse mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateWarehouseDto) => warehousesApi.updateWarehouse(id!, data),
    onSuccess: (updatedWarehouse) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] });
      toast.success(t('warehouses.messages.updated', 'تم تحديث المخزن بنجاح'));
      return updatedWarehouse;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.updateFailed', 'فشل في تحديث المخزن');
      toast.error(message);
    },
  });

  // Transfer stock mutation
  const transferStockMutation = useMutation({
    mutationFn: (data: Omit<TransferStockDto, 'fromWarehouseId'>) =>
      warehousesApi.transferStock({ ...data, fromWarehouseId: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-stock', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      toast.success(t('warehouses.messages.stockTransferred', 'تم نقل المخزون بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('warehouses.errors.transferFailed', 'فشل في نقل المخزون');
      toast.error(message);
    },
  });

  return {
    warehouse,
    stockItems: stockItems || [],
    isLoading,
    isLoadingStock,
    error,
    refetch,
    refetchStock,
    isUpdating: updateMutation.isPending,
    isTransferring: transferStockMutation.isPending,
    updateWarehouse: updateMutation.mutate,
    transferStock: transferStockMutation.mutate,
  };
};
