import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { customersApi } from '@/services/customers';
import type {
  CustomerFilters,
  UpdateCustomerDto,
} from '@/services/customers';
import { toast } from 'react-hot-toast';

export interface UseCustomersOptions {
  filters?: CustomerFilters;
  autoFetch?: boolean;
}

export const useCustomers = (options: UseCustomersOptions = {}) => {
  const { filters = {}, autoFetch = true } = options;
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState<CustomerFilters>(filters);

  // Customers query
  const {
    data: customersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['customers', currentFilters],
    queryFn: () => customersApi.getCustomers(currentFilters),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Stats query
  const {
    data: statsData,
    isLoading: isLoadingStats,
  } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => customersApi.getCustomerStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      toast.success(t('customers.messages.created', 'تم إنشاء العميل بنجاح'));
      return newCustomer;
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.createFailed', 'فشل في إنشاء العميل');
      toast.error(message);
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto }) =>
      customersApi.updateCustomer(id, data),
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', updatedCustomer.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      toast.success(t('customers.messages.updated', 'تم تحديث العميل بنجاح'));
      return updatedCustomer;
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.updateFailed', 'فشل في تحديث العميل');
      toast.error(message);
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] });
      toast.success(t('customers.messages.deleted', 'تم حذف العميل بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.deleteFailed', 'فشل في حذف العميل');
      toast.error(message);
    },
  });

  // Update loyalty points mutation
  const updateLoyaltyPointsMutation = useMutation({
    mutationFn: ({ customerId, pointsChange, reason }: { customerId: string; pointsChange: number; reason: string }) =>
      customersApi.updateLoyaltyPoints(customerId, pointsChange, reason),
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', updatedCustomer.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-loyalty', updatedCustomer.id] });
      toast.success(t('customers.messages.loyaltyUpdated', 'تم تحديث نقاط الولاء بنجاح'));
      return updatedCustomer;
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.loyaltyUpdateFailed', 'فشل في تحديث نقاط الولاء');
      toast.error(message);
    },
  });

  // Send marketing message mutation
  const sendMarketingMessageMutation = useMutation({
    mutationFn: ({ customerIds, message, subject }: { customerIds: string[]; message: string; subject?: string }) =>
      customersApi.sendMarketingMessage(customerIds, message, subject),
    onSuccess: () => {
      toast.success(t('customers.messages.marketingSent', 'تم إرسال الرسالة التسويقية بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.marketingSendFailed', 'فشل في إرسال الرسالة التسويقية');
      toast.error(message);
    },
  });

  // Computed values
  const customers = customersData?.data || [];
  const totalCustomers = customersData?.total || 0;
  const stats = statsData || {
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    totalLoyaltyPoints: 0,
    averagePurchaseValue: 0,
    topTierDistribution: {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    },
  };

  // Update filters
  const updateFilters = (newFilters: Partial<CustomerFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Search customers
  const searchCustomers = (query: string) => {
    updateFilters({ search: query, page: 1 });
  };

  // Filter by status
  const filterByStatus = (isActive?: boolean) => {
    updateFilters({
      ...(isActive !== undefined && { isActive }),
      page: 1,
    });
  };

  // Filter by loyalty tier
  const filterByLoyaltyTier = (loyaltyTier?: string) => {
    updateFilters({
      ...(loyaltyTier !== undefined && { loyaltyTier }),
      page: 1,
    });
  };

  // Filter by gender
  const filterByGender = (gender?: string) => {
      updateFilters({
      ...(gender !== undefined && { gender }),
      page: 1,
    });
  };

  // Change page
  const changePage = (page: number) => {
    updateFilters({ page });
  };

  // Change page size
  const changePageSize = (limit: number) => {
    updateFilters({ limit, page: 1 });
  };

  // Sort customers
  const sortCustomers = (sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc') => {
    updateFilters({
      ...(sortBy !== undefined && { sortBy }),
      ...(sortOrder !== undefined && { sortOrder }),
    });
    // Implementation depends on API support
  };

  // Get customer tier color
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'platinum': return 'primary';
      case 'gold': return 'warning';
      case 'silver': return 'info';
      case 'bronze': return 'error';
      default: return 'default';
    }
  };

  // Get customer tier label
  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'platinum': return t('customers.tiers.platinum', 'بلاتيني');
      case 'gold': return t('customers.tiers.gold', 'ذهبي');
      case 'silver': return t('customers.tiers.silver', 'فضي');
      case 'bronze': return t('customers.tiers.bronze', 'برونزي');
      default: return t('customers.tiers.none', 'غير مصنف');
    }
  };

  return {
    // Data
    customers,
    totalCustomers,
    stats,

    // Loading states
    isLoading,
    isRefetching,
    isLoadingStats,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingLoyalty: updateLoyaltyPointsMutation.isPending,
    isSendingMarketing: sendMarketingMessageMutation.isPending,

    // Error
    error,

    // Pagination info
    pagination: {
      page: customersData?.page || 1,
      limit: customersData?.limit || 10,
      totalPages: customersData?.totalPages || 0,
      hasNextPage: (customersData?.page || 1) < (customersData?.totalPages || 0),
      hasPrevPage: (customersData?.page || 1) > 1,
    },

    // Actions
    refetch,
    updateFilters,
    searchCustomers,
    filterByStatus,
    filterByLoyaltyTier,
    filterByGender,
    changePage,
    changePageSize,
    sortCustomers,

    // Utility functions
    getTierColor,
    getTierLabel,

    // CRUD operations
    createCustomer: createMutation.mutate,
    updateCustomer: updateMutation.mutate,
    deleteCustomer: deleteMutation.mutate,
    updateLoyaltyPoints: updateLoyaltyPointsMutation.mutate,
    sendMarketingMessage: sendMarketingMessageMutation.mutate,
  };
};

// Hook for single customer
export const useCustomer = (id: string | undefined) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Loyalty stats query
  const {
    data: loyaltyStats,
    isLoading: isLoadingLoyalty,
  } = useQuery({
    queryKey: ['customer-loyalty', id],
    queryFn: () => customersApi.getLoyaltyStats(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerDto) => customersApi.updateCustomer(id!, data),
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      toast.success(t('customers.messages.updated', 'تم تحديث العميل بنجاح'));
      return updatedCustomer;
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.updateFailed', 'فشل في تحديث العميل');
      toast.error(message);
    },
  });

  // Update loyalty points mutation
  const updateLoyaltyPointsMutation = useMutation({
    mutationFn: ({ pointsChange, reason }: { pointsChange: number; reason: string }) =>
      customersApi.updateLoyaltyPoints(id!, pointsChange, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-loyalty', id] });
      toast.success(t('customers.messages.loyaltyUpdated', 'تم تحديث نقاط الولاء بنجاح'));
    },
    onError: (error: Error) => {
      const message = error.message || t('customers.errors.loyaltyUpdateFailed', 'فشل في تحديث نقاط الولاء');
      toast.error(message);
    },
  });

  return {
    customer,
    loyaltyStats,
    isLoading,
    isLoadingLoyalty,
    error,
    refetch,
    isUpdating: updateMutation.isPending,
    isUpdatingLoyalty: updateLoyaltyPointsMutation.isPending,
    updateCustomer: updateMutation.mutate,
    updateLoyaltyPoints: updateLoyaltyPointsMutation.mutate,
  };
};
