import { api } from '../api';
import type {
  PurchaseOrder,
  PurchaseInvoice,
  PurchasingFilters,
  CreatePurchaseOrderDto,
  CreatePurchaseInvoiceDto,
  CreatePurchasePaymentDto,
} from './types';

// ============================================
// Purchase Orders API
// ============================================

export const getPurchaseOrders = async (filters?: PurchasingFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.supplierId) params.append('supplierId', filters.supplierId);
  if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/purchasing/orders?${params.toString()}`);
  return response.data;
};

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  const response = await api.get(`/purchasing/orders/${id}`);
  return response.data;
};

export const createPurchaseOrder = async (data: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
  const response = await api.post('/purchasing/orders', data);
  return response.data;
};

export const updatePurchaseOrder = async (id: string, data: Partial<CreatePurchaseOrderDto>): Promise<PurchaseOrder> => {
  const response = await api.patch(`/purchasing/orders/${id}`, data);
  return response.data;
};

export const approvePurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  const response = await api.post(`/purchasing/orders/${id}/approve`);
  return response.data;
};

export const cancelPurchaseOrder = async (id: string, reason: string): Promise<void> => {
  await api.post(`/purchasing/orders/${id}/cancel`, { reason });
};

export const deletePurchaseOrder = async (id: string): Promise<void> => {
  await api.delete(`/purchasing/orders/${id}`);
};

// ============================================
// Purchase Invoices API
// ============================================

export const getPurchaseInvoices = async (filters?: PurchasingFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.supplierId) params.append('supplierId', filters.supplierId);
  if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/purchasing/invoices?${params.toString()}`);
  return response.data;
};

export const getPurchaseInvoice = async (id: string): Promise<PurchaseInvoice> => {
  const response = await api.get(`/purchasing/invoices/${id}`);
  return response.data;
};

export const createPurchaseInvoice = async (data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> => {
  const response = await api.post('/purchasing/invoices', data);
  return response.data;
};

export const updatePurchaseInvoice = async (id: string, data: Partial<CreatePurchaseInvoiceDto>): Promise<PurchaseInvoice> => {
  const response = await api.patch(`/purchasing/invoices/${id}`, data);
  return response.data;
};

export const approvePurchaseInvoice = async (id: string): Promise<PurchaseInvoice> => {
  const response = await api.post(`/purchasing/invoices/${id}/approve`);
  return response.data;
};

export const cancelPurchaseInvoice = async (id: string, reason: string): Promise<void> => {
  await api.post(`/purchasing/invoices/${id}/cancel`, { reason });
};

// ============================================
// Purchase Payments API
// ============================================

export const createPurchasePayment = async (data: CreatePurchasePaymentDto) => {
  const response = await api.post('/purchasing/payments', data);
  return response.data;
};

export const getPurchasePayments = async (invoiceId: string) => {
  const response = await api.get(`/purchasing/invoices/${invoiceId}/payments`);
  return response.data;
};

// ============================================
// Statistics API
// ============================================

export const getPurchasingStats = async () => {
  const response = await api.get('/purchasing/stats');
  return response.data;
};
