import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SalesService } from './sales';
import type { SalesFilters, CreateSalesInvoiceDto, UpdateSalesInvoiceDto, CreatePaymentDto } from './types';

/**
 * React Query hooks لخدمة المبيعات
 * مثال على كيفية استخدام SalesService في المكونات
 */

// Query Keys
export const SALES_QUERY_KEYS = {
  all: ['sales'] as const,
  invoices: () => [...SALES_QUERY_KEYS.all, 'invoices'] as const,
  invoice: (id: string) => [...SALES_QUERY_KEYS.invoices(), id] as const,
  stats: () => [...SALES_QUERY_KEYS.all, 'stats'] as const,
  customerInvoices: (customerId: string) => [...SALES_QUERY_KEYS.all, 'customers', customerId, 'invoices'] as const,
  branchInvoices: (branchId: string) => [...SALES_QUERY_KEYS.all, 'branches', branchId, 'invoices'] as const,
};

/**
 * Hook للحصول على فواتير المبيعات مع الفلترة
 */
export const useSalesInvoices = (filters: SalesFilters = {}) => {
  return useQuery({
    queryKey: [...SALES_QUERY_KEYS.invoices(), filters],
    queryFn: () => SalesService.getInvoices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook للحصول على فاتورة مبيعات واحدة
 */
export const useSalesInvoice = (id: string) => {
  return useQuery({
    queryKey: SALES_QUERY_KEYS.invoice(id),
    queryFn: () => SalesService.getInvoiceById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook لإحصائيات المبيعات
 */
export const useSalesStats = (branchId?: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...SALES_QUERY_KEYS.stats(), branchId, startDate, endDate],
    queryFn: () => SalesService.getSalesStats(branchId, startDate, endDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook لإنشاء فاتورة مبيعات
 */
export const useCreateSalesInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesInvoiceDto) => SalesService.createInvoice(data),
    onSuccess: () => {
      // إبطال cache للفواتير
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Hook لتحديث فاتورة مبيعات
 */
export const useUpdateSalesInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesInvoiceDto }) =>
      SalesService.updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      // إبطال cache للفاتورة المحددة والقائمة
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoice(id) });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Hook لإلغاء فاتورة مبيعات
 */
export const useCancelSalesInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      SalesService.cancelInvoice(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoice(id) });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Hook لإضافة دفعة لفاتورة
 */
export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: CreatePaymentDto }) =>
      SalesService.addPayment(invoiceId, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoice(invoiceId) });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.invoices() });
      queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEYS.stats() });
    },
  });
};

/**
 * Hook لطباعة فاتورة
 */
export const usePrintInvoice = () => {
  return useMutation({
    mutationFn: (id: string) => SalesService.printInvoice(id),
  });
};
