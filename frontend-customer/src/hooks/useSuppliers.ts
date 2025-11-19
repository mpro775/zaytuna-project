import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { suppliersApi } from '@/services/suppliers';
import type {
  Supplier,
  SupplierFilters,
  CreateSupplierDto,
  UpdateSupplierDto,
  SuppliersResponse,
  SupplierStats,
} from '@/services/suppliers';
import { toast } from 'react-hot-toast';

export interface UseSuppliersOptions {
  filters?: SupplierFilters;
  autoFetch?: boolean;
}

export const useSuppliers = (options: UseSuppliersOptions = {}) => {
  const { filters = {}, autoFetch = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState<SupplierFilters>(filters);

  // Suppliers query
  const {
    data: suppliersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['suppliers', currentFilters],
    queryFn: () => suppliersApi.getSuppliers(currentFilters),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Stats query
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: () => suppliersApi.getSupplierStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create supplier mutation
  const createMutation = useMutation({
    mutationFn: suppliersApi.createSupplier,
    onSuccess: (newSupplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
      toast.success(t('suppliers.messages.created', 'تم إنشاء المورد بنجاح'));
      return newSupplier;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('suppliers.errors.createFailed', 'فشل في إنشاء المورد');
      toast.error(message);
    },
  });

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDto }) =>
      suppliersApi.updateSupplier(id, data),
    onSuccess: (updatedSupplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', updatedSupplier.id] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
      toast.success(t('suppliers.messages.updated', 'تم تحديث المورد بنجاح'));
      return updatedSupplier;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('suppliers.errors.updateFailed', 'فشل في تحديث المورد');
      toast.error(message);
    },
  });

  // Delete supplier mutation
  const deleteMutation = useMutation({
    mutationFn: suppliersApi.deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
      toast.success(t('suppliers.messages.deleted', 'تم حذف المورد بنجاح'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('suppliers.errors.deleteFailed', 'فشل في حذف المورد');
      toast.error(message);
    },
  });

  // Computed values
  const suppliers = suppliersData?.data || [];
  const totalSuppliers = suppliersData?.total || 0;
  const stats = statsData || {
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    totalOutstandingBalance: 0,
    averagePaymentTerms: '',
    topSuppliersByVolume: [],
  };

  // Update filters
  const updateFilters = (newFilters: Partial<SupplierFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Search suppliers
  const searchSuppliers = (query: string) => {
    updateFilters({ search: query, page: 1 });
  };

  // Filter by status
  const filterByStatus = (isActive?: boolean) => {
    updateFilters({ isActive, page: 1 });
  };

  // Filter by payment terms
  const filterByPaymentTerms = (paymentTerms?: string) => {
    updateFilters({ paymentTerms, page: 1 });
  };

  // Filter by outstanding balance
  const filterByOutstandingBalance = (hasOutstandingBalance?: boolean) => {
    updateFilters({ hasOutstandingBalance, page: 1 });
  };

  // Change page
  const changePage = (page: number) => {
    updateFilters({ page });
  };

  // Change page size
  const changePageSize = (limit: number) => {
    updateFilters({ limit, page: 1 });
  };

  // Sort suppliers
  const sortSuppliers = (sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    // Implementation depends on API support
  };

  // Get suppliers with outstanding balance
  const {
    data: suppliersWithBalance,
    isLoading: isLoadingBalance,
  } = useQuery({
    queryKey: ['suppliers-outstanding-balance'],
    queryFn: () => suppliersApi.getSuppliersWithOutstandingBalance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    suppliers,
    totalSuppliers,
    stats,
    suppliersWithBalance: suppliersWithBalance || [],

    // Loading states
    isLoading,
    isRefetching,
    isLoadingStats,
    isLoadingBalance,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Error
    error,

    // Pagination info
    pagination: {
      page: suppliersData?.page || 1,
      limit: suppliersData?.limit || 10,
      totalPages: suppliersData?.totalPages || 0,
      hasNextPage: (suppliersData?.page || 1) < (suppliersData?.totalPages || 0),
      hasPrevPage: (suppliersData?.page || 1) > 1,
    },

    // Actions
    refetch,
    updateFilters,
    searchSuppliers,
    filterByStatus,
    filterByPaymentTerms,
    filterByOutstandingBalance,
    changePage,
    changePageSize,
    sortSuppliers,

    // CRUD operations
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
  };
};

// Hook for single supplier
export const useSupplier = (id: string | undefined) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: supplier,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersApi.getSupplier(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Purchase history query
  const {
    data: purchaseHistory,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ['supplier-purchases', id],
    queryFn: () => suppliersApi.getSupplierPurchaseHistory(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update supplier mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSupplierDto) => suppliersApi.updateSupplier(id!, data),
    onSuccess: (updatedSupplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      toast.success(t('suppliers.messages.updated', 'تم تحديث المورد بنجاح'));
      return updatedSupplier;
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('suppliers.errors.updateFailed', 'فشل في تحديث المورد');
      toast.error(message);
    },
  });

  return {
    supplier,
    purchaseHistory: purchaseHistory || [],
    isLoading,
    isLoadingHistory,
    error,
    refetch,
    isUpdating: updateMutation.isPending,
    updateSupplier: updateMutation.mutate,
  };
};
