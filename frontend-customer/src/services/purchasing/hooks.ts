import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as purchasingApi from './purchasing';
import type { PurchasingFilters, CreatePurchaseOrderDto, CreatePurchaseInvoiceDto, CreatePurchasePaymentDto } from './types';

// Query Keys
export const purchasingKeys = {
  all: ['purchasing'] as const,
  orders: (filters?: PurchasingFilters) => [...purchasingKeys.all, 'orders', filters] as const,
  order: (id: string) => [...purchasingKeys.all, 'order', id] as const,
  invoices: (filters?: PurchasingFilters) => [...purchasingKeys.all, 'invoices', filters] as const,
  invoice: (id: string) => [...purchasingKeys.all, 'invoice', id] as const,
  stats: () => [...purchasingKeys.all, 'stats'] as const,
};

// Purchase Orders Hooks
export const usePurchaseOrders = (filters?: PurchasingFilters) => {
  return useQuery({
    queryKey: purchasingKeys.orders(filters),
    queryFn: () => purchasingApi.getPurchaseOrders(filters),
  });
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: purchasingKeys.order(id),
    queryFn: () => purchasingApi.getPurchaseOrder(id),
    enabled: !!id,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderDto) => purchasingApi.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.orders() });
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePurchaseOrderDto> }) =>
      purchasingApi.updatePurchaseOrder(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.orders() });
      queryClient.invalidateQueries({ queryKey: purchasingKeys.order(id) });
    },
  });
};

export const useApprovePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasingApi.approvePurchaseOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.orders() });
      queryClient.invalidateQueries({ queryKey: purchasingKeys.order(id) });
    },
  });
};

export const useCancelPurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      purchasingApi.cancelPurchaseOrder(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.orders() });
      queryClient.invalidateQueries({ queryKey: purchasingKeys.order(id) });
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasingApi.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.orders() });
    },
  });
};

// Purchase Invoices Hooks
export const usePurchaseInvoices = (filters?: PurchasingFilters) => {
  return useQuery({
    queryKey: purchasingKeys.invoices(filters),
    queryFn: () => purchasingApi.getPurchaseInvoices(filters),
  });
};

export const usePurchaseInvoice = (id: string) => {
  return useQuery({
    queryKey: purchasingKeys.invoice(id),
    queryFn: () => purchasingApi.getPurchaseInvoice(id),
    enabled: !!id,
  });
};

export const useCreatePurchaseInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseInvoiceDto) => purchasingApi.createPurchaseInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoices() });
    },
  });
};

export const useApprovePurchaseInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasingApi.approvePurchaseInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoice(id) });
    },
  });
};

export const useCancelPurchaseInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      purchasingApi.cancelPurchaseInvoice(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoice(id) });
    },
  });
};

// Purchase Payments Hooks
export const useCreatePurchasePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchasePaymentDto) => purchasingApi.createPurchasePayment(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoices() });
      queryClient.invalidateQueries({ queryKey: purchasingKeys.invoice(data.purchaseInvoiceId) });
    },
  });
};

// Statistics Hooks
export const usePurchasingStats = () => {
  return useQuery({
    queryKey: purchasingKeys.stats(),
    queryFn: purchasingApi.getPurchasingStats,
  });
};
