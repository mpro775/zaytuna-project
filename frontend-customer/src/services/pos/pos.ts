import { api } from '../api';
import type {
  POSProduct,
  POSTransaction,
  POSShift,
  POSSettings,
  POSFilters,
  QuickCustomer,
  Cart,
  Payment,
} from './types';

// ============================================
// Products API
// ============================================

export const getPOSProducts = async (filters?: POSFilters): Promise<POSProduct[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.categoryId) params.append('categoryId', filters.categoryId);
  if (filters?.barcode) params.append('barcode', filters.barcode);
  if (filters?.inStock !== undefined) params.append('inStock', String(filters.inStock));

  const response = await api.get(`/pos/products?${params.toString()}`);
  return unwrap<POSProduct[]>(response.data) ?? [];
};

export const searchProductByBarcode = async (barcode: string): Promise<POSProduct | null> => {
  try {
    const response = await api.get(`/pos/products/barcode/${barcode}`);
    const data = response.data as { data?: POSProduct } | POSProduct;
    return data && typeof data === 'object' && 'data' in data ? data.data ?? null : (data as POSProduct);
  } catch {
    return null;
  }
};

// ============================================
// Transactions API
// ============================================

export interface CreateTransactionPayload {
  cart: Cart;
  payments: Payment[];
  customerId?: string;
  warehouseId: string;
  notes?: string;
}

const unwrap = <T>(data: unknown): T => {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T;
};

export const createTransaction = async (payload: CreateTransactionPayload): Promise<POSTransaction> => {
  const response = await api.post('/pos/transactions', payload);
  return unwrap<POSTransaction>(response.data);
};

export const getTransaction = async (id: string): Promise<POSTransaction> => {
  const response = await api.get(`/pos/transactions/${id}`);
  return unwrap<POSTransaction>(response.data);
};

export const getTransactions = async (params?: {
  startDate?: string;
  endDate?: string;
  shiftId?: string;
  status?: string;
}): Promise<POSTransaction[]> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.shiftId) queryParams.append('shiftId', params.shiftId);
  if (params?.status) queryParams.append('status', params.status);

  const response = await api.get(`/pos/transactions?${queryParams.toString()}`);
  return unwrap<POSTransaction[]>(response.data) ?? [];
};

export const voidTransaction = async (id: string, reason: string): Promise<void> => {
  await api.post(`/pos/transactions/${id}/void`, { reason });
};

// ============================================
// Shifts API
// ============================================

export const openShift = async (openingCash: number): Promise<POSShift> => {
  const response = await api.post('/pos/shifts/open', { openingCash });
  return unwrap<POSShift>(response.data);
};

export const closeShift = async (shiftId: string, closingCash: number, notes?: string): Promise<POSShift> => {
  const response = await api.post(`/pos/shifts/${shiftId}/close`, { closingCash, notes });
  return unwrap<POSShift>(response.data);
};

export const getCurrentShift = async (): Promise<POSShift | null> => {
  try {
    const response = await api.get('/pos/shifts/current');
    return unwrap<POSShift>(response.data);
  } catch {
    return null;
  }
};

export const getShiftReport = async (shiftId: string): Promise<{
  shift: POSShift;
  transactions: POSTransaction[];
  summary: {
    totalCash: number;
    totalCard: number;
    totalOther: number;
    totalRefunds: number;
    netSales: number;
  };
}> => {
  const response = await api.get(`/pos/shifts/${shiftId}/report`);
  return response.data;
};

// ============================================
// Settings API
// ============================================

export const getPOSSettings = async (): Promise<POSSettings> => {
  const response = await api.get('/pos/settings');
  const data = response.data as { data?: POSSettings } | POSSettings;
  return data && typeof data === 'object' && 'data' in data ? (data.data as POSSettings) : (data as POSSettings);
};

export const updatePOSSettings = async (settings: Partial<POSSettings>): Promise<POSSettings> => {
  const response = await api.put('/pos/settings', settings);
  const data = response.data as { data?: POSSettings } | POSSettings;
  return data && typeof data === 'object' && 'data' in data ? (data.data as POSSettings) : (data as POSSettings);
};

// ============================================
// Customers API (Quick Access)
// ============================================

export const searchCustomers = async (query: string): Promise<QuickCustomer[]> => {
  const response = await api.get(`/pos/customers/search?q=${encodeURIComponent(query)}`);
  return unwrap<QuickCustomer[]>(response.data) ?? [];
};

export const getFrequentCustomers = async (): Promise<QuickCustomer[]> => {
  const response = await api.get('/pos/customers/frequent');
  return unwrap<QuickCustomer[]>(response.data) ?? [];
};

// ============================================
// Receipt API
// ============================================

export const printReceipt = async (transactionId: string): Promise<Blob> => {
  const response = await api.get(`/pos/transactions/${transactionId}/receipt`, {
    responseType: 'blob',
  });
  const data = response.data as { data?: Blob } | Blob;
  return data && typeof data === 'object' && 'data' in data && data.data instanceof Blob
    ? data.data
    : (data as Blob);
};

export const emailReceipt = async (transactionId: string, email: string): Promise<void> => {
  await api.post(`/pos/transactions/${transactionId}/email-receipt`, { email });
};

// ============================================
// Categories API
// ============================================

export const getPOSCategories = async (): Promise<{ id: string; name: string; productCount: number }[]> => {
  const response = await api.get('/pos/categories');
  return unwrap<{ id: string; name: string; productCount: number }[]>(response.data) ?? [];
};
