import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { branchesApi } from '@/services/branches';
import type {
  BranchFilters,
  UpdateBranchDto,
} from '@/services/branches';
import { toast } from 'react-hot-toast';

export interface UseBranchesOptions {
  filters?: BranchFilters;
  autoFetch?: boolean;
}

export const useBranches = (options: UseBranchesOptions = {}) => {
  const { filters = {}, autoFetch = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState<BranchFilters>(filters);

  // Branches query
  const {
    data: branchesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['branches', currentFilters],
    queryFn: () => branchesApi.getBranches(currentFilters),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Stats query
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['branch-stats'],
    queryFn: () => branchesApi.getBranchStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create branch mutation
  const createMutation = useMutation({
    mutationFn: branchesApi.createBranch,
    onSuccess: (newBranch) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch-stats'] });
      toast.success(t('branches.messages.created', 'تم إنشاء الفرع بنجاح'));
      return newBranch;
    },
    onError: (error: Error) => {
      const message = error.message || t('branches.errors.createFailed', 'فشل في إنشاء الفرع');
      toast.error(message);
    },
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchDto }) =>
      branchesApi.updateBranch(id, data),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', updatedBranch.id] });
      queryClient.invalidateQueries({ queryKey: ['branch-stats'] });
      toast.success(t('branches.messages.updated', 'تم تحديث الفرع بنجاح'));
      return updatedBranch;
    },
    onError: (error: Error) => {
      const message = error.message || t('branches.errors.updateFailed', 'فشل في تحديث الفرع');
      toast.error(message);
    },
  });

  // Delete branch mutation
  const deleteMutation = useMutation({
    mutationFn: branchesApi.deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch-stats'] });
      toast.success(t('branches.messages.deleted', 'تم حذف الفرع بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('branches.errors.deleteFailed', 'فشل في حذف الفرع');
      toast.error(message);
    },
  });

  // Switch branch mutation
  const switchBranchMutation = useMutation({
    mutationFn: branchesApi.switchToBranch,
    onSuccess: () => {
      // Update local storage and invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-context'] });
      toast.success(t('branches.messages.switched', 'تم تبديل الفرع بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('branches.errors.switchFailed', 'فشل في تبديل الفرع');
      toast.error(message);
    },
  });

  // Computed values
  const branches = useMemo(() => branchesData?.data || [], [branchesData?.data]);
  const totalBranches = branchesData?.total || 0;
  const stats = statsData || {
    totalBranches: 0,
    activeBranches: 0,
    inactiveBranches: 0,
    totalWarehouses: 0,
    totalUsers: 0,
  };

  // Update filters
  const updateFilters = (newFilters: Partial<BranchFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Search branches
  const searchBranches = (query: string) => {
    updateFilters({ search: query, page: 1 });
  };

  // Filter by status
  const filterByStatus = (isActive?: boolean) => {
    updateFilters({
      ...(isActive !== undefined && { isActive }),
      page: 1,
    });
  };

  // Filter by company
  const filterByCompany = (companyId: string) => {
    updateFilters({ companyId, page: 1 });
  };

  // Change page
  const changePage = (page: number) => {
    updateFilters({ page });
  };

  // Change page size
  const changePageSize = (limit: number) => {
    updateFilters({ limit, page: 1 });
  };

  // Sort branches
  const sortBranches = (sortBy: BranchFilters['sortBy'], sortOrder: BranchFilters['sortOrder'] = 'asc') => {
    updateFilters({
      ...(sortBy !== undefined && { sortBy }),
      sortOrder,
    });
  };

  // Get current selected branch
  const currentBranchId = branchesApi.getCurrentBranch();
  const currentBranch = useMemo(() => {
    return branches.find(branch => branch.id === currentBranchId) || null;
  }, [branches, currentBranchId]);

  return {
    // Data
    branches,
    totalBranches,
    currentBranch,
    currentBranchId,
    stats,

    // Loading states
    isLoading,
    isRefetching,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSwitching: switchBranchMutation.isPending,

    // Error
    error,

    // Pagination info
    pagination: {
      page: branchesData?.page || 1,
      limit: branchesData?.limit || 10,
      totalPages: branchesData?.totalPages || 0,
      hasNextPage: (branchesData?.page || 1) < (branchesData?.totalPages || 0),
      hasPrevPage: (branchesData?.page || 1) > 1,
    },

    // Actions
    refetch,
    updateFilters,
    searchBranches,
    filterByStatus,
    filterByCompany,
    changePage,
    changePageSize,
    sortBranches,

    // CRUD operations
    createBranch: createMutation.mutate,
    updateBranch: updateMutation.mutate,
    deleteBranch: deleteMutation.mutate,
    switchToBranch: switchBranchMutation.mutate,
  };
};

// Hook for single branch
export const useBranch = (id: string | undefined) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: branch,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => branchesApi.getBranch(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Get users by branch
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['branch-users', id],
    queryFn: () => branchesApi.getUsersByBranch(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update branch mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateBranchDto) => branchesApi.updateBranch(id!, data),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', id] });
      toast.success(t('branches.messages.updated', 'تم تحديث الفرع بنجاح'));
      return updatedBranch;
    },
      onError: (error: Error) => {
      const message = error.message || t('branches.errors.updateFailed', 'فشل في تحديث الفرع');
      toast.error(message);
    },
  });

  return {
    branch,
    users: users || [],
    isLoading,
    isLoadingUsers,
    error,
    refetch,
    isUpdating: updateMutation.isPending,
    updateBranch: updateMutation.mutate,
  };
};
