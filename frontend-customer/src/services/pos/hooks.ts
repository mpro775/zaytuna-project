import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as posApi from './pos';
import type { POSFilters } from './types';
import type { CreateTransactionPayload } from './pos';

// ============================================
// Query Keys
// ============================================

export const posKeys = {
  all: ['pos'] as const,
  products: (filters?: POSFilters) => [...posKeys.all, 'products', filters] as const,
  categories: () => [...posKeys.all, 'categories'] as const,
  shift: () => [...posKeys.all, 'shift'] as const,
  settings: () => [...posKeys.all, 'settings'] as const,
  transactions: (params?: Record<string, string>) => [...posKeys.all, 'transactions', params] as const,
  customers: (query?: string) => [...posKeys.all, 'customers', query] as const,
  frequentCustomers: () => [...posKeys.all, 'frequent-customers'] as const,
};

// ============================================
// Products Hooks
// ============================================

export const usePOSProducts = (filters?: POSFilters) => {
  return useQuery({
    queryKey: posKeys.products(filters),
    queryFn: () => posApi.getPOSProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePOSCategories = () => {
  return useQuery({
    queryKey: posKeys.categories(),
    queryFn: posApi.getPOSCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchByBarcode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: posApi.searchProductByBarcode,
    onSuccess: (product) => {
      if (product) {
        queryClient.setQueryData(['pos', 'product', product.barcode], product);
      }
    },
  });
};

// ============================================
// Transactions Hooks
// ============================================

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => posApi.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: posKeys.shift() });
      queryClient.invalidateQueries({ queryKey: posKeys.products() });
    },
  });
};

export const useVoidTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => posApi.voidTransaction(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: posKeys.shift() });
    },
  });
};

export const useTransactions = (params?: { startDate?: string; endDate?: string; shiftId?: string; status?: string }) => {
  return useQuery({
    queryKey: posKeys.transactions(params as Record<string, string>),
    queryFn: () => posApi.getTransactions(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// ============================================
// Shift Hooks
// ============================================

export const useCurrentShift = () => {
  return useQuery({
    queryKey: posKeys.shift(),
    queryFn: posApi.getCurrentShift,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useOpenShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (openingCash: number) => posApi.openShift(openingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.shift() });
    },
  });
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shiftId, closingCash, notes }: { shiftId: string; closingCash: number; notes?: string }) =>
      posApi.closeShift(shiftId, closingCash, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.shift() });
    },
  });
};

// ============================================
// Settings Hooks
// ============================================

export const usePOSSettings = () => {
  return useQuery({
    queryKey: posKeys.settings(),
    queryFn: posApi.getPOSSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdatePOSSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: posApi.updatePOSSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.settings() });
    },
  });
};

// ============================================
// Customers Hooks
// ============================================

export const useSearchCustomers = (query: string) => {
  return useQuery({
    queryKey: posKeys.customers(query),
    queryFn: () => posApi.searchCustomers(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });
};

export const useFrequentCustomers = () => {
  return useQuery({
    queryKey: posKeys.frequentCustomers(),
    queryFn: posApi.getFrequentCustomers,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// Receipt Hooks
// ============================================

export const usePrintReceipt = () => {
  return useMutation({
    mutationFn: posApi.printReceipt,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    },
  });
};

export const useEmailReceipt = () => {
  return useMutation({
    mutationFn: ({ transactionId, email }: { transactionId: string; email: string }) =>
      posApi.emailReceipt(transactionId, email),
  });
};
